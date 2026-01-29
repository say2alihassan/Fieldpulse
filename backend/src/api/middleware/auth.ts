import type { Request, Response, NextFunction } from 'express';
import * as jose from 'jose';
import { config } from '../../utils/config.js';
import type { AuthenticatedRequest, JWTPayload } from '../../types/index.js';

const secret = new TextEncoder().encode(config.jwt.secret);

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization header',
      });
      return;
    }

    const token = authHeader.substring(7);

    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });

    const jwtPayload = payload as unknown as JWTPayload;

    if (jwtPayload.type !== 'access') {
      res.status(401).json({
        code: 'INVALID_TOKEN_TYPE',
        message: 'Invalid token type',
      });
      return;
    }

    (req as AuthenticatedRequest).user = {
      id: jwtPayload.sub,
      email: jwtPayload.email,
      role: jwtPayload.role,
    };

    next();
  } catch (error) {
    if (error instanceof jose.errors.JWTExpired) {
      res.status(401).json({
        code: 'TOKEN_EXPIRED',
        message: 'Access token has expired',
      });
      return;
    }

    res.status(401).json({
      code: 'INVALID_TOKEN',
      message: 'Invalid access token',
    });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
      return;
    }

    if (!roles.includes(user.role)) {
      res.status(403).json({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
}
