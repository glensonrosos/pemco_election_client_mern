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
  const [selectedFile, setSelectedFile] = useState(null);
  const [importFeedback, setImportFeedback] = useState(null); // { type, message, details: {importedCount, skippedCount, errorCount, errors} }

  const [actionLoading, setActionLoading] = useState({
    openVoting: false,
    closeVoting: false,
    clearDatabase: false,
    enableRegistration: false,
    disableRegistration: false,
    importVoters: false,
    exportingVoters: false,
    exportingAdmins: false,
    deletingAllVoters: false,
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


  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setImportFeedback(null); // Clear previous feedback when a new file is selected
  };

  const handleImportVoters = async () => {
    if (!selectedFile) {
      setImportFeedback({ type: 'error', message: 'Please select an Excel file to import.' });
      return;
    }

    setActionLoading(prev => ({ ...prev, importVoters: true }));
    setImportFeedback(null);

    try {
      const response = await adminService.importVoters(selectedFile);
      setImportFeedback({
        type: 'success',
        message: response.message || 'Voter import process completed.',
        details: {
          importedCount: response.importedCount,
          skippedCount: response.skippedCount,
          errorCount: response.errorCount,
          errors: response.errors || []
        }
      });
      setSelectedFile(null); // Clear the file input after successful import
      const fileInput = document.getElementById('voter-import-file-input');
      if (fileInput) {
        fileInput.value = null; // Attempt to reset file input
      }
    } catch (error) {
      setImportFeedback({
        type: 'error',
        message: error.message || 'Failed to import voters.',
        details: error.response?.data?.errors ? { errors: error.response.data.errors } : (error.errors ? { errors: error.errors } : null)
      });
    } finally {
      setActionLoading(prev => ({ ...prev, importVoters: false }));
    }
  };

  // Original handleDisableRegistration was targeted, so we re-declare it before this comment to avoid removing it.
  const handleExportVoters = async () => {
    setActionLoading(prev => ({ ...prev, exportingVoters: true }));
    setFeedback(null); // Clear previous general feedback
    setImportFeedback(null); // Clear import-specific feedback
    try {
      const result = await adminService.exportVoters();
      if (result.success) {
        setFeedback({ type: 'success', message: result.message || 'Voter export initiated successfully.' });
      } else {
        setFeedback({ type: 'error', message: result.message || 'Failed to export voters.' });
      }
    } catch (error) {
      // This catch block might be redundant if adminService.exportVoters already catches and returns a message
      setFeedback({ type: 'error', message: error.message || 'An unexpected error occurred during export.' });
    }
    setActionLoading(prev => ({ ...prev, exportingVoters: false }));
  };

  const handleExportAdminUsers = async () => {
    setActionLoading(prev => ({ ...prev, exportingAdmins: true }));
    setFeedback(null);
    setImportFeedback(null);
    try {
      const result = await adminService.exportAdminUsers();
      if (result.success) {
        setFeedback({ type: 'success', message: result.message || 'Admin users export initiated successfully.' });
      } else {
        setFeedback({ type: 'error', message: result.message || 'Failed to export admin users.' });
      }
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'An unexpected error occurred during admin export.' });
    }
    setActionLoading(prev => ({ ...prev, exportingAdmins: false }));
  };

  const handleDeleteAllVoters = async () => {
    if (window.confirm('Are you sure you want to delete ALL voters? This action cannot be undone and will remove all users with the role \'user\'.')) {
      setActionLoading(prev => ({ ...prev, deletingAllVoters: true }));
      setFeedback(null);
      setImportFeedback(null);
      try {
        const result = await adminService.deleteAllVoters();
        if (result.success) {
          setFeedback({ type: 'success', message: result.message || 'All voters deleted successfully.' });
        } else {
          setFeedback({ type: 'error', message: result.message || 'Failed to delete all voters.' });
        }
      } catch (error) {
        setFeedback({ type: 'error', message: error.message || 'An unexpected error occurred while deleting voters.' });
      }
      setActionLoading(prev => ({ ...prev, deletingAllVoters: false }));
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
          User & Voter Management
        </Typography>
        <Card sx={{ mb: 3, p: 2 }}>
          <CardContent>
            <Typography variant="h6" component="h3" gutterBottom>
              Import Voters from Excel
            </Typography>
            <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} alignItems="center">
              <Button variant="contained" component="label" disabled={actionLoading.importVoters || isVotingOpen}>
                Choose File
                <input id="voter-import-file-input" type="file" hidden accept=".xlsx, .xls" onChange={handleFileChange} />
              </Button>
              {selectedFile && <Typography variant="body2">{selectedFile.name}</Typography>}
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleImportVoters} 
                disabled={!selectedFile || actionLoading.importVoters || isVotingOpen}
                sx={{minWidth: '120px'}}
              >
                {actionLoading.importVoters ? <CircularProgress size={24} color="inherit" /> : 'Import Voters'}
              </Button>
              <Button 
                variant="outlined" 
                color="secondary" 
                onClick={handleExportVoters} 
                disabled={actionLoading.exportingVoters || isVotingOpen}
                sx={{minWidth: '130px'}}
              >
                {actionLoading.exportingVoters ? <CircularProgress size={24} color="inherit" /> : 'Export Voters'}
              </Button>
              <Button 
                variant="outlined" 
                color="info" 
                onClick={handleExportAdminUsers} 
                disabled={actionLoading.exportingAdmins || isVotingOpen}
                sx={{minWidth: '140px'}}
              >
                {actionLoading.exportingAdmins ? <CircularProgress size={24} color="inherit" /> : 'Export Admins'}
              </Button>
            </Stack>
            {importFeedback && (
              <Box sx={{ mt: 2 }}>
                <Alert severity={importFeedback.type} onClose={() => setImportFeedback(null)}>
                  {importFeedback.message}
                  {importFeedback.details && (
                    <Box sx={{ mt: 1}}>
                      {typeof importFeedback.details.importedCount === 'number' && <Typography variant="body2">Imported: {importFeedback.details.importedCount}</Typography>}
                      {typeof importFeedback.details.skippedCount === 'number' && <Typography variant="body2">Skipped: {importFeedback.details.skippedCount}</Typography>}
                      {typeof importFeedback.details.errorCount === 'number' && <Typography variant="body2">Errors: {importFeedback.details.errorCount}</Typography>}
                      {importFeedback.details.errors && importFeedback.details.errors.length > 0 && (
                        <Box sx={{ maxHeight: '150px', overflowY: 'auto', mt: 1, border: '1px solid', borderColor: 'divider', p:1 }}>
                          <Typography variant="caption" display="block" gutterBottom>Error Details:</Typography>
                          <ul>
                            {importFeedback.details.errors.map((err, index) => (
                              <li key={index}><Typography variant="caption">{typeof err === 'string' ? err : JSON.stringify(err)}</Typography></li>
                            ))}
                          </ul>
                        </Box>
                      )}
                    </Box>
                  )}
                </Alert>
              </Box>
            )}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="contained" 
                color="error" 
                onClick={handleDeleteAllVoters} 
                disabled={actionLoading.deletingAllVoters || isVotingOpen}
                sx={{minWidth: '160px'}}
              >
                {actionLoading.deletingAllVoters ? <CircularProgress size={24} color="inherit" /> : 'Delete All Voters'}
              </Button>
            </Box>
          </CardContent>
        </Card>

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
