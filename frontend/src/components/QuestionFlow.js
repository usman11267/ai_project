import React, { useState } from 'react';
import { answerQuestion } from '../services/api';
import '../styles/QuestionFlow.css';

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
    <div className="question-flow">
      <div className="symptom-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ 
              width: `${(sessionData.symptom_index / sessionData.total_symptoms) * 100}%` 
            }}
          ></div>
        </div>
        <div className="progress-text">
          Symptom {sessionData.symptom_index} of {sessionData.total_symptoms}: {sessionData.symptom}
        </div>
      </div>
      
      <div className="question-container">
        <div className="question">
          <h3>{sessionData.question}</h3>
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmitAnswer}>
          {sessionData.input_type === 'checkbox' && sessionData.options && sessionData.options.length > 0 ? (
            <div className="options-container">
              {sessionData.options.map((option, index) => (
                <button
                  key={index}
                  type="button"
                  className={`option-btn ${answer === option ? 'selected' : ''}`}
                  onClick={() => handleOptionSelect(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-input-container">
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here"
              />
            </div>
          )}
          
          <button
            type="submit"
            className="answer-btn"
            disabled={isLoading || !answer.trim()}
          >
            {isLoading ? 'Submitting...' : 'Submit Answer'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default QuestionFlow; 