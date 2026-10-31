export default function Skeleton({ className = '' }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-sm bg-brown-600/15 ${className}`} />;
}
