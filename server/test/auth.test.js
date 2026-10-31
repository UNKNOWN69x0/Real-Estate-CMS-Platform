import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ADMIN, startApi, wait } from '../test-utils/api.js';

let api;
const NEW_PASSWORD = 'Brand-New-Passw0rd!';
const THIRD_PASSWORD = 'Third-Passw0rd-2026';
const change = (cookie, body, ip) => api.call('POST', '/api/auth/change-password', { cookie, body, ip });
const good = { currentPassword: ADMIN.password, newPassword: NEW_PASSWORD, confirmPassword: NEW_PASSWORD };

// Everything the server prints is captured, so we can prove no password ever reaches the logs
let captured = '';
const originalWrites = [];
before(async () => {
  for (const stream of [process.stdout, process.stderr]) {
    const write = stream.write.bind(stream);
    originalWrites.push([stream, write]);
    stream.write = (chunk, ...rest) => {
      captured += String(chunk);
      return write(chunk, ...rest);
    };
  }
  api = await startApi({ env: { LOG_REQUESTS: 'true', NODE_ENV: 'development' } });
});
after(async () => {
  for (const [stream, write] of originalWrites) stream.write = write;
  await api.stop();
});

describe('login and sessions', () => {
  test('logs in with the seeded credentials and sets an httpOnly, SameSite=Lax cookie', async () => {
    const { res } = await api.login();
    assert.equal(res.status, 200);
    assert.equal(res.json.data.email, ADMIN.email);
    assert.ok(!res.text.includes('passwordHash') && !res.text.includes('$2b$'));
    const setCookie = res.headers['set-cookie'][0];
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /SameSite=Lax/i);
    assert.doesNotMatch(setCookie, /Secure/i, 'Secure is only for production over HTTPS');
  });

  test('wrong password and unknown email get the same 401 message', async () => {
    const wrong = await api.call('POST', '/api/auth/login', { body: { email: ADMIN.email, password: 'wrong-password' } });
    const unknown = await api.call('POST', '/api/auth/login', { body: { email: 'nobody@example.com', password: 'wrong-password' } });
    assert.equal(wrong.status, 401);
    assert.equal(unknown.status, 401);
    assert.equal(wrong.json.message, unknown.json.message);
  });

  test('/me works with the cookie, 401s without it, and logout clears it', async () => {
    const { cookie } = await api.login();
    assert.equal((await api.call('GET', '/api/auth/me', { cookie })).status, 200);
    assert.equal((await api.call('GET', '/api/auth/me')).status, 401);
    const out = await api.call('POST', '/api/auth/logout', { cookie });
    assert.match(out.headers['set-cookie'][0], /token=;/);
  });

  test('login is rate limited per visitor (10 attempts, then 429)', async () => {
    const codes = [];
    for (let i = 0; i < 11; i += 1) {
      codes.push((await api.call('POST', '/api/auth/login', { ip: '10.9.9.9', body: { email: ADMIN.email, password: 'nope-nope' } })).status);
    }
    assert.deepEqual(codes, [...Array(10).fill(401), 429]);
    assert.equal((await api.login(ADMIN.password, '10.9.9.10')).res.status, 200, 'another visitor is unaffected');
  });
});

