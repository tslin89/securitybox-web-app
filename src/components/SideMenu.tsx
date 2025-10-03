import * as React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import MuiDrawer, { drawerClasses } from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';

import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
// import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
// import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
// import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';

import { mainNav, secondaryNav } from '../config/nav';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';

const drawerWidth = 240;
const collapsedWidth = 64;

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== 'collapsed',
})<{ collapsed?: boolean }>(({ theme, collapsed }) => ({
  width: collapsed ? collapsedWidth : drawerWidth,
  flexShrink: 0,
  boxSizing: 'border-box',
  mt: 10,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  [`& .${drawerClasses.paper}`]: {
    width: collapsed ? collapsedWidth : drawerWidth,
    boxSizing: 'border-box',
    overflow: 'visible',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
}));

function NavList({ items, userType, collapsed }: { items: typeof mainNav; userType?: number; collapsed?: boolean }) {
  // Filter items based on userType - only show Users and Transactions for userType 1 (admin)
  const filteredItems = items.filter(item => {
    if (item.label === 'Users') {
      return userType === 1;
    }
    return true; // Show all other items
  });

  return (
    <List sx={{ px: collapsed ? 0.5 : 1 }}>
      {filteredItems.map((item) => (
        <ListItem key={item.to} disablePadding>
          <Tooltip title={collapsed ? item.label : ''} placement="right">
            <ListItemButton
              component={NavLink}
              to={item.to}
              end={item.to === '/dashboard'}
              sx={{
                borderRadius: 2,
                minHeight: 48,
                justifyContent: collapsed ? 'center' : 'flex-start',
                px: collapsed ? 1.5 : 2,
                '&.active': (theme) => ({
                  backgroundColor: theme.palette.action.selected,
                }),
              }}
            >
              <ListItemIcon 
                sx={{ 
                  minWidth: collapsed ? 'auto' : 40,
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </ListItemIcon>
              {!collapsed && <ListItemText primary={item.label} />}
            </ListItemButton>
          </Tooltip>
        </ListItem>
      ))}
    </List>
  );
}

export default function SideMenu() {
  const { user, logout } = useAuth() as any;
  const navigate = useNavigate();
  const { collapsed, toggleCollapsed } = useSidebar();

  const [menuEl, setMenuEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(menuEl);
  const handleMenu = (e: React.MouseEvent<HTMLElement>) => setMenuEl(e.currentTarget);
  const handleClose = () => setMenuEl(null);

  const go = (path: string) => () => { handleClose(); navigate(path); };
  const doLogout = () => { handleClose(); logout?.(); navigate('/'); };

  return (
    <Drawer
      variant="permanent"
      collapsed={collapsed}
      sx={{
        display: { xs: 'none', md: 'block' },
        [`& .${drawerClasses.paper}`]: {
          backgroundColor: 'background.paper',
        },
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        position: 'relative'
      }}>
        {/* Toggle Button - Positioned on vertical divider */}
        <Tooltip title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} placement="right">
          <Box
            onClick={(e) => {
              e.stopPropagation();
              toggleCollapsed();
            }}
            sx={{
              position: 'absolute',
              right: -12,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 24,
              height: 24,
              borderRadius: '50%',
              backgroundColor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 1500,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: 'action.hover',
                transform: 'translateY(-50%) scale(1.1)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
              },
              '&:active': {
                transform: 'translateY(-50%) scale(0.95)',
              },
            }}
          >
            {collapsed ? (
              <ChevronRightRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            ) : (
              <ChevronLeftRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            )}
          </Box>
        </Tooltip>

        {/* BRAND / PROJECT SWITCHER AREA */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: collapsed ? 'center' : 'flex-start', 
          alignItems: 'center', 
          cursor: 'pointer',
          p: 1,
          height: 52
        }} onClick={go('/dashboard')}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box component="img" src="/logo512.png" alt="Winter Security Box" sx={{ width: 36, height: 'auto' }} />
            {!collapsed && (
              <Box sx={{ ml: 1 }}>
                <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  Winter Security System
                </Typography>
                <Typography sx={{ fontWeight: 400, fontSize: '0.75rem' }}>
                  Admin Portal
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
        <Divider sx={{ my: 1 }} />

        {/* MAIN NAV (Home, Clients, Transactions) */}
        <NavList items={mainNav} userType={user?.userType} collapsed={collapsed} />
        <Divider sx={{ my: 1 }} />

        {/* Push the user block to the absolute bottom */}
        <Box sx={{ flexGrow: 1 }} />

        {/* SECONDARY (Settings, About, …) sits ABOVE the user card */}
        <NavList items={secondaryNav as any} collapsed={collapsed} />

        {/* Any promo/plan card from the template can go here */}
        {/* <YourPlanCard /> */}

        <Divider />

        {/* USER CARD (bottom-fixed with 3-dots menu) */}
        <Box sx={{ 
          p: collapsed ? 1 : 2, 
          display: 'flex', 
          alignItems: 'center', 
          gap: collapsed ? 0 : 1.5,
          justifyContent: collapsed ? 'center' : 'flex-start'
        }}>
          <Tooltip title={collapsed ? (user?.userName || 'User') : ''} placement="right">
            <Avatar 
              src={user?.avatarUrl} 
              alt={user?.name || 'User'} 
              sx={{ 
                width: collapsed ? 32 : 40, 
                height: collapsed ? 32 : 40,
                cursor: 'pointer'
              }}
              onClick={collapsed ? handleMenu : undefined}
            />
          </Tooltip>
          {!collapsed && (
            <>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="subtitle2" noWrap>
                  {user?.userName || 'Unknown'}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {user?.email || 'tslin@gmail.com'}
                </Typography>
              </Box>
              <Tooltip title="Account options">
                <IconButton size="small" onClick={handleMenu}>
                  <MoreVertRoundedIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
          <Menu
            anchorEl={menuEl}
            open={open}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={go('/profile')}>
              <ListItemIcon><PersonRoundedIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Profile</ListItemText>
            </MenuItem>
            {/* <MenuItem onClick={go('/account')}>
              <ListItemIcon><AccountCircleRoundedIcon fontSize="small" /></ListItemIcon>
              <ListItemText>My account</ListItemText>
            </MenuItem>
            <MenuItem onClick={go('/add-account')}>
              <ListItemIcon><PersonAddAlt1RoundedIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Add another account</ListItemText>
            </MenuItem>
            <MenuItem onClick={go('/settings')}>
              <ListItemIcon><SettingsRoundedIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Settings</ListItemText>
            </MenuItem> */}
            <MenuItem onClick={doLogout}>
              <ListItemIcon><LogoutRoundedIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Sign Out</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Box>
    </Drawer>
  );
}
