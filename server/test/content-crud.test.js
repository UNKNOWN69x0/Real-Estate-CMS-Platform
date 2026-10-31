import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { startApi, wait } from '../test-utils/api.js';

let api;
let cookie;

before(async () => {
  api = await startApi();
  cookie = (await api.login()).cookie;
});
after(() => api.stop());

const admin = (method, path, body) => api.call(method, path, { cookie, body });

describe('public API', () => {
  test('serves published content and never leaks internal fields', async () => {
    const res = await api.call('GET', '/api/public/sections');
    assert.equal(res.status, 200);
    assert.equal(res.json.data.length, 12);
    for (const section of res.json.data) {
      assert.equal(section.status, 'published');
      assert.ok(!('updatedBy' in section) && !('demo' in section) && !('__v' in section));
    }
  });

  test('looks sections up by key and 404s for unknown or draft ones', async () => {
    assert.equal((await api.call('GET', '/api/public/sections/hero')).json.data.key, 'hero');
    assert.equal((await api.call('GET', '/api/public/sections/nope')).status, 404);

    const [hero] = (await admin('GET', '/api/admin/sections?search=hero')).json.data;
    await admin('PATCH', `/api/admin/sections/${hero._id}/publish`, { status: 'draft' });
    assert.equal((await api.call('GET', '/api/public/sections/hero')).status, 404, 'draft must be hidden');
    await admin('PATCH', `/api/admin/sections/${hero._id}/publish`, { status: 'published' });
    assert.equal((await api.call('GET', '/api/public/sections/hero')).status, 200);
  });

  test('public GETs are edge-cacheable briefly, authenticated routes never', async () => {
    const pub = await api.call('GET', '/api/public/amenities');
    assert.match(pub.headers['cache-control'], /s-maxage=30/);
    assert.match(pub.headers['cache-control'], /max-age=0/);
    // Browsers honour stale-while-revalidate and would show an admin the pre-edit copy first
    assert.doesNotMatch(pub.headers['cache-control'], /stale-while-revalidate/);
    assert.equal((await api.call('GET', '/api/admin/stats', { cookie })).headers['cache-control'], 'no-store');
    assert.equal((await api.call('GET', '/api/auth/me', { cookie })).headers['cache-control'], 'no-store');
  });
});

describe('admin API requires authentication', () => {
  for (const [method, path] of [['GET', '/api/admin/stats'], ['GET', '/api/admin/amenities'], ['POST', '/api/admin/gallery'], ['GET', '/api/admin/logs'], ['POST', '/api/admin/upload']]) {
    test(`${method} ${path} -> 401 without a session`, async () => {
      assert.equal((await api.call(method, path, method === 'POST' ? { body: {} } : {})).status, 401);
    });
  }
  test('a forged or garbage cookie is rejected', async () => {
    assert.equal((await api.call('GET', '/api/admin/stats', { cookie: 'token=not-a-jwt' })).status, 401);
  });
});

describe('amenities: generic CRUD, validation, draft/publish', () => {
  let id;

  test('rejects an invalid create with per-field errors', async () => {
    const res = await admin('POST', '/api/admin/amenities', { title: '', image: 'javascript:alert(1)', order: 1.5 });
    assert.equal(res.status, 400);
    assert.ok(res.json.errors.title);
    assert.ok(res.json.errors.image);
    assert.equal(res.json.errors.order, 'Must be a whole number');
  });

  test('creates a draft that the public site cannot see', async () => {
    const res = await admin('POST', '/api/admin/amenities', { title: 'Test Rooftop', icon: 'Trees', description: 'A test', order: 77 });
    assert.equal(res.status, 201);
    assert.equal(res.json.data.status, 'draft');
    assert.equal(res.json.data.publishedAt, undefined);
    id = res.json.data._id;
    const titles = (await api.call('GET', '/api/public/amenities')).json.data.map((a) => a.title);
    assert.ok(!titles.includes('Test Rooftop'));
  });

  test('PATCH is partial: untouched fields keep their values', async () => {
    const res = await admin('PATCH', `/api/admin/amenities/${id}`, { title: 'Test Rooftop v2' });
    assert.equal(res.status, 200);
    assert.equal(res.json.data.title, 'Test Rooftop v2');
    assert.equal(res.json.data.icon, 'Trees');
    assert.equal(res.json.data.order, 77);
  });

  test('publish sets publishedAt and shows it publicly; an empty body toggles it back', async () => {
    const published = await admin('PATCH', `/api/admin/amenities/${id}/publish`, { status: 'published' });
    assert.equal(published.json.data.status, 'published');
    assert.ok(published.json.data.publishedAt);
    assert.ok((await api.call('GET', '/api/public/amenities')).json.data.some((a) => a.title === 'Test Rooftop v2'));

    const toggled = await admin('PATCH', `/api/admin/amenities/${id}/publish`, {});
    assert.equal(toggled.json.data.status, 'draft');
    assert.equal(toggled.json.data.publishedAt, undefined);
  });

  test('deletes, then 404s; a malformed id is a 400, not a crash', async () => {
    assert.equal((await admin('DELETE', `/api/admin/amenities/${id}`)).status, 200);
    assert.equal((await admin('GET', `/api/admin/amenities/${id}`)).status, 404);
    assert.equal((await admin('GET', '/api/admin/amenities/not-an-id')).status, 400);
  });
});

