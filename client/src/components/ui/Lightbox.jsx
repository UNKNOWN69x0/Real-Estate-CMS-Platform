import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

// Full-screen image viewer. `index` is null when closed.
export default function Lightbox({ items, index, onClose, onChange }) {
  const closeRef = useRef(null);
  const open = index !== null;

  // Scroll lock + focus handling only change when the viewer opens/closes
  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const count = items.length;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      else if (event.key === 'ArrowRight') onChange((index + 1) % count);
      else if (event.key === 'ArrowLeft') onChange((index - 1 + count) % count);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, index, items.length, onChange, onClose]);

  if (!open || !items[index]) return null;
  const item = items[index];
  const navButton = 'absolute top-1/2 -translate-y-1/2 bg-black/40 p-2 text-white hover:bg-black/60';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-brown-900/95 p-4"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 p-2 text-white hover:text-gold">
        <X size={28} />
      </button>

      <img src={item.image} alt={item.title} className="max-h-[78svh] max-w-full object-contain" />
      <p className="mt-4 text-center text-white">
        {item.title} <span className="ml-2 text-sm text-white/60">{index + 1} / {items.length}</span>
      </p>

      {items.length > 1 && (
        <>
          <button type="button" aria-label="Previous image" className={`${navButton} left-2 sm:left-6`} onClick={() => onChange((index - 1 + items.length) % items.length)}>
            <ChevronLeft size={28} />
          </button>
          <button type="button" aria-label="Next image" className={`${navButton} right-2 sm:right-6`} onClick={() => onChange((index + 1) % items.length)}>
            <ChevronRight size={28} />
          </button>
        </>
      )}
    </div>,
    document.body,
  );
}
