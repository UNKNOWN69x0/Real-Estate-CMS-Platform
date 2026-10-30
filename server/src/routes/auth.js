import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { validate } from '../middleware/validate.js';
import { AUTH_COOKIE, requireAuth } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/security.js';
import { loginSchema } from '../validators/schemas.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Cross-domain deployment (Vercel client + Render API) needs SameSite=None; Secure
const cookieOptions = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: env.isProd ? 'none' : 'lax',
  path: '/',
};

const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email, role: user.role });

// Compared against when the email is unknown so response time doesn't reveal valid accounts
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

router.post(
  '/login',
  loginLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !valid) throw ApiError.unauthorized('Invalid email or password');

    const token = jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, {
      algorithm: 'HS256',
      expiresIn: env.jwtExpiresIn,
    });
    res.cookie(AUTH_COOKIE, token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ data: publicUser(user) });
  }),
);

router.get('/me', requireAuth, (req, res) => {
  res.json({ data: publicUser(req.user) });
});

router.post('/logout', (req, res) => {
  res.clearCookie(AUTH_COOKIE, cookieOptions);
  res.json({ message: 'Logged out' });
});

export default router;
