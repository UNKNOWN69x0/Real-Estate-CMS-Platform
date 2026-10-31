// CMS-controlled links must never become javascript:/data: URLs. Allows http(s), same-site paths and #anchors.
export function safeHref(value) {
  if (typeof value !== 'string') return '';
  const url = value.trim();
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('#') || (url.startsWith('/') && !url.startsWith('//'))) return url;
  return '';
}
