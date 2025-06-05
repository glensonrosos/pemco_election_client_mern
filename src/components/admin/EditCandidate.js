import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { TextField, Select } from 'formik-mui';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Avatar from '@mui/material/Avatar';
import candidateService from '../../services/candidateService';
import positionService from '../../services/positionService'; // Import positionService

// const POSITIONS_OPTIONS = [...] // This will be replaced by fetched data

// Adjusted Schema: profilePhoto is optional for editing
const EditCandidateSchema = Yup.object().shape({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  position: Yup.string().required('Position is required'), // Now stores position ID
  profilePhoto: Yup.mixed()
    .nullable()
    .test('fileSize', 'File too large (max 2MB)', value => !value || (value && value.size <= 2 * 1024 * 1024))
    .test('fileType', 'Unsupported file format (JPEG, PNG, GIF)', value => 
      !value || (value && ['image/jpeg', 'image/png', 'image/gif'].includes(value.type))
    ),
});

const EditCandidate = () => {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  const [initialValues, setInitialValues] = useState(null);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState('');
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true); // For fetching initial candidate data
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false); // Local submitting state

  const [positions, setPositions] = useState([]);
  const [positionsLoading, setPositionsLoading] = useState(true);
  const [positionsError, setPositionsError] = useState('');

  const fetchCandidateData = useCallback(async () => {
    setIsLoading(true); // For candidate data
    setPositionsLoading(true); // Also set positions loading
    setServerError('');
    setPositionsError('');
    try {
      // Fetch candidate data
      const candidateResponse = await candidateService.getCandidateById(candidateId);
      const candidateData = candidateResponse.data.candidate; // Extract candidate from response

      // Fetch active positions
      const activePositions = await positionService.getAllPositions({ status: 'active' });
      setPositions(activePositions || []);

      setInitialValues({
        firstName: candidateData.firstName || '',
        lastName: candidateData.lastName || '',
        // Ensure candidateData.position is the ID. If it's an object, use candidateData.position._id
        position: (candidateData.position && typeof candidateData.position === 'object') ? candidateData.position._id : candidateData.position || '', 
        profilePhoto: null, // New photo will be handled here
      });
      setCurrentPhotoUrl(candidateData.profilePhoto ? `/${candidateData.profilePhoto}` : '');
      setPositionsError(''); // Clear positions error if successful
    } catch (error) {
      console.error('Fetch data error:', error);
      const errorMessage = error.message || 'Failed to load data.';
      // Determine if the error is primarily from candidate or positions
      if (error.config && error.config.url.includes('/positions')) {
        setPositionsError(errorMessage);
        setServerError('Failed to load positions list.');
      } else {
        setServerError(`Failed to load candidate data: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false); // Candidate data loading finished
      setPositionsLoading(false); // Positions data loading finished
    }
  }, [candidateId]);

  useEffect(() => {
    fetchCandidateData();
  }, [fetchCandidateData]);

  const handleSubmit = async (values, { setSubmitting, resetForm, setFieldValue }) => {
    setIsSubmittingLocal(true);
    setServerError('');
    setSuccessMessage('');

    const formData = new FormData();
    formData.append('firstName', values.firstName);
    formData.append('lastName', values.lastName);
    formData.append('position', values.position);
    if (values.profilePhoto) { // Only append if a new photo is selected
      formData.append('profilePhoto', values.profilePhoto);
    }

    try {
      // TODO: Implement candidateService.updateCandidate(candidateId, formData)
      await candidateService.updateCandidate(candidateId, formData);
      setSuccessMessage('Candidate updated successfully!'); // Static success message
      // Optionally, refetch data or navigate away
      fetchCandidateData(); // Refetch to show updated data including new photo if any
      setFieldValue("profilePhoto", null); // Clear the file input
      setTimeout(() => navigate('/admin/candidates'), 2000); // Navigate back after a delay
    } catch (error) {
      setServerError(error.message || 'Failed to update candidate. Please try again.');
      console.error('Candidate update error:', error);
    } finally {
      setIsSubmittingLocal(false);
      setSubmitting(false); // Formik's submitting state
    }
  };

  if (isLoading) {
    return <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 4 }} />;
  }

  if (serverError && !initialValues) {
    return <Alert severity="error">{serverError}</Alert>;
  }

  if (!initialValues) {
    return <Typography>Candidate not found or unable to load data.</Typography>;
  }

  return (
    <Box sx={{ mt: 3, p: 2, maxWidth: 600, mx: 'auto', border: '1px solid #ddd', borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ textAlign: 'center' }}>
        Edit Candidate
      </Typography>
      <Formik
        initialValues={initialValues}
        validationSchema={EditCandidateSchema}
        onSubmit={handleSubmit}
        enableReinitialize // Important to reinitialize form when initialValues change
      >
        {({ setFieldValue, errors, touched, values }) => (
          <Form>
            <Box sx={{ mb: 2 }}>
              <Field
                component={TextField}
                name="firstName"
                type="text"
                label="First Name"
                fullWidth
                required
                InputLabelProps={{ shrink: Boolean(initialValues && initialValues.firstName) }}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Field
                component={TextField}
                name="lastName"
                type="text"
                label="Last Name"
                fullWidth
                required
                InputLabelProps={{ shrink: Boolean(initialValues && initialValues.lastName) }}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <FormControl fullWidth error={touched.position && Boolean(errors.position)} required>
                <InputLabel htmlFor="position-select" shrink={Boolean(initialValues && initialValues.position)}>Position</InputLabel>
                <Field
                  component={Select}
                  name="position"
                  label="Position"
                  inputProps={{ id: 'position-select' }}
                  disabled={positionsLoading || !!positionsError || isLoading} // Disable if any data is loading or error
                >
                  <MenuItem value="" disabled>
                    <em>
                      {positionsLoading ? 'Loading positions...'
                       : positionsError ? 'Error loading positions'
                       : 'Select a position'}
                    </em>
                  </MenuItem>
                  {positions.map((pos) => (
                    <MenuItem key={pos._id} value={pos._id}>{pos.name}</MenuItem>
                  ))}
                </Field>
                {touched.position && errors.position && <FormHelperText>{errors.position}</FormHelperText>}
                {positionsError && !positionsLoading && <FormHelperText error>{positionsError}</FormHelperText>}
              </FormControl>
            </Box>
            
            {currentPhotoUrl && (
              <Box sx={{ mb: 2, textAlign: 'center' }}>
                <Typography variant="subtitle2">Current Profile Photo:</Typography>
                <Avatar 
                  src={currentPhotoUrl} 
                  alt={initialValues ? `${initialValues.firstName} ${initialValues.lastName}` : 'Current Candidate'}
                  sx={{ width: 100, height: 100, margin: 'auto', mb: 1 }}
                />
              </Box>
            )}

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Change Profile Photo (Optional)</Typography>
              <input
                id="profilePhoto"
                name="profilePhoto"
                type="file"
                accept="image/jpeg,image/png,image/gif"
                onChange={(event) => {
                  setFieldValue("profilePhoto", event.currentTarget.files[0]);
                }}
                style={{ display: 'block', marginBottom: '8px' }}
              />
              {values.profilePhoto && (
                <Typography variant="caption">
                  New file selected: {values.profilePhoto.name}
                </Typography>
              )}
              {touched.profilePhoto && errors.profilePhoto && (
                <FormHelperText error>{errors.profilePhoto}</FormHelperText>
              )}
            </Box>

            {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}
            {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              fullWidth 
              disabled={isSubmittingLocal || isLoading || positionsLoading}
              sx={{ mt: 2, py: 1.5 }}
            >
              {isSubmittingLocal ? <CircularProgress size={24} /> : 'Update Candidate'}
            </Button>
          </Form>
        )}
      </Formik>
    </Box>
  );
};

export default EditCandidate;
