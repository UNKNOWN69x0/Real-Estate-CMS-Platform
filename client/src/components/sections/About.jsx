import { useSection } from '../../context/SectionsContext.jsx';
import { useInquiry } from '../../context/InquiryContext.jsx';
import SectionWrapper from '../ui/SectionWrapper.jsx';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import Skeleton from '../ui/Skeleton.jsx';

function StatCard({ value, label }) {
  return (
    <Card className="border-l-2 border-brown-600 px-5 py-4 sm:px-6 sm:py-5">
      <p className="text-3xl font-semibold text-brown-700 sm:text-4xl">{value}</p>
      <p className="mt-1 text-[0.6rem] font-medium uppercase tracking-[0.18em] text-brown-600">{label}</p>
    </Card>
  );
}

function AboutSkeleton() {
  return (
    <SectionWrapper className="bg-sand py-16 sm:py-20" containerClassName="grid gap-10 md:grid-cols-2" aria-busy="true">
      <div className="space-y-4">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-10 w-4/5" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="mt-6 h-11 w-44" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </SectionWrapper>
  );
}

export default function About() {
  const { section, loading } = useSection('about');
  const { openInquiry } = useInquiry();

  if (loading) return <AboutSkeleton />;
  if (!section) return null;

  const { content = {} } = section;
  const stats = content.stats ?? [];
  const highlights = content.highlights ?? [];
  const brochure = content.brochureCta;

  return (
    <SectionWrapper id="about" className="bg-sand py-16 sm:py-24" containerClassName="relative grid items-center gap-12 md:grid-cols-2">
      {/* Oversized decorative numeral behind the copy, as in the reference design */}
      <span aria-hidden="true" className="pointer-events-none absolute left-0 -top-10 select-none text-[22rem] font-bold leading-none text-brown-600/[0.07] sm:left-6">
        1
      </span>

      <div className="relative">
        {section.subtitle && (
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.25em] text-brown-600">{section.subtitle}</p>
        )}
        <h2 className="mt-3 text-3xl font-semibold leading-tight text-brown-700 sm:text-4xl">{section.title}</h2>
        <div className="my-5 h-px w-10 bg-brown-400" />
        {section.body && <p className="max-w-lg text-sm leading-7 text-brown-800 sm:text-[0.95rem]">{section.body}</p>}

        {highlights.length > 0 && (
          <ul className="mt-5 space-y-2">
            {highlights.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-brown-900">
                <span aria-hidden="true" className="size-1.5 shrink-0 bg-brown-600" />
                {item}
              </li>
            ))}
          </ul>
        )}

        {brochure?.label &&
          (brochure.url ? (
            <Button href={brochure.url} target="_blank" rel="noopener noreferrer" className="mt-8">
              {brochure.label}
            </Button>
          ) : (
            // No brochure uploaded yet: capture the lead instead of a dead link
            <Button onClick={() => openInquiry('brochure')} className="mt-8">
              {brochure.label}
            </Button>
          ))}
      </div>

      <div className="relative md:min-h-[26rem]">
        {/* Framed photo (desktop) with the stat cards overlapping its left edge */}
        <div className="absolute inset-y-0 right-0 hidden w-[62%] border border-brown-400 p-3 md:block">
          {section.image ? (
            <img src={section.image} alt="Project building" loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-brown-600">Building Photo</div>
          )}
        </div>
        {section.image && (
          <img src={section.image} alt="Project building" loading="lazy" className="mb-4 aspect-[4/3] w-full object-cover md:hidden" />
        )}

        <div className="relative z-10 grid gap-3 sm:grid-cols-3 md:w-[52%] md:grid-cols-1 md:py-4">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
