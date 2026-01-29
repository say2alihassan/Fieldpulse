import type { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { config } from '../../utils/config.js';

// In-memory rate limiter (use Redis in production for multi-instance)
const rateLimiter = new RateLimiterMemory({
  points: config.rateLimit.maxRequests,
  duration: config.rateLimit.windowMs / 1000,
});

// Stricter limiter for auth endpoints
const authRateLimiter = new RateLimiterMemory({
  points: 5,
  duration: 60, // 5 attempts per minute
  blockDuration: 60 * 15, // Block for 15 minutes
});

export async function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const key = req.ip || 'unknown';
    await rateLimiter.consume(key);
    next();
  } catch {
    res.status(429).json({
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
    });
  }
}

export async function authRateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const key = req.ip || 'unknown';
    await authRateLimiter.consume(key);
    next();
  } catch {
    res.status(429).json({
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts. Please try again in 15 minutes.',
    });
  }
}
