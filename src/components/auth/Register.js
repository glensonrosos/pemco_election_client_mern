import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { TextField } from 'formik-mui';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import { useAuth } from '../../context/AuthContext'; // Import useAuth
import adminService from '../../services/adminService'; // Import adminService
import CircularProgress from '@mui/material/CircularProgress';

const RegisterSchema = Yup.object().shape({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  companyId: Yup.string().required('Company ID is required'),
  password: Yup.string()
    .required('Password is required')
    .min(3, 'Password must be at least 3 characters long'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
});

const Register = () => {
  const navigate = useNavigate();
  const { register, isLoading, isAuthenticated } = useAuth(); // Use AuthContext
  const [error, setError] = React.useState(null);
  const [successMessage, setSuccessMessage] = React.useState(null); // Renamed for clarity

  // State for global registration status
  const [isRegistrationSystemOpen, setIsRegistrationSystemOpen] = useState(false);
  const [registrationStatusLoading, setRegistrationStatusLoading] = useState(true);
  const [registrationStatusError, setRegistrationStatusError] = useState(null);

  const handleSubmit = async (values, { setSubmitting }) => {
    setError(null);
    setSuccessMessage(null);
    setSubmitting(true);
    try {
      const { confirmPassword, ...userData } = values;
      console.log('Frontend: Sending registration data:', userData);
      const success = await register(userData); // Use register from AuthContext
      if (success) {
        // AuthContext handles token and user state. Navigate to home.
        navigate('/'); 
      } else {
        setError('Failed to register. Please try again or check your details.');
      }
    } catch (err) { // Catch any unexpected errors from the register function itself
      console.error('Registration submission error:', err);
      setError(err.message || 'An unexpected error occurred during registration.');
    }
    setSubmitting(false);
  };

  const fetchGlobalRegistrationStatus = useCallback(async () => {
    setRegistrationStatusLoading(true);
    setRegistrationStatusError(null);
    try {
      const data = await adminService.getRegistrationStatus();
      setIsRegistrationSystemOpen(data.isRegistrationOpen);
    } catch (err) {
      console.error('Failed to fetch registration status:', err);
      setRegistrationStatusError(err.response?.data?.message || 'Could not verify registration status. Please try again later.');
      setIsRegistrationSystemOpen(false); // Assume closed on error
    } finally {
      setRegistrationStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGlobalRegistrationStatus();
  }, [fetchGlobalRegistrationStatus]);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Sign Up
        </Typography>

        {registrationStatusLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress />
            <Typography sx={{ ml: 1 }}>Checking registration availability...</Typography>
          </Box>
        )}

        {registrationStatusError && (
          <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
            {registrationStatusError}
          </Alert>
        )}

        {!registrationStatusLoading && !registrationStatusError && !isRegistrationSystemOpen && (
          <Alert severity="warning" sx={{ width: '100%', mt: 2 }}>
            User registration is currently closed. Please check back later.
          </Alert>
        )}
        {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}
        {successMessage && <Alert severity="success" sx={{ width: '100%', mt: 2 }}>{successMessage}</Alert>}
        <Formik
          initialValues={{
            firstName: '',
            lastName: '',
            companyId: '',
            password: '',
            confirmPassword: '',
          }}
          validationSchema={RegisterSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, dirty, isValid }) => { // isSubmitting from Formik, isLoading from AuthContext, dirty & isValid for better UX
            const formIsSubmitting = isSubmitting || isLoading; // isLoading from useAuth
            const isFormEffectivelyDisabled = formIsSubmitting || registrationStatusLoading || !!registrationStatusError || !isRegistrationSystemOpen;
            return (
            <Form noValidate sx={{ mt: 1, width: '100%' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Field
                    component={TextField}
                    name="firstName"
                    required
                    fullWidth
                    id="firstName"
                    label="First Name"
                    autoFocus
                    disabled={isFormEffectivelyDisabled}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Field
                    component={TextField}
                    required
                    fullWidth
                    id="lastName"
                    label="Last Name"
                    name="lastName"
                    disabled={isFormEffectivelyDisabled}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Field
                    component={TextField}
                    required
                    fullWidth
                    id="companyId"
                    label="Company ID"
                    name="companyId"
                    disabled={isFormEffectivelyDisabled}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Field
                    component={TextField}
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type="password"
                    id="password"
                    disabled={isFormEffectivelyDisabled}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Field
                    component={TextField}
                    required
                    fullWidth
                    name="confirmPassword"
                    label="Confirm Password"
                    type="password"
                    id="confirmPassword"
                    disabled={isFormEffectivelyDisabled}
                  />
                </Grid>
              </Grid>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={isFormEffectivelyDisabled || !dirty || !isValid}
              >
                {formIsSubmitting ? 'Signing Up...' : (registrationStatusLoading ? 'Loading...' : 'Sign Up')}
              </Button>
              <Grid container justifyContent="flex-end">
                <Grid item>
                  <Link component={RouterLink} to="/login" variant="body2">
                    Already have an account? Sign in
                  </Link>
                </Grid>
              </Grid>
            </Form>
          )}}
        </Formik>
      </Box>
    </Container>
  );
};

export default Register;
