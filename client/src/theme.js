import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light', // Set the mode to light
    primary: {
      main: '#264653', // A sophisticated slate blue/teal
    },
    secondary: {
      main: '#e76f51', // A warm, friendly orange for contrast
    },
    background: {
      default: '#f4f6f8', // A very light, soft gray for the main background
      paper: '#ffffff',   // Cards, tables, and modals will be crisp white
    },
  },
  shape: {
    borderRadius: 8, // Slightly more rounded corners for a modern feel
  },
  components: {
    // Apply a global style override for the Paper component
    MuiPaper: {
      styleOverrides: {
        root: {
          // A more subtle shadow than the default
          boxShadow: '0px 0px 30px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    // Override button styles for a less aggressive look
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Buttons will use regular case, not ALL CAPS
        },
      },
    },
  },
  typography: {
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
  },
});

export default theme;