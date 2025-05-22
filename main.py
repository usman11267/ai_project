from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
import agent

app = FastAPI()

class PatientData(BaseModel):
    patient_name: str
    patient_age: Optional[int]
    symptoms: List[str]

@app.post("/get_prescription/")
async def get_prescription(data: PatientData):
    state = {
        "symptoms": data.symptoms,
        "clarified": [False] * len(data.symptoms),
        "patient_name": data.patient_name,
        "patient_age": data.patient_age,
        "matched_medicines": [{} for _ in data.symptoms],
        "prescription": None,
        "question": None,
        "history": [],
        "parent_symptoms": [None] * len(data.symptoms),
        "extra_info": [{} for _ in data.symptoms],
        "current_index": 0,
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
            if state["clarified"][idx]:
                state["current_index"] += 1
            continue
        else:
            state["current_index"] += 1

    raise HTTPException(status_code=500, detail="Failed to generate prescription") 