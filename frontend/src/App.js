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
  const [clarificationResponses, setClarificationResponses] = useState({});
  const [prescription, setPrescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async (data) => {
    setPatientData(data);
    setLoading(true);
    
    try {
      // For simplicity in this MVP, we'll skip the clarification step and go directly to prescription
      const response = await axios.post('http://localhost:8000/get_prescription/', {
        patient_name: data.name,
        patient_age: parseInt(data.age),
        symptoms: data.symptoms.split(',').map(s => s.trim())
      });
      
      setPrescription(response.data.prescription);
      setLoading(false);
      setStep(3); // Go directly to prescription step
    } catch (error) {
      console.error('Error fetching prescription:', error);
      setLoading(false);
      alert('Failed to get prescription. Please try again.');
    }
  };

  const handleClarificationSubmit = (answer) => {
    setClarificationResponses({
      ...clarificationResponses,
      [currentQuestion]: answer
    });
    
    // In a real implementation, we would send this answer back to the API
    // For now, we'll just simulate moving to the prescription step
    setLoading(true);
    setTimeout(() => {
      setPrescription("Sample prescription based on your symptoms...");
      setLoading(false);
      setStep(3);
    }, 1500);
  };

  const resetApp = () => {
    setStep(1);
    setPatientData(null);
    setCurrentQuestion('');
    setClarificationResponses({});
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
