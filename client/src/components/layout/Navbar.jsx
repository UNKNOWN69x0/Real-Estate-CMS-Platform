import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useSection } from '../../context/SectionsContext.jsx';
import { useInquiry } from '../../context/InquiryContext.jsx';
import Skeleton from '../ui/Skeleton.jsx';
import Button from '../ui/Button.jsx';
import { safeHref } from '../../utils/safeUrl.js';

// Brand lockup is built from the hero's project naming so it stays CMS-driven
function Logo({ hero }) {
  const c = hero?.content ?? {};
  return (
    <a href="#home" className="flex flex-col items-start leading-none text-white" aria-label={`${c.projectName ?? 'One'} ${c.projectSuffix ?? ''}`}>
      <span className="text-[0.5rem] font-medium uppercase tracking-[0.25em] opacity-80">{c.codename ?? 'Codename'}</span>
      <span className="-my-0.5 text-3xl font-bold lowercase tracking-tight">{c.projectName ?? 'one'}</span>
      <span className="text-[0.55rem] font-semibold uppercase tracking-[0.3em]">{c.projectSuffix ?? 'Chembur'}</span>
    </a>
  );
}

export default function Navbar() {
  const { section: navbar, loading } = useSection('navbar');
  const { section: hero } = useSection('hero');
  const { openInquiry } = useInquiry();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKeyDown = (event) => event.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  const links = (navbar?.content?.links ?? []).map((link) => ({ ...link, href: safeHref(link.href) || '#home' }));
  const ctaLabel = navbar?.content?.ctaLabel ?? 'Enquire Now';

  const enquire = () => {
    setMenuOpen(false);
    openInquiry('navbar');
  };

  return (
    <header className="sticky top-0 z-50 bg-brown-600/95 shadow-md backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-5 sm:px-8" aria-label="Main">
        <Logo hero={hero} />

        <ul className="hidden items-center gap-6 lg:flex">
          {loading
            ? Array.from({ length: 6 }, (_, i) => (
                <li key={i}>
                  <Skeleton className="h-3 w-16 bg-white/20" />
                </li>
              ))
            : links.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-xs font-medium tracking-wide text-white/90 transition-colors hover:text-white">
                    {link.label}
                  </a>
                </li>
              ))}
        </ul>

        <div className="flex items-center gap-2">
          <Button onClick={enquire} className="hidden !border-brown-800 !bg-brown-800 !py-2.5 hover:!bg-brown-900 sm:inline-flex">
            {ctaLabel}
          </Button>
          <button
            type="button"
            className="p-2 text-white lg:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div id="mobile-menu" className="border-t border-white/15 bg-brown-700 lg:hidden">
          <ul className="mx-auto max-w-6xl px-5 py-2 sm:px-8">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block border-b border-white/10 py-3 text-sm font-medium text-white/90 hover:text-white"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="py-4">
              <Button onClick={enquire} className="w-full !border-brown-900 !bg-brown-900">
                {ctaLabel}
              </Button>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
