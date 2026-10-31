const CLOUDINARY_IMAGE = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/;

/**
 * Cloudinary can resize and re-encode on the fly. Inserting `f_auto,q_auto,w_<n>` makes browsers
 * receive WebP/AVIF at the size they need instead of the original upload (often several MB).
 * Anything that isn't a Cloudinary image URL is returned untouched.
 */
export function optimizeImage(url, { width } = {}) {
  if (typeof url !== 'string') return url;
  const match = url.match(CLOUDINARY_IMAGE);
  if (!match) return url;

  const [, prefix, rest] = match;
  if (rest.split('/')[0].includes('f_auto')) return url; // already optimised

  const transform = ['f_auto', 'q_auto', width ? `w_${width}` : null, width ? 'c_limit' : null].filter(Boolean).join(',');
  return `${prefix}${transform}/${rest}`;
}
