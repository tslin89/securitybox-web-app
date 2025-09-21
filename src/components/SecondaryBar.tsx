import * as React from 'react';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import SignalRStatus from './SignalRStatus';
import ColorModeIconDropdown from '../theme/ColorModeIconDropdown';
import NotificationBell from './NotificationBell';

const APP_LABEL = 'Home';   // ← your brand text
const HOME_PATH = '/dashboard';               // ← where "home" should go

// Map route segment -> nice label
const labels: Record<string, string> = {
  dashboard: 'Dashboard',
  users: 'Users',
  translist: 'Transaction List',
  settings: 'Settings',
  about: 'About',
  profile: 'Profile',
  account: 'My account',
  'add-account': 'Add another account',
  boxlist: 'Box Status & Control',
};

export default function SecondaryBar() {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const { pathname } = useLocation();

  const segments = pathname.split('/').filter(Boolean);
  const lastSeg = segments.length ? segments[segments.length - 1] : undefined;
  const pageTitle =
    lastSeg ? (labels[lastSeg] ?? lastSeg.replace(/-/g, ' ')) : 'Dashboard';


  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: { xs: 0, md: 240 }, // Account for sidebar width on desktop
        right: 0,
        zIndex: (t) => t.zIndex.appBar - 1,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        paddingTop: 1,
        paddingBottom: 1
      }}
    >
      <Toolbar variant="dense" sx={{ minHeight: 44 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1, overflow: 'hidden' }}>
          {/* Breadcrumbs: Brand link + current page */}
          {isXs ? (
            <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0 }}>
              <Link component={RouterLink} to={HOME_PATH} underline="hover" color="inherit">
                {APP_LABEL}
              </Link>
              {' / '}
              <Typography component="span" color="text.primary" sx={{ fontWeight: 500 }}>
                {pageTitle}
              </Typography>
            </Typography>
          ) : (
            <Breadcrumbs aria-label="breadcrumb" sx={{ flex: 1, minWidth: 0 }}>
              <Link component={RouterLink} underline="hover" color="inherit" to={HOME_PATH} noWrap>
                {APP_LABEL}
              </Link>
              {segments.length > 0 && (
                <Typography color="text.primary" noWrap>
                  {pageTitle}
                </Typography>
              )}
            </Breadcrumbs>
          )}

          {/* Right side: SignalR status, Notifications, Theme toggle */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <SignalRStatus />
            <NotificationBell size="small" />
            <ColorModeIconDropdown />
          </Stack>
        </Stack>
      </Toolbar>
    </Box>
  );
}
