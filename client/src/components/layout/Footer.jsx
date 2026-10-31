import { Mail, Phone } from 'lucide-react';
import { useSection } from '../../context/SectionsContext.jsx';
import SmartImage from '../ui/SmartImage.jsx';
import Skeleton from '../ui/Skeleton.jsx';
import { safeHref } from '../../utils/safeUrl.js';

const heading = 'text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white';

function Office({ office }) {
  if (!office) return null;
  return (
    <div>
      <h3 className={heading}>{office.heading}</h3>
      <address className="mt-3 text-xs not-italic leading-relaxed text-white/85">{office.address}</address>
      <ul className="mt-3 space-y-1.5 text-xs text-white/90">
        {(office.phones ?? []).map((phone) => (
          <li key={phone}>
            <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} className="inline-flex items-center gap-2 hover:text-white hover:underline">
              <Phone size={13} aria-hidden="true" /> {phone}
            </a>
          </li>
        ))}
        {office.email && (
          <li>
            <a href={`mailto:${office.email}`} className="inline-flex items-center gap-2 break-all hover:text-white hover:underline">
              <Mail size={13} aria-hidden="true" /> {office.email}
            </a>
          </li>
        )}
      </ul>
    </div>
  );
}

export default function Footer() {
  const { section, loading } = useSection('footer');

  if (loading) {
    return (
      <footer id="contact" className="bg-brown-700 px-5 py-12">
        <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-32 bg-white/15" />
          ))}
        </div>
      </footer>
    );
  }
  if (!section) return null;

  const { corporateOffice, salesOffice, quickLinks = [], copyright, legalLinks = [] } = section.content ?? {};

  return (
    <footer id="contact" className="scroll-mt-14 bg-gradient-to-b from-brown-600 to-brown-700 text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-[1.2fr_1.2fr_1.2fr_0.8fr]">
        <div>
          {section.image ? (
            <SmartImage src={section.image} alt={section.title} className="h-14 w-auto max-w-[10rem] object-contain" />
          ) : (
            <p className="text-xl font-bold">{section.title}</p>
          )}
          {section.subtitle && <p className="mt-3 max-w-[14rem] text-xs leading-relaxed text-white/85">{section.subtitle}</p>}
        </div>

        <Office office={corporateOffice} />
        <Office office={salesOffice} />

        {quickLinks.length > 0 && (
          <nav aria-label="Quick links">
            <h3 className={heading}>{section.content?.quickLinksHeading?.trim() || 'Quick Links'}</h3>
            <ul className="mt-3 space-y-2 text-xs text-white/90">
              {quickLinks.map((link) => (
                <li key={link.href + link.label}>
                  <a href={safeHref(link.href) || '#home'} className="hover:text-white hover:underline">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      <div className="border-t border-white/20">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-4 text-[0.65rem] text-white/75 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>{copyright}</p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {legalLinks.map((link) => (
              <li key={link.label}>
                {safeHref(link.href) ? (
                  <a href={safeHref(link.href)} className="hover:text-white hover:underline">
                    {link.label}
                  </a>
                ) : (
                  <span>{link.label}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
