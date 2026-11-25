import React from 'react';
export function MetricCard({ label, value, description }) {
  return <article className="metric-card"><span>{label}</span><strong>{value ?? '—'}</strong>{description && <small>{description}</small>}</article>;
}
