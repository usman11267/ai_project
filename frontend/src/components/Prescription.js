import React from 'react';
import '../styles/Prescription.css';

const Prescription = ({ result, onNewConsultation }) => {
  const { prescription, symptom_details = [] } = result;

  return (
    <div className="prescription-container">
      <div className="prescription-header">
        <h2>Your Prescription</h2>
      </div>

      <div className="prescription-content">
        <div className="prescription-text">
          {prescription.split('\n').map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>
      </div>

      {symptom_details && symptom_details.length > 0 && (
        <div className="symptom-details">
          <h3>Symptom Details:</h3>
          <div className="symptom-list">
            {symptom_details.map((detail, index) => (
              <div key={index} className="symptom-item">
                <h4>{detail.symptom}</h4>
                {Object.entries(detail.info).length > 0 ? (
                  <ul>
                    {Object.entries(detail.info).map(([key, value], i) => (
                      <li key={i}>
                        <span className="info-key">{key}:</span> {value}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No additional information provided.</p>
                )}
                {detail.medicine && Object.keys(detail.medicine).length > 0 && (
                  <div className="medicine-info">
                    <h5>Recommended Medicine:</h5>
                    <p><strong>Name:</strong> {detail.medicine.Medicine_Name}</p>
                    <p><strong>Type:</strong> {detail.medicine.Medicine_Type}</p>
                    {detail.medicine.Common_Side_Effects && (
                      <p><strong>Side Effects:</strong> {detail.medicine.Common_Side_Effects}</p>
                    )}
                    {detail.medicine.Prescription_Required && (
                      <p><strong>Prescription Required:</strong> {detail.medicine.Prescription_Required}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="prescription-footer">
        <button 
          className="new-consultation-btn" 
          onClick={onNewConsultation}
        >
          Start New Consultation
        </button>
        <button 
          className="print-btn" 
          onClick={() => window.print()}
        >
          Print Prescription
        </button>
      </div>
    </div>
  );
};

export default Prescription; 