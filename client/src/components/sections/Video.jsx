import { useState } from 'react';
import { Play } from 'lucide-react';
import { useSection } from '../../context/SectionsContext.jsx';
import { parseVideoUrl } from '../../utils/videoEmbed.js';
import SectionWrapper from '../ui/SectionWrapper.jsx';
import SectionHeading from '../ui/SectionHeading.jsx';
import SmartImage from '../ui/SmartImage.jsx';
import Skeleton from '../ui/Skeleton.jsx';

export default function Video() {
  const { section, loading } = useSection('video');
  const [playing, setPlaying] = useState(false);

  if (loading) {
    return (
      <SectionWrapper id="video" className="bg-white py-14 sm:py-20" aria-busy="true">
        <Skeleton className="mx-auto h-9 w-72" />
        <Skeleton className="mt-8 aspect-video w-full rounded-2xl" />
      </SectionWrapper>
    );
  }
  if (!section) return null;

  const { videoUrl, posterImage } = section.content ?? {};
  const media = videoUrl ? parseVideoUrl(videoUrl) : null;

  const play = () => {
    if (!media) return;
    if (media.type === 'external') window.open(media.src, '_blank', 'noopener,noreferrer');
    else setPlaying(true);
  };

  return (
    <SectionWrapper id="video" className="bg-white py-14 sm:py-20">
      <SectionHeading title={section.title} subtitle={section.subtitle} />

      <div className="relative mt-8 aspect-video overflow-hidden rounded-2xl bg-brown-900">
        {playing && media?.type === 'iframe' && (
          <iframe
            src={media.src}
            title={section.title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        )}
        {playing && media?.type === 'file' && (
          <video src={media.src} controls autoPlay className="absolute inset-0 h-full w-full" />
        )}

        {!playing && (
          <>
            {posterImage && <SmartImage src={posterImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />}
            <button
              type="button"
              onClick={play}
              disabled={!media}
              aria-label={media ? `Play video: ${section.title}` : 'Video coming soon'}
              title={media ? undefined : 'Video coming soon'}
              className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/80 text-gold transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-50 sm:size-20"
            >
              <Play size={28} fill="currentColor" aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </SectionWrapper>
  );
}
