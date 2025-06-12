import axios from 'axios';

const API_URL = 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Symptom-related API calls
export const fetchSymptomCategories = async () => {
  try {
    const response = await apiClient.get('/symptoms/categories');
    return response.data.categories;
  } catch (error) {
    console.error('Error fetching symptom categories:', error);
    throw error;
  }
};

export const fetchSymptomsByCategory = async (category) => {
  try {
    const response = await apiClient.get(`/symptoms/${category}`);
    return response.data.symptoms;
  } catch (error) {
    console.error(`Error fetching symptoms for category ${category}:`, error);
    throw error;
  }
};

export const fetchFollowupQuestions = async (symptom) => {
  try {
    const response = await apiClient.get(`/symptoms/followup/${symptom}`);
    return response.data.questions;
  } catch (error) {
    console.error(`Error fetching followup questions for ${symptom}:`, error);
    throw error;
  }
};

export const findClosestSymptom = async (symptom) => {
  try {
    const response = await apiClient.post('/symptoms/closest', { symptom });
    return response.data.closest_match;
  } catch (error) {
    console.error(`Error finding closest match for ${symptom}:`, error);
    throw error;
  }
};

// Medicine-related API calls
export const fetchMedicines = async () => {
  try {
    const response = await apiClient.get('/medicines');
    return response.data.medicines;
  } catch (error) {
    console.error('Error fetching medicines:', error);
    throw error;
  }
};

export const fetchMedicineDetails = async (medicineName) => {
  try {
    const response = await apiClient.get(`/medicines/${medicineName}`);
    return response.data.medicine;
  } catch (error) {
    console.error(`Error fetching details for medicine ${medicineName}:`, error);
    throw error;
  }
};

// Consultation session API calls
export const startConsultation = async (patientData) => {
  try {
    const response = await apiClient.post('/start_session/', patientData);
    return response.data;
  } catch (error) {
    console.error('Error starting consultation:', error);
    throw error;
  }
};

export const answerQuestion = async (sessionId, answer) => {
  try {
    const response = await apiClient.post('/answer_question/', {
      session_id: sessionId,
      answer
    });
    return response.data;
  } catch (error) {
    console.error('Error answering question:', error);
    throw error;
  }
};

export const getSessionState = async (sessionId) => {
  try {
    const response = await apiClient.get(`/session/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching session state for ${sessionId}:`, error);
    throw error;
  }
};

export const deleteSession = async (sessionId) => {
  try {
    const response = await apiClient.delete(`/session/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting session ${sessionId}:`, error);
    throw error;
  }
};

// Direct prescription API call (legacy)
export const getPrescription = async (patientData) => {
  try {
    const response = await apiClient.post('/get_prescription/', patientData);
    return response.data.prescription;
  } catch (error) {
    console.error('Error getting prescription:', error);
    throw error;
  }
};

export default {
  fetchSymptomCategories,
  fetchSymptomsByCategory,
  fetchFollowupQuestions,
  findClosestSymptom,
  fetchMedicines,
  fetchMedicineDetails,
  startConsultation,
  answerQuestion,
  getSessionState,
  deleteSession,
  getPrescription
}; 