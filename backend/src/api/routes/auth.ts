import { Router } from 'express';
import {
  validateCredentials,
  generateTokens,
  refreshTokens,
  revokeRefreshToken,
} from '../../services/auth.js';
import { loginSchema, refreshSchema } from '../validators/auth.js';
import { asyncHandler, UnauthorizedError } from '../middleware/errorHandler.js';
import { authRateLimitMiddleware } from '../middleware/rateLimit.js';

const router = Router();

// POST /api/auth/login
router.post(
  '/login',
  authRateLimitMiddleware,
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);

    const user = await validateCredentials(email, password);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokens = await generateTokens(user);

    res.json({
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  })
);

// POST /api/auth/refresh
router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const { refreshToken } = refreshSchema.parse(req.body);

    const tokens = await refreshTokens(refreshToken);
    if (!tokens) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    res.json(tokens);
  })
);

// POST /api/auth/logout
router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const { refreshToken } = refreshSchema.parse(req.body);

    await revokeRefreshToken(refreshToken);

    res.json({ success: true });
  })
);

export default router;
