from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Union, Any
import agent
import uuid
from fastapi.responses import JSONResponse

app = FastAPI(
    title="Doctor AI API",
    description="API for the Doctor AI LangGraph Agent",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

class PatientData(BaseModel):
    patient_name: str
    patient_age: Optional[int]
    symptoms: List[str]

class ClarificationAnswer(BaseModel):
    session_id: str
    answer: str

class SessionState(BaseModel):
    state: Dict
    session_id: str

class SymptomRequest(BaseModel):
    symptom: str

# Store session states
sessions = {}

@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "online", "message": "Doctor AI API is running"}

@app.get("/symptoms/categories")
async def get_symptom_categories():
    """Get all symptom categories from the semantic network."""
    return {"categories": list(agent.semantic_net.net.keys())}

@app.get("/symptoms/{category}")
async def get_symptoms_by_category(category: str):
    """Get specific symptoms for a category."""
    if category in agent.semantic_net.net:
        return {"category": category, "symptoms": agent.semantic_net.net[category]}
    raise HTTPException(status_code=404, detail=f"Category '{category}' not found")

@app.get("/symptoms/followup/{symptom}")
async def get_followup_questions(symptom: str):
    """Get follow-up questions for a specific symptom."""
    followup_questions = agent.semantic_net.get_followup_questions(symptom)
    if followup_questions:
        return {"symptom": symptom, "questions": followup_questions}
    return {"symptom": symptom, "questions": []}

@app.post("/symptoms/closest")
async def find_closest_symptom(data: SymptomRequest):
    """Find the closest symptom in the semantic network."""
    closest = agent.semantic_net.find_closest_symptom(data.symptom)
    if closest:
        return {"input": data.symptom, "closest_match": closest}
    return {"input": data.symptom, "closest_match": None}

@app.get("/medicines")
async def get_medicines():
    """Get a list of all available medicines."""
    medicines = agent.df["Medicine_Name"].unique().tolist()
    return {"medicines": medicines}

@app.get("/medicines/{medicine_name}")
async def get_medicine_details(medicine_name: str):
    """Get details for a specific medicine."""
    medicine_data = agent.df[agent.df["Medicine_Name"] == medicine_name]
    if not medicine_data.empty:
        return {"medicine": medicine_data.iloc[0].to_dict()}
    raise HTTPException(status_code=404, detail=f"Medicine '{medicine_name}' not found")

@app.post("/start_session/")
async def start_session(data: PatientData):
    """Start a new consultation session and return either a clarification question or prescription."""
    state = {
        "symptoms": data.symptoms,
        "clarified": [False] * len(data.symptoms),
        "patient_name": data.patient_name,
        "patient_age": data.patient_age,
        "matched_medicines": [{} for _ in data.symptoms],
        "prescription": None,
        "question": None,
        "input_type": None,
        "options": [],
        "history": [],
        "parent_symptoms": [None] * len(data.symptoms),
        "extra_info": [{} for _ in data.symptoms],
        "current_index": 0,
        "followup_questions": [[] for _ in data.symptoms],
        "followup_index": [0] * len(data.symptoms),
    }
    
    # Process the first step
    state = agent.app.invoke(state)
    
    # Generate a session ID
    session_id = str(uuid.uuid4())
    sessions[session_id] = state
    
    # Check if we need to ask a clarification question
    if state.get("question"):
        return {
            "session_id": session_id,
            "status": "needs_clarification",
            "question": state["question"],
            "input_type": state.get("input_type", "text"),
            "options": state.get("options", []),
            "symptom": state["symptoms"][state["current_index"]],
            "symptom_index": state["current_index"] + 1,
            "total_symptoms": len(state["symptoms"])
        }
    
    # If no clarification needed, continue processing until prescription
    while True:
        idx = state.get("current_index", 0)
        if idx >= len(data.symptoms):
            state = agent.app.invoke(state)
            if state.get("prescription"):
                # Clean up the session
                if session_id in sessions:
                    del sessions[session_id]
                return {
                    "status": "complete",
                    "prescription": state["prescription"],
                    "matched_medicines": state.get("matched_medicines", [])
                }
            continue
        
        if not state["clarified"][idx]:
            state = agent.app.invoke(state)
            if state.get("question"):
                sessions[session_id] = state
                return {
                    "session_id": session_id,
                    "status": "needs_clarification",
                    "question": state["question"],
                    "input_type": state.get("input_type", "text"),
                    "options": state.get("options", []),
                    "symptom": state["symptoms"][idx],
                    "symptom_index": idx + 1,
                    "total_symptoms": len(state["symptoms"])
                }
        else:
            state["current_index"] += 1
            sessions[session_id] = state
    
    # This should not be reached
    raise HTTPException(status_code=500, detail="Failed to process request")

