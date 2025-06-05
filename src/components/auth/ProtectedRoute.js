import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  console.log('ProtectedRoute:', { isLoading, isAuthenticated, user, path: window.location.pathname });

  if (isLoading) {
    // Show a loading spinner or a blank page while auth state is being determined
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    // User not authenticated, redirect to login page
    // Pass the current location to redirect back after login (optional)
    return <Navigate to="/login" replace />;
  }

  // User is authenticated, check for role authorization if allowedRoles are specified
  if (allowedRoles && allowedRoles.length > 0) {
    if (!user || !user.role || !allowedRoles.includes(user.role)) {
      // User does not have the required role, redirect to a 'Forbidden' or 'Not Found' page, or home
      // For simplicity, redirecting to home page. A dedicated 'Forbidden' page would be better UX.
      return (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h5" color="error">Access Denied</Typography>
          <Typography>You do not have permission to view this page.</Typography>
          <Navigate to="/" replace /> {/* Or a dedicated /forbidden page */}
        </Box>
      );
    }
  }

  // User is authenticated and (if applicable) authorized
  return <Outlet />; // Render the child route's element
};

export default ProtectedRoute;
