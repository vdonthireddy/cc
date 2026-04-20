import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useThemeStore } from '../store/themeStore';
import { academicTheme, darkModernTheme, highContrastTheme } from '../theme';

const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useThemeStore();

  const muiTheme = React.useMemo(() => {
    switch (theme) {
      case 'darkModern':
        return darkModernTheme;
      case 'highContrast':
        return highContrastTheme;
      default:
        return academicTheme;
    }
  }, [theme]);

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export default ThemeWrapper;
