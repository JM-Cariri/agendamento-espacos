import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../App.jsx';
import { ReservationForm } from '../components/ReservationForm.jsx';
import { ReservationList } from '../components/ReservationList.jsx';

const emptyFilters = { status: '', spaceId: '', userId: '', date: '', dateFrom: '', dateTo: '', periodo: '' };
const dateLabel = (value) => { const [year, month, day] = String(value).slice(0, 10).split('-'); return `${day}/${month}/${year}`; };
export function ReservationsPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async (filter = filters) => {
    setError('');
    try { setItems(await api.reservations(filter)); }
    catch (reason) { setError([reason.message, ...reason.details].join(' ')); }
  }, [filters]);
  useEffect(() => { load({ ...emptyFilters }); api.spaces().then(setSpaces).catch((reason) => setError(reason.message)); }, []);
  useEffect(() => {
    let active = true;
    if (id) api.reservation(id).then((item) => { if (active) setSelected(item); }).catch((reason) => { if (active) setError(reason.message); });
    else setSelected(null);
    return () => { active = false; };
  }, [id]);
  async function open(idToOpen) { setEditing(false); setCreating(false); navigate(`/reservations/${idToOpen}`); }
  async function save(data) {
    setBusy(true); setError('');
    try {
      if (editing && selected) { await api.updateReservation(selected.id, data); setEditing(false); const updated = await api.reservation(selected.id); setSelected(updated); }
      else { await api.createReservation(data); setCreating(false); }
      await load();
    } catch (reason) { setError([reason.message, ...reason.details].join(' ')); }
    finally { setBusy(false); }
  }
  async function changeStatus(item, status) {
    let body = { situacao: status };
    if (status === 'Recusada') {
      const justification = window.prompt('Informe a justificativa da recusa:');
      if (!justification?.trim()) return;
      body.justificativa_recusa = justification.trim();
    }
    setError('');
    try { await api.changeReservationStatus(item.id, body); await load(); if (selected?.id === item.id) setSelected(await api.reservation(item.id)); }
    catch (reason) { setError([reason.message, ...reason.details].join(' ')); }
  }
  const owner = selected && Number(selected.usuario_id) === Number(user.id);
  const canEdit = selected && ['Pendente', 'Aprovada'].includes(selected.situacao) && (owner || user.perfil === 'Coordenador');
  const canCancel = canEdit;
  return <section>
    <div className="page-heading"><div><span className="eyebrow">AGENDA</span><h1>Reservas</h1><p className="muted">Solicite, consulte e acompanhe reservas de espaços.</p></div><button className="button" onClick={() => { navigate('/reservations'); setSelected(null); setCreating(true); setEditing(false); }}>Nova reserva</button></div>
    {error && <div className="alert" role="alert">{error}</div>}
    {creating && <div className="panel"><ReservationForm spaces={spaces} onSubmit={save} onCancel={() => setCreating(false)} busy={busy} /></div>}
    {editing && selected && <div className="panel"><ReservationForm spaces={spaces} initialValue={selected} onSubmit={save} onCancel={() => setEditing(false)} busy={busy} /></div>}
    {selected && !editing && <article className="panel reservation-detail"><div className="detail-heading"><div><span className="eyebrow">RESERVA #{selected.id}</span><h2>{selected.espaco?.nome || `Espaço ${selected.espaco_id}`}</h2></div><button className="button button-quiet" onClick={() => navigate('/reservations')}>Voltar à lista</button></div>
      <dl className="detail-grid"><dt>Situação</dt><dd>{selected.situacao}</dd><dt>Data</dt><dd>{dateLabel(selected.data)}</dd><dt>Horário</dt><dd>{String(selected.horario_inicio).slice(0, 5)}–{String(selected.horario_fim).slice(0, 5)}</dd><dt>Solicitante</dt><dd>{selected.usuario?.nome}</dd><dt>Finalidade</dt><dd>{selected.finalidade}</dd>{selected.justificativa_recusa && <><dt>Justificativa</dt><dd>{selected.justificativa_recusa}</dd></>}</dl>
      <div className="form-actions">{canEdit && <button className="button" onClick={() => setEditing(true)}>Editar</button>}{canCancel && <button className="button button-danger" onClick={() => changeStatus(selected, 'Cancelada')}>Cancelar reserva</button>}{selected.situacao === 'Pendente' && user.perfil === 'Coordenador' && <><button className="button" onClick={() => changeStatus(selected, 'Aprovada')}>Aprovar</button><button className="button button-danger" onClick={() => changeStatus(selected, 'Recusada')}>Recusar</button></>}</div>
    </article>}
    <form className="filter-bar reservation-filters" onSubmit={(event) => { event.preventDefault(); load(); }}>
      <label>Situação<select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">Todas</option>{['Pendente', 'Aprovada', 'Recusada', 'Cancelada'].map((status) => <option key={status}>{status}</option>)}</select></label>
      <label>Espaço<select value={filters.spaceId} onChange={(e) => setFilters({ ...filters, spaceId: e.target.value })}><option value="">Todos</option>{spaces.map((space) => <option key={space.id} value={space.id}>{space.nome}</option>)}</select></label>
      <label>Solicitante (ID)<input type="number" min="1" value={filters.userId} onChange={(e) => setFilters({ ...filters, userId: e.target.value })} /></label>
      <label>Data exata<input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} /></label>
      <label>De<input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} /></label>
      <label>Até<input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} /></label>
      <label>Período<select value={filters.periodo} onChange={(e) => setFilters({ ...filters, periodo: e.target.value })}><option value="">Qualquer período</option><option value="futuras">Futuras</option><option value="aprovadasFuturas">Aprovadas futuras</option></select></label>
      <div className="filter-actions"><button className="button">Filtrar</button><button type="button" className="button button-quiet" onClick={() => { setFilters(emptyFilters); load(emptyFilters); }}>Limpar</button></div>
    </form>
    <ReservationList reservations={items} user={user} onSelect={open} onStatus={changeStatus} />
  </section>;
}
