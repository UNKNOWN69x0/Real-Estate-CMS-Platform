// Turns a YouTube/Vimeo/file URL into something we can play inline; other http(s) URLs open in a new tab.
// Returns null for anything that isn't a valid http(s) URL.
export function parseVideoUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
  const host = parsed.hostname.replace(/^www\./, '');

  if (host === 'youtu.be' || host.endsWith('youtube.com')) {
    const id =
      host === 'youtu.be'
        ? parsed.pathname.slice(1)
        : parsed.searchParams.get('v') || parsed.pathname.split('/').filter(Boolean).pop();
    if (id) return { type: 'iframe', src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0` };
  }

  if (host.endsWith('vimeo.com')) {
    const id = parsed.pathname.split('/').filter(Boolean).pop();
    if (/^\d+$/.test(id)) return { type: 'iframe', src: `https://player.vimeo.com/video/${id}?autoplay=1` };
  }

  if (/\.(mp4|webm|ogg)$/i.test(parsed.pathname)) return { type: 'file', src: url };
  return { type: 'external', src: url };
}
