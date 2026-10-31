import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { PNG_BYTES, multipartFile, startApi, wait } from '../test-utils/api.js';

let api;
let cookie;

before(async () => {
  api = await startApi();
  cookie = (await api.login()).cookie;
});
after(() => api.stop());

const admin = (method, path, body) => api.call(method, path, { cookie, body });

describe('sections', () => {
  let id;

  test('a section key must be well formed and unique', async () => {
    assert.equal((await admin('POST', '/api/admin/sections', { key: 'Bad Key' })).status, 400);
    assert.equal((await admin('POST', '/api/admin/sections', { key: 'hero', title: 'Duplicate' })).status, 409);
  });

  test('custom sections can be created, edited, published publicly, and deleted', async () => {
    const created = await admin('POST', '/api/admin/sections', { key: 'offers', title: 'Launch offers', status: 'draft', order: 100 });
    assert.equal(created.status, 201);
    id = created.json.data._id;
    assert.equal((await api.call('GET', '/api/public/sections/offers')).status, 404, 'drafts stay hidden');

    await admin('PATCH', `/api/admin/sections/${id}`, { body: 'Hello\n\nWorld', content: { imagePosition: 'left' } });
    await admin('PATCH', `/api/admin/sections/${id}/publish`, { status: 'published' });
    const pub = await api.call('GET', '/api/public/sections/offers');
    assert.equal(pub.json.data.content.imagePosition, 'left');

    assert.equal((await admin('DELETE', `/api/admin/sections/${id}`)).status, 200);
    assert.equal((await api.call('GET', '/api/public/sections/offers')).status, 404);
  });

  test('a section key cannot be renamed after creation', async () => {
    const [about] = (await admin('GET', '/api/admin/sections?search=about')).json.data;
    const res = await admin('PATCH', `/api/admin/sections/${about._id}`, { key: 'renamed', title: 'Still works' });
    assert.equal(res.status, 200);
    assert.equal(res.json.data.key, 'about');
    assert.equal(res.json.data.title, 'Still works');
  });

  test('links and images inside content must be http(s), #anchor or /path, and errors mirror the field path', async () => {
    const [hero] = (await admin('GET', '/api/admin/sections?search=hero')).json.data;
    const patch = (content) => admin('PATCH', `/api/admin/sections/${hero._id}`, { content });

    const js = await patch({ primaryCta: { label: 'x', href: 'javascript:alert(1)' } });
    assert.equal(js.status, 400);
    assert.ok(js.json.errors['content.primaryCta.href']);
    const nested = await patch({ quickLinks: [{ label: 'a', href: '#ok' }, { label: 'b', href: 'data:text/html,x' }] });
    assert.ok(nested.json.errors['content.quickLinks.1.href']);
    assert.ok((await patch({ posterImage: '//evil.example/x.png' })).json.errors['content.posterImage']);
    assert.equal((await patch({ ...hero.content, primaryCta: { label: 'ok', href: '/about' } })).status, 200);
  });

  test('seo field limits are enforced', async () => {
    const [hero] = (await admin('GET', '/api/admin/sections?search=hero')).json.data;
    const res = await admin('PATCH', `/api/admin/sections/${hero._id}`, { seo: { metaTitle: 'x'.repeat(71), metaDescription: 'ok', ogImage: '' } });
    assert.equal(res.status, 400);
    assert.ok(res.json.errors['seo.metaTitle']);
  });
});

