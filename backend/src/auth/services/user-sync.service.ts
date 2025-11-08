import { db } from '../../db';
import { profiles } from '../../models/profile.schema';
import { externalIdentities } from '../../models/external-identity.schema';
import { eq, and } from 'drizzle-orm';
import { generateId } from '../../utils/id-generator';
import type { SyncUserRequest, SyncUserResponse } from '../types';
import type { ExternalIdentity } from '../../models/external-identity.schema';

// NOTE: Service for syncing OAuth provider users to local database (idempotent)
export class UserSyncService {
  async syncUser({
    provider,
    providerUserId,
    email,
    emailVerified,
    displayName,
    avatarUrl,
    metadata,
    providerCreatedAt,
    providerUpdatedAt,
  }: SyncUserRequest): Promise<SyncUserResponse> {
    const existingIdentity = await this.findIdentity(provider, providerUserId);

    if (existingIdentity) {
      await this.updateProfile(existingIdentity.profileId, {
        displayName,
        avatarUrl,
      });
      await this.updateIdentity(existingIdentity.id, {
        email,
        emailVerified,
        metadata,
        providerUpdatedAt,
      });
      return {
        synced: true,
        profileId: existingIdentity.profileId,
        identityId: existingIdentity.id,
      };
    }

    const profileId = generateId();
    const identityId = generateId();

    await db.insert(profiles).values({
      id: profileId,
      displayName: displayName || email || 'User',
      avatarUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(externalIdentities).values({
      id: identityId,
      provider,
      providerUserId,
      profileId,
      email,
      emailVerified,
      metadata,
      providerCreatedAt: providerCreatedAt ? new Date(providerCreatedAt) : undefined,
      providerUpdatedAt: providerUpdatedAt ? new Date(providerUpdatedAt) : undefined,
      lastSyncedAt: new Date(),
    });

    return { synced: true, profileId, identityId };
  }

  private async findIdentity(
    provider: string,
    providerUserId: string
  ): Promise<ExternalIdentity | undefined> {
    const [identity] = await db
      .select()
      .from(externalIdentities)
      .where(
        and(
          eq(externalIdentities.provider, provider),
          eq(externalIdentities.providerUserId, providerUserId)
        )
      )
      .limit(1);
    return identity;
  }

  private async updateProfile(
    profileId: string,
    { displayName, avatarUrl }: { displayName?: string; avatarUrl?: string }
  ): Promise<void> {
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (displayName !== undefined) {
      updateData.displayName = displayName;
    }
    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl;
    }

    await db.update(profiles).set(updateData).where(eq(profiles.id, profileId));
  }

  private async updateIdentity(
    identityId: string,
    {
      email,
      emailVerified,
      metadata,
      providerUpdatedAt,
    }: {
      email?: string;
      emailVerified?: boolean;
      metadata?: Record<string, unknown>;
      providerUpdatedAt?: string;
    }
  ): Promise<void> {
    const updateData: Record<string, unknown> = {
      lastSyncedAt: new Date(),
    };

    if (email !== undefined) {
      updateData.email = email;
    }
    if (emailVerified !== undefined) {
      updateData.emailVerified = emailVerified;
    }
    if (metadata !== undefined) {
      updateData.metadata = metadata;
    }
    if (providerUpdatedAt !== undefined) {
      updateData.providerUpdatedAt = new Date(providerUpdatedAt);
    }

    await db
      .update(externalIdentities)
      .set(updateData)
      .where(eq(externalIdentities.id, identityId));
  }
}

export const userSyncService = new UserSyncService();
