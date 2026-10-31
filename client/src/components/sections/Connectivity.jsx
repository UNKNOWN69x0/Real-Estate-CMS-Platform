import { useSection } from '../../context/SectionsContext.jsx';
import SmartImage from '../ui/SmartImage.jsx';
import Skeleton from '../ui/Skeleton.jsx';

function ConnectivitySkeleton() {
  return (
    <section id="connectivity" className="scroll-mt-14 md:grid md:grid-cols-5" aria-busy="true">
      <Skeleton className="h-64 rounded-none md:col-span-2 md:h-full md:min-h-[26rem]" />
      <div className="space-y-4 bg-brown-600 p-8 md:col-span-3 md:p-12">
        <Skeleton className="h-3 w-40 bg-white/20" />
        <Skeleton className="h-10 w-4/5 bg-white/20" />
        <Skeleton className="h-40 w-full bg-white/20" />
      </div>
    </section>
  );
}

export default function Connectivity() {
  const { section, loading } = useSection('connectivity');
  if (loading) return <ConnectivitySkeleton />;
  if (!section) return null;

  const columns = section.content?.columns ?? [];

  return (
    <section id="connectivity" className="scroll-mt-14 bg-white md:grid md:grid-cols-5">
      <SmartImage
        src={section.image}
        alt="Location map showing nearby landmarks"
        className="h-64 w-full object-cover sm:h-80 md:col-span-2 md:h-full md:min-h-[28rem]"
      />

      <div className="bg-gradient-to-br from-brown-600 to-brown-700 px-6 py-10 text-white sm:px-10 md:col-span-3 md:px-12 md:py-14">
        {section.content?.eyebrow && (
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.25em] text-white/80">{section.content.eyebrow}</p>
        )}
        <h2 className="mt-3 max-w-xl text-3xl font-semibold leading-tight sm:text-4xl">{section.title}</h2>
        {section.subtitle && <p className="mt-2 text-sm italic text-white/85">{section.subtitle}</p>}

        <div className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-5">
          {columns.map((column) => (
            <div key={column.heading}>
              <h3 className="border-b border-white/30 pb-2 text-center text-[0.65rem] font-semibold uppercase tracking-[0.2em]">
                {column.heading}
              </h3>
              <ul className="mt-3 space-y-2.5">
                {(column.items ?? []).map((item) => (
                  <li key={item.name} className="flex gap-2 text-xs leading-relaxed text-white/95">
                    <span aria-hidden="true" className="mt-1.5 size-1 shrink-0 rounded-full bg-white/80" />
                    <span>
                      {item.name}
                      {item.minutes != null && <span className="font-semibold"> — {item.minutes} min</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
