import * as React from 'react';
import { styled } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import MuiToolbar from '@mui/material/Toolbar';
import { tabsClasses } from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import SideMenuMobile from './SideMenuMobile';
import MenuButton from './MenuButton';
import ColorModeIconDropdown from '.././theme/ColorModeIconDropdown';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useSignalR } from '../contexts/SignalRContext';
import { NavLink, useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';

const Toolbar = styled(MuiToolbar)({
  width: '100%',
  padding: '12px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'start',
  justifyContent: 'center',
  gap: '12px',
  flexShrink: 0,
  [`& ${tabsClasses.flexContainer}`]: {
    gap: '8px',
    p: '8px',
    pb: 0,
  },
});

export default function AppNavbar() {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const { status, lastError, forceReconnect } = useSignalR() as any;
  const go = (path: string) => () => { navigate(path); };

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };

  // Get connection status chip
  const getConnectionStatusChip = () => {
    if (status === 'connected') {
      return <Chip size="small" color="success" label="Online" />;
    }
    if (status === 'connecting') {
      return <Chip size="small" color="info" label="Connecting..." />;
    }
    if (status === 'error') {
      return (
        <Chip
          size="small"
          color="error"
          label={lastError ? `Error: ${lastError}` : 'Error'}
          onClick={forceReconnect}
          clickable
        />
      );
    }
    return (
      <Chip
        size="small"
        variant="outlined"
        color="default"
        label="Offline"
        onClick={forceReconnect}
        clickable
      />
    );
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        display: { xs: 'auto', md: 'none' },
        boxShadow: 0,
        bgcolor: 'background.paper',
        backgroundImage: 'none',
        borderBottom: '1px solid',
        borderColor: 'divider',
        top: 'var(--template-frame-height, 0px)',
      }}
    >
      <Toolbar variant="regular">
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            flexGrow: 1,
            width: '100%',
            gap: 1,
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{ justifyContent: 'center', mr: 'auto', cursor: 'pointer' }}
            onClick={go('/dashboard')}
          >
            <CustomIcon />
            <Typography variant="h4" component="h1" sx={{ color: 'text.primary', pl: 1, fontSize: { xs: '1rem', sm: '1.5rem' } }}>
              Winter Security
            </Typography>
          </Stack>

          {/* Right side controls */}
          <Stack direction="row" alignItems="center" spacing={1}>
            {/* Connection Status */}
            <Tooltip title={status === 'connected' ? 'Connection is active' : 'Click to reconnect'}>
              {getConnectionStatusChip()}
            </Tooltip>

            {/* Alert Notifications */}
            <NotificationBell size="small" />

            {/* Theme Switcher */}
            <ColorModeIconDropdown />

            {/* Menu Button */}
            <MenuButton aria-label="menu" onClick={toggleDrawer(true)}>
              <MenuRoundedIcon />
            </MenuButton>
          </Stack>
          <SideMenuMobile open={open} toggleDrawer={toggleDrawer} />
        </Stack>
      </Toolbar>
    </AppBar>
  );
}

export function CustomIcon() {
  return (
    <Box
      sx={{
        width: '1.5rem',
        height: '1.5rem',
        bgcolor: 'black',
        borderRadius: '999px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        backgroundImage:
          'linear-gradient(135deg, hsl(210, 98%, 60%) 0%, hsl(210, 100%, 35%) 100%)',
        color: 'hsla(210, 100%, 95%, 0.9)',
        border: '1px solid',
        borderColor: 'hsl(210, 100%, 55%)',
        boxShadow: 'inset 0 2px 5px rgba(255, 255, 255, 0.3)',
      }}
    >
      <Box component="img" src="/logo512.png" alt="Winter Security Box" sx={{ width: { xs: 30, sm: 40 }, height: 'auto', margin: 1 }} />
    </Box>
  );
}
