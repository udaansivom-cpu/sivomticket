//JWT_SECRET secret 5a8cbb54d3ea1588ce44cd0f28c64523
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// MUI and Theme Imports
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';

// Context and Component Imports
import { AuthProvider, AuthContext } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import AdminReports from './pages/AdminReports';
import UserManagementPage from './pages/UserManagementPage';
import LocationManagementPage from './pages/LocationManagementPage';

// This is a helper component to determine which dashboard to show at the root URL ('/')
const Home = () => {
  const { user, loading } = React.useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>; // Or a MUI CircularProgress component
  }

  if (!user) {
    return <Navigate to="/login" />;
  }
  
  // Based on the user's role, render the correct dashboard
  return user.role === 'admin' ? <AdminDashboard /> : <UserDashboard />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Applies the theme's background color and resets styles */}
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public route for the login page */}
            <Route path="/login" element={<LoginPage />} />

            {/* All protected routes are nested inside PrivateRoute */}
            <Route element={<PrivateRoute />}>
              <Route path="/" element={<Home />} />
              <Route path="/reports" element={<AdminReports />} />
              <Route path="/users" element={<UserManagementPage />} /> {/* <-- ADD */}
              <Route path="/locations" element={<LocationManagementPage /> }/>
            </Route>

            {/* A catch-all route to redirect any unknown URL back to the home page */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;