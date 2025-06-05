import authService from './authService';

export default function authHeader() {
  const token = authService.getCurrentUserToken();

  if (token) {
    // For Spring Boot back-end, Bearer prefix is common
    // For Node.js Express back-ends, it might also be 'x-access-token': token
    // Adjust according to your backend's expectation if 'Bearer' doesn't work.
    return { Authorization: 'Bearer ' + token };
  } else {
    return {};
  }
}
