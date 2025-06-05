import axios from 'axios';
import authHeader from './authHeader';

const API_URL = '/api/election'; // Base URL for election-related public endpoints

/**
 * Fetches the public election status (e.g., if voting is open or closed).
 * Requires authentication.
 */
const getPublicElectionStatus = async () => {
  try {
    const response = await axios.get(`${API_URL}/status`, { headers: authHeader() });
    console.log('[electionService.getPublicElectionStatus] Raw Axios response.data (next log shows object):');
    console.log(response.data); // Log the object directly for better inspection in browser console
    return response.data;
  } catch (error) {
    console.error('[electionService.getPublicElectionStatus] Error fetching status. Full error object:', error);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('[electionService.getPublicElectionStatus] Error response data:', error.response.data);
      console.error('[electionService.getPublicElectionStatus] Error response status:', error.response.status);
      console.error('[electionService.getPublicElectionStatus] Error response headers:', error.response.headers);
      // Throw a more informative error or the data itself if it contains a message
      throw error.response.data.message || error.response.data || new Error(`Request failed with status ${error.response.status}`);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('[electionService.getPublicElectionStatus] Error request:', error.request);
      throw new Error('No response received from server while fetching election status.');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('[electionService.getPublicElectionStatus] Error message:', error.message);
      throw new Error(error.message || 'Failed to fetch election status due to a setup error.');
    }
  }
};

const electionService = {
  getPublicElectionStatus,
};

export default electionService;
