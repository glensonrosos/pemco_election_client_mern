import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'; // Removed Container, Typography as they are handled by Layout/Pages

// Import actual components
import Home from './components/pages/Home';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import NotFound from './components/pages/NotFound';
import Layout from './components/layout/Layout'; // Import the Layout component
import { AuthProvider } from './context/AuthContext'; // Import AuthProvider

// Import page components
import VotingPage from './components/pages/VotingPage';
import ResultsPage from './components/pages/ResultsPage';
import AdminDashboard from './components/pages/AdminDashboard';
import ProtectedRoute from './components/auth/ProtectedRoute'; // Import ProtectedRoute
import CandidateRegistration from './components/admin/CandidateRegistration'; // Import CandidateRegistration
import CandidateList from './components/admin/CandidateList'; // Import CandidateList
import EditCandidate from './components/admin/EditCandidate'; // Import EditCandidate
import AdminPositionsPage from './components/admin/AdminPositionsPage'; // Import AdminPositionsPage
import ChangePasswordPage from './components/auth/ChangePasswordPage'; // Import ChangePasswordPage

// Basic theme for Material-UI
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // A standard blue
    },
    secondary: {
      main: '#dc004e', // A standard pink
    },
    background: {
      default: '#f4f6f8',
    }
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
  }
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Normalize CSS and apply background color */}
      <Router>
        <AuthProvider>
          <Layout> {/* Wrap Routes with Layout */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            {/* Routes accessible to any authenticated user */}
            <Route element={<ProtectedRoute />}>
              <Route path="/vote" element={<VotingPage />} />
              <Route path="/results" element={<ResultsPage />} />
              <Route path="/change-password" element={<ChangePasswordPage />} /> {/* Add ChangePasswordPage route */}
            </Route>

            {/* Routes accessible only to admin users */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/candidates" element={<CandidateList />} />
              <Route path="/admin/candidates/new" element={<CandidateRegistration />} />
              <Route path="/admin/candidates/edit/:candidateId" element={<EditCandidate />} />
              <Route path="/admin/positions" element={<AdminPositionsPage />} />
              {/* Add other admin-specific sub-routes here, e.g., /admin/candidates/edit/:id */}
            </Route>

            <Route path="*" element={<NotFound />} />
            {/* Add more admin routes like /admin/candidates, /admin/settings etc. */}
          </Routes>
        </Layout>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
