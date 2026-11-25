import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { api } from './api/client.js';
import { AppRoutes } from './routes/AppRoutes.jsx';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    api.me().then(({ user: current }) => { if (active) setUser(current); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const value = useMemo(() => ({ user, setUser, loading, async logout() {
    try { await api.logout(); } finally { setUser(null); }
  } }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function RouterContent() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => {
    try { await logout(); } finally { navigate('/login', { replace: true }); }
  };
  return <AppRoutes user={user} onLogout={handleLogout} />;
}

export function App() {
  return <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><AuthProvider><RouterContent /></AuthProvider></BrowserRouter>;
}
