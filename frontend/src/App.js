import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';
import PatientForm from './components/PatientForm';
import Clarification from './components/Clarification';
import Prescription from './components/Prescription';
import axios from 'axios';

function App() {
  const [step, setStep] = useState(1); // 1: Form, 2: Clarification, 3: Prescription
  const [patientData, setPatientData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [prescription, setPrescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async (data) => {
    setPatientData(data);
    setLoading(true);
    
    try {
      // Start a new session with the backend
      const response = await axios.post('http://localhost:8000/start_session/', {
        patient_name: data.name,
        patient_age: parseInt(data.age),
        symptoms: data.symptoms.split(',').map(s => s.trim())
      });
      
      setLoading(false);
      
      if (response.data.status === 'needs_clarification') {
        // We need to ask a clarification question
        setSessionId(response.data.session_id);
        setCurrentQuestion(response.data.question);
        setStep(2); // Go to clarification step
      } else if (response.data.status === 'complete') {
        // We have a prescription already
        setPrescription(response.data.prescription);
        setStep(3); // Go to prescription step
      }
    } catch (error) {
      console.error('Error starting session:', error);
      setLoading(false);
      alert('Failed to start consultation. Please try again.');
    }
  };

  const handleClarificationSubmit = async (answer) => {
    setLoading(true);
    
    try {
      // Send the answer to the backend
      const response = await axios.post('http://localhost:8000/answer_question/', {
        session_id: sessionId,
        answer: answer
      });
      
      setLoading(false);
      
      if (response.data.status === 'needs_clarification') {
        // We need to ask another clarification question
        setCurrentQuestion(response.data.question);
        // Stay on clarification step
      } else if (response.data.status === 'complete') {
        // We have a prescription
        setPrescription(response.data.prescription);
        setStep(3); // Go to prescription step
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setLoading(false);
      alert('Failed to process your answer. Please try again.');
    }
  };

  const resetApp = () => {
    setStep(1);
    setPatientData(null);
    setCurrentQuestion('');
    setSessionId(null);
    setPrescription('');
  };

  return (
    <div className="App">
      <div className="app-background"></div>
      <div className="container py-5">
        <header className="mb-5 text-center">
          <div className="logo-container mb-3">
            <i className="bi bi-heart-pulse-fill text-danger"></i>
          </div>
          <h1 className="display-4 fw-bold">Doctor AI Assistant</h1>
          <p className="text-muted lead">Powered by LangGraph + Gemini</p>
          <div className="progress mb-4" style={{height: '8px'}}>
            <div 
              className="progress-bar" 
              role="progressbar" 
              style={{width: `${step * 33.33}%`}} 
              aria-valuenow={step * 33.33} 
              aria-valuemin="0" 
              aria-valuemax="100"
            ></div>
          </div>
          <div className="steps-indicator d-flex justify-content-between mb-5">
            <div className={`step-item ${step >= 1 ? 'active' : ''}`}>
              <div className="step-circle">
                <i className="bi bi-person-fill"></i>
              </div>
              <div className="step-label">Patient Info</div>
            </div>
            <div className={`step-item ${step >= 2 ? 'active' : ''}`}>
              <div className="step-circle">
                <i className="bi bi-chat-dots-fill"></i>
              </div>
              <div className="step-label">Clarification</div>
            </div>
            <div className={`step-item ${step >= 3 ? 'active' : ''}`}>
              <div className="step-circle">
                <i className="bi bi-file-medical-fill"></i>
              </div>
              <div className="step-label">Prescription</div>
            </div>
          </div>
        </header>

        <div className="row justify-content-center">
          <div className="col-lg-8 col-md-10">
            <div className="content-wrapper">
              {step === 1 && (
                <PatientForm onSubmit={handleFormSubmit} loading={loading} />
              )}
              
              {step === 2 && (
                <Clarification 
                  question={currentQuestion} 
                  onSubmit={handleClarificationSubmit}
                  loading={loading}
                />
              )}
              
              {step === 3 && (
                <Prescription 
                  prescription={prescription} 
                  patientData={patientData} 
                  onReset={resetApp}
                />
              )}
            </div>
          </div>
        </div>
        
        <footer className="mt-5 pt-4 text-center text-muted">
          <small>&copy; {new Date().getFullYear()} Doctor AI Assistant. All rights reserved.</small>
        </footer>
      </div>
    </div>
  );
}

export default App;
