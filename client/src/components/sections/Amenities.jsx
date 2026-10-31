import { useSection } from '../../context/SectionsContext.jsx';
import { useCollection } from '../../hooks/useCollection.js';
import { getAmenityIcon } from '../../utils/amenityIcons.js';
import SectionWrapper from '../ui/SectionWrapper.jsx';
import SectionHeading from '../ui/SectionHeading.jsx';
import { CardSkeletons, LoadError } from '../ui/CollectionNotice.jsx';

export default function Amenities() {
  const { section, loading } = useSection('amenities');
  const { items, status, retry } = useCollection('amenities');

  if (!loading && !section) return null;
  if (status === 'ready' && items.length === 0) return null;

  return (
    <SectionWrapper id="amenities" className="bg-white py-12 sm:py-20">
      <div className="border border-brown-400/60 px-4 py-12 sm:px-8 sm:py-14">
        <SectionHeading eyebrow={section?.content?.eyebrow} title={section?.title} subtitle={section?.subtitle} />
        <div className="mx-auto my-5 h-px w-10 bg-brown-400" />

        {status === 'error' ? (
          <LoadError label="amenities" onRetry={retry} />
        ) : (
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
            {status === 'loading' ? (
              <CardSkeletons count={6} className="h-28" />
            ) : (
              items.map((amenity) => {
                const Icon = getAmenityIcon(amenity.icon);
                return (
                  <li
                    key={amenity._id}
                    className="flex flex-col items-center gap-3 border border-gold/50 border-t-2 border-t-gold bg-[#f8f0e7] px-4 py-7 text-center"
                  >
                    <span className="grid size-11 place-items-center rounded-full bg-brown-700 text-white">
                      <Icon size={20} strokeWidth={1.6} aria-hidden="true" />
                    </span>
                    <span className="text-sm text-brown-800">{amenity.title}</span>
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>
    </SectionWrapper>
  );
}
