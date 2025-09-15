import * as React from 'react';

export type AlertItem = {
  id: string;                 // unique
  message: string;
  severity?: 'error' | 'warning' | 'info' | 'success';
  persistent?: boolean;       // stay until dismissed
};

type AlertsCtx = {
  alerts: AlertItem[];
  push: (a: AlertItem) => void;
  dismiss: (id: string) => void;
  clear: () => void;
};

const Ctx = React.createContext<AlertsCtx | null>(null);

export function AlertsProvider({ children }: React.PropsWithChildren) {
  const [alerts, setAlerts] = React.useState<AlertItem[]>([]);

  const push = (a: AlertItem) =>
    setAlerts((prev) => (prev.find((x) => x.id === a.id) ? prev : [...prev, a]));

  const dismiss = (id: string) =>
    setAlerts((prev) => prev.filter((x) => x.id !== id));

  const clear = () => setAlerts([]);

  return <Ctx.Provider value={{ alerts, push, dismiss, clear }}>{children}</Ctx.Provider>;
}

export const useAlerts = () => {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error('useAlerts must be used within AlertsProvider');
  return ctx;
};
