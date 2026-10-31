import { useSection } from '../../context/SectionsContext.jsx';
import { useInquiry } from '../../context/InquiryContext.jsx';
import Button from '../ui/Button.jsx';
import Skeleton from '../ui/Skeleton.jsx';

const HEIGHT = 'min-h-[30rem] sm:min-h-[34rem] lg:min-h-[38rem]';

function HeroSkeleton() {
  return (
    <div className={`bg-brown-700 ${HEIGHT}`} aria-busy="true" aria-label="Loading hero">
      <div className="mx-auto max-w-6xl space-y-4 px-5 pt-24 sm:px-8">
        <Skeleton className="h-3 w-56 bg-white/20" />
        <Skeleton className="h-3 w-24 bg-white/20" />
        <Skeleton className="h-20 w-48 bg-white/20" />
        <Skeleton className="h-4 w-64 bg-white/20" />
        <div className="flex gap-3 pt-4">
          <Skeleton className="h-11 w-40 bg-white/20" />
          <Skeleton className="h-11 w-32 bg-white/20" />
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  const { section, loading } = useSection('hero');
  const { openInquiry } = useInquiry();

  if (loading) return <HeroSkeleton />;
  if (!section) return null;

  const { content = {} } = section;
  const primary = content.primaryCta;
  const secondary = content.secondaryCta;

  return (
    <section id="home" className={`relative flex scroll-mt-14 items-center overflow-hidden bg-brown-700 ${HEIGHT}`}>
      {section.image && (
        <img
          src={section.image}
          alt=""
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {/* Darkens the left side so copy stays readable on any photo */}
      <div className="absolute inset-0 bg-gradient-to-r from-brown-900/70 via-brown-900/35 to-transparent" />

      <div className="relative mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
        {content.location && (
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.25em] text-white/80 sm:text-xs">{content.location}</p>
        )}
        {content.codename && (
          <p className="mt-4 text-xs font-medium uppercase tracking-[0.35em] text-white/80 sm:text-sm">{content.codename}</p>
        )}
        <h1 className="mt-1 text-[6rem] font-bold lowercase leading-none tracking-tight text-white sm:text-[8rem]">
          {content.projectName || section.title}
        </h1>
        {content.projectSuffix && (
          <p className="mt-2 border-t border-white/40 pt-2 text-sm font-semibold uppercase tracking-[0.3em] text-white sm:inline-block">
            {content.projectSuffix}
          </p>
        )}
        {section.subtitle && <p className="mt-5 text-lg italic text-white/90 sm:text-xl">{section.subtitle}</p>}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {primary?.label && (
            <Button href={primary.href || '#about'} className="!border-white/30 !bg-brown-700/90">
              {primary.label}
            </Button>
          )}
          {secondary?.label && (
            <Button variant="glass" onClick={() => openInquiry('hero')}>
              {secondary.label}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
