import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import FormField from '../../components/ui/FormField.jsx';
import Button from '../../components/ui/Button.jsx';

export default function LoginPage() {
  const { status, login } = useAuth();
  const location = useLocation();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Where to go once signed in: the page that sent us here, else the dashboard
  const from = location.state?.from;
  const redirectTo = typeof from === 'string' && from.startsWith('/admin') ? from : '/admin';

  // Signed in (already, or just now): render-time redirect, so a fresh login lands on `redirectTo` too
  if (status === 'authed') return <Navigate to={redirectTo} replace />;

  const bind = (field) => ({
    name: field,
    value: values[field],
    error: errors[field],
    onChange: (event) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
  });

  const onSubmit = async (event) => {
    event.preventDefault();
    const found = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) found.email = 'Enter a valid email';
    if (!values.password) found.password = 'Password is required';
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      await login(values.email.trim(), values.password);
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      else setFormError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-svh place-items-center bg-gradient-to-br from-brown-600 to-brown-800 px-4">
      <div className="w-full max-w-sm bg-cream p-6 shadow-2xl sm:p-8">
        <p className="text-[0.55rem] font-medium uppercase tracking-[0.25em] text-brown-600">Codename</p>
        <p className="-my-0.5 text-4xl font-bold lowercase leading-none text-brown-700">one</p>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-brown-700">Chembur · Admin</p>

        <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
          <FormField label="Email" type="email" autoComplete="username" required {...bind('email')} />
          <FormField label="Password" type="password" autoComplete="current-password" required {...bind('password')} />
          {formError && (
            <p role="alert" className="bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </main>
  );
}
