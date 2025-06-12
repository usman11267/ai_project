import React, { useState } from 'react';
import { answerQuestion } from '../services/api';

const QuestionFlow = ({ 
  sessionData, 
  onQuestionAnswered, 
  onConsultationComplete 
}) => {
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    
    if (!answer.trim()) {
      setError('Please provide an answer');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await answerQuestion(sessionData.session_id, answer);
      setAnswer(''); // Clear the input
      
      if (result.status === 'complete') {
        onConsultationComplete(result);
      } else {
        onQuestionAnswered(result);
      }
    } catch (err) {
      setError('Failed to process answer. Please try again.');
      console.error('Answer submission error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionSelect = (option) => {
    setAnswer(option);
  };

  return (
    <div className="card">
      <div className="card-header bg-info text-white">
        <h3 className="mb-0 d-flex align-items-center">
          <i className="bi bi-chat-dots-fill me-2"></i>
          Doctor's Questions
        </h3>
      </div>
      <div className="card-body p-4">
        <div className="mb-4">
          <div className="d-flex align-items-center justify-content-between mb-1">
            <span className="text-muted fs-6">
              Question {sessionData.symptom_index} of {sessionData.total_symptoms}
            </span>
            <span className="badge bg-primary">{sessionData.symptom}</span>
          </div>
          <div className="progress" style={{ height: '8px' }}>
            <div 
              className="progress-bar bg-info" 
              role="progressbar" 
              style={{ width: `${(sessionData.symptom_index / sessionData.total_symptoms) * 100}%` }}
              aria-valuenow={(sessionData.symptom_index / sessionData.total_symptoms) * 100}
              aria-valuemin="0" 
              aria-valuemax="100"
            ></div>
          </div>
        </div>

        <div className="doctor-question mb-4">
          <div className="d-flex">
            <div className="doctor-avatar me-3 align-self-start">
              <i className="bi bi-robot fs-4 text-info"></i>
            </div>
            <div className="question-bubble p-3 bg-light rounded">
              <h4 className="fs-5 fw-medium">{sessionData.question}</h4>
            </div>
          </div>
        </div>
          
        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmitAnswer}>
          {sessionData.input_type === 'checkbox' && sessionData.options && sessionData.options.length > 0 ? (
            <div className="option-buttons d-flex flex-wrap gap-2 my-3">
              {sessionData.options.map((option, index) => (
                <button
                  key={index}
                  type="button"
                  className={`btn ${answer === option ? 'btn-info text-white' : 'btn-outline-info'}`}
                  onClick={() => handleOptionSelect(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : (
            <div className="mb-3">
              <input
                type="text"
                className="form-control form-control-lg"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here"
                aria-label="Your answer"
              />
            </div>
          )}
          
          <div className="d-grid gap-2 mt-4">
            <button
              type="submit"
              className="btn btn-info text-white"
              disabled={isLoading || !answer.trim()}
            >
              {isLoading ? (
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
  );
};

export default QuestionFlow; 