import React, { useState, useEffect } from 'react';
import { startConsultation, fetchSymptomCategories, fetchSymptomsByCategory } from '../services/api';
import '../styles/ConsultationForm.css';

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
      onConsultationStart(result);
    } catch (err) {
      setError('Failed to start consultation. Please try again.');
      console.error('Consultation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="consultation-form">
      <h2>New Consultation</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="patientName">Patient Name:</label>
          <input
            type="text"
            id="patientName"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="Enter patient name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="patientAge">Patient Age:</label>
          <input
            type="number"
            id="patientAge"
            value={patientAge}
            onChange={(e) => setPatientAge(e.target.value)}
            placeholder="Enter patient age"
            min="0"
            max="120"
          />
        </div>

        <div className="form-group">
          <label>Symptoms:</label>
          <div className="symptom-input-container">
            <input
              type="text"
              value={symptomText}
              onChange={(e) => setSymptomText(e.target.value)}
              placeholder="Enter a symptom"
            />
            <button
              type="button"
              onClick={addSymptom}
              className="add-symptom-btn"
            >
              Add
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>Select from common symptoms:</label>
          <select 
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
            <div className="available-symptoms">
              {availableSymptoms.map((symptom) => (
                <button
                  key={symptom}
                  type="button"
                  onClick={() => addSymptomFromList(symptom)}
                  className="symptom-btn"
                >
                  {symptom}
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedSymptoms.length > 0 && (
          <div className="selected-symptoms">
            <h3>Selected Symptoms:</h3>
            <ul>
              {selectedSymptoms.map((symptom, index) => (
                <li key={index}>
                  {symptom}
                  <button 
                    type="button" 
                    onClick={() => removeSymptom(index)}
                    className="remove-btn"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="submit"
          className="submit-btn"
          disabled={isLoading || selectedSymptoms.length === 0}
        >
          {isLoading ? "Loading..." : "Start Consultation"}
        </button>
      </form>
    </div>
  );
};

export default ConsultationForm; 