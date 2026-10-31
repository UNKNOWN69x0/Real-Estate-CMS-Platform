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
  if (!env.isProd) app.use(morgan('dev'));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use('/api', apiLimiter, originGuard);

  // Authenticated and session responses must never be cached by a browser or by Vercel's edge
  app.use(['/api/auth', '/api/admin'], (req, res, next) => {
    res.set('Cache-Control', 'no-store');
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
