import { useState } from 'react';
import { useSection } from '../../context/SectionsContext.jsx';
import { useCollection } from '../../hooks/useCollection.js';
import SectionWrapper from '../ui/SectionWrapper.jsx';
import SectionHeading from '../ui/SectionHeading.jsx';
import SmartImage from '../ui/SmartImage.jsx';
import Lightbox from '../ui/Lightbox.jsx';
import { CardSkeletons, LoadError } from '../ui/CollectionNotice.jsx';

export default function Gallery() {
  const { section, loading } = useSection('gallery');
  const { items, status, retry } = useCollection('gallery');
  const [lightboxIndex, setLightboxIndex] = useState(null);

  if (!loading && !section) return null;
  if (status === 'ready' && items.length === 0) return null;

  return (
    <SectionWrapper id="gallery" className="bg-sand py-16 sm:py-24">
      <SectionHeading eyebrow={section?.subtitle} title={section?.title} />

      {status === 'error' ? (
        <LoadError label="gallery" onRetry={retry} />
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {status === 'loading' ? (
            <CardSkeletons count={6} className="aspect-[4/3]" />
          ) : (
            items.map((item, index) => (
              <button
                key={item._id}
                type="button"
                onClick={() => setLightboxIndex(index)}
                aria-label={`View ${item.title}`}
                className="group relative aspect-[4/3] overflow-hidden rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown-600"
              >
                <SmartImage
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-10 text-sm font-medium text-white sm:text-base">
                  {item.title}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      <Lightbox items={items} index={lightboxIndex} onClose={() => setLightboxIndex(null)} onChange={setLightboxIndex} />
    </SectionWrapper>
  );
}
