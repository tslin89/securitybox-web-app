import * as React from 'react';

export type AlertItem = {
  id: string;                 // unique
  message: string;            // can contain HTML
  severity?: 'error' | 'warning' | 'info' | 'success';
  persistent?: boolean;       // stay until dismissed
  timestamp?: number;         // timestamp when alert was created
  read?: boolean;             // whether the alert has been read
};

type AlertsCtx = {
  alerts: AlertItem[];
  push: (a: AlertItem) => void;
  dismiss: (id: string) => void;
  clear: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  unreadCount: number;
  dismissToast: (id: string) => void; // Only dismisses from toast display, not from list
  dismissedToasts: Set<string>; // Track which toasts have been dismissed from display
};

const Ctx = React.createContext<AlertsCtx | null>(null);

const STORAGE_KEY = 'securitybox_notifications';

export function AlertsProvider({ children }: React.PropsWithChildren) {
  const [alerts, setAlerts] = React.useState<AlertItem[]>([]);
  const [dismissedToasts, setDismissedToasts] = React.useState<Set<string>>(new Set());

  // Load alerts from localStorage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedAlerts = JSON.parse(stored);
        setAlerts(parsedAlerts);
      }
    } catch (error) {
      console.error('Error loading notifications from localStorage:', error);
    }
  }, []);

  // Save alerts to localStorage whenever alerts change
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
    } catch (error) {
      console.error('Error saving notifications to localStorage:', error);
    }
  }, [alerts]);

  const push = (a: AlertItem) =>
    setAlerts((prev) => (prev.find((x) => x.id === a.id) ? prev : [...prev, { ...a, read: false }]));

  const dismiss = (id: string) =>
    setAlerts((prev) => prev.filter((x) => x.id !== id));

  const dismissToast = (id: string) => {
    setDismissedToasts((prev) => new Set([...prev, id]));
  };

  const clear = () => setAlerts([]);

  const markAsRead = (id: string) =>
    setAlerts((prev) => prev.map((x) => x.id === id ? { ...x, read: true } : x));

  const markAllAsRead = () =>
    setAlerts((prev) => prev.map((x) => ({ ...x, read: true })));

  const unreadCount = alerts.filter((x) => !x.read).length;

  return <Ctx.Provider value={{ alerts, push, dismiss, clear, markAsRead, markAllAsRead, unreadCount, dismissToast, dismissedToasts }}>{children}</Ctx.Provider>;
}

export const useAlerts = () => {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error('useAlerts must be used within AlertsProvider');
  return ctx;
};
