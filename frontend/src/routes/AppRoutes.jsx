import React from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '../App.jsx';
import { LoginPage } from '../pages/LoginPage.jsx';
import { DashboardPage } from '../pages/DashboardPage.jsx';
import { SpacesPage } from '../pages/SpacesPage.jsx';
import { ReservationsPage } from '../pages/ReservationsPage.jsx';

function Protected({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <p className="loading">Verificando sessão…</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.perfil)) return <Navigate to="/dashboard" replace />;
  return children;
}

function Shell({ children, onLogout, user }) {
  return <div className="app-shell">
    <header className="topbar">
      <Link className="brand" to="/dashboard">Agendamento de Espaços</Link>
      <nav aria-label="Navegação principal">
        <Link to="/dashboard">Painel</Link>
        <Link to="/spaces">Espaços</Link>
        <Link to="/reservations">Reservas</Link>
      </nav>
      <div className="user-menu"><span>{user?.nome} · {user?.perfil}</span><button className="button button-quiet" onClick={onLogout}>Sair</button></div>
    </header>
    <main className="page-content">{children}</main>
  </div>;
}

export function AppRoutes({ user, onLogout }) {
  const { loading } = useAuth();
  if (loading) return <p className="loading">Verificando sessão…</p>;
  return <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/dashboard" element={<Protected><Shell user={user} onLogout={onLogout}><DashboardPage /></Shell></Protected>} />
    <Route path="/spaces" element={<Protected><Shell user={user} onLogout={onLogout}><SpacesPage /></Shell></Protected>} />
    <Route path="/spaces/manage" element={<Protected roles={['Coordenador']}><Shell user={user} onLogout={onLogout}><SpacesPage /></Shell></Protected>} />
    <Route path="/reservations" element={<Protected><Shell user={user} onLogout={onLogout}><ReservationsPage /></Shell></Protected>} />
    <Route path="/reservations/:id" element={<Protected><Shell user={user} onLogout={onLogout}><ReservationsPage /></Shell></Protected>} />
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>;
}
