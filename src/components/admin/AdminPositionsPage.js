import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText, // Optional: if you want to add more text
  DialogTitle,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
// import { Link } from 'react-router-dom'; // Link might not be needed if using modals

import positionService from '../../services/positionService';
import PositionForm from './PositionForm'; // Import the PositionForm

const AdminPositionsPage = () => {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true); // For table data loading
  const [error, setError] = useState(''); // For general page errors
  const [successMessage, setSuccessMessage] = useState(''); // For general page success messages

  const [openFormModal, setOpenFormModal] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null); // For editing, null for adding
  const [formLoading, setFormLoading] = useState(false); // For form submission loading
  const [formError, setFormError] = useState(''); // For form-specific errors

  const fetchPositions = useCallback(async () => {
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const data = await positionService.getAllPositions();
      setPositions(data || []); // Ensure positions is always an array
    } catch (err) {
      setError(err.message || 'Failed to fetch positions.');
      setPositions([]); // Clear positions on error
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  const handleDeletePosition = async (positionId) => {
    // Placeholder for delete functionality
    if (window.confirm('Are you sure you want to delete this position? This action cannot be undone.')) {
      setLoading(true);
      try {
        await positionService.deletePosition(positionId);
        setSuccessMessage('Position deleted successfully.');
        fetchPositions(); // Refresh the list
      } catch (err) {
        setError(err.message || 'Failed to delete position.');
      }
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setCurrentPosition(null); // Clear any existing position data for add mode
    setFormError(''); // Clear previous form errors
    setOpenFormModal(true);
  };

  const handleOpenEditModal = (position) => {
    setCurrentPosition(position);
    setFormError(''); // Clear previous form errors
    setOpenFormModal(true);
  };

  const handleCloseFormModal = () => {
    setOpenFormModal(false);
    setCurrentPosition(null); // Reset current position
    setFormError('');
  };

  const handlePositionSubmit = async (values) => {
    setFormLoading(true);
    setFormError('');
    setSuccessMessage(''); // Clear general success message
    setError(''); // Clear general error message

    try {
      if (currentPosition && currentPosition._id) {
        // Edit mode
        await positionService.updatePosition(currentPosition._id, values);
        setSuccessMessage('Position updated successfully!');
      } else {
        // Add mode
        await positionService.createPosition(values);
        setSuccessMessage('Position created successfully!');
      }
      fetchPositions(); // Refresh the list
      handleCloseFormModal();
    } catch (err) {
      console.error('Form submission error:', err);
      setFormError(err.message || (currentPosition ? 'Failed to update position.' : 'Failed to create position.'));
    }
    setFormLoading(false);
  };

  if (loading && positions.length === 0) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Manage Candidate Positions
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddCircleOutlineIcon />}
          onClick={handleOpenAddModal} // Link to Add Position form/modal
        >
          Add New Position
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
      {loading && <CircularProgress sx={{ display: 'block', margin: 'auto', mb: 2 }}/>}

      <TableContainer component={Paper} elevation={3}>
        <Table sx={{ minWidth: 650 }} aria-label="positions table">
          <TableHead sx={{ backgroundColor: 'primary.main' }}>
            <TableRow>
              <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }} align="right">Order</TableCell>
              <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }} align="right">Min Winners</TableCell>
              <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }} align="right">Min Selectable</TableCell>
              <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }} align="right">Max Selectable</TableCell>
              <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {positions.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No positions found. Click 'Add New Position' to create one.
                </TableCell>
              </TableRow>
            ) : (
              positions.map((position) => (
                <TableRow
                  key={position._id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: 'action.hover' } }}
                >
                  <TableCell component="th" scope="row">
                    {position.name}
                  </TableCell>
                  <TableCell>{position.status}</TableCell>
                  <TableCell align="right">{position.order}</TableCell>
                  <TableCell align="right">{position.minWinners}</TableCell>
                  <TableCell align="right">{position.minSelectable}</TableCell>
                  <TableCell align="right">{position.maxSelectable}</TableCell>
                  <TableCell align="center">
                    <IconButton color="primary" onClick={() => handleOpenEditModal(position)} aria-label="edit position">
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDeletePosition(position._id)} aria-label="delete position" disabled={loading}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Position Add/Edit Modal */}
      <Dialog open={openFormModal} onClose={handleCloseFormModal} maxWidth="md" fullWidth>
        <DialogTitle>{currentPosition ? 'Edit Position' : 'Add New Position'}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          {/* Optional: DialogContentText can be used here for more descriptive text if needed */}
          {/* <DialogContentText sx={{mb: 2}}>Please fill in the details for the position.</DialogContentText> */}
          <PositionForm
            initialValues={currentPosition} // Formik handles null initialValues by using its defaults
            onSubmit={handlePositionSubmit}
            onCancel={handleCloseFormModal}
            isEditMode={!!currentPosition}
            loading={formLoading}
          />
        </DialogContent>
        {/* DialogActions can be part of the PositionForm for better encapsulation if preferred */}
        {/* <DialogActions>
          <Button onClick={handleCloseFormModal} disabled={formLoading}>Cancel</Button>
          <Button type="submit" form="position-form-id" variant="contained" disabled={formLoading}>
            {formLoading ? <CircularProgress size={24}/> : (currentPosition ? 'Update' : 'Create')}
          </Button>
        </DialogActions> */}
      </Dialog>
    </Container>
  );
};

export default AdminPositionsPage;
