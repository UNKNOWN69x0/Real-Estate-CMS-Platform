import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="grid min-h-svh place-items-center bg-sand px-5 text-center">
      <div>
        <p className="text-6xl font-bold text-brown-600">404</p>
        <p className="mt-2 text-brown-800">This page doesn&apos;t exist.</p>
        <Link to="/" className="mt-6 inline-block bg-brown-700 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white hover:bg-brown-800">
          Back to home
        </Link>
      </div>
    </main>
  );
}
