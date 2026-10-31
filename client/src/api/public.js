import { request } from './client.js';

export const fetchSections = (signal) => request('/api/public/sections', { signal }).then((res) => res.data);

export const submitInquiry = (payload) => request('/api/inquiries', { method: 'POST', body: payload });
