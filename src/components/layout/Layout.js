import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../context/AuthContext';

const Layout = ({ children }) => {
  const { user, isAuthenticated, logout, isLoading } = useAuth(); // Use AuthContext
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = React.useState(null);

  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchorEl(null);
  };

  const handleLogout = () => {
    logout(); // logout from AuthContext handles token removal and navigation
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            <RouterLink to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              PEMCO Election Portal
            </RouterLink>
          </Typography>

          {isMobile ? (
            <>
              <IconButton
                size="large"
                edge="end"
                color="inherit"
                aria-label="open drawer"
                onClick={handleMobileMenuOpen}
              >
                <MenuIcon />
              </IconButton>
              <Menu
                id="menu-appbar-mobile"
                anchorEl={mobileMenuAnchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(mobileMenuAnchorEl)}
                onClose={handleMobileMenuClose}
              >
                {isLoading ? (
                  <MenuItem onClick={handleMobileMenuClose}>Loading...</MenuItem>
                ) : isAuthenticated && user ? (
                  [
                    <MenuItem key="welcome" disabled sx={{ '&.Mui-disabled': { opacity: 1, color: theme.palette.text.primary }}}>Welcome, {user.firstName}!</MenuItem>,
                    <MenuItem key="vote" component={RouterLink} to="/vote" onClick={handleMobileMenuClose}>Vote</MenuItem>,
                    <MenuItem key="results" component={RouterLink} to="/results" onClick={handleMobileMenuClose}>Results</MenuItem>,
                    user.role === 'admin' && (
                      <MenuItem key="admin" component={RouterLink} to="/admin" onClick={handleMobileMenuClose}>Admin Dashboard</MenuItem>
                    ),
                    <MenuItem key="logout" onClick={() => { handleLogout(); handleMobileMenuClose(); }}>Logout</MenuItem>
                  ]
                ) : (
                  [
                    <MenuItem key="login" component={RouterLink} to="/login" onClick={handleMobileMenuClose}>Login</MenuItem>,
                    <MenuItem key="register" component={RouterLink} to="/register" onClick={handleMobileMenuClose}>Register</MenuItem>
                  ]
                )}
              </Menu>
            </>
          ) : (
            // Desktop view: buttons directly in toolbar
            <>
              {isLoading ? (
            <Typography>Loading...</Typography> // Optional: show loading state
          ) : isAuthenticated && user ? (
            <>
              <Typography sx={{ mr: 2 }}>Welcome, {user.firstName}!</Typography>
              {/* Basic navigation links - can be expanded based on role */}
              <Button color="inherit" component={RouterLink} to="/vote">Vote</Button>
              <Button color="inherit" component={RouterLink} to="/results">Results</Button>
              {user.role === 'admin' && (
                <Button color="inherit" component={RouterLink} to="/admin">Admin Dashboard</Button>
              )}
              <Button color="inherit" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to="/login">
                Login
              </Button>
              <Button color="inherit" component={RouterLink} to="/register">
                Register
              </Button>
            </>
          )}
            </>
          )}
        </Toolbar>
      </AppBar>

      <Container component="main" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        {children} {/* This is where the page content (Login, Home, etc.) will be rendered */}
      </Container>

      <Box component="footer" sx={{ bgcolor: 'primary.main', color: 'white', p: 3, textAlign: 'center' }}>
        <Typography variant="body2">
          &copy; {new Date().getFullYear()} PEMCO Cooperative. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default Layout;
