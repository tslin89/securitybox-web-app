import * as React from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Button,
  Alert,
  Box,
  Chip,
  CircularProgress,
} from '@mui/material';
import { getUserEventSettings, updateUserEventSettings, EventSetting } from '../services/api';

interface EventSettingsProps {
  userId: number;
}

const getEventTypeLabel = (eventType: number): string => {
  switch (eventType) {
    case 0:
      return 'Information';
    case 1:
      return 'Warning';
    case 2:
      return 'Success';
    case 3:
      return 'Error';
    default:
      return 'Unknown';
  }
};

const getEventTypeColor = (eventType: number): 'default' | 'warning' | 'success' | 'error' => {
  switch (eventType) {
    case 0:
      return 'default';
    case 1:
      return 'warning';
    case 2:
      return 'success';
    case 3:
      return 'error';
    default:
      return 'default';
  }
};

export default function EventSettings({ userId }: EventSettingsProps) {
  const [eventSettings, setEventSettings] = React.useState<EventSetting[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [disabledCodes, setDisabledCodes] = React.useState<Set<string>>(new Set());

  // Load event settings on component mount
  React.useEffect(() => {
    loadEventSettings();
  }, [userId]);

  const loadEventSettings = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const response = await getUserEventSettings(userId);
      setEventSettings(response.data);

      // Initialize disabled codes based on notificationEnabled status
      const disabled = new Set<string>();
      response.data.forEach(setting => {
        if (!setting.notificationEnabled) {
          disabled.add(setting.eventCode);
        }
      });
      setDisabledCodes(disabled);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load event settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (eventCode: string, checked: boolean) => {
    const newDisabledCodes = new Set(disabledCodes);
    if (checked) {
      newDisabledCodes.delete(eventCode);
    } else {
      newDisabledCodes.add(eventCode);
    }
    setDisabledCodes(newDisabledCodes);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const disabledCodesArray = Array.from(disabledCodes);
      await updateUserEventSettings(userId, disabledCodesArray);

      setMessage({ type: 'success', text: 'Event settings updated successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update event settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={1} sx={{ p: { xs: 0, sm: 3 }, borderRadius: 1 }}>
      <Typography variant="h6" sx={{ mb: 1.5 , m: { xs: 2}}}>
        Event Notifications
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ m: { xs: 2 } }}>
        Configure which events should trigger notifications.
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Event Description</TableCell>
              <TableCell>Event Type</TableCell>
              <TableCell align="center">Notification Enabled</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {eventSettings.map((setting) => (
              <TableRow key={setting.eventCode}>
                <TableCell>
                  <Typography variant="body2">
                    {setting.eventDescription}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Code: {setting.eventCode}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={getEventTypeLabel(setting.eventType)}
                    color={getEventTypeColor(setting.eventType)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Checkbox
                    checked={!disabledCodes.has(setting.eventCode)}
                    onChange={(e) => handleCheckboxChange(setting.eventCode, e.target.checked)}
                    disabled={saving}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 2, pb: { xs: 2, sm: 0 }, display: 'flex', justifyContent: { xs: 'center', sm: 'flex-end' } }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} /> : null}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>
    </Paper>
  );
}
