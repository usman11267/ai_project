import React, { useState } from 'react';

const Prescription = ({ result, patientData, onNewConsultation }) => {
  const { prescription, symptom_details = [] } = result;
  const [showDetails, setShowDetails] = useState(false);
  
  const renderSymptomInfo = (info) => {
    if (!info || Object.keys(info).length === 0) return "No additional information";
    
    return (
      <ul className="mb-0 list-unstyled">
        {Object.entries(info).map(([key, value], index) => (
          <li key={index} className="mb-1">
            <span className="fw-medium text-secondary text-capitalize">{key}:</span> {value}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="card">
      <div className="card-header bg-success text-white">
        <h3 className="mb-0 d-flex align-items-center">
          <i className="bi bi-file-earmark-medical-fill me-2"></i>
          Doctor's Prescription
        </h3>
      </div>
      <div className="card-body">
        <div className="patient-info mb-4 p-3 bg-light rounded">
          <h4 className="d-flex align-items-center border-bottom pb-2 mb-3">
            <i className="bi bi-person-badge me-2 text-primary"></i>
            Patient Information
          </h4>
          <div className="row">
            <div className="col-md-6 mb-2">
              <div className="d-flex align-items-center">
                <i className="bi bi-person-fill text-secondary me-2"></i>
                <strong>Name:</strong>
                <span className="ms-2">{patientData?.name}</span>
              </div>
            </div>
            <div className="col-md-6 mb-2">
              <div className="d-flex align-items-center">
                <i className="bi bi-calendar-event text-secondary me-2"></i>
                <strong>Age:</strong>
                <span className="ms-2">{patientData?.age}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="symptoms-info mb-4">
          <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
            <h4 className="d-flex align-items-center mb-0">
              <i className="bi bi-clipboard2-pulse text-info me-2"></i>
              Symptoms
            </h4>
            {symptom_details?.length > 0 && (
              <button 
                className="btn btn-sm btn-outline-info" 
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? 'Hide Details' : 'Show Details'}
              </button>
            )}
          </div>

          {!showDetails ? (
            <div className="simple-symptoms">
              <p className="mb-0">{patientData?.symptoms}</p>
            </div>
          ) : (
            <div className="detailed-symptoms">
              {symptom_details?.map((detail, index) => (
                <div key={index} className="symptom-detail mb-3 p-3 border rounded">
                  <h5 className="d-flex align-items-center mb-3">
                    <i className="bi bi-activity me-2 text-danger"></i>
                    {detail.symptom}
                  </h5>
                  <div className="symptom-info ps-4">
                    {renderSymptomInfo(detail.info)}
                  </div>
                  {detail.medicine && Object.keys(detail.medicine).length > 0 && (
                    <div className="medicine-info mt-3 pt-3 border-top">
                      <h6 className="d-flex align-items-center mb-2">
                        <i className="bi bi-capsule me-2 text-primary"></i>
                        Recommended Medicine:
                      </h6>
                      <div className="ps-4">
                        <div className="mb-1"><strong>Name:</strong> {detail.medicine.Medicine_Name}</div>
                        <div className="mb-1"><strong>Type:</strong> {detail.medicine.Medicine_Type}</div>
                        {detail.medicine.Common_Side_Effects && (
                          <div className="mb-1"><strong>Side Effects:</strong> {detail.medicine.Common_Side_Effects}</div>
                        )}
                        {detail.medicine.Prescription_Required && (
                          <div className="mb-1">
                            <strong>Prescription Required:</strong> 
                            <span className={detail.medicine.Prescription_Required === 'Yes' ? 'text-danger' : 'text-success'}>
                              {' '}{detail.medicine.Prescription_Required}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="prescription-content mb-4">
          <h4 className="d-flex align-items-center border-bottom pb-2 mb-3">
            <i className="bi bi-capsule me-2 text-success"></i>
            Prescription
          </h4>
          <div className="prescription-text p-3 border rounded bg-light position-relative">
            <div className="prescription-watermark">
              <i className="bi bi-patch-check-fill text-success opacity-10"></i>
            </div>
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', position: 'relative', zIndex: 1 }}>
              {prescription}
            </pre>
          </div>
        </div>

        <div className="disclaimer mb-4 p-3 border-start border-warning border-4 bg-light rounded">
          <h5 className="d-flex align-items-center text-warning mb-2">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            Medical Disclaimer
          </h5>
          <small>
            This prescription is generated by an AI assistant and is not a substitute for professional medical advice. 
            Please consult with a healthcare provider before following any recommendations.
          </small>
        </div>
        
        <div className="d-flex flex-wrap gap-2">
          <button 
            className="btn btn-primary"
            onClick={onNewConsultation}
          >
            <i className="bi bi-arrow-counterclockwise me-2"></i>
            Start Over
          </button>
          
          <button 
            className="btn btn-outline-success"
            onClick={() => window.print()}
          >
            <i className="bi bi-printer-fill me-2"></i>
            Print Prescription
          </button>
          
          <button 
            className="btn btn-outline-secondary"
            onClick={() => {
              const blob = new Blob([prescription], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `prescription_${patientData?.name || 'patient'}.txt`;
              a.click();
            }}
          >
            <i className="bi bi-download me-2"></i>
            Download Prescription
          </button>
        </div>
      </div>
    </div>
  );
};

export default Prescription; 