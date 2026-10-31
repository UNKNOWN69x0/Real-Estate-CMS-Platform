import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { BCRYPT_ROUNDS } from '../config/password.js';
import { User } from '../models/User.js';
import { validate } from '../middleware/validate.js';
import { AUTH_COOKIE, requireAuth } from '../middleware/auth.js';
import { logActivity } from '../middleware/activityLog.js';
import { loginLimiter, passwordLimiter } from '../middleware/security.js';
import { changePasswordSchema, loginSchema } from '../validators/schemas.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// httpOnly always; Secure in production (HTTPS only). SameSite defaults to Lax because the browser talks to
// the API through the client's own domain (Vercel rewrite), so the cookie is first-party. Set
// COOKIE_SAMESITE=none only when the browser calls the API domain directly (cross-site).
const cookieOptions = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: env.cookieSameSite,
  path: '/',
};

const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email, role: user.role });

// Compared against when the email is unknown so response time doesn't reveal valid accounts
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

function setSessionCookie(res, user) {
  const token = jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: env.jwtExpiresIn,
  });
  res.cookie(AUTH_COOKIE, token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

router.post(
  '/login',
  loginLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !valid) throw ApiError.unauthorized('Invalid email or password');

    setSessionCookie(res, user);
    res.json({ data: publicUser(user) });
  }),
);

router.get('/me', requireAuth, (req, res) => {
  res.json({ data: publicUser(req.user) });
});

// A wrong current password is a 400 on that field (not a 401), so the client shows it inline
// instead of treating it as an expired session.
router.post(
  '/change-password',
  requireAuth,
  passwordLimiter,
  logActivity('update', 'user'),
  validate(changePasswordSchema),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw ApiError.badRequest('Current password is incorrect', { currentPassword: 'Current password is incorrect' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    user.passwordChangedAt = new Date();
    await user.save();

    // Fresh cookie keeps this device signed in; every older session stops working
    setSessionCookie(res, user);
    // Nothing from the request body ever goes into the log
    res.locals.logTarget = { id: user._id, summary: 'Changed password' };
    res.json({ message: 'Password changed' });
  }),
);

router.post('/logout', (req, res) => {
  res.clearCookie(AUTH_COOKIE, cookieOptions);
  res.json({ message: 'Logged out' });
});

export default router;
