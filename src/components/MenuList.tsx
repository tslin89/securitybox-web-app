// src/components/MenuList.tsx
import * as React from 'react';
import { NavLink } from 'react-router-dom';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import type { NavItem } from '../config/nav';

export default function MenuList({
  items,
  onNavigate,
}: { items: NavItem[]; onNavigate?: () => void }) {
  return (
    <List sx={{ px: 1 }}>
      {items.map((item) => (
        <ListItem key={item.to} disablePadding>
          <NavLink
            to={item.to}
            end={item.to === '/dashboard'}
            style={{ textDecoration: 'none', width: '100%', display: 'block' }}
            onClick={onNavigate}
          >
            {({ isActive }) => (
              <ListItemButton
                selected={isActive}
                sx={{
                  borderRadius: 2,
                  '&.Mui-selected': (t) => ({ backgroundColor: t.palette.action.selected }),
                  '&.Mui-selected:hover': (t) => ({ backgroundColor: t.palette.action.selected }),
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            )}
          </NavLink>
        </ListItem>
      ))}
    </List>
  );
}
