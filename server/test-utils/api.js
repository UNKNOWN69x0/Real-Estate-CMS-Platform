// Shared harness: boots the real Express app against a throwaway in-memory MongoDB and gives tests a tiny HTTP client.
// Each test file runs in its own process (node --test), so setting process.env here is safe.
import http from 'node:http';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { MongoMemoryServer } from 'mongodb-memory-server';

export const ADMIN = { email: 'admin@onechembur.com', password: 'Test-Admin-Passw0rd' };

let nextIp = 0;

export async function startApi({ env = {}, seedContent = true } = {}) {
  // mongodb-memory-server picks its cache from the directory npm was launched in, so running the tests from
  // the repo root would re-download the ~800 MB binary. Pin it next to the server package (CI overrides this).
  process.env.MONGOMS_DOWNLOAD_DIR ??= fileURLToPath(new URL('../node_modules/.cache/mongodb-memory-server', import.meta.url));
  const mongod = await MongoMemoryServer.create();
  Object.assign(process.env, {
    NODE_ENV: 'test',
    LOG_REQUESTS: 'false',
    MONGODB_URI: mongod.getUri('test'),
    JWT_SECRET: 'test-secret-test-secret-test-secret-1234',
    CLIENT_URL: 'http://localhost:5173',
    SEED_ADMIN_EMAIL: ADMIN.email,
    SEED_ADMIN_PASSWORD: ADMIN.password,
    TRUST_PROXY: '1', // every request gets its own X-Forwarded-For, so rate limits never leak between tests
    COOKIE_SAMESITE: '',
    // Never touch a real Cloudinary account, whatever is in a developer's .env
    CLOUDINARY_CLOUD_NAME: '',
    CLOUDINARY_API_KEY: '',
    CLOUDINARY_API_SECRET: '',
    ...env,
  });

  const { env: config } = await import('../src/config/env.js');
  const { connectDb } = await import('../src/config/db.js');
  const { createApp } = await import('../src/app.js');
  await connectDb();

  if (seedContent) {
    const { seed } = await import('../src/seed/seed.js');
    const originalLog = console.log;
    console.log = () => {};
    try {
      await seed();
    } finally {
      console.log = originalLog;
    }
  }

  const server = createApp().listen(0);
  await once(server, 'listening');
  const port = server.address().port;

  /** call(method, path, { body, cookie, ip, headers, raw }) -> { status, headers, json, text } */
  const call = (method, path, { body, cookie, ip, headers = {}, raw } = {}) =>
    new Promise((resolve, reject) => {
      const payload = raw ?? (body === undefined ? undefined : JSON.stringify(body));
      const h = {
        'X-Forwarded-For': ip ?? `10.${(nextIp >> 8) & 255}.${nextIp & 255}.1`,
        ...(raw ? {} : payload ? { 'Content-Type': 'application/json' } : {}),
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        ...headers,
      };
      nextIp += ip ? 0 : 1;
      const req = http.request({ host: '127.0.0.1', port, method, path, headers: h }, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          let json = null;
          try { json = JSON.parse(text); } catch { /* not JSON (CSV etc.) */ }
          resolve({ status: res.statusCode, headers: res.headers, text, json });
        });
      });
      req.on('error', reject);
      if (payload) req.write(payload);
      req.end();
    });

  const cookieFrom = (res) => (res.headers['set-cookie'] || [])[0]?.split(';')[0] ?? '';

  const login = async (password = ADMIN.password, ip) => {
    const res = await call('POST', '/api/auth/login', { ip, body: { email: ADMIN.email, password } });
    return { res, cookie: cookieFrom(res) };
  };

  const models = {
    User: (await import('../src/models/User.js')).User,
    Section: (await import('../src/models/Section.js')).Section,
    Amenity: (await import('../src/models/Amenity.js')).Amenity,
    GalleryItem: (await import('../src/models/GalleryItem.js')).GalleryItem,
    FloorPlan: (await import('../src/models/FloorPlan.js')).FloorPlan,
    Inquiry: (await import('../src/models/Inquiry.js')).Inquiry,
    ActivityLog: (await import('../src/models/ActivityLog.js')).ActivityLog,
  };

  const stop = async () => {
    server.close();
    const mongoose = (await import('mongoose')).default;
    await mongoose.disconnect();
    await mongod.stop();
  };

  return { call, login, cookieFrom, models, config, stop, port, baseUrl: `http://127.0.0.1:${port}` };
}

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Smallest valid PNG, for upload tests
export const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

/** multipart/form-data body with a single `file` part */
export function multipartFile({ filename, type, data }) {
  const boundary = `----test${Math.random().toString(16).slice(2)}`;
  const head = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${type}\r\n\r\n`);
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
  return { raw: Buffer.concat([head, data, tail]), headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` } };
}
