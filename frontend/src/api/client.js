const API_BASE = '/api';

export class ApiError extends Error {
  constructor(message, status, details = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = Array.isArray(details) ? details : [];
  }
}

export async function request(path, { method = 'GET', body, ...options } = {}) {
  const headers = { Accept: 'application/json', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...options.headers };
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    method,
    headers,
    credentials: 'include',
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = { error: text }; }
  }
  if (!response.ok) {
    throw new ApiError(data?.error || `Falha na solicitação (${response.status}).`, response.status, data?.details);
  }
  return data;
}

const query = (params) => {
  const search = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== '' && value !== undefined && value !== null) search.set(key, value);
  });
  const serialized = search.toString();
  return serialized ? `?${serialized}` : '';
};

export const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  me: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST', body: {} }),
  metrics: () => request('/dashboard/metrics'),
  spaces: (filters) => request(`/spaces${query(filters)}`),
  space: (id) => request(`/spaces/${id}`),
  createSpace: (data) => request('/spaces', { method: 'POST', body: data }),
  updateSpace: (id, data) => request(`/spaces/${id}`, { method: 'PUT', body: data }),
  archiveSpace: (id) => request(`/spaces/${id}/archive`, { method: 'PATCH', body: {} }),
  reservations: (filters) => request(`/reservas${query(filters)}`),
  reservation: (id) => request(`/reservas/${id}`),
  createReservation: (data) => request('/reservas', { method: 'POST', body: data }),
  updateReservation: (id, data) => request(`/reservas/${id}`, { method: 'PUT', body: data }),
  changeReservationStatus: (id, data) => request(`/reservas/${id}/status`, { method: 'PATCH', body: data }),
};
