import os
import pandas as pd
from langgraph.graph import StateGraph, END
from typing import TypedDict, Optional, List, Dict, Any, Tuple, Union
import google.generativeai as genai

# --- Gemini Configuration ---
genai.configure(api_key=("AIzaSyC6mrIGThbjDwCmrZdagfoUvmQtPomXIn8"))
model = genai.GenerativeModel("gemini-2.0-flash")

# --- Load Dataset ---
df = pd.read_csv("pakistani_medicine_dataset.csv")

# --- Semantic Net ---
class SemanticNet:
    def __init__(self):
        # Enhanced semantic network with more symptoms and clarification questions
        self.net = {
            "pain": ["headache", "stomachache", "joint pain", "back pain", "chest pain"],
            "fever": ["low grade fever", "high fever", "intermittent fever"],
            "cough": ["dry cough", "wet cough", "persistent cough"],
            "infection": ["urinary tract infection", "skin infection", "respiratory infection"],
            "fatigue": ["chronic fatigue", "acute fatigue"],
            "rash": ["skin rash", "allergic rash"],
            "bp": ["low bp", "high bp"],
            "headache": ["migraine", "tension headache", "cluster headache", "sinus headache"],
            "stomachache": ["upper abdominal pain", "lower abdominal pain", "cramps"],
            "dizziness": ["lightheadedness", "vertigo", "faintness"],
            "nausea": ["morning sickness", "motion sickness", "medication-induced nausea"],
            "breathing": ["shortness of breath", "wheezing", "labored breathing"],
            "insomnia": ["difficulty falling asleep", "difficulty staying asleep", "early morning awakening"],
            "allergy": ["food allergy", "seasonal allergy", "drug allergy", "skin allergy"],
            "anxiety": ["generalized anxiety", "panic attacks", "social anxiety"],
            "cold": ["common cold", "flu", "sinus infection"],
            "diarrhea": ["acute diarrhea", "chronic diarrhea", "traveler's diarrhea"]
        }
        self.child_to_parent = {child: parent for parent, children in self.net.items() for child in children}
        
        # Common follow-up questions for all symptoms with input type info
        self.common_followups = {
            "combined_assessment": {
                "question": "For your symptoms, please indicate:",
                "input_type": "checkbox",
                "options": [
                    "Mild and occasional, started recently (less than a week)",
                    "Mild and occasional, ongoing for more than a week",
                    "Moderate and daily, started recently (less than a week)",
                    "Moderate and daily, ongoing for more than a week",
                    "Severe and constant, started recently (less than a week)",
                    "Severe and constant, ongoing for more than a week"
                ]
            }
        }
        
        # Specific follow-up questions for certain symptoms with input type info
        self.specific_followups = {
            "headache": [
                {
                    "question": "Is it on one side or both sides?",
                    "input_type": "checkbox",
                    "options": ["One side", "Both sides", "Varies"]
                },
                {
                    "question": "Does it throb or is it a steady pain?",
                    "input_type": "checkbox",
                    "options": ["Throbbing", "Steady", "Both"]
                }
            ],
            "fever": [
                {
                    "question": "Have you taken any medication to reduce it?",
                    "input_type": "checkbox",
                    "options": ["Yes", "No"]
                },
                {
                    "question": "Are you experiencing chills or sweating?",
                    "input_type": "checkbox",
                    "options": ["Chills", "Sweating", "Both", "Neither"]
                }
            ],
            "cough": [
                {
                    "question": "Is there any phlegm or mucus?",
                    "input_type": "checkbox",
                    "options": ["Yes, clear phlegm", "Yes, colored phlegm", "No phlegm"]
                },
                {
                    "question": "Is it worse at night?",
                    "input_type": "checkbox",
                    "options": ["Yes", "No", "Not sure"]
                }
            ],
            "rash": [
                {
                    "question": "Is it itchy?",
                    "input_type": "checkbox",
                    "options": ["Very itchy", "Mildly itchy", "Not itchy"]
                },
                {
                    "question": "Has the rash spread since it first appeared?",
                    "input_type": "checkbox",
                    "options": ["Yes, significantly", "Yes, slightly", "No"]
                }
            ],
            "stomachache": [
                {
                    "question": "Is it related to eating?",
                    "input_type": "checkbox",
                    "options": ["Yes, worse after eating", "Yes, better after eating", "Not related to eating"]
                },
                {
                    "question": "Does it come and go or is it constant?",
                    "input_type": "checkbox",
                    "options": ["Comes and goes", "Constant", "Varies"]
                }
            ],
            "pain": [
                {
                    "question": "Does anything make it better or worse?",
                    "input_type": "checkbox",
                    "options": ["Rest makes it better", "Movement makes it better", "Medication helps", "Nothing helps", "Not sure"]
                },
                {
                    "question": "Does it radiate to other areas?",
                    "input_type": "checkbox",
                    "options": ["Yes", "No", "Sometimes"]
                }
            ],
            "dizziness": [
                {
                    "question": "Does it happen when you stand up?",
                    "input_type": "checkbox",
                    "options": ["Yes", "No", "Sometimes"]
                },
                {
                    "question": "Is it associated with nausea?",
                    "input_type": "checkbox",
                    "options": ["Yes", "No", "Sometimes"]
                }
            ],
            "breathing": [
                {
                    "question": "Does it occur at rest or with activity?",
                    "input_type": "checkbox",
                    "options": ["Only with activity", "At rest", "Both"]
                },
                {
                    "question": "Do you have a history of respiratory conditions?",
                    "input_type": "checkbox",
                    "options": ["Yes, asthma", "Yes, COPD", "Yes, other", "No"]
                }
            ],
            "insomnia": [
                {
                    "question": "Do you feel tired during the day?",
                    "input_type": "checkbox",
                    "options": ["Yes, very tired", "Somewhat tired", "Not particularly"]
                },
                {
                    "question": "What time do you typically go to bed?",
                    "input_type": "checkbox",
                    "options": ["Before 10pm", "10pm-12am", "After midnight", "Irregular"]
                }
            ],
            "allergy": [
                {
                    "question": "Have you been exposed to any new substances?",
                    "input_type": "checkbox",
                    "options": ["Yes", "No", "Not sure"]
                },
                {
                    "question": "Do you have any known allergies?",
                    "input_type": "checkbox",
                    "options": ["Yes, food allergies", "Yes, seasonal allergies", "Yes, medication allergies", "No known allergies"]
                }
            ],
            "diarrhea": [
                {
                    "question": "Is there blood in your stool?",
                    "input_type": "checkbox",
                    "options": ["Yes", "No", "Not sure"]
                },
                {
                    "question": "Are you experiencing abdominal pain?",
                    "input_type": "checkbox",
                    "options": ["Severe pain", "Mild pain", "No pain"]
                }
            ],
            "cold": [
                {
                    "question": "Do you have a sore throat?",
                    "input_type": "checkbox",
                    "options": ["Yes, severe", "Yes, mild", "No"]
                },
                {
                    "question": "Are you experiencing body aches?",
                    "input_type": "checkbox",
                    "options": ["Yes", "No", "Mild aches"]
                }
            ]
        }

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
        
    def get_followup_questions(self, symptom: str) -> List[Dict[str, Any]]:
        """Get follow-up questions with their input types and options for a specific symptom"""
        questions = []
        
        # Add symptom-specific questions if available
        key = self.find_closest_symptom(symptom)
        if key in self.specific_followups:
            questions.extend(self.specific_followups[key])
        
        # Add common followup questions if not already added
        for key, followup in self.common_followups.items():
            question_text = followup["question"].format(symptom)
            existing_questions = [q["question"] for q in questions]
            
            if question_text not in existing_questions:
                questions.append({
                    "question": question_text,
                    "input_type": followup["input_type"],
                    "options": followup["options"]
                })
            
        return questions
        
    def clarification_for_vague_symptom(self, symptom: str) -> Dict[str, Any]:
        """Get clarification options for a vague symptom"""
        if not self.is_vague(symptom):
            return {
                "question": f"Please provide more details about your {symptom}",
                "input_type": "text",
                "options": []
            }
            
        options = self.get_children(symptom)
        return {
            "question": f"Your symptom '{symptom}' is broad. Please clarify:",
            "input_type": "checkbox",
            "options": options
        }

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
    input_type: Optional[str]
    options: List[str]
    history: List[str]
    parent_symptoms: List[Optional[str]]
    extra_info: List[Dict[str, str]]
    current_index: int
    followup_questions: List[List[Dict[str, Any]]]  # New field to track follow-up questions for each symptom
    followup_index: List[int]  # New field to track which follow-up question we're on

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
    if "followup_questions" not in state or len(state["followup_questions"]) != len(symptoms):
        state["followup_questions"] = [[] for _ in symptoms]
    if "followup_index" not in state or len(state["followup_index"]) != len(symptoms):
        state["followup_index"] = [0] * len(symptoms)

    symptom = symptoms[idx].lower()
    history = state.get("history", [])
    extra_info = state["extra_info"][idx]
    clarified = state["clarified"]
    
    # First check if the symptom is vague (e.g., 'pain', 'cough')
    if not clarified[idx] and semantic_net.is_vague(symptom):
        clarification = semantic_net.clarification_for_vague_symptom(symptom)
        question = clarification["question"]
        
        if question in history:
            # If we've already asked about the vague symptom, move to follow-up questions
            if not state["followup_questions"][idx]:
                state["followup_questions"][idx] = semantic_net.get_followup_questions(symptom)
            
            if state["followup_index"][idx] < len(state["followup_questions"][idx]):
                # Ask the next follow-up question
                next_question_obj = state["followup_questions"][idx][state["followup_index"][idx]]
                state["followup_index"][idx] += 1
                return {
                    **state,
                    "question": next_question_obj["question"],
                    "input_type": next_question_obj["input_type"],
                    "options": next_question_obj["options"],
                    "history": history + [next_question_obj["question"]]
                }
            else:
                # No more questions, mark as clarified
                clarified[idx] = True
                return {**state, "clarified": clarified}
        
        return {
            **state,
            "question": clarification["question"],
            "input_type": clarification["input_type"],
            "options": clarification["options"],
            "history": history + [clarification["question"]]
        }

    # If not a vague symptom, prepare follow-up questions
    if not state["followup_questions"][idx]:
        state["followup_questions"][idx] = semantic_net.get_followup_questions(symptom)
    
    # Ask follow-up questions in sequence
    if state["followup_index"][idx] < len(state["followup_questions"][idx]):
        next_question_obj = state["followup_questions"][idx][state["followup_index"][idx]]
        state["followup_index"][idx] += 1
        return {
            **state,
            "question": next_question_obj["question"],
            "input_type": next_question_obj["input_type"],
            "options": next_question_obj["options"],
            "history": history + [next_question_obj["question"]]
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
            # Try to find the closest symptom
            closest = semantic_net.find_closest_symptom(symptom)
            match = df[df["Symptom"].str.lower() == closest] if closest else pd.DataFrame()
            
            # If no match found, try to recommend based on symptom category
            if match.empty:
                # Get the parent category if it exists
                parent_category = None
                for parent, children in semantic_net.net.items():
                    if symptom in children:
                        parent_category = parent
                        break
                
                # Find medicines for this category
                if parent_category:
                    category_matches = []
                    for child in semantic_net.net.get(parent_category, []):
                        category_match = df[df["Symptom"].str.lower() == child.lower()]
                        if not category_match.empty:
                            category_matches.append(category_match)
                    
                    if category_matches:
                        # Get a random medicine from one of the related symptoms
                        import random
                        match = random.choice(category_matches)
                
            # If still no match, use a varied default based on first letter of symptom
            if match.empty:
                first_letter = symptom[0].lower() if symptom else 'a'
                
                # Map first letter to different default medicines
                default_medicines = {
                    'a': {"Medicine_Name": "Aspirin", "Medicine_Type": "Tablet", 
                          "Common_Side_Effects": "Stomach irritation, increased risk of bleeding", 
                          "Prescription_Required": "No"},
                    'b': {"Medicine_Name": "Buscopan", "Medicine_Type": "Tablet", 
                          "Common_Side_Effects": "Dry mouth, blurred vision", 
                          "Prescription_Required": "No"},
                    'c': {"Medicine_Name": "Cetirizine", "Medicine_Type": "Tablet", 
                          "Common_Side_Effects": "Drowsiness, dry mouth", 
                          "Prescription_Required": "No"},
                    'd': {"Medicine_Name": "Diclofenac", "Medicine_Type": "Tablet", 
                          "Common_Side_Effects": "Stomach upset, headache", 
                          "Prescription_Required": "Yes"},
                    'e': {"Medicine_Name": "Esomeprazole", "Medicine_Type": "Capsule", 
                          "Common_Side_Effects": "Headache, nausea", 
                          "Prescription_Required": "Yes"},
                    'f': {"Medicine_Name": "Fluconazole", "Medicine_Type": "Tablet", 
                          "Common_Side_Effects": "Nausea, headache", 
                          "Prescription_Required": "Yes"},
                    'g': {"Medicine_Name": "Gabapentin", "Medicine_Type": "Capsule", 
                          "Common_Side_Effects": "Dizziness, drowsiness", 
                          "Prescription_Required": "Yes"},
                    'h': {"Medicine_Name": "Hydrocortisone", "Medicine_Type": "Cream", 
                          "Common_Side_Effects": "Skin irritation, itching", 
                          "Prescription_Required": "No"},
                    'i': {"Medicine_Name": "Ibuprofen", "Medicine_Type": "Tablet", 
                          "Common_Side_Effects": "Stomach upset, heartburn", 
                          "Prescription_Required": "No"},
                    'j': {"Medicine_Name": "Jardiance", "Medicine_Type": "Tablet", 
                          "Common_Side_Effects": "Urinary tract infections, hypoglycemia", 
                          "Prescription_Required": "Yes"},
                    'k': {"Medicine_Name": "Ketorolac", "Medicine_Type": "Tablet", 
                          "Common_Side_Effects": "Stomach pain, dizziness", 
                          "Prescription_Required": "Yes"},
                    'l': {"Medicine_Name": "Loratadine", "Medicine_Type": "Tablet", 
                          "Common_Side_Effects": "Headache, dry mouth", 
                          "Prescription_Required": "No"},
                    'm': {"Medicine_Name": "Metformin", "Medicine_Type": "Tablet", 
                          "Common_Side_Effects": "Stomach upset, diarrhea", 
                          "Prescription_Required": "Yes"},
                    'n': {"Medicine_Name": "Naproxen", "Medicine_Type": "Tablet", 
                          "Common_Side_Effects": "Stomach upset, drowsiness", 
                          "Prescription_Required": "No"},
                    'o': {"Medicine_Name": "Omeprazole", "Medicine_Type": "Capsule", 
                          "Common_Side_Effects": "Headache, stomach pain", 
                          "Prescription_Required": "No"},
                    'p': {"Medicine_Name": "Paracetamol", "Medicine_Type": "Tablet", 
                          "Common_Side_Effects": "Nausea, liver issues if overused", 
                          "Prescription_Required": "No"},
                    'q': {"Medicine_Name": "Quetiapine", "Medicine_Type": "Tablet", 
                          "Common_Side_Effects": "Drowsiness, dizziness", 
                          "Prescription_Required": "Yes"},
                    'r': {"Medicine_Name": "Ranitidine", "Medicine_Type": "Tablet", 
                          "Common_Side_Effects": "Headache, constipation", 
                          "Prescription_Required": "No"},
                    's': {"Medicine_Name": "Sertraline", "Medicine_Type": "Tablet", 
                          "Common_Side_Effects": "Nausea, insomnia", 
                          "Prescription_Required": "Yes"},
                    't': {"Medicine_Name": "Tramadol", "Medicine_Type": "Tablet", 
                          "Common_Side_Effects": "Dizziness, nausea", 
                          "Prescription_Required": "Yes"},
                    'u': {"Medicine_Name": "Ursodeoxycholic acid", "Medicine_Type": "Tablet", 
                          "Common_Side_Effects": "Diarrhea, itching", 
                          "Prescription_Required": "Yes"},
                    'v': {"Medicine_Name": "Venlafaxine", "Medicine_Type": "Capsule", 
                          "Common_Side_Effects": "Nausea, headache", 
                          "Prescription_Required": "Yes"},
                    'w': {"Medicine_Name": "Warfarin", "Medicine_Type": "Tablet", 
                          "Common_Side_Effects": "Increased risk of bleeding, bruising", 
                          "Prescription_Required": "Yes"},
                    'x': {"Medicine_Name": "Xanax", "Medicine_Type": "Tablet", 
                          "Common_Side_Effects": "Drowsiness, confusion", 
                          "Prescription_Required": "Yes"},
                    'y': {"Medicine_Name": "Yasmin", "Medicine_Type": "Tablet", 
                          "Common_Side_Effects": "Nausea, breast tenderness", 
                          "Prescription_Required": "Yes"},
                    'z': {"Medicine_Name": "Zolpidem", "Medicine_Type": "Tablet", 
                          "Common_Side_Effects": "Drowsiness, dizziness", 
                          "Prescription_Required": "Yes"}
                }
                
                # Default to a medicine based on first letter, or use paracetamol if not found
                default_med = default_medicines.get(first_letter, default_medicines['p'])
                medicine = {"Symptom": symptom.title(), **default_med}
            else:
                medicine = match.sample(1).iloc[0].to_dict()
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
    - DON'T INCOPERATE THE * IN YOUR RESPONSE LIKE YOU CREATE BOLD AND USE Aesterick * DON'T INCOPERATE IT JUST SIMPLE RESPONSE.
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
        "input_type": None,
        "options": [],
        "history": [],
        "parent_symptoms": [None] * len(symptoms),
        "extra_info": [{} for _ in symptoms],
        "current_index": 0,
        "followup_questions": [[] for _ in symptoms],
        "followup_index": [0] * len(symptoms),
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
                
                # Display options if available
                options = state.get("options", [])
                input_type = state.get("input_type", "text")
                
                if input_type == "checkbox" and options:
                    print("Options:")
                    for i, option in enumerate(options):
                        print(f"  [{i+1}] {option}")
                    answer = input("📝 Select option number: ").strip()
                    try:
                        answer_idx = int(answer) - 1
                        if 0 <= answer_idx < len(options):
                            answer = options[answer_idx]
                        else:
                            print("Invalid option, using text input instead.")
                            answer = input("📝 Your answer: ").strip().lower()
                    except ValueError:
                        print("Invalid input, using text input instead.")
                        answer = input("📝 Your answer: ").strip().lower()
                else:
                    answer = input("📝 Your answer: ").strip().lower()
                
                # Store the answer appropriately based on the question type
                if state["question"] == "For your symptoms, please indicate:":
                    # Combined follow-up for all symptoms
                    for i in range(len(symptoms)):
                        if "recently" in answer or "week" in answer:
                            state["extra_info"][i]["duration"] = answer
                        if "mild" in answer or "moderate" in answer or "severe" in answer:
                            state["extra_info"][i]["severity_frequency"] = answer
                elif "how long" in state["question"].lower() or "duration" in state["question"].lower():
                    state["extra_info"][idx]["duration"] = answer
                elif "severity" in state["question"].lower():
                    state["extra_info"][idx]["severity"] = answer
                elif "how often" in state["question"].lower() or "frequency" in state["question"].lower():
                    state["extra_info"][idx]["frequency"] = answer
                elif "is it on one side" in state["question"].lower():
                    state["extra_info"][idx]["side"] = answer
                elif "itchy" in state["question"].lower():
                    state["extra_info"][idx]["itchy"] = answer
                elif "your symptom" in state["question"].lower() and "please clarify" in state["question"].lower():
                    parent = semantic_net.find_parent(symptoms[idx]) or symptoms[idx]
                    state["parent_symptoms"][idx] = parent
                    state["symptoms"][idx] = answer
                else:
                    # Generic storage for other follow-up questions
                    question_key = state["question"].lower().replace("?", "").strip()
                    state["extra_info"][idx][question_key] = answer
                    
                state["history"].append(state["question"])
                state["history"].append(answer)
                state["question"] = None
                state["input_type"] = None
                state["options"] = []
            if state["clarified"][idx]:
                state["current_index"] += 1
            continue
        else:
            state["current_index"] += 1

    print("\n✅ Stay healthy! Thanks for using Doctor AI 👨‍⚕")
