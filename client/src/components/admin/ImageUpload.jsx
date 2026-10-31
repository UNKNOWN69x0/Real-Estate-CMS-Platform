import { useRef, useState } from 'react';
import { FileText, Loader2, Trash2, Upload } from 'lucide-react';
import { adminApi } from '../../api/admin.js';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../ui/Button.jsx';

const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Upload-or-paste field for images and PDFs. Files go to POST /api/admin/upload (Cloudinary)
 * and the returned URL is what the form stores.
 */
export default function ImageUpload({ label, value, onChange, error, hint, kind = 'image', accept, required }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const acceptTypes = accept ?? (kind === 'file' ? 'application/pdf' : 'image/jpeg,image/png,image/webp,image/gif');
  const shownError = uploadError || error;
  const isImage = kind === 'image' && value;

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // allow re-picking the same file
    if (!file) return;

    setUploadError('');
    if (!acceptTypes.split(',').includes(file.type)) {
      setUploadError(kind === 'file' ? 'Please choose a PDF file' : 'Please choose a JPG, PNG, WebP or GIF image');
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadError('File is too large (max 10 MB)');
      return;
    }

    setUploading(true);
    try {
      const result = await adminApi.upload(file);
      onChange(result.url);
      toast.success('File uploaded');
    } catch (err) {
      setUploadError(err.message);
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-brown-700">
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </p>

      <div className={`flex flex-col gap-3 border bg-white p-3 sm:flex-row sm:items-start ${shownError ? 'border-red-600' : 'border-brown-400/50'}`}>
        <div className="grid h-20 w-full shrink-0 place-items-center overflow-hidden border border-brown-400/30 bg-sand sm:w-28">
          {isImage ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : value && kind === 'file' ? (
            <a href={value} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 text-xs text-brown-700 underline">
              <FileText size={22} /> Open file
            </a>
          ) : (
            <span className="text-xs text-brown-400">{kind === 'file' ? 'No file' : 'No image'}</span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <input
            type="url"
            value={value ?? ''}
            onChange={(event) => {
              setUploadError('');
              onChange(event.target.value);
            }}
            placeholder="Paste a link, or upload a file"
            aria-label={`${label} URL`}
            aria-invalid={Boolean(shownError)}
            className="w-full border border-brown-400/50 px-3 py-2 text-sm focus:border-brown-600 focus:outline-none focus:ring-1 focus:ring-brown-600"
          />
          <div className="flex flex-wrap gap-2">
            <input ref={inputRef} type="file" accept={acceptTypes} onChange={handleFile} className="sr-only" tabIndex={-1} aria-hidden="true" />
            <Button variant="ghost" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? 'Uploading…' : 'Upload'}
            </Button>
            {value && (
              <Button variant="ghost" size="sm" disabled={uploading} onClick={() => onChange('')}>
                <Trash2 size={14} /> Remove
              </Button>
            )}
          </div>
        </div>
      </div>

      {hint && !shownError && <p className="mt-1 text-xs text-brown-600">{hint}</p>}
      {shownError && (
        <p role="alert" className="mt-1 text-xs font-medium text-red-700">
          {shownError}
        </p>
      )}
    </div>
  );
}
