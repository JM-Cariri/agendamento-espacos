import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../App.jsx';
import { SpaceForm } from '../components/SpaceForm.jsx';
import { SpaceFilter } from '../components/SpaceFilter.jsx';

export function SpacesPage() {
  const { user } = useAuth();
  const coordinator = user?.perfil === 'Coordenador';
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ nome: '', capacidadeMinima: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const load = useCallback(async (filter = filters) => {
    setError('');
    try { setItems(await api.spaces(filter)); }
    catch (reason) { setError([reason.message, ...reason.details].join(' ')); }
  }, [filters]);
  useEffect(() => { load({ nome: '', capacidadeMinima: '' }); }, []);
  async function save(data) {
    setBusy(true); setError('');
    try {
      if (editing?.id) await api.updateSpace(editing.id, data); else await api.createSpace(data);
      setEditing(null); await load();
    } catch (reason) { setError([reason.message, ...reason.details].join(' ')); }
    finally { setBusy(false); }
  }
  async function archive(space) {
    if (!window.confirm(`Arquivar “${space.nome}”?`)) return;
    setError('');
    try { await api.archiveSpace(space.id); setSelected(null); await load(); }
    catch (reason) { setError([reason.message, ...reason.details].join(' ')); }
  }
  async function showDetails(space) {
    setSelected(space);
    try { setSelected(await api.space(space.id)); }
    catch (reason) { setError([reason.message, ...reason.details].join(' ')); }
  }
  return <section>
    <div className="page-heading"><div><span className="eyebrow">CATÁLOGO</span><h1>Espaços</h1><p className="muted">Consulte os espaços e seus detalhes.</p></div>{coordinator && <button className="button" onClick={() => { setEditing({}); setSelected(null); }}>Novo espaço</button>}</div>
    {error && <div className="alert" role="alert">{error}</div>}
    <SpaceFilter filters={filters} onChange={setFilters} onSubmit={(event) => { event.preventDefault(); load(); }} onReset={() => { const clean = { nome: '', capacidadeMinima: '' }; setFilters(clean); load(clean); }} />
    {editing !== null && coordinator && <div className="panel"><SpaceForm initialValue={editing.id ? editing : null} onSubmit={save} onCancel={() => setEditing(null)} busy={busy} /></div>}
    {selected && <div className="panel detail-panel"><button className="close-button" onClick={() => setSelected(null)} aria-label="Fechar detalhes">×</button><h2>{selected.nome}</h2><p>{selected.descricao || 'Sem descrição.'}</p><dl className="detail-grid"><dt>Capacidade</dt><dd>{selected.capacidade}</dd><dt>Localização</dt><dd>{selected.localizacao_predio}</dd><dt>Funcionamento</dt><dd>{String(selected.horario_funcionamento_inicio || '07:00').slice(0, 5)}–{String(selected.horario_funcionamento_fim || '22:00').slice(0, 5)}</dd><dt>Reservas pendentes</dt><dd>{selected.reservas_pendentes ?? 0}</dd><dt>Reservas aprovadas</dt><dd>{selected.reservas_aprovadas ?? 0}</dd></dl></div>}
    {items.length === 0 ? <p className="empty-state">Nenhum espaço encontrado. {coordinator ? 'Cadastre o primeiro espaço para começar.' : ''}</p> : <div className="space-grid">{items.map((space) => <article className="space-card" key={space.id}><div><span className="eyebrow">CAPACIDADE {space.capacidade}</span><h2>{space.nome}</h2><p>{space.localizacao_predio}</p><small>{space.descricao || 'Sem descrição'}</small></div><div className="card-actions"><button className="text-button" onClick={() => showDetails(space)}>Detalhes</button>{coordinator && <><button className="text-button" onClick={() => { setEditing(space); setSelected(null); }}>Editar</button><button className="text-button danger-text" onClick={() => archive(space)}>Arquivar</button></>}</div></article>)}</div>}
  </section>;
}
