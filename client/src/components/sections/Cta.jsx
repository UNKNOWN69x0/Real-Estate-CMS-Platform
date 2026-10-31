import { useSection } from '../../context/SectionsContext.jsx';
import { useInquiry } from '../../context/InquiryContext.jsx';
import Button from '../ui/Button.jsx';
import SmartImage from '../ui/SmartImage.jsx';
import Skeleton from '../ui/Skeleton.jsx';
import { safeHref } from '../../utils/safeUrl.js';

export default function Cta() {
  const { section, loading } = useSection('cta');
  const { openInquiry } = useInquiry();

  if (loading) {
    return (
      <section id="cta" className="bg-brown-700 px-5 py-20">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
          <Skeleton className="h-3 w-40 bg-white/20" />
          <Skeleton className="h-10 w-full bg-white/20" />
          <Skeleton className="h-11 w-64 bg-white/20" />
        </div>
      </section>
    );
  }
  if (!section) return null;

  const { primaryCta, secondaryCta } = section.content ?? {};
  const primaryUrl = safeHref(primaryCta?.url);
  const secondaryUrl = safeHref(secondaryCta?.url);

  return (
    <section id="cta" className="relative scroll-mt-14 overflow-hidden bg-brown-800 py-16 text-center text-white sm:py-20">
      <SmartImage src={section.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-brown-900/65" />

      <div className="relative mx-auto max-w-3xl px-5">
        {section.subtitle && (
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.3em] text-white/80">{section.subtitle}</p>
        )}
        <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">{section.title}</h2>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {primaryCta?.label && (
            // Both CTAs fall back to the enquiry modal when no URL is set
            primaryUrl ? (
              <Button variant="light" href={primaryUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                {primaryCta.label}
              </Button>
            ) : (
              <Button variant="light" onClick={() => openInquiry('cta-site-visit')} className="w-full sm:w-auto">
                {primaryCta.label}
              </Button>
            )
          )}
          {secondaryCta?.label &&
            (secondaryUrl ? (
              <Button variant="outline" href={secondaryUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                {secondaryCta.label}
              </Button>
            ) : (
              <Button variant="outline" onClick={() => openInquiry('cta-brochure')} className="w-full sm:w-auto">
                {secondaryCta.label}
              </Button>
            ))}
        </div>
      </div>
    </section>
  );
}
