import * as jose from 'jose';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { config } from '../utils/config.js';
import type { User, AuthTokens } from '../types/index.js';

const secret = new TextEncoder().encode(config.jwt.secret);

function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid expiry format: ${expiry}`);

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60,
  };

  return value * multipliers[unit];
}

export async function generateTokens(user: User): Promise<AuthTokens> {
  const accessExpiry = parseExpiry(config.jwt.accessExpiry);
  const refreshExpiry = parseExpiry(config.jwt.refreshExpiry);

  const accessToken = await new jose.SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
    type: 'access',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${accessExpiry}s`)
    .sign(secret);

  const refreshToken = await new jose.SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
    type: 'refresh',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${refreshExpiry}s`)
    .sign(secret);

  // Store refresh token hash
  const tokenHash = await bcrypt.hash(refreshToken, 10);
  await db
    .insertInto('refresh_tokens')
    .values({
      id: uuidv4(),
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + refreshExpiry * 1000),
    })
    .execute();

  return { accessToken, refreshToken };
}

export async function validateCredentials(
  email: string,
  password: string
): Promise<User | null> {
  const userRow = await db
    .selectFrom('users')
    .selectAll()
    .where('email', '=', email)
    .executeTakeFirst();

  if (!userRow) return null;

  const isValid = await bcrypt.compare(password, userRow.password_hash);
  if (!isValid) return null;

  return {
    id: userRow.id,
    email: userRow.email,
    fullName: userRow.full_name,
    role: userRow.role as User['role'],
    createdAt: userRow.created_at.toISOString(),
    updatedAt: userRow.updated_at.toISOString(),
  };
}

export async function refreshTokens(refreshToken: string): Promise<AuthTokens | null> {
  try {
    const { payload } = await jose.jwtVerify(refreshToken, secret, {
      algorithms: ['HS256'],
    });

    if ((payload as { type?: string }).type !== 'refresh') {
      return null;
    }

    const userId = payload.sub as string;

    // Find valid refresh token for user
    const storedTokens = await db
      .selectFrom('refresh_tokens')
      .selectAll()
      .where('user_id', '=', userId)
      .where('revoked_at', 'is', null)
      .where('expires_at', '>', new Date())
      .execute();

    // Find matching token
    let validToken = null;
    for (const token of storedTokens) {
      const matches = await bcrypt.compare(refreshToken, token.token_hash);
      if (matches) {
        validToken = token;
        break;
      }
    }

    if (!validToken) return null;

    // Revoke the used token (rotation)
    await db
      .updateTable('refresh_tokens')
      .set({ revoked_at: new Date() })
      .where('id', '=', validToken.id)
      .execute();

    // Get user
    const userRow = await db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', userId)
      .executeTakeFirst();

    if (!userRow) return null;

    const user: User = {
      id: userRow.id,
      email: userRow.email,
      fullName: userRow.full_name,
      role: userRow.role as User['role'],
      createdAt: userRow.created_at.toISOString(),
      updatedAt: userRow.updated_at.toISOString(),
    };

    return generateTokens(user);
  } catch {
    return null;
  }
}

export async function revokeRefreshToken(refreshToken: string): Promise<boolean> {
  try {
    const { payload } = await jose.jwtVerify(refreshToken, secret, {
      algorithms: ['HS256'],
    });

    const userId = payload.sub as string;

    const storedTokens = await db
      .selectFrom('refresh_tokens')
      .selectAll()
      .where('user_id', '=', userId)
      .where('revoked_at', 'is', null)
      .execute();

    for (const token of storedTokens) {
      const matches = await bcrypt.compare(refreshToken, token.token_hash);
      if (matches) {
        await db
          .updateTable('refresh_tokens')
          .set({ revoked_at: new Date() })
          .where('id', '=', token.id)
          .execute();
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  await db
    .updateTable('refresh_tokens')
    .set({ revoked_at: new Date() })
    .where('user_id', '=', userId)
    .where('revoked_at', 'is', null)
    .execute();
}
