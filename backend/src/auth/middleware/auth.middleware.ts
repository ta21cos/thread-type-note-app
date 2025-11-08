import { clerkClient } from '../clerk';
import type { Context, Next } from 'hono';

export const requireAuth = async (c: Context, next: Next) => {
  const { isAuthenticated, toAuth, reason, message } =
    await clerkClient.authenticateRequest(c.req.raw, {
      authorizedParties: process.env.ALLOWED_ORIGINS?.split(',') || [],
      audience: process.env.APP_DOMAIN,
      clockSkewInMs: 5000,
    });

  if (!isAuthenticated) {
    console.warn('Authentication failed:', { reason, message });
    return c.json({
      error: 'Unauthorized',
      reason,
      message
    }, 401);
  }

  const auth = toAuth();

  if (!auth.userId) {
    return c.json({ error: 'Invalid session' }, 401);
  }

  // NOTE: Set userId in context for downstream handlers
  c.set('userId', auth.userId);
  c.set('sessionId', auth.sessionId);

  await next();
};

export const optionalAuth = async (c: Context, next: Next) => {
  const { isAuthenticated, toAuth } =
    await clerkClient.authenticateRequest(c.req.raw, {
      authorizedParties: process.env.ALLOWED_ORIGINS?.split(',') || [],
      audience: process.env.APP_DOMAIN,
      clockSkewInMs: 5000,
    });

  if (isAuthenticated) {
    const auth = toAuth();
    if (auth.userId) {
      c.set('userId', auth.userId);
      c.set('sessionId', auth.sessionId);
    }
  }

  await next();
};
