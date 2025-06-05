import React from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { TextField } from 'formik-mui'; // Using formik-mui for easy integration
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import { useAuth } from '../../context/AuthContext'; // Import useAuth

const LoginSchema = Yup.object().shape({
  companyId: Yup.string().required('Company ID is required'),
  password: Yup.string().required('Password is required'),
});

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading, isAuthenticated } = useAuth(); // Use AuthContext
  const [error, setError] = React.useState(null);

  const handleSubmit = async (values, { setSubmitting }) => {
    setError(null); // Clear previous errors
    setSubmitting(true);
    try {
      const success = await login(values); // Use login from AuthContext
      if (success) {
        // No alert needed, AuthContext handles token and user state
        // Navigation can be handled by a ProtectedRoute or useEffect watching isAuthenticated
        // For now, explicit navigation after successful login is fine.
        navigate('/'); 
      } else {
        setError('Failed to login. Please check your credentials.');
      }
    } catch (err) { // Catch any unexpected errors from the login function itself
      console.error('Login submission error:', err);
      setError(err.message || 'An unexpected error occurred during login.');
    }
    setSubmitting(false);
  };

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
          Sign In
        </Typography>
        {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}
        <Formik
          initialValues={{
            companyId: '',
            password: '',
          }}
          validationSchema={LoginSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => { // isSubmitting from Formik, isLoading from AuthContext
            const formIsSubmitting = isSubmitting || isLoading;
            return (
            <Form noValidate sx={{ mt: 1, width: '100%' }}>
              <Field
                component={TextField}
                margin="normal"
                required
                fullWidth
                id="companyId"
                label="Company ID"
                name="companyId"
                autoComplete="username" // Or a custom one if companyId is not typical username
                autoFocus
              />
              <Field
                component={TextField}
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={formIsSubmitting}
              >
                {formIsSubmitting ? 'Signing In...' : 'Sign In'}
              </Button>
              <Grid container justifyContent="flex-end">
                <Grid item>
                  <Link component={RouterLink} to="/register" variant="body2">
                    {"Don't have an account? Sign Up"}
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

export default Login;
