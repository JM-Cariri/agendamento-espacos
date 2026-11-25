import React, { useEffect, useState } from 'react';
const blank = { nome: '', capacidade: '', descricao: '', localizacao_predio: '' };
const editableFields = (space) => ({
  nome: space?.nome || '',
  capacidade: space?.capacidade ?? '',
  descricao: space?.descricao || '',
  localizacao_predio: space?.localizacao_predio || '',
});
export function SpaceForm({ initialValue, onSubmit, onCancel, busy }) {
  const [form, setForm] = useState(editableFields(initialValue));
  useEffect(() => setForm(editableFields(initialValue)), [initialValue]);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  return <form className="form-grid" onSubmit={(event) => { event.preventDefault(); onSubmit({ nome: form.nome, capacidade: Number(form.capacidade), descricao: form.descricao || null, localizacao_predio: form.localizacao_predio }); }}>
    <h3>{initialValue ? 'Editar espaço' : 'Novo espaço'}</h3>
    <label>Nome<input required maxLength="150" value={form.nome || ''} onChange={(e) => update('nome', e.target.value)} /></label>
    <label>Capacidade<input required type="number" min="1" value={form.capacidade ?? ''} onChange={(e) => update('capacidade', e.target.value)} /></label>
    <label>Localização no prédio<input required maxLength="255" value={form.localizacao_predio || ''} onChange={(e) => update('localizacao_predio', e.target.value)} /></label>
    <label className="full-width">Descrição<textarea rows="3" value={form.descricao || ''} onChange={(e) => update('descricao', e.target.value)} /></label>
    <p className="muted full-width">Funcionamento: 07:00–22:00.</p>
    <div className="form-actions full-width"><button className="button" disabled={busy}>{busy ? 'Salvando…' : 'Salvar espaço'}</button><button type="button" className="button button-quiet" onClick={onCancel}>Cancelar</button></div>
  </form>;
}
