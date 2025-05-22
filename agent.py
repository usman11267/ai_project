import os
import pandas as pd
from langgraph.graph import StateGraph, END
from typing import TypedDict, Optional, List, Dict
import google.generativeai as genai

# --- Gemini Configuration ---
genai.configure(api_key=("AIzaSyC6mrIGThbjDwCmrZdagfoUvmQtPomXIn8"))
model = genai.GenerativeModel("gemini-2.0-flash")

# --- Load Dataset ---
df = pd.read_csv("pakistani_medicine_dataset.csv")

# --- Semantic Net ---
class SemanticNet:
    def __init__(self):
        self.net = {
            "pain": ["headache", "stomachache", "joint pain", "back pain", "chest pain"],
            "fever": ["low grade fever", "high fever", "intermittent fever"],
            "cough": ["dry cough", "wet cough", "persistent cough"],
            "infection": ["urinary tract infection", "skin infection", "respiratory infection"],
            "fatigue": ["chronic fatigue", "acute fatigue"],
            "rash": ["skin rash", "allergic rash"],
            "bp": ["low bp", "high bp"]
        }
        self.child_to_parent = {child: parent for parent, children in self.net.items() for child in children}

    def is_vague(self, symptom: str) -> bool:
        return symptom in self.net

    def get_children(self, symptom: str) -> List[str]:
        return self.net.get(symptom, [])

    def find_parent(self, symptom: str) -> Optional[str]:
        return self.child_to_parent.get(symptom)

    def add_symptom(self, parent: str, new_symptom: str):
        parent = parent.lower()
        new_symptom = new_symptom.lower()
        self.net.setdefault(parent, []).append(new_symptom)
        self.child_to_parent[new_symptom] = parent

    def find_closest_symptom(self, symptom: str) -> Optional[str]:
        symptom = symptom.lower()
        if symptom in self.net or symptom in self.child_to_parent:
            return symptom
        for known in list(self.net.keys()) + list(self.child_to_parent.keys()):
            if symptom in known or known in symptom:
                return known
        return None

semantic_net = SemanticNet()

# --- State Definition ---
class AgentState(TypedDict):
    symptoms: List[str]
    clarified: List[bool]
    patient_name: Optional[str]
    patient_age: Optional[int]
    matched_medicines: List[Dict]
    prescription: Optional[str]
    question: Optional[str]
    history: List[str]
    parent_symptoms: List[Optional[str]]
    extra_info: List[Dict[str, str]]
    current_index: int

# --- Node: Clarify Symptom ---
def clarify_symptom(state: AgentState) -> AgentState:
    idx = state.get("current_index", 0)
    symptoms = state.get("symptoms", [])
    if not symptoms or idx >= len(symptoms):
        return {**state, "clarified": [True] * len(state.get("symptoms", []))}
    
    # Ensure all lists are properly initialized
    if "clarified" not in state or len(state["clarified"]) != len(symptoms):
        state["clarified"] = [False] * len(symptoms)
    if "parent_symptoms" not in state or len(state["parent_symptoms"]) != len(symptoms):
        state["parent_symptoms"] = [None] * len(symptoms)
    if "extra_info" not in state or len(state["extra_info"]) != len(symptoms):
        state["extra_info"] = [{} for _ in symptoms]
    if "matched_medicines" not in state or len(state["matched_medicines"]) != len(symptoms):
        state["matched_medicines"] = [{} for _ in symptoms]

    symptom = symptoms[idx].lower()
    history = state.get("history", [])
    extra_info = state["extra_info"][idx]
    clarified = state["clarified"]

    # Check if symptom is vague (e.g., 'pain', 'cough')
    if not clarified[idx] and semantic_net.is_vague(symptom):
        options = semantic_net.get_children(symptom)
        question = f"Your symptom '{symptom}' is broad. Please clarify: {', '.join(options)}"
        if question in history:
            clarified[idx] = True
            return {**state, "clarified": clarified}
        return {
            **state,
            "question": question,
            "history": history + [question]
        }

    # Ask duration only if not already asked and not already provided
    if not extra_info.get("duration"):
        duration_question = f"How long have you had this '{symptom}'?"
        if any("how long" in q.lower() for q in history):
            clarified[idx] = True
            return {**state, "clarified": clarified}
        return {
            **state,
            "question": duration_question,
            "history": history + [duration_question]
        }

    clarified[idx] = True
    return {**state, "clarified": clarified}

