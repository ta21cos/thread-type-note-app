import { Hono } from 'hono';
import { userSyncService } from '../../../auth/services/user-sync.service';
import { IDENTITY_PROVIDERS } from '../../../models/external-identity.schema';
import type { SyncUserRequest } from '../../../auth/types';

const app = new Hono();

// NOTE: Provider type guard for validation
const isValidProvider = (value: unknown): value is string =>
  typeof value === 'string' &&
  IDENTITY_PROVIDERS.includes(value as (typeof IDENTITY_PROVIDERS)[number]);

// POST /api/users/sync - Sync OAuth provider user to local database
app.post('/', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400);
  }

  if (!body || typeof body !== 'object') {
    return c.json({ error: 'Request body must be an object' }, 400);
  }

  const { provider, providerUserId } = body as Record<string, unknown>;

  if (!isValidProvider(provider)) {
    return c.json({ error: 'Invalid provider' }, 400);
  }

  if (typeof providerUserId !== 'string' || !providerUserId) {
    return c.json({ error: 'providerUserId is required' }, 400);
  }

  try {
    const result = await userSyncService.syncUser(body as SyncUserRequest);
    return c.json(result);
  } catch (error) {
    console.error('User sync failed:', error);
    return c.json({ error: 'Sync failed' }, 500);
  }
});

export default app;
