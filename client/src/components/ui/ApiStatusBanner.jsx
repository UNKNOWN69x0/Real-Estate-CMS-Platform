import { useSectionsStatus } from '../../context/SectionsContext.jsx';

// Shown when the API is unreachable and fallback copy is on screen
export default function ApiStatusBanner() {
  const { status, retry } = useSectionsStatus();
  if (status !== 'error') return null;

  return (
    <div role="status" className="bg-brown-900 px-5 py-2 text-center text-xs text-white/90">
      We couldn&apos;t load the latest content, so some details may be missing.{' '}
      <button type="button" onClick={retry} className="font-semibold underline underline-offset-2 hover:text-white">
        Try again
      </button>
    </div>
  );
}
