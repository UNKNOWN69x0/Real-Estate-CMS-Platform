import { useCallback, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import FormField from '../ui/FormField.jsx';
import PasswordField from '../ui/PasswordField.jsx';
import Button from '../ui/Button.jsx';
import ImageUpload from './ImageUpload.jsx';
import { AMENITY_ICON_NAMES, getAmenityIcon } from '../../utils/amenityIcons.js';
import { coerceNumbers, emptyValue, getIn, pickPayload, setIn, validateFields, withDefaults } from './formUtils.js';

const fieldsetClass = 'space-y-4 border border-brown-400/40 bg-white/60 p-4';

function FieldRenderer({ field, path, values, errors, onChange }) {
  const value = getIn(values, path);
  const error = errors[path];
  const common = { label: field.label, required: field.required, hint: field.hint, error };
  const child = (sub, subPath) => (
    <FieldRenderer key={subPath} field={sub} path={subPath} values={values} errors={errors} onChange={onChange} />
  );

  switch (field.type) {
    case 'textarea':
      return (
        <FormField
          {...common}
          as="textarea"
          rows={field.rows ?? 4}
          value={value ?? ''}
          maxLength={field.maxLength}
          onChange={(e) => onChange(path, e.target.value)}
          hint={field.maxLength ? `${String(value ?? '').length}/${field.maxLength} characters` : field.hint}
        />
      );

    case 'password':
      return (
        <PasswordField
          {...common}
          autoComplete={field.autoComplete}
          value={value ?? ''}
          onChange={(e) => onChange(path, e.target.value)}
        />
      );

    case 'number':
      return (
        <FormField
          {...common}
          type="number"
          min={field.min}
          max={field.max}
          step={field.step ?? 1}
          value={value ?? ''}
          onChange={(e) => onChange(path, e.target.value)}
        />
      );

    case 'select':
      return (
        <FormField {...common} as="select" value={value ?? ''} onChange={(e) => onChange(path, e.target.value)}>
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FormField>
      );

    case 'icon': {
      const Icon = getAmenityIcon(value);
      return (
        <div className="flex items-end gap-3">
          <FormField {...common} as="select" className="flex-1" value={value ?? ''} onChange={(e) => onChange(path, e.target.value)}>
            {AMENITY_ICON_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </FormField>
          <span aria-hidden="true" className="mb-0.5 grid size-11 shrink-0 place-items-center rounded-full bg-brown-700 text-white">
            <Icon size={20} strokeWidth={1.6} />
          </span>
        </div>
      );
    }

    case 'image':
    case 'file':
      return <ImageUpload {...common} kind={field.type} accept={field.accept} value={value} onChange={(url) => onChange(path, url)} />;

    case 'strings': {
      const items = Array.isArray(value) ? value : [];
      return (
        <fieldset className={fieldsetClass}>
          <legend className="px-1 text-xs font-semibold uppercase tracking-widest text-brown-700">{field.label}</legend>
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <FormField
                label={`${field.itemLabel ?? 'Item'} ${i + 1}`}
                className="flex-1"
                value={item}
                error={errors[`${path}.${i}`]}
                onChange={(e) => onChange(path, items.map((it, idx) => (idx === i ? e.target.value : it)))}
              />
              <Button variant="ghost" size="sm" aria-label={`Remove ${field.itemLabel ?? 'item'} ${i + 1}`} className="mt-7" onClick={() => onChange(path, items.filter((_, idx) => idx !== i))}>
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={() => onChange(path, [...items, ''])}>
            <Plus size={14} /> {field.addLabel ?? 'Add'}
          </Button>
        </fieldset>
      );
    }

    case 'group':
      return (
        <fieldset className={fieldsetClass}>
          <legend className="px-1 text-xs font-semibold uppercase tracking-widest text-brown-700">{field.label}</legend>
          {field.fields.map((sub) => child(sub, `${path}.${sub.name}`))}
        </fieldset>
      );

    case 'list': {
      const items = Array.isArray(value) ? value : [];
      const move = (from, to) => {
        const next = [...items];
        [next[from], next[to]] = [next[to], next[from]];
        onChange(path, next);
      };
      return (
        <fieldset className={fieldsetClass}>
          <legend className="px-1 text-xs font-semibold uppercase tracking-widest text-brown-700">{field.label}</legend>
          {items.map((_, i) => (
            <div key={i} className="space-y-3 border border-brown-400/40 bg-cream p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-brown-600">
                  {field.itemLabel ?? 'Item'} {i + 1}
                </p>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" aria-label="Move up" disabled={i === 0} onClick={() => move(i, i - 1)}>
                    <ArrowUp size={14} />
                  </Button>
                  <Button variant="ghost" size="sm" aria-label="Move down" disabled={i === items.length - 1} onClick={() => move(i, i + 1)}>
                    <ArrowDown size={14} />
                  </Button>
                  <Button variant="ghost" size="sm" aria-label={`Remove ${field.itemLabel ?? 'item'} ${i + 1}`} onClick={() => onChange(path, items.filter((__, idx) => idx !== i))}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
              <div className={field.inline ? 'grid gap-3 sm:grid-cols-2' : 'space-y-3'}>
                {field.fields.map((sub) => child(sub, `${path}.${i}.${sub.name}`))}
              </div>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(path, [...items, Object.fromEntries(field.fields.map((sub) => [sub.name, emptyValue(sub)]))])}
          >
            <Plus size={14} /> {field.addLabel ?? 'Add item'}
          </Button>
        </fieldset>
      );
    }

    default: // text, url
      return (
        <FormField
          {...common}
          type={field.type === 'url' ? 'url' : 'text'}
          inputMode={field.type === 'url' ? 'url' : undefined}
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          value={value ?? ''}
          onChange={(e) => onChange(path, e.target.value)}
          hint={field.type === 'url' ? field.hint ?? 'https://…, #section-id or /path' : field.hint}
        />
      );
  }
}

/**
 * Config-driven form used by the section editor and every CRUD modal.
 * `onSubmit(payload)` should return a promise and may throw an ApiError whose `errors` map
 * (field path -> message) is shown inline next to the matching inputs.
 */
export default function SectionForm({ fields, initialValues, onSubmit, onCancel, submitLabel = 'Save', requireDirty = false, children }) {
  const [values, setValues] = useState(() => withDefaults(fields, initialValues));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const baseline = useRef(JSON.stringify(values));
  const formRef = useRef(null);

  const dirty = JSON.stringify(values) !== baseline.current;

  const handleChange = useCallback((path, value) => {
    setValues((prev) => setIn(prev, path, value));
    setFormError(''); // the banner belongs to the last submit; per-field errors stay until fixed
    setErrors((prev) => {
      if (!prev[path]) return prev;
      const { [path]: _removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const focusFirstError = () =>
    requestAnimationFrame(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus());

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    const found = validateFields(fields, values);
    setErrors(found);
    if (Object.keys(found).length) {
      setFormError('Please fix the highlighted fields.');
      focusFirstError();
      return;
    }

    setSaving(true);
    try {
      await onSubmit(pickPayload(fields, coerceNumbers(fields, values)));
      baseline.current = JSON.stringify(values);
    } catch (err) {
      if (err.errors) {
        setErrors(err.errors);
        setFormError('Please fix the highlighted fields.');
        focusFirstError();
      } else {
        setFormError(err.message || 'Something went wrong');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-5">
      {fields.map((field) => (
        <FieldRenderer key={field.name} field={field} path={field.name} values={values} errors={errors} onChange={handleChange} />
      ))}
      {children}
      {formError && (
        <p role="alert" className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {formError}
        </p>
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={saving || (requireDirty && !dirty)}>
          {saving ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
