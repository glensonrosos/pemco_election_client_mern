import React, { useEffect } from 'react'; // Removed useContext
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Import useAuth custom hook
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import { Link as RouterLink } from 'react-router-dom';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

const Home = () => {
  const authState = useAuth(); // Use the custom hook
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for auth state to be loaded
    if (!authState.isLoading) { // Use authState.isLoading
      if (authState.isAuthenticated && authState.user) {
        if (authState.user.role === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/vote', { replace: true });
        }
      } 
      // If not authenticated, and not loading, it will proceed to render the JSX below
      // which contains login/register buttons.
    }
  }, [authState.isLoading, authState.isAuthenticated, authState.user, navigate]); // More specific dependencies

  // While authState is loading, show a loader or nothing to prevent flash of content
  if (authState.isLoading) { // Use authState.isLoading
    return (
      <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        {/* You can put a CircularProgress here if desired */}
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  // If not authenticated and not loading, render the original Home page content 

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          PEMCO Cooperative Election Portal
        </Typography>
        <Typography variant="h5" component="p" color="text.secondary" sx={{ mb: 4 }}>
          Your voice, your choice. Participate in our cooperative's future.
        </Typography>
        
        {/* Placeholder: Show different content based on login status */}
        {/* For now, always show login/register buttons */}
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button component={RouterLink} to="/login" variant="contained" size="large">
            Login to Vote
          </Button>
          <Button component={RouterLink} to="/register" variant="outlined" size="large">
            Register Account
          </Button>
        </Stack>

        <Box sx={{ mt: 6, p: 2, border: '1px dashed grey', borderRadius: 1 }}>
            <Typography variant="body1">
                This is the main landing page. Once logged in, users will be able to access the voting interface, and admins will see their dashboard options.
            </Typography>
        </Box>

      </Box>
    </Container>
  );
};

export default Home;
