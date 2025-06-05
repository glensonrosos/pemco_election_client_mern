import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { jwtDecode } from 'jwt-decode'; // To decode JWT and get user info

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Stores decoded user object from token
  const [token, setToken] = useState(authService.getCurrentUserToken());
  const [loading, setLoading] = useState(true); // To handle initial auth state check
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        // Check if token is expired
        if (decodedToken.exp * 1000 < Date.now()) {
          authService.logout(); // Clear expired token
          setUser(null);
          setToken(null);
        } else {
          setUser({ 
            id: decodedToken.id,
            firstName: decodedToken.firstName, 
            lastName: decodedToken.lastName,
            companyId: decodedToken.companyId,
            role: decodedToken.role 
          });
        }
      } catch (error) {
        console.error('Invalid token:', error);
        authService.logout(); // Clear invalid token
        setUser(null);
        setToken(null);
      }
    }
    setLoading(false);
  }, [token]);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    if (data && data.token) {
      setToken(data.token);
      // User state will be updated by useEffect due to token change
      return true; // Indicate success
    }
    return false; // Indicate failure
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    if (data && data.token) {
      setToken(data.token);
      // User state will be updated by useEffect due to token change
      return true; // Indicate success
    }
    return false; // Indicate failure
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
    navigate('/login');
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user, // True if user object exists
    isLoading: loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;
