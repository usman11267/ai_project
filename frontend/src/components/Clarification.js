import React, { useState, useEffect } from 'react';

function Clarification({ question, symptomInfo, onSubmit, loading }) {
  const [textAnswer, setTextAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  
  const { symptom, symptomIndex, totalSymptoms, inputType, options } = symptomInfo || { 
    symptom: '', 
    symptomIndex: 1, 
    totalSymptoms: 1,
    inputType: 'text',
    options: []
  };
  
  // Reset state when question changes
  useEffect(() => {
    setTextAnswer('');
    setSelectedOption('');
  }, [question]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    const answer = inputType === 'checkbox' ? selectedOption : textAnswer;
    onSubmit(answer);
    setTextAnswer('');
    setSelectedOption('');
  };

  return (
    <div className="card">
      <div className="card-header bg-info text-white">
        <h3 className="mb-0 d-flex align-items-center justify-content-between">
          <div>
            <i className="bi bi-chat-quote-fill me-2"></i>
            Symptom Clarification
          </div>
          <div className="symptom-progress">
            <span className="badge rounded-pill bg-light text-dark">
              Symptom {symptomIndex} of {totalSymptoms}
            </span>
          </div>
        </h3>
      </div>
      <div className="card-body">
        {symptom && (
          <div className="current-symptom mb-3 p-2 bg-light rounded d-flex align-items-center">
            <i className="bi bi-clipboard2-pulse text-info me-2"></i>
            <span>Current symptom: <strong>{symptom}</strong></span>
          </div>
        )}
        
        <div className="doctor-question mb-4 p-3 bg-light rounded border-start border-info border-4">
          <div className="d-flex">
            <div className="me-3">
              <div className="doctor-avatar">
                <i className="bi bi-robot text-info" style={{ fontSize: '2rem' }}></i>
              </div>
            </div>
            <div>
              <div className="fw-bold mb-2 text-info">
                <i className="bi bi-heart-pulse me-2"></i>
                Doctor AI
              </div>
              <p className="mb-0 lead">{question}</p>
            </div>
          </div>
        </div>
        
        <div className="answer-section">
          <form onSubmit={handleSubmit}>
            {inputType === 'checkbox' && options && options.length > 0 ? (
              <div className="mb-4">
                <label className="form-label d-flex align-items-center">
                  <i className="bi bi-check2-square me-2"></i>
                  Select an option
                </label>
                <div className="options-container p-2 rounded border">
                  {options.map((option, index) => (
                    <div className="form-check mb-2" key={index}>
                      <input
                        className="form-check-input"
                        type="radio"
                        name="symptomOption"
                        id={`option-${index}`}
                        value={option}
                        checked={selectedOption === option}
                        onChange={() => setSelectedOption(option)}
                        disabled={loading}
                        required
                      />
                      <label className="form-check-label" htmlFor={`option-${index}`}>
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
                {!selectedOption && (
                  <div className="form-text">
                    <i className="bi bi-info-circle me-1"></i>
                    Please select one option
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-4">
                <label htmlFor="answer" className="form-label">
                  <i className="bi bi-reply-fill me-2"></i>
                  Your Answer
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light">
                    <i className="bi bi-pencil-square"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    id="answer"
                    value={textAnswer}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    required
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>
            )}
            
            <div className="d-grid gap-2">
              <button
                type="submit"
                className="btn btn-info text-white py-2"
                disabled={loading || (inputType === 'checkbox' && !selectedOption)}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send-fill me-2"></i>
                    Submit Answer
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Clarification; 