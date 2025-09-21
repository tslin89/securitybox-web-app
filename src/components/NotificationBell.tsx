import * as React from 'react';
import {
  IconButton,
  Badge,
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton as ListIconButton,
  Divider,
  Button,
  Chip,
  Stack,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  NotificationsRounded as NotificationsIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAlerts } from '../alerts/AlertsProvider';
import { formatTime, formatDateTime } from '../utils/dateFormatter';

interface NotificationBellProps {
  size?: 'small' | 'medium' | 'large';
}

export default function NotificationBell({ size = 'small' }: NotificationBellProps) {
  const { alerts, dismiss, markAsRead, markAllAsRead, unreadCount } = useAlerts();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = (alertId: string) => {
    markAsRead(alertId);
  };

  const handleDismiss = (alertId: string) => {
    dismiss(alertId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleClearAll = () => {
    alerts.forEach(alert => dismiss(alert.id));
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'success': return 'success';
      case 'info': return 'info';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity?: string) => {
    switch (severity) {
      case 'error': return '🔴';
      case 'warning': return '🟡';
      case 'success': return '🟢';
      case 'info': return '🔵';
      default: return '⚪';
    }
  };

  // Sort alerts by timestamp (newest first)
  const sortedAlerts = [...alerts].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  return (
    <>
      <Tooltip title={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}>
        <IconButton
          size={size}
          color="inherit"
          aria-label="notifications"
          onClick={handleClick}
          sx={{
            position: 'relative',
          }}
        >
          <Badge 
            badgeContent={unreadCount} 
            color="error" 
            overlap="circular"
            invisible={unreadCount === 0}
          >
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 500,
            mt: 1,
          }
        }}
      >
        <Paper elevation={0}>
          {/* Header */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" component="div">
                Notifications
                {unreadCount > 0 && (
                  <Chip 
                    label={unreadCount} 
                    size="small" 
                    color="primary" 
                    sx={{ ml: 1 }}
                  />
                )}
              </Typography>
              <Stack direction="row" spacing={1}>
                {unreadCount > 0 && (
                  <Button
                    size="small"
                    onClick={handleMarkAllAsRead}
                    sx={{ minWidth: 'auto' }}
                  >
                    Mark All Read
                  </Button>
                )}
                {alerts.length > 0 && (
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleClearAll}
                    sx={{ minWidth: 'auto' }}
                  >
                    Dismiss All
                  </Button>
                )}
              </Stack>
            </Stack>
          </Box>

          {/* Notifications List */}
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {sortedAlerts.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No notifications
                </Typography>
              </Box>
            ) : (
              <List dense>
                {sortedAlerts.map((alert, index) => (
                  <React.Fragment key={alert.id}>
                    <ListItem
                      sx={{
                        backgroundColor: alert.read ? 'transparent' : 'action.hover',
                        '&:hover': {
                          backgroundColor: 'action.selected',
                        },
                        py: 1.5,
                        cursor: 'pointer',
                      }}
                      onClick={() => !alert.read && handleMarkAsRead(alert.id)}
                    >
                      <ListItemText
                        primary={
                          <Box>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                              <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                {getSeverityIcon(alert.severity)}
                              </Typography>
                              <Chip
                                label={alert.severity || 'info'}
                                size="small"
                                color={getSeverityColor(alert.severity)}
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.65rem' }}
                              />
                              {!alert.read && (
                                <Box
                                  sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    backgroundColor: 'primary.main',
                                  }}
                                />
                              )}
                            </Stack>
                            <Box
                              sx={{
                                fontWeight: alert.read ? 'normal' : 'medium',
                                '& b': {
                                  fontWeight: 'bold',
                                },
                                '& br': {
                                  display: 'block',
                                  marginBottom: '4px',
                                },
                              }}
                              dangerouslySetInnerHTML={{ __html: alert.message }}
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                            {alert.timestamp ? formatDateTime(alert.timestamp) : 'Unknown time'}
                          </Typography>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Dismiss">
                          <ListIconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent triggering the row click
                              handleDismiss(alert.id);
                            }}
                            sx={{ p: 0.5 }}
                          >
                            <CloseIcon fontSize="small" />
                          </ListIconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < sortedAlerts.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        </Paper>
      </Popover>
    </>
  );
}
