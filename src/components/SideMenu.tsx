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
// import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
// import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
// import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';

import { mainNav, secondaryNav } from '../config/nav';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 240;

const Drawer = styled(MuiDrawer)({
  width: drawerWidth,
  flexShrink: 0,
  boxSizing: 'border-box',
  mt: 10,
  [`& .${drawerClasses.paper}`]: {
    width: drawerWidth,
    boxSizing: 'border-box',
  },
});

function NavList({ items, userType }: { items: typeof mainNav; userType?: number }) {
  // Filter items based on userType - only show Users and Transactions for userType 1 (admin)
  const filteredItems = items.filter(item => {
    if (item.label === 'Users') {
      return userType === 1;
    }
    return true; // Show all other items
  });

  return (
    <List sx={{ px: 1 }}>
      {filteredItems.map((item) => (
        <ListItem key={item.to} disablePadding>
          <ListItemButton
            component={NavLink}
            to={item.to}
            end={item.to === '/dashboard'}
            // className={({ isActive }) => (isActive ? 'active' : undefined)}
            sx={{
              borderRadius: 2,
              '&.active': (theme) => ({
                backgroundColor: theme.palette.action.selected,
              }),
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
}

export default function SideMenu() {
  const { user, logout } = useAuth() as any;
  const navigate = useNavigate();

  const [menuEl, setMenuEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(menuEl);
  const handleMenu = (e: React.MouseEvent<HTMLElement>) => setMenuEl(e.currentTarget);
  const handleClose = () => setMenuEl(null);

  const go = (path: string) => () => { handleClose(); navigate(path); };
  const doLogout = () => { handleClose(); logout?.(); navigate('/'); };

  return (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: 'none', md: 'block' },
        [`& .${drawerClasses.paper}`]: {
          backgroundColor: 'background.paper',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* BRAND / PROJECT SWITCHER AREA (optional, keep template content here) */}

        <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', cursor: 'pointer' }} onClick={go('/dashboard')}>
          <Box component="img" src="/logo512.png" alt="Winter Security Box" sx={{ width: 36, height: 'auto', margin: 1 }} />
          <Box>
            <Typography sx={{ fontWeight: 600 }}>
              Winter Security System
            </Typography>
            <Typography sx={{ fontWeight: 400 }}>
              Admin Portal
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ my: 1 }} />

        {/* MAIN NAV (Home, Clients, Transactions) */}
        <NavList items={mainNav} userType={user?.userType} />
        <Divider sx={{ my: 1 }} />

        {/* Push the user block to the absolute bottom */}
        <Box sx={{ flexGrow: 1 }} />

        {/* SECONDARY (Settings, About, …) sits ABOVE the user card */}

        <NavList items={secondaryNav as any} />

        {/* Any promo/plan card from the template can go here */}
        {/* <YourPlanCard /> */}

        <Divider />

        {/* USER CARD (bottom-fixed with 3-dots menu) */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar src={user?.avatarUrl} alt={user?.name || 'User'} />
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
