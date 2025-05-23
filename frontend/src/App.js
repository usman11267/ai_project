import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';
import ConsultationForm from './components/ConsultationForm';
import QuestionFlow from './components/QuestionFlow';
import Prescription from './components/Prescription';

function App() {
  const [currentView, setCurrentView] = useState('form');
  const [sessionData, setSessionData] = useState(null);
  const [consultationResult, setConsultationResult] = useState(null);
  const [patientData, setPatientData] = useState(null);

  const handleConsultationStart = (result) => {
    setSessionData(result);
    if (result.status === 'needs_clarification') {
      setCurrentView('question');
    } else if (result.status === 'complete') {
      setConsultationResult(result);
      setCurrentView('prescription');
    }
  };

  const handleQuestionAnswered = (result) => {
    setSessionData(result);
    if (result.status === 'complete') {
      setConsultationResult(result);
      setCurrentView('prescription');
    }
  };

  const handleNewConsultation = () => {
    setCurrentView('form');
    setSessionData(null);
    setConsultationResult(null);
    setPatientData(null);
  };

  // Map current view to step number for progress indicator
  const getStepNumber = () => {
    switch (currentView) {
      case 'form': return 1;
      case 'question': return 2;
      case 'prescription': return 3;
      default: return 1;
    }
  };

  const step = getStepNumber();

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
              {currentView === 'form' && (
                <ConsultationForm 
                  onConsultationStart={(result) => {
                    setPatientData(result.patientData);
                    handleConsultationStart(result);
                  }}
                />
              )}
              
              {currentView === 'question' && sessionData && (
                <QuestionFlow 
                  sessionData={sessionData}
                  onQuestionAnswered={handleQuestionAnswered}
                  onConsultationComplete={(result) => {
                    setConsultationResult(result);
                    setCurrentView('prescription');
                  }}
                />
              )}
              
              {currentView === 'prescription' && consultationResult && (
                <Prescription 
                  result={consultationResult}
                  patientData={patientData}
                  onNewConsultation={handleNewConsultation}
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
