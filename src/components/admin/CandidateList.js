import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import candidateService from '../../services/candidateService';
import positionService from '../../services/positionService'; // Added
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

const CandidateList = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(''); // For general success messages
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPosition, setFilterPosition] = useState(''); // Will store position ID

  const [positions, setPositions] = useState([]);
  const [positionsLoading, setPositionsLoading] = useState(true);
  const [positionsError, setPositionsError] = useState('');

  const [deleteCandidateId, setDeleteCandidateId] = useState(null); // For delete confirmation dialog
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch active positions for the filter dropdown
  useEffect(() => {
    const fetchActivePositions = async () => {
      try {
        setPositionsLoading(true);
        const activePositionsData = await positionService.getAllPositions({ status: 'active' });
        setPositions(activePositionsData || []);
        setPositionsError('');
      } catch (err) {
        console.error('Failed to fetch positions for filter:', err);
        setPositionsError(err.message || 'Could not load positions for filter.');
        setPositions([]);
      } finally {
        setPositionsLoading(false);
      }
    };
    fetchActivePositions();
  }, []);

  const fetchCandidates = useCallback(async (currentSearchTerm, currentFilterPositionId) => {
    setLoading(true);
    setError('');
    setSuccessMessage(''); // Clear previous success messages
    try {
      const response = await candidateService.getAllCandidates({ 
        search: currentSearchTerm, 
        position: currentFilterPositionId // Ensure backend expects 'position' as ID
      });
      setCandidates(response.data.candidates || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch candidates.');
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timerId = setTimeout(() => {
      fetchCandidates(searchTerm, filterPosition);
    }, 500);
    return () => clearTimeout(timerId);
  }, [fetchCandidates, searchTerm, filterPosition]);

  const openDeleteDialog = (id) => {
    setDeleteCandidateId(id);
  };

  const closeDeleteDialog = () => {
    setDeleteCandidateId(null);
  };

  const handleDeleteCandidate = async () => {
    if (!deleteCandidateId) return;
    setIsDeleting(true);
    setError('');
    setSuccessMessage('');
    try {
      await candidateService.deleteCandidate(deleteCandidateId);
      setSuccessMessage('Candidate deleted successfully!');
      setCandidates(prevCandidates => prevCandidates.filter(c => c._id !== deleteCandidateId));
    } catch (err) {
      setError(err.message || 'Failed to delete candidate.');
    } finally {
      setIsDeleting(false);
      closeDeleteDialog();
    }
  };

  if (loading && candidates.length === 0) { // Show main loading only on initial load
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 3, p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Manage Candidates
        </Typography>
        <Button variant="contained" component={RouterLink} to="/admin/candidates/new">
          Register New Candidate
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          label="Search by Name"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flexGrow: 1 }}
          InputLabelProps={{ shrink: !!searchTerm }}
        />
        <FormControl variant="outlined" sx={{ minWidth: 200 }} disabled={positionsLoading || !!positionsError}>
          <InputLabel id="filter-position-label">Filter by Position</InputLabel>
          <Select
            labelId="filter-position-label"
            id="filter-position-select"
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            label="Filter by Position"
          >
            <MenuItem value="">
              <em>{positionsLoading ? 'Loading...' : (positionsError ? 'Error' : 'All Positions')}</em>
            </MenuItem>
            {!positionsLoading && !positionsError && positions.map((pos) => (
              <MenuItem key={pos._id} value={pos._id}>
                {pos.name}
              </MenuItem>
            ))}
          </Select>
          {positionsError && <Alert severity="warning" sx={{mt:1}}>{positionsError}</Alert>}
        </FormControl>
      </Box>

      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>}

      {!loading && candidates.length === 0 && !error && (
        <Typography variant="subtitle1" sx={{ textAlign: 'center', mt: 3 }}>
          No candidates found for the current filters. Register a new candidate to get started.
        </Typography>
      )}

      {!loading && candidates.length > 0 && (
        <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead sx={{ backgroundColor: 'primary.main' }}>
              <TableRow>
                <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Profile Photo</TableCell>
                <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>First Name</TableCell>
                <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Last Name</TableCell>
                <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Position</TableCell>
                <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {candidates.map((candidate) => (
                <TableRow
                  key={candidate._id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: 'action.hover' } }}
                >
                  <TableCell component="th" scope="row">
                    {candidate.profilePhoto ? (
                      <img 
                        src={`/${candidate.profilePhoto}`} 
                        alt={`${candidate.firstName} ${candidate.lastName}`}
                        style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : 'No Photo'}
                  </TableCell>
                  <TableCell>{candidate.firstName}</TableCell>
                  <TableCell>{candidate.lastName}</TableCell>
                  <TableCell>{candidate.position ? candidate.position.name : 'N/A'}</TableCell>
                  <TableCell align="right">
                    <IconButton 
                      aria-label="edit"
                      color="primary"
                      component={RouterLink} 
                      to={`/admin/candidates/edit/${candidate._id}`}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      aria-label="delete" 
                      color="error"
                      onClick={() => openDeleteDialog(candidate._id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteCandidateId !== null}
        onClose={closeDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Confirm Deletion"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this candidate? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} disabled={isDeleting}>Cancel</Button>
          <Button onClick={handleDeleteCandidate} color="error" autoFocus disabled={isDeleting}>
            {isDeleting ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CandidateList;
