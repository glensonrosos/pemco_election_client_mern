import axios from 'axios';

const API_URL = '/api/positions'; // Uses proxy in development

// Helper function to get authentication headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('userToken'); // Corrected key
  console.log('[positionService] Token from localStorage (using key \'userToken\'):', token);
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

// Create a new position
export const createPosition = async (positionData) => {
  try {
    const response = await axios.post(API_URL, positionData, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error creating position:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Failed to create position');
  }
};

// Get all positions (optional: query params for filtering, e.g., { status: 'active' })
export const getAllPositions = async (params = {}) => {
  try {
    const response = await axios.get(API_URL, { headers: getAuthHeaders(), params });
    return response.data;
  } catch (error) {
    console.error('Error fetching positions:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Failed to fetch positions');
  }
};

// Get a single position by ID
export const getPositionById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error(`Error fetching position ${id}:`, error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Failed to fetch position');
  }
};

// Update a position
export const updatePosition = async (id, positionData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, positionData, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error(`Error updating position ${id}:`, error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Failed to update position');
  }
};

// Delete a position
export const deletePosition = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error(`Error deleting position ${id}:`, error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Failed to delete position');
  }
};

const positionService = {
  createPosition,
  getAllPositions,
  getPositionById,
  updatePosition,
  deletePosition,
};

export default positionService;