describe('uploads', () => {
  const upload = ({ filename, type, data }) => {
    const { raw, headers } = multipartFile({ filename, type, data });
    return api.call('POST', '/api/admin/upload', { cookie, raw, headers });
  };

  test('rejects a request with no file', async () => {
    const res = await api.call('POST', '/api/admin/upload', { cookie, raw: Buffer.from(''), headers: { 'Content-Type': 'multipart/form-data; boundary=x' } });
    assert.equal(res.status, 400);
  });

  test('rejects disallowed MIME types', async () => {
    assert.equal((await upload({ filename: 'x.txt', type: 'text/plain', data: Buffer.from('hello world, not an image') })).status, 400);
  });

  test('rejects a file whose bytes do not match its declared type', async () => {
    const res = await upload({ filename: 'fake.png', type: 'image/png', data: Buffer.from('<html><script>alert(1)</script></html>') });
    assert.equal(res.status, 400);
    assert.match(res.json.message, /don't match/);
    const mismatch = await upload({ filename: 'pic.pdf', type: 'application/pdf', data: PNG_BYTES });
    assert.equal(mismatch.status, 400, 'a PNG labelled as PDF is refused');
  });

  test('a genuine image passes validation (503 only because Cloudinary is not configured here)', async () => {
    const res = await upload({ filename: 'pixel.png', type: 'image/png', data: PNG_BYTES });
    assert.equal(res.status, 503);
    assert.match(res.json.message, /not configured/);
  });
});

describe('inquiries', () => {
  const valid = { name: 'Priya Nair', phone: '+91 9876543210', email: 'priya@example.com', message: 'Interested in 2 BHK', source: 'hero' };

  test('the public form validates and stores an enquiry without echoing it back', async () => {
    const bad = await api.call('POST', '/api/inquiries', { body: { name: 'A', phone: 'abc', email: 'nope' } });
    assert.equal(bad.status, 400);
    assert.ok(bad.json.errors.name && bad.json.errors.phone && bad.json.errors.email);

    const ok = await api.call('POST', '/api/inquiries', { body: valid });
    assert.equal(ok.status, 201);
    assert.deepEqual(Object.keys(ok.json), ['message']);
    assert.equal(await api.models.Inquiry.countDocuments({ name: 'Priya Nair' }), 1);
  });

  test('the honeypot field makes bots look successful without storing anything', async () => {
    const res = await api.call('POST', '/api/inquiries', { body: { ...valid, name: 'Spam Bot', website: 'http://spam.example' } });
    assert.equal(res.status, 201);
    assert.equal(await api.models.Inquiry.countDocuments({ name: 'Spam Bot' }), 0);
  });

  test('admins list, search, filter, update status and notes, and delete', async () => {
    const list = await admin('GET', '/api/admin/inquiries?search=priya&status=new');
    assert.equal(list.json.meta.total, 1);
    const id = list.json.data[0]._id;

    assert.equal((await admin('PATCH', `/api/admin/inquiries/${id}`, { status: 'bogus' })).status, 400);
    const updated = await admin('PATCH', `/api/admin/inquiries/${id}`, { status: 'contacted', notes: 'Called back' });
    assert.equal(updated.json.data.status, 'contacted');
    assert.equal(updated.json.data.notes, 'Called back');
    assert.equal((await admin('GET', '/api/admin/inquiries?status=new&search=priya')).json.meta.total, 0);

    assert.equal((await admin('POST', '/api/admin/inquiries', { name: 'x' })).status, 404, 'admins cannot create inquiries');
    assert.equal((await admin('DELETE', `/api/admin/inquiries/${id}`)).status, 200);
    await wait(150);
    assert.ok(await api.models.ActivityLog.findOne({ entity: 'inquiry', action: 'delete', entityId: id }), 'deletion is logged');
  });

  test('CSV export applies the filters and neutralises spreadsheet formulas', async () => {
    await api.call('POST', '/api/inquiries', { body: { ...valid, name: '=HYPERLINK("http://evil")', message: 'line1\nline2, "quoted"' } });
    const res = await admin('GET', '/api/admin/inquiries/export');
    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'], /text\/csv/);
    assert.match(res.headers['content-disposition'], /attachment; filename=inquiries-/);
    assert.match(res.text, /^Received,Name,Phone,Email,Message,Source,Status,Notes/);
    assert.ok(res.text.includes(`"'=HYPERLINK(""http://evil"")"`), 'formula is prefixed with a quote and escaped');
    assert.equal((await admin('GET', '/api/admin/inquiries/export?status=closed')).text.trim().split('\r\n').length, 1, 'filter leaves only the header');
  });
});
