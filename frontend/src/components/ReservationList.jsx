import React from 'react';
const dateLabel = (value) => {
  const date = String(value).slice(0, 10);
  const [year, month, day] = date.split('-');
  return year ? `${day}/${month}/${year}` : date;
};
export function ReservationList({ reservations, user, onSelect, onStatus }) {
  if (!reservations.length) return <p className="empty-state">Nenhuma reserva encontrada.</p>;
  return <div className="table-wrap"><table><thead><tr><th>Data e horário</th><th>Espaço</th><th>Solicitante</th><th>Finalidade</th><th>Situação</th><th>Ações</th></tr></thead>
    <tbody>{reservations.map((item) => {
      const owner = Number(item.usuario_id) === Number(user.id);
      const canCancel = ['Pendente', 'Aprovada'].includes(item.situacao) && (owner || user.perfil === 'Coordenador');
      return <tr key={item.id}>
        <td>{dateLabel(item.data)}<br /><span className="muted">{String(item.horario_inicio).slice(0, 5)}–{String(item.horario_fim).slice(0, 5)}</span></td>
        <td>{item.espaco?.nome || `Espaço ${item.espaco_id}`}</td><td>{item.usuario?.nome || `Usuário ${item.usuario_id}`}</td><td>{item.finalidade}</td>
        <td><span className={`status status-${item.situacao.toLowerCase()}`}>{item.situacao}</span></td>
        <td className="row-actions"><button className="text-button" onClick={() => onSelect(item.id)}>Detalhes</button>{canCancel && <button className="text-button danger-text" onClick={() => onStatus(item, 'Cancelada')}>Cancelar</button>}{item.situacao === 'Pendente' && user.perfil === 'Coordenador' && <><button className="text-button" onClick={() => onStatus(item, 'Aprovada')}>Aprovar</button><button className="text-button danger-text" onClick={() => onStatus(item, 'Recusada')}>Recusar</button></>}</td>
      </tr>;
    })}</tbody></table></div>;
}
