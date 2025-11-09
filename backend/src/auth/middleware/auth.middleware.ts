import { getClerkClient } from '../clerk';
import type { MiddlewareHandler } from 'hono';
import type { Bindings, Variables } from '../../worker';

export const requireAuth: MiddlewareHandler<{ Bindings: Bindings; Variables: Variables }> = async (
  c,
  next
) => {
  const CLERK_SECRET_KEY = c.env.CLERK_SECRET_KEY;
  const CLERK_PUBLISHABLE_KEY = c.env.CLERK_PUBLISHABLE_KEY;
  const ALLOWED_ORIGINS = c.env.ALLOWED_ORIGINS;
  const APP_DOMAIN = c.env.APP_DOMAIN;

  const clerkClient = getClerkClient({
    CLERK_SECRET_KEY,
    CLERK_PUBLISHABLE_KEY,
  });

  const { isAuthenticated, toAuth, reason, message } = await clerkClient.authenticateRequest(
    c.req.raw,
    {
      authorizedParties: ALLOWED_ORIGINS.split(','),
      audience: APP_DOMAIN,
      clockSkewInMs: 5000,
    }
  );

  if (!isAuthenticated) {
    console.warn('Authentication failed:', { reason, message });
    return c.json(
      {
        error: 'Unauthorized',
        reason,
        message,
      },
      401
    );
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

export const optionalAuth: MiddlewareHandler = async (c, next) => {
  const env = c.env as any;
  const clerkClient = getClerkClient({
    CLERK_SECRET_KEY: env?.CLERK_SECRET_KEY || process.env.CLERK_SECRET_KEY,
    CLERK_PUBLISHABLE_KEY: env?.CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY,
  });

  const allowedOrigins = env?.ALLOWED_ORIGINS || process.env.ALLOWED_ORIGINS;
  const appDomain = env?.APP_DOMAIN || process.env.APP_DOMAIN;

  const { isAuthenticated, toAuth } = await clerkClient.authenticateRequest(c.req.raw, {
    authorizedParties: allowedOrigins?.split(',') || [],
    audience: appDomain,
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
