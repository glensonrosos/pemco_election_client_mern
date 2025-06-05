import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { TextField, Select } from 'formik-mui'; // Using formik-mui for easier integration
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import candidateService from '../../services/candidateService';
import positionService from '../../services/positionService';

const CandidateSchema = Yup.object().shape({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  position: Yup.string().required('Position is required'), // Now stores position ID
  profilePhoto: Yup.mixed()
    .required('A profile photo is required')
    .test('fileSize', 'File too large (max 2MB)', value => value && value.size <= 2 * 1024 * 1024) // 2MB limit
    .test('fileType', 'Unsupported file format (JPEG, PNG, GIF)', value => 
      value && ['image/jpeg', 'image/png', 'image/gif'].includes(value.type)
    ),
});

const CandidateRegistration = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmittingForm, setIsSubmittingForm] = useState(false); // Renamed to avoid conflict with Formik's isSubmitting

  const [positions, setPositions] = useState([]);
  const [positionsLoading, setPositionsLoading] = useState(true);
  const [positionsError, setPositionsError] = useState('');

  useEffect(() => {
    const fetchActivePositions = async () => {
      try {
        setPositionsLoading(true);
        const activePositions = await positionService.getAllPositions({ status: 'active' });
        setPositions(activePositions || []);
        setPositionsError('');
      } catch (error) {
        console.error('Failed to fetch positions:', error);
        setPositionsError(error.message || 'Could not load positions. Please try refreshing.');
        setPositions([]);
      } finally {
        setPositionsLoading(false);
      }
    };
    fetchActivePositions();
  }, []);

  const handleSubmit = async (values, { setSubmitting, resetForm, setFieldValue }) => {
    setIsSubmittingForm(true);
    setServerError('');
    setSuccessMessage('');

    const formData = new FormData();
    formData.append('firstName', values.firstName);
    formData.append('lastName', values.lastName);
    formData.append('position', values.position);
    formData.append('profilePhoto', values.profilePhoto);

    try {
      const response = await candidateService.createCandidate(formData);
      setSuccessMessage(response.message || 'Candidate registered successfully!');
      resetForm();
      setFieldValue("profilePhoto", null);
      // Redirect after a short delay to allow user to see success message
      setTimeout(() => {
        navigate('/admin/candidates');
      }, 1500); // 1.5 seconds delay 
    } catch (error) {
      setServerError(error.message || 'Failed to register candidate. Please try again.');
      console.error('Candidate registration error:', error);
    } finally {
      setIsSubmittingForm(false); // Local loading state
      setSubmitting(false); // Formik's submitting state
    }
  };

  return (
    <Box sx={{ mt: 3, p: 2, maxWidth: 600, mx: 'auto', border: '1px solid #ddd', borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ textAlign: 'center' }}>
        Register New Candidate
      </Typography>
      <Formik
        initialValues={{
          firstName: '',
          lastName: '',
          position: '',
          profilePhoto: null,
        }}
        validationSchema={CandidateSchema}
        onSubmit={handleSubmit}
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
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <FormControl fullWidth error={touched.position && Boolean(errors.position)} required>
                <InputLabel htmlFor="position-select">Position</InputLabel>
                <Field
                  component={Select}
                  name="position"
                  label="Position"
                  inputProps={{ id: 'position-select' }}
                  disabled={positionsLoading || !!positionsError} 
                >
                  <MenuItem value="" disabled><em>{positionsLoading ? 'Loading positions...' : (positionsError ? 'Error loading positions' : 'Select a position')}</em></MenuItem>
                  {positions.map((position) => (
                    <MenuItem key={position._id} value={position._id}>{position.name}</MenuItem>
                  ))}
                </Field>
                {touched.position && errors.position && <FormHelperText>{errors.position}</FormHelperText>}
                {positionsError && <FormHelperText error>{positionsError}</FormHelperText>}
              </FormControl>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Profile Photo</Typography>
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
                  Selected file: {values.profilePhoto.name}
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
              disabled={isSubmittingForm || positionsLoading}
              sx={{ mt: 2, py: 1.5 }}
            >
              {isSubmittingForm ? <CircularProgress size={24} /> : 'Register Candidate'}
            </Button>
          </Form>
        )}
      </Formik>
    </Box>
  );
};

export default CandidateRegistration;