# --- Node: Process Clarification ---
def process_clarification(state: AgentState) -> AgentState:
    idx = state.get("current_index", 0)
    symptoms = state.get("symptoms", [])
    if not symptoms or idx >= len(symptoms):
        return state

    # Ensure lists are properly initialized
    if "parent_symptoms" not in state or len(state["parent_symptoms"]) != len(symptoms):
        state["parent_symptoms"] = [None] * len(symptoms)

    parent = state["parent_symptoms"][idx]
    symptom = symptoms[idx]
    if parent and symptom and symptom not in semantic_net.get_children(parent):
        semantic_net.add_symptom(parent, symptom)
    state["parent_symptoms"][idx] = None
    return state

# --- Node: Inference Engine ---
def inference_engine(state: AgentState) -> AgentState:
    symptoms = state.get("symptoms", [])
    if not symptoms:
        return state

    medicines = []
    for symptom in symptoms:
        symptom = symptom.lower()
        match = df[df["Symptom"].str.lower() == symptom]
        if not match.empty:
            medicine = match.sample(1).iloc[0].to_dict()
        else:
            closest = semantic_net.find_closest_symptom(symptom)
            match = df[df["Symptom"].str.lower() == closest] if closest else pd.DataFrame()
            medicine = match.sample(1).iloc[0].to_dict() if not match.empty else {
                "Symptom": symptom.title(),
                "Medicine_Name": "Paracetamol",
                "Medicine_Type": "Tablet",
                "Common_Side_Effects": "Nausea, liver issues if overused",
                "Prescription_Required": "No"
            }
        medicines.append(medicine)
    return {**state, "matched_medicines": medicines}

# --- Node: Generate Prescription ---
def generate_prescription_gemini(state: AgentState) -> AgentState:
    name = state.get("patient_name", "Anonymous")
    age = state.get("patient_age", "N/A")
    symptoms = state.get("symptoms", [])
    extra_info = state.get("extra_info", [{} for _ in symptoms])
    meds = state.get("matched_medicines", [{} for _ in symptoms])

    if not symptoms or not meds:
        return {**state, "prescription": "No symptoms or medicines found."}

    lines = [
        f"\n👤 Patient Name: {name}",
        f"🎂 Age: {age}",
        f"\n-- SYMPTOMS --"
    ]
    for idx, symptom in enumerate(symptoms):
        duration = extra_info[idx].get("duration", "not specified") if idx < len(extra_info) else "not specified"
        med = meds[idx] if idx < len(meds) else {}
        med_name = med.get('Medicine_Name', 'Not found')
        med_type = med.get('Medicine_Type', 'Not found')
        lines.append(f"- {symptom.title()} (Duration: {duration})")
        lines.append(f"  ({med_name}, {med_type})")

    prompt = (
        "\n".join(lines) +
        """
\nYou're a kind, professional Pakistani doctor. Based on the following info, write a detailedS prescription in both English:

👤 Patient Name: {name}
🎂 Age: {age}
🤕 Symptom: {symptom}
⏳ Duration: {duration}

💊 Medicine:
- Name: {med['Medicine_Name']}
- Type: {med['Medicine_Type']}

TODOS
    - DON'T EXPLAIN THE MEDICINE, JUST GIVE PRESCRIPTION
    - MAKE USE OF TECHNICAL WRITING RULE AND GIVE RESPONSE IN BULLET POINTS. etc.,
    - DON'T INCOPERATE THE * IN YOUR RESPONSE LIKE YOU CREATE BOLD AND USE * DON'T INCOPERATE IT JUST SIMPLE RESPONSE.
    - GIVE MEDICINE NAME, THEN IT DOSAGE AND TIMES TO USE IN A DAY, TOTAL DAYS TO USE LIKE [Medicine name], [Dosage], [Times to use in a day], [Total days to use].
    - DON'T WRITE PRECAUTION
    - ALSO LIST WHAT TO INTAKE WITH MEDICINE LIKE WATER, FOOD, etc.
    - DON'T USE STYLE OF REPORT, IT MUST BE BULLET POINTS LIKE SHOWN
        -- SYMPTOMS
        -- IF ONE THEN THIS ([Medicine name], [Dosage], [Times to use in a day], [Total days to use]), IF MULTIPLE THEN SAME PREVIOUS BUT FOR EACH MEDICINE.

"""
    )
    try:
        response = model.generate_content(prompt)
        return {**state, "prescription": response.text}
    except Exception as e:
        return {**state, "prescription": f"⚠ Gemini error: {str(e)}"}

