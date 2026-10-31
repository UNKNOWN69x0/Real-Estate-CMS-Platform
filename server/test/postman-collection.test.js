// Executes docs/postman_collection.json against the real app, so the published API docs can't drift from the code:
// every request must return the status its embedded test script expects, and every route must be covered.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ADMIN, PNG_BYTES, startApi } from '../test-utils/api.js';

const collection = JSON.parse(fs.readFileSync(fileURLToPath(new URL('../../docs/postman_collection.json', import.meta.url)), 'utf8'));
let api;
before(async () => { api = await startApi(); });
after(() => api.stop());

const flatten = (items) => items.flatMap((item) => (item.item ? flatten(item.item) : [item]));

test('the Postman collection runs clean and covers every route', async () => {
  const vars = Object.fromEntries(collection.variable.map((v) => [v.key, v.value]));
  Object.assign(vars, { baseUrl: api.baseUrl, adminEmail: ADMIN.email, adminPassword: ADMIN.password });
  const fill = (text) => text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);

  let cookie = '';
  const covered = new Set();
  const failures = [];
  const requests = flatten(collection.item);

  for (const item of requests) {
    const { request } = item;
    const script = item.event.flatMap((e) => e.script.exec).join('\n');
    const single = script.match(/have\.status\((\d+)\)/);
    const multi = script.match(/oneOf\(\[([\d,\s]+)\]\)/);
    const expected = single ? [Number(single[1])] : multi[1].split(',').map((n) => Number(n.trim()));

    const url = fill(request.url.raw);
    const headers = Object.fromEntries((request.header || []).map((h) => [h.key, fill(h.value)]));
    if (cookie) headers.Cookie = cookie;
    let body;
    if (request.body?.mode === 'raw') body = fill(request.body.raw);
    if (request.body?.mode === 'formdata') {
      body = new FormData();
      body.append('file', new Blob([PNG_BYTES], { type: 'image/png' }), 'pixel.png');
    }

    const res = await fetch(url, { method: request.method, headers, body });
    const setCookie = res.headers.getSetCookie?.()[0];
    if (setCookie) cookie = setCookie.split(';')[0].endsWith('=') ? '' : setCookie.split(';')[0]; // logout clears it
    const text = await res.text();

    if (!expected.includes(res.status)) failures.push(`${request.method} ${item.name}: expected ${expected.join('/')}, got ${res.status} ${text.slice(0, 120)}`);
    else if (res.status < 300) {
      // The same variable saves the Postman script would perform
      for (const m of script.matchAll(/collectionVariables\.set\("(\w+)", pm\.response\.json\(\)\.([^)]+)\)/g)) {
        vars[m[1]] = new Function('json', `return json.${m[2]}`)(JSON.parse(text));
      }
    }

    const path = new URL(url).pathname.split('/').map((seg, i) => (i > 3 && !['export', 'publish'].includes(seg) ? ':id' : seg)).join('/');
    covered.add(`${request.method} ${path}`);
  }
  assert.deepEqual(failures, []);

  const expectedRoutes = ['GET /api/health', 'POST /api/auth/login', 'GET /api/auth/me', 'POST /api/auth/logout', 'POST /api/auth/change-password', 'POST /api/inquiries',
    'GET /api/admin/inquiries/export', 'GET /api/admin/logs', 'GET /api/admin/stats', 'POST /api/admin/upload'];
  for (const r of ['sections', 'amenities', 'gallery', 'floor-plans']) expectedRoutes.push(`GET /api/public/${r}`, `GET /api/public/${r}/:id`);
  for (const r of ['sections', 'amenities', 'gallery', 'floor-plans', 'inquiries']) {
    expectedRoutes.push(`GET /api/admin/${r}`, `GET /api/admin/${r}/:id`, `PUT /api/admin/${r}/:id`, `PATCH /api/admin/${r}/:id`, `DELETE /api/admin/${r}/:id`);
    if (r !== 'inquiries') expectedRoutes.push(`POST /api/admin/${r}`, `PATCH /api/admin/${r}/:id/publish`);
  }
  assert.deepEqual(expectedRoutes.filter((route) => !covered.has(route)), [], 'routes missing from the collection');

  // Every request cleaned up after itself
  assert.equal(await api.models.Section.countDocuments(), 12);
  assert.equal(await api.models.Amenity.countDocuments(), 9);
  assert.equal(await api.models.Inquiry.countDocuments(), 0);
});
