// src/layout/AppShell.tsx
import * as React from 'react';
import { Outlet } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import { alpha } from '@mui/material/styles';
import SecondaryBar from '../components/SecondaryBar';
import AppNavbar from '../components/AppNavbar';
import SideMenu from '../components/SideMenu';
// import SideMenuMobile from '../components/SideMenuMobile';
import ToastCenter from '../components/ToastCenter';
import { SidebarProvider } from '../contexts/SidebarContext';

// Theme wrapper & X customizations (from the template)
import AppTheme from '../theme/AppTheme';
import {
  chartsCustomizations,
  dataGridCustomizations,
  datePickersCustomizations,
} from '../theme/customizations';
// import { Typography } from '@mui/material';

const xThemeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
};

export default function AppShell() {
  // const [mobileOpen, setMobileOpen] = React.useState(false);
  // const toggleMobileMenu = () => setMobileOpen((v) => !v);

  // test toast mesage
  // const { push } = useAlerts();


  // const id = crypto.randomUUID?.() ?? String(Date.now());

  return (
    <AppTheme themeComponents={xThemeComponents}>
      <CssBaseline enableColorScheme />
      <SidebarProvider>
        <Box sx={{ display: 'flex' }}>
          <SideMenu />
          <AppNavbar />

          <Box
            component="main"
            sx={(theme) => ({
              flexGrow: 1,
              backgroundColor: theme.vars
                ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
                : alpha(theme.palette.background.default, 1),
              overflow: 'auto',
              pt: { xs: 0, md: 7 }, // Add top padding to account for fixed top bar
            })}
          >
            <SecondaryBar />
            <ToastCenter />
            <Box sx={{ p: { xs: 2, md: 3 } }}>
              <Outlet />
            </Box>
          </Box>
        </Box>
      </SidebarProvider>
    </AppTheme>
  );
}
