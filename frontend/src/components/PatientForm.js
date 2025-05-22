import React, { useState } from 'react';

function PatientForm({ onSubmit, loading }) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    symptoms: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="card">
      <div className="card-header bg-primary text-white">
        <h3 className="mb-0 d-flex align-items-center">
          <i className="bi bi-person-vcard me-2"></i>
          Patient Information
        </h3>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="form-label">
              <i className="bi bi-person me-2"></i>
              Full Name
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light">
                <i className="bi bi-person-fill"></i>
              </span>
              <input
                type="text"
                className="form-control"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="age" className="form-label">
              <i className="bi bi-calendar-heart me-2"></i>
              Age
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light">
                <i className="bi bi-123"></i>
              </span>
              <input
                type="number"
                className="form-control"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="Enter your age"
                required
                min="0"
                max="120"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="symptoms" className="form-label">
              <i className="bi bi-activity me-2"></i>
              Symptoms
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light">
                <i className="bi bi-clipboard2-pulse"></i>
              </span>
              <textarea
                className="form-control"
                id="symptoms"
                name="symptoms"
                value={formData.symptoms}
                onChange={handleChange}
                required
                placeholder="E.g., headache, fever, cough"
                rows="3"
              />
            </div>
            <div className="form-text">
              <i className="bi bi-info-circle me-1"></i>
              Enter symptoms separated by commas (e.g., headache, fever, cough)
            </div>
          </div>
          
          <div className="d-grid gap-2">
            <button
              type="submit"
              className="btn btn-primary py-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Processing...
                </>
              ) : (
                <>
                  <i className="bi bi-capsule me-2"></i>
                  Get Medical Advice
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PatientForm; 