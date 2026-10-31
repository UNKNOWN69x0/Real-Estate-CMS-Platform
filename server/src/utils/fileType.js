// The browser-reported MIME type is just a header the client chose, so check the file's real signature too.
const startsWith = (buf, bytes, offset = 0) => bytes.every((b, i) => buf[offset + i] === b);

export function sniffMime(buf) {
  if (!buf || buf.length < 12) return null;
  if (startsWith(buf, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (startsWith(buf, [0x47, 0x49, 0x46, 0x38])) return 'image/gif'; // GIF87a / GIF89a
  if (startsWith(buf, [0x52, 0x49, 0x46, 0x46]) && startsWith(buf, [0x57, 0x45, 0x42, 0x50], 8)) return 'image/webp'; // RIFF....WEBP
  if (startsWith(buf, [0x25, 0x50, 0x44, 0x46, 0x2d])) return 'application/pdf'; // %PDF-
  return null;
}
