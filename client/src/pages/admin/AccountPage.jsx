import { useState } from 'react';
import { adminApi } from '../../api/admin.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import PageHeader from '../../components/admin/PageHeader.jsx';
import SectionForm from '../../components/admin/SectionForm.jsx';

// Rules mirror the server (config/password.js): 10+ characters, at most 72 bytes, different from the current one
const fields = [
  { name: 'currentPassword', label: 'Current password', type: 'password', required: true, autoComplete: 'current-password' },
  {
    name: 'newPassword',
    label: 'New password',
    type: 'password',
    required: true,
    autoComplete: 'new-password',
    minLength: 10,
    maxBytes: 72,
    differsFrom: 'currentPassword',
    differsMessage: 'New password must be different from the current one',
    hint: 'At least 10 characters. A few random words make a strong, memorable password.',
  },
  {
    name: 'confirmPassword',
    label: 'Confirm new password',
    type: 'password',
    required: true,
    autoComplete: 'new-password',
    matches: 'newPassword',
    matchesMessage: 'Passwords do not match',
  },
];

const EMPTY = { currentPassword: '', newPassword: '', confirmPassword: '' };

export default function AccountPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [formKey, setFormKey] = useState(0); // bumping it remounts the form, which clears every field

  const save = async (payload) => {
    await adminApi.changePassword(payload);
    toast.success('Password changed. You are still signed in on this device.');
    setFormKey((k) => k + 1);
  };

  return (
    <>
      <PageHeader title="Account" description={user ? `Signed in as ${user.email}` : 'Manage your admin account.'} />

      <section className="max-w-md border border-brown-400/30 bg-white p-4 sm:p-6" aria-labelledby="change-password-heading">
        <h2 id="change-password-heading" className="text-lg font-semibold text-brown-700">
          Change password
        </h2>
        <p className="mb-5 mt-1 text-sm text-brown-600">You stay signed in here; any other device that was signed in is signed out.</p>

        <SectionForm key={formKey} fields={fields} initialValues={EMPTY} onSubmit={save} submitLabel="Change password">
          {/* Lets password managers attach the new password to the right account */}
          <input type="text" name="username" autoComplete="username" value={user?.email ?? ''} readOnly tabIndex={-1} aria-hidden="true" className="sr-only" />
        </SectionForm>
      </section>
    </>
  );
}
