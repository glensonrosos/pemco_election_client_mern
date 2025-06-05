import React from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  TextField,
  CircularProgress,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText
} from '@mui/material';

const PositionSchema = Yup.object().shape({
  name: Yup.string().required('Position name is required'),
  description: Yup.string(),
  status: Yup.string().oneOf(['active', 'inactive'], 'Invalid status').required('Status is required'),
  order: Yup.number()
    .integer('Order must be an integer')
    .min(0, 'Order cannot be negative')
    .required('Order is required'),
  minWinners: Yup.number()
    .integer('Must be an integer')
    .min(0, 'Minimum winners cannot be less than 0')
    .required('Minimum winners are required'),
  minSelectable: Yup.number()
    .integer('Must be an integer')
    .min(0, 'Minimum selectable cannot be less than 0')
    .required('Minimum selectable candidates are required'),
  maxSelectable: Yup.number()
    .integer('Must be an integer')
    .min(1, 'Maximum selectable candidates must be at least 1')
    .required('Maximum selectable candidates are required')
    .when('minSelectable', (minSelectable, schema) => {
      return schema.min(minSelectable, 'Max selectable must be greater than or equal to min selectable');
    }),
});

const PositionForm = ({ initialValues, onSubmit, onCancel, isEditMode = false, loading }) => {
  const defaultInitialValues = {
    name: '',
    description: '',
    status: 'active',
    order: 0,
    minWinners: 1,
    minSelectable: 0,
    maxSelectable: 1,
  };

  return (
    <Formik
      initialValues={initialValues || defaultInitialValues}
      validationSchema={PositionSchema}
      onSubmit={(values, { setSubmitting }) => {
        onSubmit(values);
        // setSubmitting is handled by the parent component's loading state
      }}
      enableReinitialize // Important for edit mode to reinitialize with new initialValues
    >
      {({ errors, touched, handleChange, values, isSubmitting }) => (
        <Form>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Field
                as={TextField}
                name="name"
                label="Position Name"
                fullWidth
                required
                error={touched.name && !!errors.name}
                helperText={touched.name && errors.name}
              />
            </Grid>
            <Grid item xs={12}>
              <Field
                as={TextField}
                name="description"
                label="Description (Optional)"
                fullWidth
                multiline
                rows={3}
                error={touched.description && !!errors.description}
                helperText={touched.description && errors.description}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={touched.status && !!errors.status} required>
                <InputLabel id="status-label">Status</InputLabel>
                <Field
                  as={Select}
                  name="status"
                  labelId="status-label"
                  label="Status"
                  value={values.status}
                  onChange={handleChange}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Field>
                {touched.status && errors.status && <FormHelperText>{errors.status}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Field
                as={TextField}
                name="order"
                label="Display Order"
                type="number"
                fullWidth
                required
                error={touched.order && !!errors.order}
                helperText={touched.order && errors.order}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Field
                as={TextField}
                name="minWinners"
                label="Min Winners"
                type="number"
                fullWidth
                required
                error={touched.minWinners && !!errors.minWinners}
                helperText={touched.minWinners && errors.minWinners}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Field
                as={TextField}
                name="minSelectable"
                label="Min Selectable by Voter"
                type="number"
                fullWidth
                required
                error={touched.minSelectable && !!errors.minSelectable}
                helperText={touched.minSelectable && errors.minSelectable}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Field
                as={TextField}
                name="maxSelectable"
                label="Max Selectable by Voter"
                type="number"
                fullWidth
                required
                error={touched.maxSelectable && !!errors.maxSelectable}
                helperText={touched.maxSelectable && errors.maxSelectable}
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={onCancel} sx={{ mr: 1 }} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={loading || isSubmitting}>
              {loading ? <CircularProgress size={24} /> : (isEditMode ? 'Update Position' : 'Create Position')}
            </Button>
          </Box>
        </Form>
      )}
    </Formik>
  );
};

export default PositionForm;
