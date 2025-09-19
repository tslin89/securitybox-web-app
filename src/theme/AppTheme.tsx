import * as React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
// import { CssVarsProvider, useColorScheme } from '@mui/material/styles';
import type { ThemeOptions } from '@mui/material/styles';
import { inputsCustomizations } from './customizations/inputs';
import { dataDisplayCustomizations } from './customizations/dataDisplay';
import { feedbackCustomizations } from './customizations/feedback';
import { navigationCustomizations } from './customizations/navigation';
import { surfacesCustomizations } from './customizations/surfaces';
import { typography, shadows, shape } from './themePrimitives';

// Create a custom theme context to track mode
const ThemeModeContext = React.createContext<{
  mode: 'light' | 'dark';
  setMode: (mode: 'light' | 'dark') => void;
}>({
  mode: 'light',
  setMode: () => {},
});

interface AppThemeProps {
  children: React.ReactNode;
  /**
   * This is for the docs site. You can ignore it or remove it.
   */
  disableCustomTheme?: boolean;
  themeComponents?: ThemeOptions['components'];
}

// Custom hook to use theme mode
export const useThemeMode = () => {
  const context = React.useContext(ThemeModeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeModeProvider');
  }
  return context;
};

// Wrapper component to ensure color scheme is properly initialized
function ColorSchemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = React.useState<'light' | 'dark'>('light');

  const handleSetMode = React.useCallback((newMode: 'light' | 'dark') => {
    setModeState(newMode);
  }, []);

  // Create a theme that responds to the mode
  const theme = React.useMemo(() => {
    const isDark = mode === 'dark';
    return createTheme({
      palette: {
        mode: mode,
        primary: {
          main: isDark ? '#90caf9' : '#1976d2',
        },
        secondary: {
          main: isDark ? '#f48fb1' : '#dc004e',
        },
        background: {
          default: isDark ? '#121212' : '#f5f5f5',
          paper: isDark ? '#1e1e1e' : '#ffffff',
        },
        text: {
          primary: isDark ? '#ffffff' : '#000000',
          secondary: isDark ? '#b0b0b0' : '#666666',
        },
        divider: isDark ? '#333333' : '#e0e0e0',
        action: {
          hover: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
          disabledBackground: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
        },
      },
      typography,
      shadows,
      shape,
      components: {
        ...inputsCustomizations,
        ...dataDisplayCustomizations,
        ...feedbackCustomizations,
        ...navigationCustomizations,
        ...surfacesCustomizations,
      },
    });
  }, [mode]);

  return (
    <ThemeModeContext.Provider value={{ mode, setMode: handleSetMode }}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export default function AppTheme(props: AppThemeProps) {
  const { children, disableCustomTheme } = props;
  
  if (disableCustomTheme) {
    return <React.Fragment>{children}</React.Fragment>;
  }
  
  return (
    <ColorSchemeProvider>
      {children}
    </ColorSchemeProvider>
  );
}
