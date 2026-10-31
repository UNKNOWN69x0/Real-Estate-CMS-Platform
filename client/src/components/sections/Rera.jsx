import { useSection } from '../../context/SectionsContext.jsx';
import SectionWrapper from '../ui/SectionWrapper.jsx';
import SmartImage from '../ui/SmartImage.jsx';
import Skeleton from '../ui/Skeleton.jsx';
import { safeHref } from '../../utils/safeUrl.js';

export default function Rera() {
  const { section, loading } = useSection('rera');

  if (loading) {
    return (
      <SectionWrapper id="rera" className="bg-brown-600 py-10">
        <div className="flex gap-6">
          <Skeleton className="size-24 shrink-0 bg-white/20" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-4 w-1/2 bg-white/20" />
            <Skeleton className="h-3 w-full bg-white/20" />
            <Skeleton className="h-3 w-4/5 bg-white/20" />
          </div>
        </div>
      </SectionWrapper>
    );
  }
  if (!section) return null;

  const { registrationLabel, registrationNumber, qrCaption } = section.content ?? {};
  const websiteUrl = safeHref(section.content?.websiteUrl);

  return (
    <SectionWrapper id="rera" className="bg-gradient-to-b from-brown-600 to-brown-700 py-10 text-white sm:py-12">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
        <figure className="shrink-0 text-center">
          <SmartImage src={section.image} alt="MahaRERA QR code" className="size-28 bg-white object-contain p-1.5" />
          {qrCaption && <figcaption className="mt-2 text-[0.6rem] text-white/80">{qrCaption}</figcaption>}
        </figure>

        <div className="min-w-0">
          <h2 className="text-sm font-bold uppercase tracking-wide">{section.title}</h2>
          {registrationNumber && (
            <p className="mt-1 text-sm font-semibold">
              {registrationLabel ?? 'Registration No.'}: {registrationNumber}
            </p>
          )}
          {websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-sm font-semibold underline underline-offset-2 hover:text-gold"
            >
              {websiteUrl}
            </a>
          )}
          {section.body && <p className="mt-3 text-[0.65rem] leading-relaxed text-white/75 sm:text-xs">{section.body}</p>}
        </div>
      </div>
    </SectionWrapper>
  );
}