# --- Build LangGraph ---
builder = StateGraph(AgentState)
builder.set_entry_point("clarify_symptom")
builder.add_node("clarify_symptom", clarify_symptom)
builder.add_node("process_clarification", process_clarification)
builder.add_node("inference_engine", inference_engine)
builder.add_node("generate_prescription_gemini", generate_prescription_gemini)
builder.add_edge("clarify_symptom", "process_clarification")
builder.add_edge("process_clarification", "inference_engine")
builder.add_edge("inference_engine", "generate_prescription_gemini")
builder.add_edge("generate_prescription_gemini", END)
app = builder.compile()

# --- CLI ---
if __name__ == "__main__":
    print("\U0001F916 Welcome to the LangGraph + Gemini AI Doctor Assistant!\n")
    patient_name = input("👤 Patient name: ").strip()
    try:
        patient_age = int(input("🎂 Age: ").strip())
    except:
        patient_age = "N/A"
    symptoms = [s.strip().lower() for s in input("🩺 List symptoms (comma separated): ").split(",") if s.strip()]
    
    if not symptoms:
        print("⚠ No symptoms entered. Please run the program again with valid symptoms.")
        exit(1)

    state: AgentState = {
        "symptoms": symptoms,
        "clarified": [False] * len(symptoms),
        "patient_name": patient_name,
        "patient_age": patient_age,
        "matched_medicines": [{} for _ in symptoms],
        "prescription": None,
        "question": None,
        "history": [],
        "parent_symptoms": [None] * len(symptoms),
        "extra_info": [{} for _ in symptoms],
        "current_index": 0,
    }

    while True:
        idx = state.get("current_index", 0)
        if idx >= len(symptoms):
            state = app.invoke(state)
            if state.get("prescription"):
                print("\n📄 Prescription:\n")
                print(state["prescription"])
                break
            continue

        if not state["clarified"][idx]:
            state = app.invoke(state)
            if state.get("question"):
                print(f"\n🤔 Doctor AI (for symptom {idx+1}/{len(symptoms)} '{symptoms[idx]}'): " + state["question"])
                answer = input("📝 Your answer: ").strip().lower()
                if "how long" in state["question"].lower():
                    state["extra_info"][idx]["duration"] = answer
                else:
                    parent = semantic_net.find_parent(symptoms[idx]) or symptoms[idx]
                    state["parent_symptoms"][idx] = parent
                    state["symptoms"][idx] = answer
                state["history"].append(state["question"])
                state["history"].append(answer)
                state["question"] = None
            if state["clarified"][idx]:
                state["current_index"] += 1
            continue
        else:
            state["current_index"] += 1

    print("\n✅ Stay healthy! Thanks for using Doctor AI 👨‍⚕")
