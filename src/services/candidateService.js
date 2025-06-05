import axios from 'axios';
import authService from './authService'; // To get the token for authenticated requests

const API_URL = '/api/candidates'; // Adjust if your backend URL is different

// Setup axios instance to include Authorization header if token exists
const getAuthHeaders = () => {
  const token = authService.getCurrentUserToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

/**
 * Fetches all candidates.
 * Requires authentication as this route is protected on the backend.
 */
const getAllCandidates = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.search) {
      queryParams.append('search', params.search);
    }
    if (params.position) {
      queryParams.append('position', params.position);
    }
    const requestUrl = `${API_URL}?${queryParams.toString()}`;
    const response = await axios.get(requestUrl, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error fetching candidates:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Failed to fetch candidates');
  }
};

/**
 * Creates a new candidate.
 * Requires admin authentication.
 * @param {FormData} formData - The candidate data including profile photo.
 */
const createCandidate = async (formData) => {
  try {
    const headers = {
      ...getAuthHeaders(),
      'Content-Type': 'multipart/form-data',
    };
    const response = await axios.post(API_URL, formData, { headers });
    return response.data;
  } catch (error) {
    console.error('Error creating candidate:', error.response ? error.response.data : error.message);
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to create candidate');
  }
};

/**
 * Fetches a single candidate by their ID.
 * Requires authentication.
 * @param {string} candidateId - The ID of the candidate to fetch.
 */
const getCandidateById = async (candidateId) => {
  try {
    const response = await axios.get(`${API_URL}/${candidateId}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error(`Error fetching candidate ${candidateId}:`, error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Failed to fetch candidate details');
  }
};

/**
 * Updates an existing candidate.
 * Requires admin authentication.
 * @param {string} candidateId - The ID of the candidate to update.
 * @param {FormData} formData - The candidate data to update, may include profile photo.
 */
const updateCandidate = async (candidateId, formData) => {
  try {
    const headers = {
      ...getAuthHeaders(),
      'Content-Type': 'multipart/form-data', // Keep as multipart for potential photo update
    };
    const response = await axios.patch(`${API_URL}/${candidateId}`, formData, { headers });
    return response.data;
  } catch (error) {
    console.error(`Error updating candidate ${candidateId}:`, error.response ? error.response.data : error.message);
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to update candidate');
  }
};

/**
 * Deletes a candidate by their ID.
 * Requires admin authentication.
 * @param {string} candidateId - The ID of the candidate to delete.
 */
const deleteCandidate = async (candidateId) => {
  try {
    const response = await axios.delete(`${API_URL}/${candidateId}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error(`Error deleting candidate ${candidateId}:`, error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Failed to delete candidate');
  }
};

const candidateService = {
  getAllCandidates,
  createCandidate,
  getCandidateById,
  updateCandidate,
  deleteCandidate, // Add new function
};

export default candidateService;
