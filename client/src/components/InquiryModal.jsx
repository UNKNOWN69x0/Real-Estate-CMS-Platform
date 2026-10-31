import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import Modal from './ui/Modal.jsx';
import FormField from './ui/FormField.jsx';
import Button from './ui/Button.jsx';
import { useSection } from '../context/SectionsContext.jsx';
import { submitInquiry } from '../api/public.js';

// Mirrors the server's Zod rules so most mistakes are caught before the request
function validate({ name, phone, email }) {
  const errors = {};
  if (name.trim().length < 2) errors.name = 'Please enter your name';
  if (!/^\+?[\d\s-]{7,18}$/.test(phone.trim())) errors.phone = 'Enter a valid phone number';
  if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'Enter a valid email';
  return errors;
}

// Editable in the admin (Navbar section); these apply when a field is left empty or the API is down
const DEFAULT_COPY = {
  enquiryTitle: 'Enquire Now',
  enquiryIntro: 'Share your details and our team will get back to you shortly.',
  enquirySubmitLabel: 'Submit enquiry',
  enquirySuccessTitle: 'Enquiry received',
};

// `website` is a honeypot: invisible to people, tempting to bots (the API discards anything that fills it)
const EMPTY = { name: '', phone: '', email: '', message: '', website: '' };

function InquiryForm({ source, onClose, copy }) {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const bind = (field) => ({
    name: field,
    value: values[field],
    error: errors[field],
    onChange: (event) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
  });

  const onSubmit = async (event) => {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      const res = await submitInquiry({ ...values, source });
      setSuccessMessage(res.message || 'Thank you! Our team will contact you shortly.');
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      setFormError(err.errors ? 'Please fix the highlighted fields.' : err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (successMessage) {
    return (
      <div className="py-6 text-center" role="status">
        <CheckCircle2 className="mx-auto mb-3 text-brown-600" size={44} />
        <p className="text-lg font-semibold text-brown-700">{copy.enquirySuccessTitle}</p>
        <p className="mt-2 text-sm text-brown-800">{successMessage}</p>
        <Button className="mt-6" onClick={onClose}>
          Close
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <p className="text-sm text-brown-800">{copy.enquiryIntro}</p>
      <FormField label="Full name" required autoComplete="name" placeholder="Your name" {...bind('name')} />
      <FormField label="Phone" required type="tel" autoComplete="tel" placeholder="+91 98765 43210" {...bind('phone')} />
      <FormField label="Email" type="email" autoComplete="email" placeholder="you@example.com" {...bind('email')} />
      <FormField label="Message" as="textarea" rows={3} maxLength={1000} placeholder="Tell us what you're looking for" {...bind('message')} />
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Leave this field empty
          <input type="text" name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={(e) => setValues((prev) => ({ ...prev, website: e.target.value }))} />
        </label>
      </div>
      {formError && (
        <p role="alert" className="bg-red-50 px-3 py-2 text-sm text-red-700">
          {formError}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Sending…' : copy.enquirySubmitLabel}
      </Button>
    </form>
  );
}

export default function InquiryModal({ open, source, onClose }) {
  const { section } = useSection('navbar');
  const content = section?.content ?? {};
  // Empty strings count as "not set" so an admin clearing a field never produces a blank heading
  const copy = Object.fromEntries(Object.entries(DEFAULT_COPY).map(([key, fallback]) => [key, content[key]?.trim() || fallback]));

  return (
    <Modal open={open} onClose={onClose} title={copy.enquiryTitle}>
      <InquiryForm source={source} onClose={onClose} copy={copy} />
    </Modal>
  );
}
