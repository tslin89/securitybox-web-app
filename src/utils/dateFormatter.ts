import moment from 'moment';

/**
 * Centralized date/time formatting utility
 * Provides consistent formatting across the entire application
 */

// Format constants - easily changeable in one place
const FORMATS = {
  TIME_ONLY: 'hh:mm:ss A',           // 12:34:56 PM
  DATE_ONLY: 'DD MMM YYYY',          // 15 Jan 2024
  DATETIME: 'DD MMM YYYY, hh:mm:ss A', // 15 Jan 2024 12:34:56 PM
} as const;

/**
 * Format a date/time value to time only (12-hour format with AM/PM)
 * @param date - Date string, timestamp, or Date object
 * @returns Formatted time string (e.g., "12:34:56 PM")
 */
export const formatTime = (date: string | number | Date | null | undefined): string => {
  if (!date) return '--';
  
  const momentDate = moment(date);
  if (!momentDate.isValid()) return 'Invalid Date';
  
  return momentDate.format(FORMATS.TIME_ONLY);
};

/**
 * Format a date/time value to date only
 * @param date - Date string, timestamp, or Date object
 * @returns Formatted date string (e.g., "15 Jan 2024")
 */
export const formatDate = (date: string | number | Date | null | undefined): string => {
  if (!date) return '--';
  
  const momentDate = moment(date);
  if (!momentDate.isValid()) return 'Invalid Date';
  
  return momentDate.format(FORMATS.DATE_ONLY);
};

/**
 * Format a date/time value to date and time
 * @param date - Date string, timestamp, or Date object
 * @returns Formatted datetime string (e.g., "15 Jan 2024 12:34:56 PM")
 */
export const formatDateTime = (date: string | number | Date | null | undefined): string => {
  if (!date) return '--';
  
  const momentDate = moment(date);
  if (!momentDate.isValid()) return 'Invalid Date';
  
  return momentDate.format(FORMATS.DATETIME);
};

/**
 * Format a date/time value with relative time (e.g., "2 hours ago", "just now")
 * @param date - Date string, timestamp, or Date object
 * @returns Relative time string
 */
export const formatRelativeTime = (date: string | number | Date | null | undefined): string => {
  if (!date) return '--';
  
  const momentDate = moment(date);
  if (!momentDate.isValid()) return 'Invalid Date';
  
  return momentDate.fromNow();
};

/**
 * Check if a date is today
 * @param date - Date string, timestamp, or Date object
 * @returns true if the date is today
 */
export const isToday = (date: string | number | Date | null | undefined): boolean => {
  if (!date) return false;
  
  const momentDate = moment(date);
  if (!momentDate.isValid()) return false;
  
  return momentDate.isSame(moment(), 'day');
};

/**
 * Check if a date is within the last N days
 * @param date - Date string, timestamp, or Date object
 * @param days - Number of days to check
 * @returns true if the date is within the last N days
 */
export const isWithinDays = (date: string | number | Date | null | undefined, days: number): boolean => {
  if (!date) return false;
  
  const momentDate = moment(date);
  if (!momentDate.isValid()) return false;
  
  return momentDate.isAfter(moment().subtract(days, 'days'));
};

/**
 * Get a human-readable duration between two dates
 * @param startDate - Start date
 * @param endDate - End date (defaults to now)
 * @returns Duration string (e.g., "2 hours 30 minutes")
 */
export const formatDuration = (
  startDate: string | number | Date | null | undefined,
  endDate?: string | number | Date | null | undefined
): string => {
  if (!startDate) return '--';
  
  const start = moment(startDate);
  const end = endDate ? moment(endDate) : moment();
  
  if (!start.isValid() || !end.isValid()) return 'Invalid Date';
  
  const duration = moment.duration(end.diff(start));
  
  const hours = Math.floor(duration.asHours());
  const minutes = duration.minutes();
  const seconds = duration.seconds();
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

// Export the format constants for reference
export { FORMATS };
