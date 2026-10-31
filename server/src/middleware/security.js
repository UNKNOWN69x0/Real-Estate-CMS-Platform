import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const limiter = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, res, next) => next(new ApiError(429, message)),
  });

export const apiLimiter = limiter(15 * 60 * 1000, 600, 'Too many requests, please slow down');
export const loginLimiter = limiter(15 * 60 * 1000, 10, 'Too many login attempts, try again in 15 minutes');
export const passwordLimiter = limiter(15 * 60 * 1000, 5, 'Too many password change attempts, try again in 15 minutes');
export const inquiryLimiter = limiter(60 * 60 * 1000, 10, 'Too many enquiries from this address, please try again later');

/**
 * Cookie auth with SameSite=None is exposed to cross-site request forgery, so reject
 * state-changing requests whose Origin header isn't one of our known clients.
 * Requests without an Origin (curl, server-to-server) are not browser CSRF vectors.
 */
export const originGuard = (req, res, next) => {
  const unsafe = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  const origin = req.get('origin');
  if (unsafe && origin && !env.clientUrls.includes(origin)) {
    return next(ApiError.forbidden('Origin not allowed'));
  }
  next();
};
