import { API_BASE, ApiError, request } from './client.js';

// Drops empty params so the URL only carries active filters
const qs = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '' && value != null) search.set(key, value);
  });
  const text = search.toString();
  return text ? `?${text}` : '';
};

export const adminApi = {
  login: (email, password) => request('/api/auth/login', { method: 'POST', body: { email, password } }).then((r) => r.data),
  me: () => request('/api/auth/me').then((r) => r.data),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  changePassword: (body) => request('/api/auth/change-password', { method: 'POST', body }),

  stats: () => request('/api/admin/stats').then((r) => r.data),

  // Generic CRUD: resource is 'sections' | 'amenities' | 'gallery' | 'floor-plans' | 'inquiries'
  list: (resource, params, signal) => request(`/api/admin/${resource}${qs(params)}`, { signal }),
  create: (resource, body) => request(`/api/admin/${resource}`, { method: 'POST', body }).then((r) => r.data),
  update: (resource, id, body) => request(`/api/admin/${resource}/${id}`, { method: 'PATCH', body }).then((r) => r.data),
  remove: (resource, id) => request(`/api/admin/${resource}/${id}`, { method: 'DELETE' }),
  setStatus: (resource, id, status) =>
    request(`/api/admin/${resource}/${id}/publish`, { method: 'PATCH', body: { status } }).then((r) => r.data),

  logs: (params, signal) => request(`/api/admin/logs${qs(params)}`, { signal }),

  upload: (file) => {
    const form = new FormData();
    form.append('file', file);
    return request('/api/admin/upload', { method: 'POST', body: form }).then((r) => r.data);
  },

  async exportInquiries(params) {
    const res = await fetch(`${API_BASE}/api/admin/inquiries/export${qs(params)}`, { credentials: 'include' });
    if (!res.ok) throw new ApiError('Could not export inquiries', res.status);
    return res.blob();
  },
};
