import 'dotenv/config';

const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// How many reverse proxies sit in front of the app. In production the request path is
// browser -> Vercel (rewrite) -> Render's load balancer -> this app, i.e. 2 hops; getting this
// wrong makes every visitor share one IP, which would collapse the per-IP rate limits.
function parseTrustProxy(raw) {
  if (raw !== undefined && raw !== '' && Number.isInteger(Number(raw)) && Number(raw) >= 0) return Number(raw);
  return isProd ? 2 : 0;
}

const sameSite = (process.env.COOKIE_SAMESITE || 'lax').toLowerCase();

export const env = {
  isProd,
  isTest,
  logRequests: process.env.LOG_REQUESTS !== 'false' && !isTest,
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  // Comma-separated list of allowed browser origins (CORS + origin guard)
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim().replace(/\/$/, ''))
    .filter(Boolean),
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
  // 'lax' is right when the API is reached through the client's own domain (the Vercel rewrite).
  // Use 'none' only if browsers call the API's domain directly, which also needs Secure (set in production).
  cookieSameSite: ['lax', 'strict', 'none'].includes(sameSite) ? sameSite : 'lax',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  seedAdmin: {
    name: process.env.SEED_ADMIN_NAME || 'Admin',
    email: process.env.SEED_ADMIN_EMAIL || 'admin@onechembur.com',
    password: process.env.SEED_ADMIN_PASSWORD,
  },
};

export function assertRequiredEnv() {
  const missing = [];
  if (!env.mongoUri) missing.push('MONGODB_URI');
  if (!env.jwtSecret) missing.push('JWT_SECRET');
  if (env.isProd && !process.env.CLIENT_URL) missing.push('CLIENT_URL');
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  if (env.isProd) {
    if (env.jwtSecret.length < 32) throw new Error('JWT_SECRET must be at least 32 characters in production');
    const insecure = env.clientUrls.filter((url) => !url.startsWith('https://'));
    if (insecure.length) throw new Error(`CLIENT_URL must use https:// in production (got ${insecure.join(', ')})`);
  }
}