describe('change password', () => {
  test('requires a session', async () => {
    assert.equal((await change('', good)).status, 401);
  });

  test('rejects bad input with field-level errors and changes nothing', async () => {
    const { cookie } = await api.login();
    const cases = [
      [{ ...good, currentPassword: 'Not-The-Password' }, 'currentPassword', /incorrect/],
      [{ ...good, confirmPassword: 'Something-Else-123' }, 'confirmPassword', /do not match/],
      [{ currentPassword: ADMIN.password, newPassword: 'short123', confirmPassword: 'short123' }, 'newPassword', /at least 10/],
      [{ currentPassword: ADMIN.password, newPassword: ADMIN.password, confirmPassword: ADMIN.password }, 'newPassword', /different/],
      [{ currentPassword: ADMIN.password, newPassword: 'x'.repeat(73), confirmPassword: 'x'.repeat(73) }, 'newPassword', /72 bytes/],
      [{ currentPassword: ADMIN.password, newPassword: 'é'.repeat(37), confirmPassword: 'é'.repeat(37) }, 'newPassword', /72 bytes/],
    ];
    for (const [body, field, pattern] of cases) {
      const res = await change(cookie, body);
      assert.equal(res.status, 400, field);
      assert.match(res.json.errors[field], pattern);
    }
    const empty = await change(cookie, {});
    assert.ok(empty.json.errors.currentPassword && empty.json.errors.newPassword && empty.json.errors.confirmPassword);

    assert.equal(await api.models.ActivityLog.countDocuments({ summary: 'Changed password' }), 0, 'rejected attempts are not logged');
    assert.equal((await api.login()).res.status, 200, 'the password is unchanged');
  });

  test('a valid change re-hashes, logs safely, and signs out every older session', async () => {
    const oldSession = (await api.login()).cookie;
    await wait(1100); // JWT issue times are whole seconds

    const res = await change(oldSession, good);
    assert.equal(res.status, 200);
    assert.deepEqual(res.json, { message: 'Password changed' });
    assert.ok(!res.text.includes(NEW_PASSWORD) && !res.text.includes('$2b$'), 'response carries no password or hash');
    const freshCookie = api.cookieFrom(res);

    const user = await api.models.User.findOne({ email: ADMIN.email }).select('+passwordHash').lean();
    assert.match(user.passwordHash, /^\$2[aby]\$12\$/, 'bcrypt cost 12, same as the seed');
    assert.ok(user.passwordChangedAt);

    assert.equal((await api.call('GET', '/api/auth/me', { cookie: freshCookie })).status, 200, 'this device stays signed in');
    assert.equal((await api.call('GET', '/api/auth/me', { cookie: oldSession })).status, 401, 'other sessions are signed out');
    assert.equal((await api.login(ADMIN.password)).res.status, 401, 'old password no longer works');
    assert.equal((await api.login(NEW_PASSWORD)).res.status, 200, 'new password works');

    await wait(150);
    const entry = await api.models.ActivityLog.findOne({ summary: 'Changed password' }).lean();
    assert.equal(entry.action, 'update');
    assert.equal(entry.entity, 'user');
    assert.equal(entry.userEmail, ADMIN.email);
    const serialised = JSON.stringify(entry);
    for (const secret of [ADMIN.password, NEW_PASSWORD, user.passwordHash]) assert.ok(!serialised.includes(secret));
  });

  test('is rate limited (5 attempts per 15 minutes per visitor)', async () => {
    const { cookie } = await api.login(NEW_PASSWORD);
    const bad = { currentPassword: 'wrong-wrong-wrong', newPassword: THIRD_PASSWORD, confirmPassword: THIRD_PASSWORD };
    const codes = [];
    for (let i = 0; i < 6; i += 1) codes.push((await change(cookie, bad, '10.8.8.8')).status);
    assert.deepEqual(codes, [400, 400, 400, 400, 400, 429]);
  });
});

describe('reset-admin script', () => {
  const run = (extraEnv) =>
    spawnSync(process.execPath, ['src/seed/resetAdmin.js'], {
      cwd: fileURLToPath(new URL('..', import.meta.url)),
      env: { ...process.env, ...extraEnv },
      encoding: 'utf8',
      timeout: 60_000,
    });
  const EMERGENCY = 'Emergency-Reset-Passw0rd';

  test('fails clearly without ADMIN_NEW_PASSWORD and rejects weak passwords without echoing them', () => {
    const missing = run({ ADMIN_NEW_PASSWORD: '' });
    assert.equal(missing.status, 1);
    assert.match(missing.stderr, /ADMIN_NEW_PASSWORD/);
    const weak = run({ ADMIN_NEW_PASSWORD: 'tooshort' });
    assert.equal(weak.status, 1);
    assert.match(weak.stderr, /at least 10/);
    assert.ok(!(weak.stdout + weak.stderr).includes('tooshort'));
  });

  test('sets the password, signs out all sessions, audits it, and never prints the password', async () => {
    const before = (await api.login(NEW_PASSWORD)).cookie;
    await wait(1100);
    const result = run({ ADMIN_NEW_PASSWORD: EMERGENCY });
    assert.equal(result.status, 0, result.stderr);
    assert.ok(!(result.stdout + result.stderr).includes(EMERGENCY));

    assert.equal((await api.login(EMERGENCY)).res.status, 200);
    assert.equal((await api.login(NEW_PASSWORD)).res.status, 401);
    assert.equal((await api.call('GET', '/api/auth/me', { cookie: before })).status, 401);
    const audit = await api.models.ActivityLog.findOne({ summary: 'Reset password via reset-admin script' }).lean();
    assert.ok(audit && !JSON.stringify(audit).includes(EMERGENCY));
  });
});

test('no password ever appeared in anything the server printed', () => {
  for (const secret of [ADMIN.password, NEW_PASSWORD, THIRD_PASSWORD, 'Emergency-Reset-Passw0rd', 'Not-The-Password', 'Something-Else-123']) {
    assert.ok(!captured.includes(secret), 'a password reached the logs');
  }
  assert.ok(captured.includes('POST /api/auth/change-password'), 'request logging was actually active for this check');
});
