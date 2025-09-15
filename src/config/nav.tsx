// src/config/nav.tsx
import * as React from 'react';
import HomeRounded from '@mui/icons-material/HomeRounded';
import GroupRounded from '@mui/icons-material/GroupRounded';
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded';
import SettingsRounded from '@mui/icons-material/SettingsRounded';
import InfoRounded from '@mui/icons-material/InfoRounded';

export type NavItem = { label: string; to: string; icon: React.ReactNode };

export const mainNav: NavItem[] = [
  { label: 'Home',         to: '/dashboard', icon: <HomeRounded /> },
  { label: 'Clients',      to: '/users',     icon: <GroupRounded /> },
  { label: 'Transactions', to: '/translist', icon: <ReceiptLongRounded /> },
];

export const secondaryNav: NavItem[] = [
  { label: 'Settings', to: '/settings', icon: <SettingsRounded /> },
  { label: 'About',    to: '/about',    icon: <InfoRounded /> },
];
