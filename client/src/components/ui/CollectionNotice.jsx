import Skeleton from './Skeleton.jsx';

// Placeholder grid shown while a collection loads
export function CardSkeletons({ count = 6, className = 'h-40' }) {
  return Array.from({ length: count }, (_, i) => <Skeleton key={i} className={className} />);
}

// Shown in place of a grid when its collection request failed
export function LoadError({ label, onRetry }) {
  return (
    <p role="alert" className="py-8 text-center text-sm text-brown-700">
      We couldn&apos;t load the {label}.{' '}
      <button type="button" onClick={onRetry} className="font-semibold underline underline-offset-2">
        Try again
      </button>
    </p>
  );
}
