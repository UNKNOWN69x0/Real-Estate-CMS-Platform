import { safeHref } from '../../utils/safeUrl.js';

/*
 * Field config shape (shared by the section editor and every CRUD form):
 *   { name, label, type, required?, hint?, maxLength?, min?, max?, options?, fields?, itemLabel?, addLabel?, accept? }
 *   type: text | textarea | url | number | select | icon | image | file | strings | list | group
 * Top-level names may be dotted ("content.location"). Inside list/group, sub-field names are relative.
 * Values live in one nested object and are addressed by dotted paths ("content.stats.0.value"); the server
 * reports validation errors with the same paths, so they land on the right input.
 */

export const getIn = (obj, path) => path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);

export function setIn(obj, path, value) {
  const keys = path.split('.');
  const root = Array.isArray(obj) ? [...obj] : { ...obj };
  let cursor = root;
  keys.slice(0, -1).forEach((key) => {
    const next = cursor[key];
    cursor[key] = Array.isArray(next) ? [...next] : { ...(next ?? {}) };
    cursor = cursor[key];
  });
  cursor[keys.at(-1)] = value;
  return root;
}

export function emptyValue(field) {
  switch (field.type) {
    case 'list':
    case 'strings':
      return [];
    case 'group':
      return Object.fromEntries(field.fields.map((sub) => [sub.name, emptyValue(sub)]));
    default:
      return '';
  }
}

/** Fills in missing arrays/objects/strings so every field is always controllable. */
export function withDefaults(fields, values = {}) {
  let result = values;
  fields.forEach((field) => {
    const current = getIn(result, field.name);
    if (current === undefined || current === null) {
      result = setIn(result, field.name, emptyValue(field));
    } else if (field.type === 'group') {
      result = setIn(result, field.name, { ...withDefaults(field.fields, current) });
    }
  });
  return result;
}

const isBlank = (value) => value == null || String(value).trim() === '';

function validateField(field, values, path, errors) {
  const value = getIn(values, path);
  const label = field.label || field.name;

  if (field.type === 'list') {
    (Array.isArray(value) ? value : []).forEach((_, i) =>
      field.fields.forEach((sub) => validateField(sub, values, `${path}.${i}.${sub.name}`, errors)),
    );
    return;
  }
  if (field.type === 'group') {
    field.fields.forEach((sub) => validateField(sub, values, `${path}.${sub.name}`, errors));
    return;
  }
  if (field.type === 'strings') {
    (Array.isArray(value) ? value : []).forEach((item, i) => {
      if (isBlank(item)) errors[`${path}.${i}`] = 'Fill this in or remove it';
    });
    return;
  }

  if (field.required && isBlank(value)) {
    errors[path] = `${label} is required`;
  } else if (!isBlank(value)) {
    if (field.type === 'url' && !safeHref(value)) errors[path] = 'Must be an http(s) URL, a #anchor or a /path';
    if ((field.type === 'image' || field.type === 'file') && !/^https?:\/\//i.test(String(value).trim())) {
      errors[path] = 'Must be an http(s) URL — upload a file or paste a link';
    }
    if (field.type === 'number') {
      const n = Number(value);
      if (Number.isNaN(n)) errors[path] = 'Must be a number';
      else if (field.integer && !Number.isInteger(n)) errors[path] = 'Must be a whole number';
      else if (field.min != null && n < field.min) errors[path] = `Must be ${field.min} or more`;
      else if (field.max != null && n > field.max) errors[path] = `Must be ${field.max} or less`;
    }
    if (field.maxLength && String(value).length > field.maxLength) {
      errors[path] = `Keep this under ${field.maxLength} characters`;
    }
    // Password rules (values are never trimmed or altered)
    if (!errors[path] && field.minLength && String(value).length < field.minLength) {
      errors[path] = `Use at least ${field.minLength} characters`;
    }
    if (!errors[path] && field.maxBytes && new TextEncoder().encode(String(value)).length > field.maxBytes) {
      errors[path] = `Must be ${field.maxBytes} bytes or fewer (shorter if it uses emoji or accented characters)`;
    }
    if (!errors[path] && field.differsFrom && value === getIn(values, field.differsFrom)) {
      errors[path] = field.differsMessage ?? 'Must be different from the current value';
    }
    if (!errors[path] && field.matches && value !== getIn(values, field.matches)) {
      errors[path] = field.matchesMessage ?? 'Values do not match';
    }
  }
}

export function validateFields(fields, values) {
  const errors = {};
  fields.forEach((field) => validateField(field, values, field.name, errors));
  return errors;
}

/** Number inputs hold strings while editing; send real numbers (blank stays blank). */
export function coerceNumbers(fields, values) {
  let result = values;
  const walk = (field, path) => {
    const value = getIn(result, path);
    if (field.type === 'number' && !isBlank(value)) result = setIn(result, path, Number(value));
    if (field.type === 'list') (value ?? []).forEach((_, i) => field.fields.forEach((sub) => walk(sub, `${path}.${i}.${sub.name}`)));
    if (field.type === 'group') field.fields.forEach((sub) => walk(sub, `${path}.${sub.name}`));
  };
  fields.forEach((field) => walk(field, field.name));
  return result;
}

/** Only the top-level keys the form edits (drops _id, __v, timestamps...). */
export function pickPayload(fields, values) {
  const keys = [...new Set(fields.map((field) => field.name.split('.')[0]))];
  return Object.fromEntries(keys.map((key) => [key, values[key]]));
}
