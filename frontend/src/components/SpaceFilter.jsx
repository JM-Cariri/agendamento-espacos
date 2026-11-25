import React from 'react';
export function SpaceFilter({ filters, onChange, onSubmit, onReset }) {
  const hasFilters = Boolean(filters.nome || filters.capacidadeMinima);
  return <form className="filter-bar" onSubmit={onSubmit}>
    <label>Nome do espaço<input value={filters.nome} onChange={(e) => onChange({ ...filters, nome: e.target.value })} placeholder="Ex.: laboratório" /></label>
    <label>Capacidade mínima<input type="number" min="1" value={filters.capacidadeMinima} onChange={(e) => onChange({ ...filters, capacidadeMinima: e.target.value })} /></label>
    <div className="filter-actions"><button className="button" type="submit">Filtrar</button><button className="button button-quiet" type="button" onClick={onReset} disabled={!hasFilters}>Limpar</button></div>
  </form>;
}
