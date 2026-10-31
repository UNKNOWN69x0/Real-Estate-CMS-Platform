// The app exactly as deployed: NODE_ENV=production, behind Vercel's rewrite and Render's load balancer.
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { ADMIN, startApi } from '../test-utils/api.js';

const ORIGIN = 'https://one-chembur.vercel.app';
let api;

before(async () => {
  api = await startApi({
    env: {
      NODE_ENV: 'production',
      JWT_SECRET: 'prod-test-secret-prod-test-secret-prod-test-1234',
      CLIENT_URL: ORIGIN,
      TRUST_PROXY: '', // production default (2 hops)
    },
  });
});
after(() => api.stop());

// Two proxies in front of the app: "<visitor>, <vercel egress>"
const viaProxy = (visitorIp, extra = {}) => ({ ip: `${visitorIp}, 198.51.100.7`, headers: { 'X-Forwarded-Proto': 'https', Origin: ORIGIN, ...extra } });

describe('production configuration', () => {
  test('defaults: two trusted proxies, SameSite=Lax cookies', () => {
    assert.equal(api.config.trustProxy, 2);
    assert.equal(api.config.cookieSameSite, 'lax');
    assert.equal(api.config.isProd, true);
  });

  test('startup checks refuse an unsafe production config', async () => {
    const { assertRequiredEnv, env } = await import('../src/config/env.js');
    assert.doesNotThrow(() => assertRequiredEnv());
    const saved = { urls: env.clientUrls, secret: env.jwtSecret, client: process.env.CLIENT_URL };
    const restore = () => { env.clientUrls = saved.urls; env.jwtSecret = saved.secret; process.env.CLIENT_URL = saved.client; };
    try {
      delete process.env.CLIENT_URL;
      assert.throws(() => assertRequiredEnv(), /CLIENT_URL/);
      restore();
      env.clientUrls = ['http://example.com'];
      assert.throws(() => assertRequiredEnv(), /https:\/\//);
      restore();
      env.jwtSecret = 'short';
      assert.throws(() => assertRequiredEnv(), /32 characters/);
    } finally {
      restore();
    }
  });
});

describe('cookies and caching', () => {
  test('the session cookie is HttpOnly, Secure and SameSite=Lax, and logout clears it identically', async () => {
    const res = await api.call('POST', '/api/auth/login', { ...viaProxy('203.0.113.50'), body: { email: ADMIN.email, password: ADMIN.password } });
    assert.equal(res.status, 200);
    const cookie = res.headers['set-cookie'][0];
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /; Secure/i);
    assert.match(cookie, /SameSite=Lax/i);

    const out = await api.call('POST', '/api/auth/logout', { ...viaProxy('203.0.113.50'), cookie: cookie.split(';')[0] });
    const cleared = out.headers['set-cookie'][0];
    assert.match(cleared, /token=;/);
    assert.match(cleared, /Secure/i);
    assert.match(cleared, /SameSite=Lax/i);
  });

  test('errors carry no stack trace in production', async () => {
    const res = await api.call('GET', '/api/nope');
    assert.equal(res.status, 404);
    assert.ok(!('stack' in res.json));
  });
});

describe('CORS and the origin guard', () => {
  test('allows the CLIENT_URL origin with credentials and no other', async () => {
    const ok = await api.call('OPTIONS', '/api/auth/login', { headers: { Origin: ORIGIN, 'Access-Control-Request-Method': 'POST' } });
    assert.equal(ok.headers['access-control-allow-origin'], ORIGIN);
    assert.equal(ok.headers['access-control-allow-credentials'], 'true');
    const evil = await api.call('OPTIONS', '/api/auth/login', { headers: { Origin: 'https://evil.example', 'Access-Control-Request-Method': 'POST' } });
    assert.equal(evil.headers['access-control-allow-origin'], undefined);
  });

  test('state-changing requests from other origins are blocked, from CLIENT_URL accepted', async () => {
    const body = { name: 'Origin Test', phone: '9876543210' };
    assert.equal((await api.call('POST', '/api/inquiries', { ...viaProxy('203.0.113.60', { Origin: 'https://evil.example' }), body })).status, 403);
    assert.equal((await api.call('POST', '/api/inquiries', { ...viaProxy('203.0.113.61'), body })).status, 201);
  });
});

describe('rate limits are per visitor behind two proxies', () => {
  test('one visitor hitting the enquiry limit does not affect another', async () => {
    const body = { name: 'Visitor', phone: '9876543210' };
    const codes = [];
    for (let i = 0; i < 11; i += 1) codes.push((await api.call('POST', '/api/inquiries', { ...viaProxy('203.0.113.9'), body })).status);
    assert.deepEqual(codes, [...Array(10).fill(201), 429]);
    assert.equal((await api.call('POST', '/api/inquiries', { ...viaProxy('203.0.113.10'), body })).status, 201);
  });

  test('login attempts are limited per visitor, too', async () => {
    const codes = [];
    for (let i = 0; i < 11; i += 1) codes.push((await api.call('POST', '/api/auth/login', { ...viaProxy('203.0.113.77'), body: { email: ADMIN.email, password: 'wrong' } })).status);
    assert.deepEqual(codes, [...Array(10).fill(401), 429]);
    assert.equal((await api.call('POST', '/api/auth/login', { ...viaProxy('203.0.113.78'), body: { email: ADMIN.email, password: ADMIN.password } })).status, 200);
  });
});
