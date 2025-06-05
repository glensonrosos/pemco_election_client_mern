import axios from 'axios';
import authService from './authService';

const API_URL = '/api/admin'; // Base URL for admin actions // Base URL for admin-specific endpoints

const getAuthHeaders = () => {
  const token = authService.getCurrentUserToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

/**
 * Sends a request to open the voting period.
 */
const openVoting = async () => {
  try {
    const response = await axios.post(`${API_URL}/open-voting`, {}, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error opening voting:', error.response ? error.response.data : error.message);
    throw error.response?.data || new Error('Failed to open voting');
  }
};

/**
 * Sends a request to close the voting period.
 */
const closeVoting = async () => {
  try {
    const response = await axios.post(`${API_URL}/close-voting`, {}, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error closing voting:', error.response ? error.response.data : error.message);
    throw error.response?.data || new Error('Failed to close voting');
  }
};

/**
 * Sends a request to clear all election data (votes, potentially candidates based on backend logic).
 */
const clearElectionData = async () => {
  try {
    // It's good practice to use DELETE for destructive actions, but ensure backend matches.
    // Backend expects POST for this action as defined in adminRoutes.js
    const response = await axios.post(`${API_URL}/clear-database`, {}, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error clearing election data:', error.response ? error.response.data : error.message);
    throw error.response?.data || new Error('Failed to clear election data');
  }
};

/**
 * Sends a request to enable user registration.
 */
const enableRegistration = async () => {
  try {
    const response = await axios.post(`${API_URL}/enable-registration`, {}, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error enabling registration:', error.response ? error.response.data : error.message);
    throw error.response?.data || new Error('Failed to enable registration');
  }
};

/**
 * Sends a request to disable user registration.
 */
const disableRegistration = async () => {
  try {
    const response = await axios.post(`${API_URL}/disable-registration`, {}, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error disabling registration:', error.response ? error.response.data : error.message);
    throw error.response?.data || new Error('Failed to disable registration');
  }
};

/**
 * Fetches the current user registration status.
 */
const getRegistrationStatus = async () => {
  try {
    const response = await axios.get(`${API_URL}/registration-status`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error fetching registration status:', error.response ? error.response.data : error.message);
    throw error.response?.data || new Error('Failed to fetch registration status');
  }
};

/**
 * Fetches the current status of the election (e.g., open/closed).
 */
const getElectionStatus = async () => {
  try {
    const response = await axios.get(`${API_URL}/voting-status`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error fetching election status:', error.response ? error.response.data : error.message);
    throw error.response?.data || new Error('Failed to fetch election status');
  }
};

const adminService = {
  openVoting,
  closeVoting,
  clearElectionData,
  getElectionStatus, // Added back
  enableRegistration,
  disableRegistration,
  getRegistrationStatus,
};

export default adminService;