describe('list endpoints: search, filter, sort, pagination', () => {
  test('paginates with accurate metadata and caps the page size', async () => {
    const res = await admin('GET', '/api/admin/amenities?limit=4&page=2');
    assert.equal(res.json.data.length, 4);
    assert.deepEqual(res.json.meta, { total: 9, page: 2, limit: 4, pages: 3 });
    assert.equal((await admin('GET', '/api/admin/amenities?limit=5000')).json.meta.limit, 100);
  });

  test('searches case-insensitively and filters by status', async () => {
    assert.equal((await admin('GET', '/api/admin/amenities?search=GYM')).json.data[0].title, 'Gymnasium / Fitness Center');
    assert.equal((await admin('GET', '/api/admin/amenities?status=draft')).json.meta.total, 0);
  });

  test('sorts only by whitelisted fields, ascending or descending', async () => {
    const asc = (await admin('GET', '/api/admin/amenities?sort=title&limit=100')).json.data.map((a) => a.title);
    const desc = (await admin('GET', '/api/admin/amenities?sort=-title&limit=100')).json.data.map((a) => a.title);
    assert.deepEqual(desc, [...asc].reverse());
    assert.equal((await admin('GET', '/api/admin/amenities?sort=passwordHash')).status, 200, 'unknown sort falls back safely');
  });

  test('operator-injection and regex-bomb style queries are inert', async () => {
    const injected = await admin('GET', '/api/admin/amenities?status[$ne]=x&search[$regex]=.*&title[$gt]=');
    assert.equal(injected.status, 200);
    const regexChars = await admin('GET', `/api/admin/amenities?search=${encodeURIComponent('(.*)+$[')}`);
    assert.equal(regexChars.status, 200);
    assert.equal(regexChars.json.meta.total, 0);
  });
});

describe('gallery and floor plans', () => {
  test('a gallery item needs a real http(s) image', async () => {
    assert.equal((await admin('POST', '/api/admin/gallery', { title: 'No image' })).status, 400);
    assert.equal((await admin('POST', '/api/admin/gallery', { title: 'Bad', image: 'ftp://x/y.png' })).status, 400);
    const ok = await admin('POST', '/api/admin/gallery', { title: 'Good', image: 'https://placehold.co/10x10' });
    assert.equal(ok.status, 201);
    await admin('DELETE', `/api/admin/gallery/${ok.json.data._id}`);
  });

  test('floor plan areas are coerced to numbers and validated', async () => {
    const bad = await admin('POST', '/api/admin/floor-plans', { unitType: 'x', carpetArea: -5, totalArea: 'abc' });
    assert.equal(bad.status, 400);
    const ok = await admin('POST', '/api/admin/floor-plans', { unitType: '9 BHK Test', carpetArea: '800', totalArea: 950 });
    assert.equal(ok.json.data.carpetArea, 800);
    assert.equal(typeof ok.json.data.carpetArea, 'number');
    assert.equal(ok.json.data.balcony, 0);
    await admin('DELETE', `/api/admin/floor-plans/${ok.json.data._id}`);
  });
});

describe('activity log', () => {
  test('records create / update / publish / delete with the admin and a readable summary', async () => {
    const before = await api.models.ActivityLog.countDocuments();
    const created = await admin('POST', '/api/admin/amenities', { title: 'Logged Amenity' });
    const id = created.json.data._id;
    await admin('PATCH', `/api/admin/amenities/${id}`, { description: 'x' });
    await admin('PATCH', `/api/admin/amenities/${id}/publish`, { status: 'published' });
    await admin('DELETE', `/api/admin/amenities/${id}`);
    await wait(150); // logs are written after the response is sent

    const entries = await api.models.ActivityLog.find({ entityId: id }).sort({ createdAt: 1, _id: 1 }).lean();
    assert.deepEqual(entries.map((e) => e.action), ['create', 'update', 'publish', 'delete']);
    assert.ok(entries.every((e) => e.entity === 'amenity' && e.userEmail === 'admin@onechembur.com' && e.user));
    assert.equal(entries[0].summary, 'Created amenity "Logged Amenity"');
    assert.equal((await api.models.ActivityLog.countDocuments()) - before, 4);
  });

  test('failed requests write nothing, and the log is filterable and paginated', async () => {
    const before = await api.models.ActivityLog.countDocuments();
    await admin('POST', '/api/admin/amenities', { title: '' }); // 400
    await admin('DELETE', '/api/admin/amenities/000000000000000000000000'); // 404
    await wait(150);
    assert.equal(await api.models.ActivityLog.countDocuments(), before);

    const filtered = await admin('GET', '/api/admin/logs?entity=amenity&action=create&limit=1');
    assert.equal(filtered.status, 200);
    assert.ok(filtered.json.data.every((l) => l.entity === 'amenity' && l.action === 'create'));
    assert.equal(filtered.json.meta.limit, 1);
  });
});

describe('dashboard stats', () => {
  test('returns counts per type, inquiries by status and recent items', async () => {
    const { data } = (await admin('GET', '/api/admin/stats')).json;
    assert.deepEqual(data.sections, { total: 12, published: 12, draft: 0 });
    assert.deepEqual(Object.keys(data.inquiries).sort(), ['closed', 'contacted', 'new', 'total']);
    assert.ok(Array.isArray(data.recentInquiries) && Array.isArray(data.recentActivity));
  });
});
