import React, { useEffect, useState } from 'react';
const startTimes = Array.from({ length: 18 }, (_, index) => {
  const minutes = 7 * 60 + index * 50;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
});
const empty = { espaco_id: '', data: '', horario_inicio: startTimes[0], finalidade: '' };
export function ReservationForm({ spaces, initialValue, onSubmit, onCancel, busy }) {
  const [form, setForm] = useState(empty);
  useEffect(() => setForm(initialValue ? {
    espaco_id: initialValue.espaco_id,
    data: String(initialValue.data).slice(0, 10),
    horario_inicio: String(initialValue.horario_inicio).slice(0, 5),
    finalidade: initialValue.finalidade || '',
  } : empty), [initialValue]);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const endTime = (time) => {
    const [hour, minute] = time.split(':').map(Number);
    const end = hour * 60 + minute + 50;
    return `${String(Math.floor(end / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`;
  };
  return <form className="form-grid" onSubmit={(event) => {
    event.preventDefault();
    onSubmit({ espaco_id: Number(form.espaco_id), data: form.data, horario_inicio: form.horario_inicio, horario_fim: endTime(form.horario_inicio), finalidade: form.finalidade });
  }}>
    <h3>{initialValue ? 'Editar reserva' : 'Solicitar reserva'}</h3>
    <label>Espaço<select required value={form.espaco_id} onChange={(e) => update('espaco_id', e.target.value)}><option value="">Selecione um espaço</option>{spaces.map((space) => <option key={space.id} value={space.id}>{space.nome} · {space.localizacao_predio} (cap. {space.capacidade})</option>)}</select></label>
    <label>Data<input required type="date" value={form.data} onChange={(e) => update('data', e.target.value)} /></label>
    <label>Início<select value={form.horario_inicio} onChange={(e) => update('horario_inicio', e.target.value)}>{startTimes.map((time) => <option key={time} value={time}>{time}–{endTime(time)}</option>)}</select></label>
    <label className="full-width">Finalidade<textarea required maxLength="2000" rows="3" value={form.finalidade} onChange={(e) => update('finalidade', e.target.value)} /></label>
    <p className="muted full-width">Slots de 50 minutos entre 07:00 e 22:00. A reserva deve começar no futuro.</p>
    <div className="form-actions full-width"><button className="button" disabled={busy || spaces.length === 0}>{busy ? 'Salvando…' : initialValue ? 'Salvar alterações' : 'Solicitar'}</button><button type="button" className="button button-quiet" onClick={onCancel}>Cancelar</button></div>
  </form>;
}
