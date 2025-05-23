import React, { useState } from 'react';
import ConsultationForm from './components/ConsultationForm';
import QuestionFlow from './components/QuestionFlow';
import Prescription from './components/Prescription';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('form');
  const [sessionData, setSessionData] = useState(null);
  const [consultationResult, setConsultationResult] = useState(null);

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
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Doctor AI Assistant</h1>
        <p>Powered by LangGraph + Gemini</p>
      </header>

      <main className="app-main">
        {currentView === 'form' && (
          <ConsultationForm 
            onConsultationStart={handleConsultationStart} 
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
            onNewConsultation={handleNewConsultation}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} Doctor AI</p>
      </footer>
    </div>
  );
}

export default App;
