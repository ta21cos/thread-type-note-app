import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import type { ClerkClient } from '@clerk/backend';
import app from '../../src/api/app';
import { db } from '../../src/db';
import { profiles } from '../../src/models/profile.schema';
import { externalIdentities } from '../../src/models/external-identity.schema';

interface SyncResponse {
  synced: boolean;
  profileId: string;
  identityId: string;
}

interface ErrorResponse {
  error: string;
  message: string;
}

// NOTE: Mock Clerk authentication
beforeAll(() => {
  process.env.CLERK_SECRET_KEY = 'sk_test_mock';
  process.env.CLERK_PUBLISHABLE_KEY = 'pk_test_mock';
});

// NOTE: Mock the getClerkClient function
const mockAuthenticateRequest = vi.fn();
const mockClerkClient: Partial<ClerkClient> = {
  authenticateRequest: mockAuthenticateRequest,
};

vi.mock('../../src/auth/clerk', () => ({
  getClerkClient: () => mockClerkClient,
}));

describe('POST /api/users/sync', () => {
  beforeEach(async () => {
    await db.delete(externalIdentities);
    await db.delete(profiles);
    vi.clearAllMocks();

    // NOTE: Mock successful authentication by default
    mockAuthenticateRequest.mockResolvedValue({
      isAuthenticated: true,
      toAuth: () => ({ userId: 'user_test', sessionId: 'sess_test' }),
    });
  });

  afterEach(async () => {
    await db.delete(externalIdentities);
    await db.delete(profiles);
  });

  it('should require authentication', async () => {
    // NOTE: Mock failed authentication
    mockAuthenticateRequest.mockResolvedValue({
      isAuthenticated: false,
      reason: 'token-invalid',
      message: 'Invalid token',
      toAuth: () => ({ userId: null, sessionId: null }),
    });

    const res = await app.request('/api/users/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'CLERK',
        providerUserId: 'user_test',
      }),
    });

    expect(res.status).toBe(401);
  });

  it('should sync new user successfully', async () => {
    const syncData = {
      provider: 'CLERK',
      providerUserId: 'user_test123',
      email: 'test@example.com',
      emailVerified: true,
      displayName: 'Test User',
      avatarUrl: 'https://example.com/avatar.jpg',
      metadata: {
        firstName: 'Test',
        lastName: 'User',
      },
    };

    const res = await app.request('/api/users/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(syncData),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as SyncResponse | ErrorResponse;

    expect((body as SyncResponse).synced).toBe(true);
    expect((body as SyncResponse).profileId).toBeTruthy();
    expect((body as SyncResponse).identityId).toBeTruthy();

    // NOTE: Verify database records created
    const allProfiles = await db.select().from(profiles);
    expect(allProfiles.length).toBe(1);

    const allIdentities = await db.select().from(externalIdentities);
    expect(allIdentities.length).toBe(1);
  });

  it('should return 400 when provider is missing', async () => {
    const res = await app.request('/api/users/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerUserId: 'user_test',
      }),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as SyncResponse | ErrorResponse;
    expect((body as ErrorResponse).error).toBe('Bad Request');
    expect((body as ErrorResponse).message).toContain('provider');
  });

  it('should return 400 when providerUserId is missing', async () => {
    const res = await app.request('/api/users/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'CLERK',
      }),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as SyncResponse | ErrorResponse;
    expect((body as ErrorResponse).error).toBe('Bad Request');
    expect((body as ErrorResponse).message).toContain('providerUserId');
  });

  it('should return 400 when provider is invalid', async () => {
    const res = await app.request('/api/users/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'INVALID_PROVIDER',
        providerUserId: 'user_test',
      }),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as SyncResponse | ErrorResponse;
    expect((body as ErrorResponse).error).toBe('Bad Request');
    expect((body as ErrorResponse).message).toContain('Invalid provider');
  });

  it('should handle idempotent sync (update existing user)', async () => {
    const initialData = {
      provider: 'CLERK',
      providerUserId: 'user_idempotent',
      displayName: 'Initial Name',
      email: 'initial@example.com',
    };

    // NOTE: First sync
    const firstRes = await app.request('/api/users/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(initialData),
    });

    expect(firstRes.status).toBe(200);
    const firstBody = await firstRes.json();

    // NOTE: Second sync with updated data
    const updatedData = {
      ...initialData,
      displayName: 'Updated Name',
      email: 'updated@example.com',
    };

    const secondRes = await app.request('/api/users/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData),
    });

    expect(secondRes.status).toBe(200);
    const secondBody = (await secondRes.json()) as SyncResponse;

    // NOTE: Should return same IDs
    expect(secondBody.profileId).toBe((firstBody as SyncResponse).profileId);
    expect(secondBody.identityId).toBe((firstBody as SyncResponse).identityId);

    // NOTE: Should only have one profile
    const allProfiles = await db.select().from(profiles);
    expect(allProfiles.length).toBe(1);

    // NOTE: Should only have one identity
    const allIdentities = await db.select().from(externalIdentities);
    expect(allIdentities.length).toBe(1);
  });

  it('should handle optional fields gracefully', async () => {
    const minimalData = {
      provider: 'CLERK',
      providerUserId: 'user_minimal',
    };

    const res = await app.request('/api/users/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(minimalData),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as SyncResponse | ErrorResponse;

    expect((body as SyncResponse).synced).toBe(true);
    expect((body as SyncResponse).profileId).toBeTruthy();
    expect((body as SyncResponse).identityId).toBeTruthy();
  });

  it('should handle all supported providers', async () => {
    const providers = ['CLERK', 'AUTH0', 'GOOGLE', 'GITHUB'];

    for (const provider of providers) {
      const res = await app.request('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          providerUserId: `user_${provider.toLowerCase()}`,
          displayName: `${provider} User`,
        }),
      });

      expect(res.status).toBe(200);
    }

    // NOTE: Should have created 4 profiles
    const allProfiles = await db.select().from(profiles);
    expect(allProfiles.length).toBe(4);
  });
});
