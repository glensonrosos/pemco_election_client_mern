import axios from 'axios';

const API_URL = '/api/auth'; // Base URL for authentication routes

/**
 * Registers a new user.
 * @param {object} userData - Object containing { firstName, lastName, companyId, password, confirmPassword }
 * @returns {Promise<object>} Promise resolving to the server response data.
 */
const register = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/register`, userData);
    // If registration is successful, the backend sends back user data and token
    // Store token in localStorage for subsequent authenticated requests
    if (response.data && response.data.token) {
      localStorage.setItem('userToken', response.data.token);
      // You might want to store user info as well, or decode from token if needed
      // localStorage.setItem('userInfo', JSON.stringify(response.data.data.user));
    }
    return response.data;
  } catch (error) {
    // Axios wraps the error response in error.response
    throw error.response ? error.response.data : new Error('Registration failed');
  }
};

/**
 * Logs in an existing user.
 * @param {object} credentials - Object containing { companyId, password }
 * @returns {Promise<object>} Promise resolving to the server response data.
 */
const login = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/login`, credentials);
    // If login is successful, store token
    if (response.data && response.data.token) {
      localStorage.setItem('userToken', response.data.token);
      // localStorage.setItem('userInfo', JSON.stringify(response.data.data.user));
    }
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Login failed');
  }
};

/**
 * Logs out the current user.
 * Removes the token from localStorage.
 */
const logout = () => {
  localStorage.removeItem('userToken');
  // localStorage.removeItem('userInfo');
  // Optionally, redirect to login page or inform backend about logout
};

/**
 * Gets the current user's token from localStorage.
 * @returns {string|null} The JWT token or null if not found.
 */
const getCurrentUserToken = () => {
  return localStorage.getItem('userToken');
};

// You can add more auth-related functions here, e.g., getCurrentUserProfile, refreshToken, etc.

const authService = {
  register,
  login,
  logout,
  getCurrentUserToken,
};

export default authService;
