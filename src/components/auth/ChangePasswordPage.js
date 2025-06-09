import React, { useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { TextField } from 'formik-mui';
import { Button, Container, Typography, Box, Alert, CircularProgress } from '@mui/material';
import authService from '../../services/authService';
import { useNavigate } from 'react-router-dom';

const ChangePasswordSchema = Yup.object().shape({
  currentPassword: Yup.string()
    .required('Current password is required'),
  newPassword: Yup.string()
    .required('New password is required')
    .min(3, 'Password must be at least 3 characters long'),
    // .matches(
    //   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    //   'Must Contain 8 Chars, 1 Uppercase, 1 Lowercase, 1 Number & 1 Special Char'
    // ), // Example of stronger password validation
  newPasswordConfirm: Yup.string()
    .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
    .required('Confirm new password is required'),
});

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

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
          Change Password
        </Typography>
        {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ width: '100%', mt: 2 }}>{success}</Alert>}
        <Formik
          initialValues={{
            currentPassword: '',
            newPassword: '',
            newPasswordConfirm: '',
          }}
          validationSchema={ChangePasswordSchema}
          onSubmit={async (values, { setSubmitting, resetForm }) => {
            setError('');
            setSuccess('');
            setLoading(true);
            try {
              const response = await authService.changePassword(values);
              setSuccess(response.message || 'Password changed successfully!');
              resetForm();
              // Optionally navigate away after a delay or on user action
              // setTimeout(() => navigate('/profile'), 2000); 
            } catch (err) {
              setError(err.message || 'Failed to change password. Please try again.');
            }
            setLoading(false);
            setSubmitting(false);
          }}
        >
          {({ submitForm, isSubmitting }) => (
            <Form sx={{ width: '100%', mt: 1 }}> {/* Formik's Form doesn't directly accept sx, use Box or form tag if needed for styling via sx */}
              <Field
                component={TextField}
                margin="normal"
                required
                fullWidth
                name="currentPassword"
                label="Current Password"
                type="password"
                id="currentPassword"
                autoComplete="current-password"
              />
              <Field
                component={TextField}
                margin="normal"
                required
                fullWidth
                name="newPassword"
                label="New Password"
                type="password"
                id="newPassword"
                autoComplete="new-password"
              />
              <Field
                component={TextField}
                margin="normal"
                required
                fullWidth
                name="newPasswordConfirm"
                label="Confirm New Password"
                type="password"
                id="newPasswordConfirm"
                autoComplete="new-password"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={isSubmitting || loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Change Password'}
              </Button>
            </Form>
          )}
        </Formik>
      </Box>
    </Container>
  );
};

export default ChangePasswordPage;
