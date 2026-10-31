// In dev the Vite proxy forwards /api to the backend; in production builds the API origin comes from VITE_API_URL.
export const API_BASE = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status = 0, errors) {
    super(message);
    this.status = status;
    this.errors = errors; // { field: message } from server-side validation
  }
}

export async function request(path, { method = 'GET', body, signal } = {}) {
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: body && !isForm ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
      credentials: 'include',
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError('Cannot reach the server. Please try again.');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    // An expired session on any admin call sends the admin app back to the login page
    if (res.status === 401 && path.startsWith('/api/admin')) window.dispatchEvent(new Event('admin:unauthorized'));
    throw new ApiError(data?.message || `Request failed (${res.status})`, res.status, data?.errors);
  }
  return data;
}
