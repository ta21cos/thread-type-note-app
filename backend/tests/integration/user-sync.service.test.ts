import { describe, it, expect, beforeEach } from 'vitest';
import { db, profiles, externalIdentities } from '../../src/db';
import { eq } from 'drizzle-orm';
import { UserSyncService } from '../../src/auth/services/user-sync.service';
import type { SyncUserRequest } from '../../src/auth/types';

// NOTE: Integration tests for UserSyncService
describe('UserSyncService', () => {
  const userSync = new UserSyncService();

  beforeEach(async () => {
    await db.delete(externalIdentities);
    await db.delete(profiles);
  });

  it('should create new profile and identity for new user', async () => {
    const request: SyncUserRequest = {
      provider: 'CLERK',
      providerUserId: 'user_clerk123',
      email: 'newuser@example.com',
      emailVerified: true,
      displayName: 'New User',
      avatarUrl: 'https://example.com/avatar.jpg',
      metadata: { firstName: 'New', lastName: 'User' },
      providerCreatedAt: '2024-01-01T00:00:00Z',
      providerUpdatedAt: '2024-01-01T00:00:00Z',
    };

    const result = await userSync.syncUser(request);

    expect(result.synced).toBe(true);
    expect(result.profileId).toBeDefined();
    expect(result.identityId).toBeDefined();

    const [profile] = await db.select().from(profiles).where(eq(profiles.id, result.profileId));

    expect(profile.displayName).toBe('New User');
    expect(profile.avatarUrl).toBe('https://example.com/avatar.jpg');

    const [identity] = await db
      .select()
      .from(externalIdentities)
      .where(eq(externalIdentities.id, result.identityId));

    expect(identity.provider).toBe('CLERK');
    expect(identity.providerUserId).toBe('user_clerk123');
    expect(identity.profileId).toBe(result.profileId);
    expect(identity.email).toBe('newuser@example.com');
    expect(identity.emailVerified).toBe(true);
    expect(identity.metadata).toEqual({ firstName: 'New', lastName: 'User' });
  });

  it('should update existing profile and identity when syncing again', async () => {
    const initialRequest: SyncUserRequest = {
      provider: 'CLERK',
      providerUserId: 'user_existing',
      email: 'original@example.com',
      displayName: 'Original Name',
      avatarUrl: 'https://example.com/old.jpg',
    };

    const firstSync = await userSync.syncUser(initialRequest);

    const updateRequest: SyncUserRequest = {
      provider: 'CLERK',
      providerUserId: 'user_existing',
      email: 'updated@example.com',
      emailVerified: true,
      displayName: 'Updated Name',
      avatarUrl: 'https://example.com/new.jpg',
      metadata: { updated: true },
      providerUpdatedAt: '2024-01-02T00:00:00Z',
    };

    const secondSync = await userSync.syncUser(updateRequest);

    expect(secondSync.synced).toBe(true);
    expect(secondSync.profileId).toBe(firstSync.profileId);
    expect(secondSync.identityId).toBe(firstSync.identityId);

    const [profile] = await db.select().from(profiles).where(eq(profiles.id, secondSync.profileId));

    expect(profile.displayName).toBe('Updated Name');
    expect(profile.avatarUrl).toBe('https://example.com/new.jpg');

    const [identity] = await db
      .select()
      .from(externalIdentities)
      .where(eq(externalIdentities.id, secondSync.identityId));

    expect(identity.email).toBe('updated@example.com');
    expect(identity.emailVerified).toBe(true);
    expect(identity.metadata).toEqual({ updated: true });
  });

  it('should be idempotent (multiple syncs with same data)', async () => {
    const request: SyncUserRequest = {
      provider: 'CLERK',
      providerUserId: 'user_idempotent',
      email: 'idempotent@example.com',
      displayName: 'Idempotent User',
    };

    const first = await userSync.syncUser(request);
    const second = await userSync.syncUser(request);
    const third = await userSync.syncUser(request);

    expect(second.profileId).toBe(first.profileId);
    expect(second.identityId).toBe(first.identityId);
    expect(third.profileId).toBe(first.profileId);
    expect(third.identityId).toBe(first.identityId);

    const allProfiles = await db.select().from(profiles);
    const allIdentities = await db.select().from(externalIdentities);

    expect(allProfiles).toHaveLength(1);
    expect(allIdentities).toHaveLength(1);
  });

  it('should handle minimal user data (no email, use fallback displayName)', async () => {
    const request: SyncUserRequest = {
      provider: 'GOOGLE',
      providerUserId: 'google_minimal',
    };

    const result = await userSync.syncUser(request);

    expect(result.synced).toBe(true);

    const [profile] = await db.select().from(profiles).where(eq(profiles.id, result.profileId));

    expect(profile.displayName).toBe('User');
  });

  it('should use email as displayName if name not provided', async () => {
    const request: SyncUserRequest = {
      provider: 'AUTH0',
      providerUserId: 'auth0_email_only',
      email: 'emailuser@example.com',
    };

    const result = await userSync.syncUser(request);

    const [profile] = await db.select().from(profiles).where(eq(profiles.id, result.profileId));

    expect(profile.displayName).toBe('emailuser@example.com');
  });

  it('should allow different providers for different users', async () => {
    const clerkUser: SyncUserRequest = {
      provider: 'CLERK',
      providerUserId: 'clerk_user',
      email: 'clerk@example.com',
      displayName: 'Clerk User',
    };

    const googleUser: SyncUserRequest = {
      provider: 'GOOGLE',
      providerUserId: 'google_user',
      email: 'google@example.com',
      displayName: 'Google User',
    };

    const clerkResult = await userSync.syncUser(clerkUser);
    const googleResult = await userSync.syncUser(googleUser);

    expect(clerkResult.profileId).not.toBe(googleResult.profileId);
    expect(clerkResult.identityId).not.toBe(googleResult.identityId);

    const allProfiles = await db.select().from(profiles);
    const allIdentities = await db.select().from(externalIdentities);

    expect(allProfiles).toHaveLength(2);
    expect(allIdentities).toHaveLength(2);
  });

  it('should update lastSyncedAt on every sync', async () => {
    const request: SyncUserRequest = {
      provider: 'CLERK',
      providerUserId: 'user_sync_time',
      email: 'synctime@example.com',
    };

    const first = await userSync.syncUser(request);
    const [firstIdentity] = await db
      .select()
      .from(externalIdentities)
      .where(eq(externalIdentities.id, first.identityId));

    const firstSyncTime = firstIdentity.lastSyncedAt;

    await new Promise((resolve) => setTimeout(resolve, 1000));

    await userSync.syncUser(request);
    const [secondIdentity] = await db
      .select()
      .from(externalIdentities)
      .where(eq(externalIdentities.id, first.identityId));

    const secondSyncTime = secondIdentity.lastSyncedAt;

    expect(secondSyncTime.getTime()).toBeGreaterThan(firstSyncTime.getTime());
  });
});
