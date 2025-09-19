import * as React from 'react';
import DarkModeIcon from '@mui/icons-material/DarkModeRounded';
import LightModeIcon from '@mui/icons-material/LightModeRounded';
import Box from '@mui/material/Box';
import IconButton, { IconButtonOwnProps } from '@mui/material/IconButton';
import { useThemeMode } from './AppTheme';

export default function ColorModeIconDropdown(props: IconButtonOwnProps) {
  const { mode, setMode } = useThemeMode();

  const handleToggle = () => {
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  if (!mode) {
    return (
      <Box
        data-screenshot="toggle-mode"
        sx={(theme) => ({
          verticalAlign: 'bottom',
          display: 'inline-flex',
          width: '2.25rem',
          height: '2.25rem',
          borderRadius: (theme.vars || theme).shape.borderRadius,
          border: '1px solid',
          borderColor: (theme.vars || theme).palette.divider,
        })}
      />
    );
  }

  const icon = mode === 'light' ? <LightModeIcon /> : <DarkModeIcon />;
  
  return (
    <IconButton
      data-screenshot="toggle-mode"
      onClick={handleToggle}
      disableRipple
      size="small"
      aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
      {...props}
    >
      {icon}
    </IconButton>
  );
}
