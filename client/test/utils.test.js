import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { safeHref } from '../src/utils/safeUrl.js';
import { parseVideoUrl } from '../src/utils/videoEmbed.js';
import { optimizeImage } from '../src/utils/image.js';
import { coerceNumbers, emptyValue, getIn, pickPayload, setIn, validateFields, withDefaults } from '../src/components/admin/formUtils.js';

describe('safeHref: CMS links can never become javascript:/data: URLs', () => {
  test('allows http(s), anchors and site paths', () => {
    for (const ok of ['https://example.com/a.pdf', 'http://example.com', '#about', '/privacy', ' https://example.com ']) {
      assert.notEqual(safeHref(ok), '', ok);
    }
  });
  test('rejects everything else', () => {
    for (const bad of ['javascript:alert(1)', ' JaVaScRiPt:alert(1)', 'data:text/html,x', '//evil.com', 'mailto:a@b.c', 'ftp://x', '', undefined, null, 42]) {
      assert.equal(safeHref(bad), '', String(bad));
    }
  });
});

describe('parseVideoUrl', () => {
  test('turns YouTube and Vimeo links into embeddable players', () => {
    assert.deepEqual(parseVideoUrl('https://www.youtube.com/watch?v=abc123'), { type: 'iframe', src: 'https://www.youtube-nocookie.com/embed/abc123?autoplay=1&rel=0' });
    assert.equal(parseVideoUrl('https://youtu.be/abc123').type, 'iframe');
    assert.equal(parseVideoUrl('https://vimeo.com/123456789').src, 'https://player.vimeo.com/video/123456789?autoplay=1');
  });
  test('plays direct video files inline and opens other http(s) links externally', () => {
    assert.equal(parseVideoUrl('https://cdn.example.com/tour.mp4').type, 'file');
    assert.equal(parseVideoUrl('https://example.com/tour').type, 'external');
  });
  test('rejects anything that is not a valid http(s) URL', () => {
    for (const bad of ['javascript:alert(1)', 'data:text/html,x', 'not a url', 'ftp://x.com/a.mp4']) assert.equal(parseVideoUrl(bad), null, bad);
  });
});

describe('optimizeImage', () => {
  const upload = 'https://res.cloudinary.com/demo/image/upload/v123/one-chembur/photo.jpg';
  test('asks Cloudinary for auto format, auto quality and a bounded width', () => {
    assert.equal(optimizeImage(upload, { width: 800 }), 'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800,c_limit/v123/one-chembur/photo.jpg');
    assert.equal(optimizeImage(upload), 'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/v123/one-chembur/photo.jpg');
  });
  test('is idempotent and leaves other URLs and non-strings alone', () => {
    const once = optimizeImage(upload, { width: 800 });
    assert.equal(optimizeImage(once, { width: 800 }), once);
    assert.equal(optimizeImage('https://placehold.co/800x600', { width: 800 }), 'https://placehold.co/800x600');
    assert.equal(optimizeImage('https://res.cloudinary.com/demo/raw/upload/v1/doc.pdf', { width: 800 }), 'https://res.cloudinary.com/demo/raw/upload/v1/doc.pdf');
    assert.equal(optimizeImage('', { width: 800 }), '');
    assert.equal(optimizeImage(undefined), undefined);
  });
});

describe('form engine (formUtils)', () => {
  test('getIn / setIn address nested paths immutably', () => {
    const original = { content: { stats: [{ value: '1' }] } };
    const next = setIn(original, 'content.stats.0.value', '2');
    assert.equal(getIn(next, 'content.stats.0.value'), '2');
    assert.equal(getIn(original, 'content.stats.0.value'), '1', 'the original object is not mutated');
    assert.equal(getIn(original, 'content.missing.deep'), undefined);
  });

  test('withDefaults makes every configured field controllable', () => {
    const fields = [
      { name: 'title', type: 'text' },
      { name: 'content.items', type: 'list', fields: [{ name: 'label', type: 'text' }] },
      { name: 'content.cta', type: 'group', fields: [{ name: 'label', type: 'text' }, { name: 'href', type: 'url' }] },
    ];
    const filled = withDefaults(fields, { title: 'Hi' });
    assert.equal(filled.title, 'Hi');
    assert.deepEqual(filled.content.items, []);
    assert.deepEqual(filled.content.cta, { label: '', href: '' });
    assert.deepEqual(emptyValue(fields[2]), { label: '', href: '' });
  });

  test('validateFields reports required, URL, number and password rules at the right paths', () => {
    const fields = [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'link', type: 'url' },
      { name: 'photo', type: 'image' },
      { name: 'order', type: 'number', integer: true, min: 0 },
      { name: 'items', type: 'list', fields: [{ name: 'minutes', type: 'number', required: true, label: 'Minutes' }] },
      { name: 'newPassword', type: 'password', minLength: 10, differsFrom: 'currentPassword' },
      { name: 'confirm', type: 'password', matches: 'newPassword', matchesMessage: 'Passwords do not match' },
      { name: 'key', type: 'text', pattern: '^[a-z]+$', patternMessage: 'letters only' },
    ];
    const errors = validateFields(fields, {
      title: '  ', link: 'javascript:alert(1)', photo: 'not-a-url', order: '1.5', items: [{ minutes: '' }],
      newPassword: 'short', currentPassword: 'short', confirm: 'other', key: 'Bad Key',
    });
    assert.equal(errors.title, 'Title is required');
    assert.match(errors.link, /http\(s\)/);
    assert.match(errors.photo, /http\(s\)/);
    assert.equal(errors.order, 'Must be a whole number');
    assert.equal(errors['items.0.minutes'], 'Minutes is required');
    assert.match(errors.newPassword, /at least 10/);
    assert.equal(errors.confirm, 'Passwords do not match');
    assert.equal(errors.key, 'letters only');

    const clean = validateFields(fields, { title: 'Ok', link: '#about', photo: 'https://x.test/a.png', order: '3', items: [{ minutes: '5' }], newPassword: 'a-long-enough-one', currentPassword: 'old', confirm: 'a-long-enough-one', key: 'good' });
    assert.deepEqual(clean, {});
  });

  test('passwords are never trimmed or altered by validation', () => {
    const field = { name: 'p', type: 'password', required: true, minLength: 10 };
    assert.deepEqual(validateFields([field], { p: '          x' }), {}, 'leading spaces count towards length');
  });

  test('coerceNumbers converts number inputs, including inside lists, and leaves blanks alone', () => {
    const fields = [
      { name: 'order', type: 'number' },
      { name: 'items', type: 'list', fields: [{ name: 'minutes', type: 'number' }] },
    ];
    const out = coerceNumbers(fields, { order: '7', items: [{ minutes: '12' }, { minutes: '' }] });
    assert.equal(out.order, 7);
    assert.deepEqual(out.items, [{ minutes: 12 }, { minutes: '' }]);
  });

  test('pickPayload sends only the keys the form edits', () => {
    const fields = [{ name: 'title' }, { name: 'content.a' }, { name: 'content.b' }];
    assert.deepEqual(pickPayload(fields, { _id: '1', __v: 0, title: 't', content: { a: 1 }, updatedAt: 'x' }), { title: 't', content: { a: 1 } });
  });
});