@app.post("/answer_question/")
async def answer_question(data: ClarificationAnswer):
    """Process the answer to a clarification question and continue the consultation."""
    # Check if session exists
    if data.session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Retrieve state
    state = sessions[data.session_id]
    
    # Process the answer
    idx = state.get("current_index", 0)
    question = state.get("question", "")
    
    if "how long" in question.lower() or "duration" in question.lower():
        # If it's a duration question
        state["extra_info"][idx]["duration"] = data.answer
    elif "severity" in question.lower():
        state["extra_info"][idx]["severity"] = data.answer
    elif "how often" in question.lower() or "frequency" in question.lower():
        state["extra_info"][idx]["frequency"] = data.answer
    elif "your symptom" in question.lower() and "please clarify" in question.lower():
        # If it's a symptom clarification
        parent = agent.semantic_net.find_parent(state["symptoms"][idx]) or state["symptoms"][idx]
        state["parent_symptoms"][idx] = parent
        state["symptoms"][idx] = data.answer
    else:
        # Generic storage for other questions
        question_key = question.lower().replace("?", "").strip()
        state["extra_info"][idx][question_key] = data.answer
    
    # Update history
    state["history"].append(state["question"])
    state["history"].append(data.answer)
    state["question"] = None
    state["input_type"] = None
    state["options"] = []
    
    # Process next step
    state = agent.app.invoke(state)
    sessions[data.session_id] = state
    
    # Check if we need to ask another clarification question
    if state.get("question"):
        return {
            "session_id": data.session_id,
            "status": "needs_clarification",
            "question": state["question"],
            "input_type": state.get("input_type", "text"),
            "options": state.get("options", []),
            "symptom": state["symptoms"][idx],
            "symptom_index": idx + 1,
            "total_symptoms": len(state["symptoms"])
        }
    
    # Check if current symptom is clarified
    if state["clarified"][idx]:
        state["current_index"] += 1
        sessions[data.session_id] = state
    
    # Continue processing until prescription
    while True:
        idx = state.get("current_index", 0)
        if idx >= len(state.get("symptoms", [])):
            state = agent.app.invoke(state)
            if state.get("prescription"):
                # Include symptom details in the response
                symptom_details = []
                for i, symptom in enumerate(state["symptoms"]):
                    details = {
                        "symptom": symptom,
                        "info": state["extra_info"][i] if i < len(state["extra_info"]) else {},
                        "medicine": state["matched_medicines"][i] if i < len(state["matched_medicines"]) else {}
                    }
                    symptom_details.append(details)
                
                # Clean up the session
                if data.session_id in sessions:
                    del sessions[data.session_id]
                
                return {
                    "status": "complete",
                    "prescription": state["prescription"],
                    "symptom_details": symptom_details
                }
            continue
        
        if not state["clarified"][idx]:
            state = agent.app.invoke(state)
            if state.get("question"):
                sessions[data.session_id] = state
                return {
                    "session_id": data.session_id,
                    "status": "needs_clarification",
                    "question": state["question"],
                    "input_type": state.get("input_type", "text"),
                    "options": state.get("options", []),
                    "symptom": state["symptoms"][idx],
                    "symptom_index": idx + 1,
                    "total_symptoms": len(state["symptoms"])
                }
            continue
        else:
            state["current_index"] += 1
            sessions[data.session_id] = state
    
    # This should not be reached
    raise HTTPException(status_code=500, detail="Failed to process request")

@app.get("/session/{session_id}")
async def get_session_state(session_id: str):
    """Get the current state of a session (for debugging)."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "session_id": session_id,
        "current_index": sessions[session_id].get("current_index", 0),
        "symptoms": sessions[session_id].get("symptoms", []),
        "clarified": sessions[session_id].get("clarified", []),
        "has_prescription": sessions[session_id].get("prescription") is not None
    }

@app.delete("/session/{session_id}")
async def delete_session(session_id: str):
    """Delete a session."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    del sessions[session_id]
    return {"status": "success", "message": f"Session {session_id} deleted"}

# Keep the original endpoint for backward compatibility
@app.post("/get_prescription/")
async def get_prescription(data: PatientData):
    """Legacy endpoint for getting prescriptions without the interactive Q&A flow."""
    state = {
        "symptoms": data.symptoms,
        "clarified": [False] * len(data.symptoms),
        "patient_name": data.patient_name,
        "patient_age": data.patient_age,
        "matched_medicines": [{} for _ in data.symptoms],
        "prescription": None,
        "question": None,
        "input_type": None,
        "options": [],
        "history": [],
        "parent_symptoms": [None] * len(data.symptoms),
        "extra_info": [{} for _ in data.symptoms],
        "current_index": 0,
        "followup_questions": [[] for _ in data.symptoms],
        "followup_index": [0] * len(data.symptoms),
    }

    while True:
        idx = state.get("current_index", 0)
        if idx >= len(data.symptoms):
            state = agent.app.invoke(state)
            if state.get("prescription"):
                return {"prescription": state["prescription"]}
            continue

        if not state["clarified"][idx]:
            state = agent.app.invoke(state)
            if state.get("question"):
                # For simplicity, assume clarification is provided automatically
                state["extra_info"][idx]["duration"] = "1 week"  # Example duration
                state["history"].append(state["question"])
                state["history"].append("1 week")
                state["question"] = None
                state["input_type"] = None
                state["options"] = []
            if state["clarified"][idx]:
                state["current_index"] += 1
            continue
        else:
            state["current_index"] += 1

    raise HTTPException(status_code=500, detail="Failed to generate prescription")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 