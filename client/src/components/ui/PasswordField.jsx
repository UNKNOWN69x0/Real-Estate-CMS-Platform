import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// Password input with a show/hide toggle, inline error and the same look as FormField.
export default function PasswordField({ label, error, hint, required, className = '', ...props }) {
  const id = useId();
  const errorId = `${id}-error`;
  const [visible, setVisible] = useState(false);

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-brown-700">
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          spellCheck={false}
          autoCapitalize="off"
          className={`w-full border bg-white py-2.5 pl-3.5 pr-11 text-sm text-brown-900 focus:border-brown-600 focus:outline-none focus:ring-1 focus:ring-brown-600 ${
            error ? 'border-red-600' : 'border-brown-400/50'
          }`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 grid w-10 place-items-center text-brown-600 hover:text-brown-900 focus-visible:outline-2 focus-visible:outline-gold"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {hint && !error && <p className="mt-1 text-xs text-brown-600">{hint}</p>}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
