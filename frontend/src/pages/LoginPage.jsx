import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../App.jsx';

export function LoginPage() {
  const { user, setUser, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!loading && user) navigate('/dashboard', { replace: true }); }, [loading, user, navigate]);
  if (loading) return <p className="loading">Verificando sessão…</p>;
  if (user) return <Navigate to="/dashboard" replace />;
  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const result = await api.login(email, password);
      setUser(result.user);
      const destination = location.state?.from?.pathname;
      navigate(destination && destination !== '/login' ? destination : '/dashboard', { replace: true });
    } catch (reason) { setError(reason.message || 'Não foi possível entrar.'); }
    finally { setBusy(false); }
  }
  return <main className="login-page"><form className="login-card" onSubmit={submit}>
    <span className="eyebrow">AGENDAMENTO DE ESPAÇOS</span><h1>Entrar</h1><p className="muted">Acesse com sua conta institucional.</p>
    {error && <div className="alert" role="alert">{error}</div>}
    <label>E-mail<input autoComplete="username" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
    <label>Senha<input autoComplete="current-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
    <button className="button button-wide" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
  </form></main>;
}
