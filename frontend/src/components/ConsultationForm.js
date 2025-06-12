import React, { useState, useEffect } from 'react';
import { startConsultation, fetchSymptomCategories, fetchSymptomsByCategory } from '../services/api';

const ConsultationForm = ({ onConsultationStart }) => {
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [symptomText, setSymptomText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [availableSymptoms, setAvailableSymptoms] = useState([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);

  // Fetch symptom categories when component mounts
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await fetchSymptomCategories();
        setCategories(categoriesData);
      } catch (err) {
        setError('Failed to load symptom categories');
        console.error(err);
      }
    };
    loadCategories();
  }, []);

  // Fetch symptoms when a category is selected
  useEffect(() => {
    if (selectedCategory) {
      const loadSymptoms = async () => {
        try {
          const symptoms = await fetchSymptomsByCategory(selectedCategory);
          setAvailableSymptoms(symptoms);
        } catch (err) {
          setError(`Failed to load symptoms for ${selectedCategory}`);
          console.error(err);
        }
      };
      loadSymptoms();
    } else {
      setAvailableSymptoms([]);
    }
  }, [selectedCategory]);

  const addSymptom = () => {
    if (symptomText.trim() !== '') {
      setSelectedSymptoms([...selectedSymptoms, symptomText.trim()]);
      setSymptomText('');
    }
  };

  const addSymptomFromList = (symptom) => {
    if (!selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  const removeSymptom = (index) => {
    const updatedSymptoms = [...selectedSymptoms];
    updatedSymptoms.splice(index, 1);
    setSelectedSymptoms(updatedSymptoms);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!patientName.trim()) {
      setError('Please enter a patient name');
      return;
    }

    if (selectedSymptoms.length === 0) {
      setError('Please add at least one symptom');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const patientData = {
        patient_name: patientName,
        patient_age: patientAge ? parseInt(patientAge, 10) : null,
        symptoms: selectedSymptoms
      };

      const result = await startConsultation(patientData);
      // Add patient data to the result for later use
      result.patientData = {
        name: patientName,
        age: patientAge,
        symptoms: selectedSymptoms.join(', ')
      };
      onConsultationStart(result);
    } catch (err) {
      setError('Failed to start consultation. Please try again.');
      console.error('Consultation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header bg-primary text-white">
        <h3 className="mb-0 d-flex align-items-center">
          <i className="bi bi-person-plus-fill me-2"></i>
          New Patient Consultation
        </h3>
      </div>
      
      <div className="card-body p-4">
        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="patientName" className="form-label">
              <i className="bi bi-person me-2 text-primary"></i>
              Patient Name
            </label>
            <input
              type="text"
              className="form-control"
              id="patientName"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Enter patient name"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="patientAge" className="form-label">
              <i className="bi bi-calendar3 me-2 text-primary"></i>
              Patient Age
            </label>
            <input
              type="number"
              className="form-control"
              id="patientAge"
              value={patientAge}
              onChange={(e) => setPatientAge(e.target.value)}
              placeholder="Enter patient age"
              min="0"
              max="120"
            />
          </div>

          <div className="mb-4">
            <label className="form-label">
              <i className="bi bi-clipboard2-pulse me-2 text-primary"></i>
              Symptoms
            </label>
            <div className="input-group mb-3">
              <input
                type="text"
                className="form-control"
                value={symptomText}
                onChange={(e) => setSymptomText(e.target.value)}
                placeholder="Type a symptom"
                aria-label="Symptom"
              />
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={addSymptom}
                disabled={!symptomText.trim()}
              >
                <i className="bi bi-plus-lg"></i> Add
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label">
              <i className="bi bi-list-check me-2 text-primary"></i>
              Select from common symptoms
            </label>
            <select 
              className="form-select mb-3"
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">-- Select a category --</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
            
            {selectedCategory && (
              <div className="d-flex flex-wrap gap-2 mt-2">
                {availableSymptoms.map((symptom) => (
                  <button
                    key={symptom}
                    type="button"
                    onClick={() => addSymptomFromList(symptom)}
                    className="btn btn-sm btn-outline-secondary"
                  >
                    {symptom} <i className="bi bi-plus-circle-fill ms-1"></i>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedSymptoms.length > 0 && (
            <div className="mb-4">
              <label className="form-label">
                <i className="bi bi-card-checklist me-2 text-success"></i>
                Selected Symptoms:
              </label>
              <div className="list-group">
                {selectedSymptoms.map((symptom, index) => (
                  <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                    <span>{symptom}</span>
                    <button 
                      type="button" 
                      onClick={() => removeSymptom(index)}
                      className="btn btn-sm btn-outline-danger rounded-circle"
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-100 py-2"
            disabled={isLoading || selectedSymptoms.length === 0}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Processing...
              </>
            ) : (
              <>
                <i className="bi bi-arrow-right-circle-fill me-2"></i>
                Start Consultation
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ConsultationForm; 