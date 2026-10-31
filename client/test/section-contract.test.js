// Keeps the admin editor, the public site and the seed data in agreement about which sections exist and what they hold.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { sections as seeded } from '../../server/src/seed/content.js';
import { sectionConfigs, customSectionConfig, getSectionConfig, SECTION_KEY_PATTERN } from '../src/admin/sectionConfigs.js';
import { BUILT_IN_SECTION_KEYS, customSectionId, isBuiltInSection } from '../src/utils/sectionKeys.js';
import { getIn } from '../src/components/admin/formUtils.js';

const FIELD_TYPES = new Set(['text', 'textarea', 'url', 'number', 'select', 'icon', 'image', 'file', 'strings', 'list', 'group', 'password']);

function* walk(fields, prefix = '') {
  for (const field of fields) {
    yield { field, path: prefix + field.name };
    if (field.fields) yield* walk(field.fields, `${prefix}${field.name}.`);
  }
}

describe('section registry', () => {
  test('the public site, the editor configs and the seed all list the same built-in sections', () => {
    assert.deepEqual([...BUILT_IN_SECTION_KEYS].sort(), Object.keys(sectionConfigs).sort());
    assert.deepEqual([...BUILT_IN_SECTION_KEYS].sort(), seeded.map((s) => s.key).sort());
  });

  test('unknown keys are custom sections with their own editor; built-ins are protected', () => {
    assert.equal(getSectionConfig('offers'), customSectionConfig);
    assert.ok(isBuiltInSection('hero') && !isBuiltInSection('offers'));
    assert.equal(customSectionId('offers'), 'section-offers', 'ids cannot clash with built-in anchors');
  });

  test('the new-section key pattern matches the server rule', () => {
    const re = new RegExp(SECTION_KEY_PATTERN);
    for (const ok of ['offers', 'neighbourhood-2', 'ab']) assert.ok(re.test(ok), ok);
    for (const bad of ['Offers', 'a', '1abc', 'has space', 'x'.repeat(41)]) assert.ok(!re.test(bad), bad);
  });
});

describe('every editor config is well formed', () => {
  for (const [key, config] of Object.entries({ ...sectionConfigs, custom: customSectionConfig })) {
    test(`${key}: valid field types, unique top-level names, complete lists and groups`, () => {
      const names = new Set();
      for (const { field, path } of walk(config.fields)) {
        assert.ok(FIELD_TYPES.has(field.type), `${key}.${path} has unknown type ${field.type}`);
        assert.ok(field.name, `${key}: a field has no name`);
        if (!path.includes('.') || config.fields.includes(field)) {
          assert.ok(!names.has(field.name), `${key}: duplicate field ${field.name}`);
          names.add(field.name);
        }
        if (field.type === 'list' || field.type === 'group') assert.ok(Array.isArray(field.fields) && field.fields.length, `${key}.${path} needs sub-fields`);
        if (field.type === 'select') assert.ok(field.options?.length, `${key}.${path} needs options`);
      }
    });
  }
});

describe('the editor covers the content the seed ships', () => {
  for (const section of seeded) {
    test(`${section.key}: every editable field exists in the seeded document`, () => {
      const config = sectionConfigs[section.key];
      for (const field of config.fields) {
        assert.notEqual(getIn(section, field.name), undefined, `config edits "${field.name}" but the seeded ${section.key} section has no such field`);
      }
    });

    test(`${section.key}: every seeded content key is editable (or is internal)`, () => {
      const editable = new Set(sectionConfigs[section.key].fields.map((f) => f.name.replace(/^content\./, '').split('.')[0]));
      const internal = new Set(['logoText', 'secondaryCta']); // logoText is unused legacy copy; secondaryCta.action is fixed
      for (const contentKey of Object.keys(section.content ?? {})) {
        assert.ok(editable.has(contentKey) || internal.has(contentKey), `seeded ${section.key}.content.${contentKey} cannot be edited in the admin`);
      }
    });
  }
});
