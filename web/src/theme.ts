import { createTheme, ThemeOptions } from '@mui/material/styles';

const baseTypography: ThemeOptions['typography'] = {
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  h1: {
    fontWeight: 700,
  },
  h2: {
    fontWeight: 700,
  },
  button: {
    textTransform: 'none',
  },
};

const baseComponents: ThemeOptions['components'] = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      },
    },
  },
};

export const academicTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1A365D', // Dark Blue / Academic
    },
    secondary: {
      main: '#F6AD55', // Orange / Highlight
    },
    background: {
      default: '#F7FAFC',
      paper: '#FFFFFF',
    },
  },
  typography: baseTypography,
  components: baseComponents,
});

export const darkModernTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#63B3ED', // Light Blue
    },
    secondary: {
      main: '#F6AD55', // Orange
    },
    background: {
      default: '#1A202C',
      paper: '#2D3748',
    },
  },
  typography: baseTypography,
  components: baseComponents,
});

export const highContrastTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#FFFF00', // Yellow
    },
    secondary: {
      main: '#00FFFF', // Cyan
    },
    background: {
      default: '#000000',
      paper: '#121212',
    },
  },
  typography: baseTypography,
  components: {
    ...baseComponents,
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: '2px solid #FFFF00',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: '1px solid #FFFF00',
        },
      },
    },
  },
});

export default academicTheme;
