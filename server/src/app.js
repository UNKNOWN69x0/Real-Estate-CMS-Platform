import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env.js';
import { apiLimiter, originGuard } from './middleware/security.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import { publicResourceRouter } from './routes/resources.js';
import { publicInquiryRouter } from './routes/inquiries.js';

export function createApp() {
  const app = express();

  // Trust the proxies in front of us (Vercel rewrite + Render load balancer) so req.ip is the real
  // visitor and rate limiting works per visitor. See TRUST_PROXY in config/env.js.
  if (env.trustProxy > 0) app.set('trust proxy', env.trustProxy);

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, cb) => cb(null, !origin || env.clientUrls.includes(origin)),
      credentials: true,
    }),
  );
  // Readable logs in dev; one terse line per request in production (health checks skipped to keep Render's log clean).
  // Neither format includes headers, cookies or bodies, so no credentials can reach the logs.
  if (env.logRequests) {
    app.use(env.isProd ? morgan('tiny', { skip: (req) => req.path === '/api/health' }) : morgan('dev'));
  }
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use('/api', apiLimiter, originGuard);

  // Authenticated and session responses must never be cached by a browser or by Vercel's edge
  app.use(['/api/auth', '/api/admin'], (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  // Published content is public and identical for everyone, so let a shared cache (Vercel's edge) hold it for 30 s.
  // Browsers ignore s-maxage and, with max-age=0, always revalidate via ETag, so an admin who just saved sees the
  // change on the next load. Deliberately NO stale-while-revalidate: browsers honour it too and would show the old
  // copy first. GET only: the enquiry POST is untouched.
  app.use('/api/public', (req, res, next) => {
    if (req.method === 'GET') res.set('Cache-Control', 'public, max-age=0, s-maxage=30');
    next();
  });

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRouter);
  app.use('/api/public', publicResourceRouter);
  app.use('/api/inquiries', publicInquiryRouter);
  app.use('/api/admin', adminRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
