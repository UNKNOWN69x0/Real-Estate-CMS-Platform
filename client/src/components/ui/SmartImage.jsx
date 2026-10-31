import { useState } from 'react';
import { optimizeImage } from '../../utils/image.js';

// Lazy-loaded image that degrades to a neutral block when missing or broken.
// `width` is the largest size (in CSS px) it is shown at; Cloudinary images are served resized and
// re-encoded, with a 2x variant for high-density screens.
export default function SmartImage({ src, alt, width = 800, className = '', ...props }) {
  const [failedSrc, setFailedSrc] = useState(null);

  if (!src || failedSrc === src) {
    return <div role="img" aria-label={alt} className={`bg-brown-600/15 ${className}`} />;
  }

  const base = optimizeImage(src, { width });
  const retina = optimizeImage(src, { width: width * 2 });
  return (
    <img
      src={base}
      srcSet={retina !== base ? `${base} 1x, ${retina} 2x` : undefined}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailedSrc(src)}
      className={className}
      {...props}
    />
  );
}
