import { useId } from 'react';

// Label + input/textarea/select + inline error, wired up for screen readers.
// Pass `as="select"` with <option> children for a dropdown.
export default function FormField({ label, error, hint, required, as: Tag = 'input', className = '', children, ...props }) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-brown-700">
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <Tag
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`w-full border bg-white px-3.5 py-2.5 text-sm text-brown-900 placeholder:text-brown-400/70 focus:border-brown-600 focus:outline-none focus:ring-1 focus:ring-brown-600 ${
          error ? 'border-red-600' : 'border-brown-400/50'
        }`}
        {...props}
      >
        {children}
      </Tag>
      {hint && !error && <p className="mt-1 text-xs text-brown-600">{hint}</p>}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
