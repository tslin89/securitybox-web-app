// src/layout/AppShell.tsx
import * as React from 'react';
import { Outlet } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import { alpha } from '@mui/material/styles';
import SecondaryBar from '../components/SecondaryBar';
import AppNavbar from '../components/AppNavbar';
import SideMenu from '../components/SideMenu';
import SideMenuMobile from '../components/SideMenuMobile';

// Theme wrapper & X customizations (from the template)
import AppTheme from '../theme/AppTheme';
import {
  chartsCustomizations,
  dataGridCustomizations,
  datePickersCustomizations,
  treeViewCustomizations,
} from '../theme/customizations';
import GlobalAlertBanner from '../components/GlobalAlertBanner';

const xThemeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
  ...treeViewCustomizations,
};

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const toggleMobileMenu = () => setMobileOpen((v) => !v);

  return (
    <AppTheme themeComponents={xThemeComponents}>
      <CssBaseline enableColorScheme />
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
          })}
        >
          <SecondaryBar />
          <GlobalAlertBanner />
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </AppTheme>
  );
}
