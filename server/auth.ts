import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { env } from './env.js';
import { prisma } from './db.js';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string | null;
};

const COOKIE = 'mt_session';

export const hashPassword = (plain: string) => bcrypt.hash(plain, 12);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

export const signUser = (user: AuthUser) =>
  jwt.sign(user, env.jwtSecret, { expiresIn: '7d' });

export const setSession = (reply: FastifyReply, user: AuthUser) => {
  reply.setCookie(COOKIE, signUser(user), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProd,
    maxAge: 60 * 60 * 24 * 7,
  });
};

export const clearSession = (reply: FastifyReply) => {
  reply.clearCookie(COOKIE, { path: '/' });
};

export const readUser = (request: FastifyRequest): AuthUser | null => {
  const token = request.cookies[COOKIE];
  if (!token) return null;
  try {
    return jwt.verify(token, env.jwtSecret) as AuthUser;
  } catch {
    return null;
  }
};

export const requireUser = (request: FastifyRequest) => {
  const user = readUser(request);
  if (!user) {
    const err = new Error('Please sign in to continue');
    (err as Error & { statusCode?: number }).statusCode = 401;
    throw err;
  }
  return user;
};

export const requireRole = (request: FastifyRequest, roles: string[]) => {
  const user = requireUser(request);
  if (user.role === 'PLATFORM_ADMIN') return user;
  if (!roles.includes(user.role)) {
    const err = new Error('You do not have access to this area');
    (err as Error & { statusCode?: number }).statusCode = 403;
    throw err;
  }
  return user;
};

export const toAuth = (user: {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string | null;
}): AuthUser => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  tenantId: user.tenantId,
});

export const loadUser = (id: string) =>
  prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, tenantId: true, phone: true },
  });
