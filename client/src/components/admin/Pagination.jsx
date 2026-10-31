import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../ui/Button.jsx';

export default function Pagination({ meta, onPage }) {
  if (!meta || meta.total === 0) return null;
  const from = (meta.page - 1) * meta.limit + 1;
  const to = Math.min(meta.page * meta.limit, meta.total);

  return (
    <nav aria-label="Pagination" className="flex flex-col items-center justify-between gap-3 border-t border-brown-400/30 px-1 pt-4 text-sm text-brown-700 sm:flex-row">
      <p>
        Showing {from}–{to} of {meta.total}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>
          <ChevronLeft size={14} /> Prev
        </Button>
        <span aria-live="polite">
          Page {meta.page} of {meta.pages}
        </span>
        <Button variant="ghost" size="sm" disabled={meta.page >= meta.pages} onClick={() => onPage(meta.page + 1)}>
          Next <ChevronRight size={14} />
        </Button>
      </div>
    </nav>
  );
}
