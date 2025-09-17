import { Routes, Route, Navigate } from 'react-router-dom';
//import GlobalAlerts from '../components/GlobalAlerts';
import TransactionList from '../pages/TransactionList';
import Login from '../pages/Login';
import ProtectedRoute from './ProtectedRoute';
import AppShell from '../layout/AppShell';
import Dashboard from '../pages/Dashboard';
import Users from '../pages/Users';
import Settings from '../pages/Settings';
import About from '../pages/About';
import Profile from '../pages/Profile';
import Account from '../pages/Account';
import AddAccount from '../pages/AddAccount';
import { useAuth } from '../contexts/AuthContext';

/** Show children only when NOT authed. If authed, go to dashboard. */
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null; // or your spinner
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

/** Catch-all: send authed users to dashboard, others to login. */
function AuthAwareCatchAll() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

export default function AppRoutes() {
  return (
    <>
      {/* <GlobalAlerts /> */}
      <Routes>
        {/* Public login at BOTH / and /login */}
        <Route path="/" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />

        {/* Protected area wrapped in the shell */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="translist" element={<TransactionList />} />
            <Route path="settings" element={<Settings />} />
            <Route path="about" element={<About />} />
            <Route path="profile" element={<Profile />} />
            <Route path="account" element={<Account />} />
            <Route path="add-account" element={<AddAccount />} />
          </Route>
        </Route>

        {/* Wildcard: redirect depending on auth */}
        <Route path="*" element={<AuthAwareCatchAll />} />
      </Routes>
    </>
  );
}
