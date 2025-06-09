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

/**
 * Sends a request to import voters from an Excel file.
 * @param {File} file - The Excel file to upload.
 * @returns {Promise<object>} Promise resolving to the server response data.
 */
const importVoters = async (file) => {
  try {
    const formData = new FormData();
    formData.append('votersFile', file);

    const response = await axios.post(`${API_URL}/import-voters`, formData, {
      headers: {
        ...getAuthHeaders(),
        // 'Content-Type': 'multipart/form-data', // Axios sets this automatically for FormData
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error importing voters:', error.response ? error.response.data : error.message);
    throw error.response?.data || new Error('Failed to import voters');
  }
};

// Service function to trigger the export of voters
const exportVoters = async () => {
  try {
    const response = await axios.get(`${API_URL}/export-voters`, {
      headers: getAuthHeaders(),
      responseType: 'blob', // Important to handle the file download
    });
    // Create a URL for the blob
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    // Extract filename from content-disposition header if available, otherwise fallback
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'voters_export.xlsx'; // Default filename
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/i);
      if (filenameMatch && filenameMatch.length > 1) {
        filename = filenameMatch[1];
      }
    }
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url); // Clean up the object URL
    // Unlike other functions, this one doesn't typically return data for UI update on success,
    // as the download itself is the primary feedback. Can return a success status if needed.
    // For consistency, let's return a success object.
    return { success: true, message: 'Voters export initiated successfully.' };
  } catch (error) {
    console.error('Error exporting voters:', error.response ? error.response.data : error.message);
    // Attempt to parse error message from blob if it's a JSON error response
    let errorMessage = 'Failed to export voters. Please try again.';
    if (error.response && error.response.data instanceof Blob && error.response.data.type === 'application/json') {
      try {
        const errorJson = JSON.parse(await error.response.data.text());
        errorMessage = errorJson.message || errorMessage;
      } catch (parseError) {
        // Blob wasn't JSON or couldn't be parsed, stick to default
      }
    }
    return { 
      success: false, 
      message: errorMessage 
    };
  }
};

// Service function to trigger the export of admin users
const exportAdminUsers = async () => {
  try {
    const response = await axios.get(`${API_URL}/export-admins`, {
      headers: getAuthHeaders(),
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'admins_export.xlsx'; // Default filename
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/i);
      if (filenameMatch && filenameMatch.length > 1) {
        filename = filenameMatch[1];
      }
    }
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
    return { success: true, message: 'Admin users export initiated successfully.' };
  } catch (error) {
    console.error('Error exporting admin users:', error.response ? error.response.data : error.message);
    let errorMessage = 'Failed to export admin users. Please try again.';
    if (error.response && error.response.data instanceof Blob && error.response.data.type === 'application/json') {
      try {
        const errorJson = JSON.parse(await error.response.data.text());
        errorMessage = errorJson.message || errorMessage;
      } catch (parseError) {
        // Blob wasn't JSON or couldn't be parsed, stick to default
      }
    }
    return { 
      success: false, 
      message: errorMessage 
    };
  }
};

// Service function to delete all voters
const deleteAllVoters = async () => {
  try {
    const response = await axios.delete(`${API_URL}/delete-all-voters`, {
      headers: getAuthHeaders(),
    });
    return { success: true, message: response.data.message, details: response.data };
  } catch (error) {
    console.error('Error deleting all voters:', error.response ? error.response.data : error.message);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to delete all voters. Please try again.' 
    };
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
  importVoters,
  exportVoters,
  exportAdminUsers,
  deleteAllVoters,
};

export default adminService;
