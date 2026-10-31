// In dev the Vite proxy forwards /api to the backend; in production builds the API origin comes from VITE_API_URL.
const BASE = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status = 0, errors) {
    super(message);
    this.status = status;
    this.errors = errors; // { field: message } from server-side validation
  }
}

export async function request(path, { method = 'GET', body, signal } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError('Cannot reach the server. Please try again.');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.message || `Request failed (${res.status})`, res.status, data?.errors);
  return data;
}
