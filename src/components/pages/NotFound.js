import React from 'react';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { Link as RouterLink } from 'react-router-dom';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';

const NotFound = () => {
  return (
    <Container component="main" maxWidth="sm" sx={{ mt: 8 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          p: 3,
          border: '1px solid #ddd',
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <ReportProblemIcon sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          404
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom color="text.secondary">
          Page Not Found
        </Typography>
        <Typography variant="body1" gutterBottom sx={{ mb: 3 }}>
          Oops! The page you are looking for does not exist or may have been moved.
        </Typography>
        <Button component={RouterLink} to="/" variant="contained" color="primary">
          Go Back to Home
        </Button>
      </Box>
    </Container>
  );
};

export default NotFound;
