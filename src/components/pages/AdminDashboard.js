import React, { useState, useEffect, useCallback } from 'react';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import { Link as RouterLink } from 'react-router-dom';
import adminService from '../../services/adminService'; // Import adminService
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';

const AdminDashboard = () => {
  // Election status state
  const [electionStatus, setElectionStatus] = useState('Loading status...');
  const [isVotingOpen, setIsVotingOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);

  // Registration status state
  const [registrationStatusMessage, setRegistrationStatusMessage] = useState('Loading registration status...');
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [registrationStatusLoading, setRegistrationStatusLoading] = useState(true);

  // Action loading state (extended)
  const [actionLoading, setActionLoading] = useState({
    openVoting: false,
    closeVoting: false,
    clearDatabase: false,
    enableRegistration: false,
    disableRegistration: false,
  });

  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }
  

  const fetchElectionStatus = useCallback(async () => {
    setStatusLoading(true);
    setFeedback(null);
    try {
      const data = await adminService.getElectionStatus();
      // Use the isVotingOpen boolean to set a descriptive status string
      if (typeof data.isVotingOpen === 'boolean') {
        setElectionStatus(data.isVotingOpen ? 'Voting is Open' : 'Voting is Closed');
        setIsVotingOpen(data.isVotingOpen);
      } else {
        setElectionStatus('Status unavailable');
      }
    } catch (error) {
      setElectionStatus('Failed to load status');
      setFeedback({ type: 'error', message: error.message || 'Could not fetch election status.' });
    } finally {
      setStatusLoading(false);
    }
  }, []);

  const fetchRegistrationStatus = useCallback(async () => {
    setRegistrationStatusLoading(true);
    // setFeedback(null); // Optionally clear feedback or manage separately
    try {
      const data = await adminService.getRegistrationStatus();
      if (typeof data.isRegistrationOpen === 'boolean') {
        setRegistrationStatusMessage(data.isRegistrationOpen ? 'User Registration is Open' : 'User Registration is Closed');
        setIsRegistrationOpen(data.isRegistrationOpen);
      } else {
        setRegistrationStatusMessage('Registration status unavailable');
        setIsRegistrationOpen(false); // Default to false if status is unclear
      }
    } catch (error) {
      setRegistrationStatusMessage('Failed to load registration status');
      setIsRegistrationOpen(false);
      setFeedback({ type: 'error', message: error.message || 'Could not fetch registration status.' });
    } finally {
      setRegistrationStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchElectionStatus();
    fetchRegistrationStatus();
  }, [fetchElectionStatus, fetchRegistrationStatus]);

  const handleAdminAction = async (actionType, serviceCall, successMessage) => {
    setActionLoading(prev => ({ ...prev, [actionType]: true }));
    setFeedback(null);
    try {
      const response = await serviceCall();
      setFeedback({ type: 'success', message: response.message || successMessage });
      fetchElectionStatus(); // Refresh election status
      fetchRegistrationStatus(); // Refresh registration status
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || `Failed to ${actionType} voting.` });
    } finally {
      setActionLoading(prev => ({ ...prev, [actionType]: false }));
    }
  };

  const handleOpenVoting = () => {
    if (window.confirm('Are you sure you want to open voting?')) {
      handleAdminAction('openVoting', adminService.openVoting, 'Voting opened successfully.');
    }
  };

  const handleCloseVoting = () => {
    if (window.confirm('Are you sure you want to close voting?')) {
      handleAdminAction('closeVoting', adminService.closeVoting, 'Voting closed successfully.');
    }
  };

  const handleClearDatabase = () => {
    if (window.confirm('Are you sure you want to clear all election data? This action cannot be undone.')) {
      handleAdminAction('clearDatabase', adminService.clearElectionData, 'Election data cleared successfully.');
    }
  };

  const handleEnableRegistration = () => {
    if (window.confirm('Are you sure you want to enable user registration?')) {
      handleAdminAction('enableRegistration', adminService.enableRegistration, 'User registration enabled successfully.');
    }
  };

  const handleDisableRegistration = () => {
    if (window.confirm('Are you sure you want to disable user registration? This will prevent new users from signing up.')) {
      handleAdminAction('disableRegistration', adminService.disableRegistration, 'User registration disabled successfully.');
    }
  };

  return (
    <Container component="main" maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Manage the election process, candidates, and view system status.
        </Typography>

        {feedback && (
          <Alert severity={feedback.type} sx={{ mb: 2 }} onClose={() => setFeedback(null)}>
            {feedback.message}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ backgroundColor: isVotingOpen ? 'success.light' : electionStatus.toLowerCase().includes('closed') ? 'warning.light' : 'grey.200', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" component="h3">Current Election Status:</Typography>
                {statusLoading ? <CircularProgress size={20} /> : <Typography variant="body1">{electionStatus}</Typography>}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ backgroundColor: isRegistrationOpen ? 'success.light' : 'warning.light', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" component="h3">Current Registration Status:</Typography>
                {registrationStatusLoading ? <CircularProgress size={20} /> : <Typography variant="body1">{registrationStatusMessage}</Typography>}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Typography variant="h5" component="h2" gutterBottom sx={{mt: 4}}>
          Election Controls
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Button variant="contained" fullWidth onClick={handleOpenVoting} disabled={actionLoading.openVoting || statusLoading || isVotingOpen}>
              {actionLoading.openVoting ? <CircularProgress size={24} color="inherit" /> : 'Open Voting'}
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button variant="contained" color="secondary" fullWidth onClick={handleCloseVoting} disabled={actionLoading.closeVoting || statusLoading || !isVotingOpen}>
              {actionLoading.closeVoting ? <CircularProgress size={24} color="inherit" /> : 'Close Voting'}
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button variant="contained" fullWidth onClick={handleEnableRegistration} disabled={actionLoading.enableRegistration || registrationStatusLoading || isRegistrationOpen || isVotingOpen}>
              {actionLoading.enableRegistration ? <CircularProgress size={24} color="inherit" /> : 'Enable Registration'}
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button variant="contained" color="secondary" fullWidth onClick={handleDisableRegistration} disabled={actionLoading.disableRegistration || registrationStatusLoading || !isRegistrationOpen || isVotingOpen}>
              {actionLoading.disableRegistration ? <CircularProgress size={24} color="inherit" /> : 'Disable Registration'}
            </Button>
          </Grid>
          <Grid item xs={12} md={12}> {/* Changed to full width for larger screens, or keep as 3 for consistency if preferred */}
            <Button variant="outlined" color="error" fullWidth onClick={handleClearDatabase} disabled={actionLoading.clearDatabase || statusLoading || registrationStatusLoading || isVotingOpen}>
              {actionLoading.clearDatabase ? <CircularProgress size={24} color="inherit" /> : 'Clear Election Data'}
            </Button>
          </Grid>
        </Grid>

        <Typography variant="h5" component="h2" gutterBottom sx={{mt: 4}}>
          Candidate Management
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <Button variant="outlined" component={RouterLink} to="/admin/candidates">
              View/Manage Candidates
          </Button>
        </Stack>

        <Typography variant="h5" component="h2" gutterBottom sx={{mt: 4}}>
          Position Management
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <Button variant="outlined" component={RouterLink} to="/admin/positions">
              Manage Positions
          </Button>
        </Stack>

        {/* TODO: Display election results summary on dashboard */}
        {/* TODO: Add candidate list/edit/delete functionality link/section */}

      </Box>
    </Container>
  );
};

export default AdminDashboard;
