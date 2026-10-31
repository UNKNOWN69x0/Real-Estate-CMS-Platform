import { request } from './client.js';

export const fetchSections = (signal) => request('/api/public/sections', { signal }).then((res) => res.data);

// name: 'gallery' | 'amenities' | 'floor-plans'
export const fetchCollection = (name, signal) => request(`/api/public/${name}`, { signal }).then((res) => res.data);

export const submitInquiry = (payload) => request('/api/inquiries', { method: 'POST', body: payload });
