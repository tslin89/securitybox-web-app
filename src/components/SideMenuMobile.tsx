import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Drawer, { drawerClasses } from '@mui/material/Drawer';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
// import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
// import MenuButton from './MenuButton';
// import MenuContent from './MenuContent';
// import CardAlert from './CardAlert';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { mainNav, secondaryNav } from '../config/nav';
import { useAuth } from '../contexts/AuthContext';
import { NavLink, useNavigate } from 'react-router-dom';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
// import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
// import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
// import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';

interface SideMenuMobileProps {
  open: boolean | undefined;
  toggleDrawer: (newOpen: boolean) => () => void;
}

function NavList({ items, onItemClick, userType }: { items: typeof mainNav; onItemClick?: () => void; userType?: number }) {
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
            onClick={onItemClick}
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

export default function SideMenuMobile({ open, toggleDrawer }: SideMenuMobileProps) {
  const { user, logout } = useAuth() as any;
  const [menuEl, setMenuEl] = React.useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  
  const handleMenu = (e: React.MouseEvent<HTMLElement>) => setMenuEl(e.currentTarget);
  const handleClose = () => setMenuEl(null);
  const go = (path: string) => () => { handleClose(); navigate(path); toggleDrawer(false)(); };
  const doLogout = () => { 
    handleClose(); 
    logout?.(); 
    navigate('/'); 
    toggleDrawer(false)();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={toggleDrawer(false)}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        [`& .${drawerClasses.paper}`]: {
          backgroundImage: 'none',
          backgroundColor: 'background.paper',
        },
      }}
    >
      <Stack
        sx={{
          width: '300px',
          maxWidth: '70dvw',
          height: '100%',
        }}
      >
        <Stack>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar src={user?.avatarUrl} alt={user?.name || 'User'} />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="subtitle2" noWrap>
                {user?.userName || 'Unknown'}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {user?.email || '???@gmail.com'}
              </Typography>
            </Box>
            <Tooltip title="Account options">
              <IconButton size="small" onClick={handleMenu}>
                <MoreVertRoundedIcon />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={menuEl}
              open={Boolean(menuEl)}
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
              {/* <MenuItem onClick={doLogout}>
                <ListItemIcon><LogoutRoundedIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Logout</ListItemText>
              </MenuItem> */}
            </Menu>
          </Box>
        </Stack>
        <Divider />
        <Stack sx={{ flexGrow: 1 }}>
          <NavList items={mainNav} onItemClick={toggleDrawer(false)} userType={user?.userType} />
        </Stack>
        <Divider />
        <Stack>
          <NavList items={secondaryNav as any} onItemClick={toggleDrawer(false)} />
        </Stack>
        <Stack sx={{ p: 2 }}>
          <Button variant="outlined" fullWidth startIcon={<LogoutRoundedIcon />} onClick={doLogout}>
            Sign Out
          </Button>
        </Stack>
      </Stack>
    </Drawer>
  );
}
