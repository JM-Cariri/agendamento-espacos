import React, { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../App.jsx';
import { MetricCard } from '../components/MetricCard.jsx';

export function DashboardPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.metrics().then(setMetrics).catch((reason) => setError(reason.message)); }, []);
  const coordinator = user?.perfil === 'Coordenador';
  return <section>
    <div className="page-heading"><div><span className="eyebrow">VISÃO GERAL</span><h1>Olá, {user?.nome}</h1><p className="muted">Acompanhe os indicadores do sistema.</p></div></div>
    {error && <div className="alert" role="alert">{error}</div>}
    {!metrics && !error ? <p className="loading">Carregando indicadores…</p> : <div className="metrics-grid">
      {coordinator ? <>
        <MetricCard label="Espaços ativos" value={metrics?.totalEspacos} description="Disponíveis para reserva" />
        <MetricCard label="Reservas pendentes" value={metrics?.reservasPendentes} description="Aguardando decisão" />
        <MetricCard label="Reservas aprovadas" value={metrics?.reservasAprovadas} description="Em todo o sistema" />
      </> : <>
        <MetricCard label="Minhas reservas futuras" value={metrics?.minhasReservasFuturas} description="Pendentes ou aprovadas" />
        <MetricCard label="Minhas reservas pendentes" value={metrics?.minhasReservasPendentes} description="Aguardando decisão" />
        <MetricCard label="Minhas reservas aprovadas" value={metrics?.minhasReservasAprovadas} description="Inclui reservas históricas" />
      </>}
    </div>}
  </section>;
}
