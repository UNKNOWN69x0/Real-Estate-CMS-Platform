import { useSection } from '../../context/SectionsContext.jsx';
import SectionWrapper from '../ui/SectionWrapper.jsx';
import SmartImage from '../ui/SmartImage.jsx';
import Skeleton from '../ui/Skeleton.jsx';

export default function Developer() {
  const { section, loading } = useSection('developer');

  if (loading) {
    return (
      <SectionWrapper id="developer" className="bg-white py-16 sm:py-24" containerClassName="grid gap-10 md:grid-cols-[2fr_3fr]">
        <Skeleton className="aspect-[3/4] w-full" />
        <div className="space-y-4">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      </SectionWrapper>
    );
  }
  if (!section) return null;

  const { eyebrow, consultants = [] } = section.content ?? {};

  return (
    <SectionWrapper
      id="developer"
      className="bg-white py-16 sm:py-24"
      containerClassName="relative grid items-center gap-10 md:grid-cols-[2fr_3fr] md:gap-14"
    >
      <span aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-sand" />

      <SmartImage
        src={section.image}
        alt={`${section.title} logo`}
        className="relative mx-auto aspect-[3/4] w-full max-w-sm border border-brown-400/40 bg-cream object-cover"
      />

      <div className="relative">
        {eyebrow && <p className="text-[0.65rem] font-medium uppercase tracking-[0.25em] text-brown-600">{eyebrow}</p>}
        <h2 className="mt-3 text-4xl font-semibold text-brown-700">{section.title}</h2>
        {section.subtitle && <p className="mt-1 italic text-brown-600">{section.subtitle}</p>}
        {section.body && <p className="mt-5 max-w-xl text-sm leading-7 text-brown-800">{section.body}</p>}

        {consultants.length > 0 && (
          <dl className="mt-8 grid gap-x-8 gap-y-4 border-t border-brown-400/40 pt-6 sm:grid-cols-2">
            {consultants.map((item) => (
              <div key={item.role}>
                <dt className="text-[0.6rem] font-medium uppercase tracking-[0.18em] text-brown-600">{item.role}</dt>
                <dd className="mt-0.5 text-sm font-medium text-brown-900">{item.name}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </SectionWrapper>
  );
}
