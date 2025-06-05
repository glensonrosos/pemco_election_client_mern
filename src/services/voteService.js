import axios from 'axios';
import authService from './authService'; // To get the token for authenticated requests

const API_URL = '/api/votes'; // Base URL for vote-related endpoints

// Setup axios instance to include Authorization header if token exists
const getAuthHeaders = () => {
  const token = authService.getCurrentUserToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

/**
 * Submits the user's vote.
 * @param {Object} voteData - The data containing the votes.
 * Expected format: { votes: ['candidateId1', 'candidateId2', ...] }
 */
const castVote = async (voteData) => {
  try {
    const response = await axios.post(`${API_URL}/cast`, voteData, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error casting vote:', error.response ? error.response.data : error.message);
    // Rethrow a more specific error message if available from backend, otherwise a generic one
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Failed to cast vote. Please try again.');
  }
};

/**
 * Fetches election results.
 */
const getElectionResults = async () => {
  try {
    const response = await axios.get(`${API_URL}/results`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error fetching election results:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Failed to fetch election results');
  }
};

/**
 * Fetches the voting status for the current authenticated user.
 */
const getUserVoteStatus = async () => {
  try {
    const response = await axios.get(`${API_URL}/user-status`, { headers: getAuthHeaders() });
    return response.data; // Expected: { hasVoted: true/false }
  } catch (error) {
    console.error('Error fetching user vote status:', error.response ? error.response.data : error.message);
    throw error.response?.data || new Error('Failed to fetch user vote status');
  }
};

const voteService = {
  castVote,
  getElectionResults,
  getUserVoteStatus,
};

export default voteService;
