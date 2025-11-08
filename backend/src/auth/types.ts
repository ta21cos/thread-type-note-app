// NOTE: Type definitions for auth domain - provider-agnostic user sync

export interface SyncUserRequest {
  provider: string;
  providerUserId: string;
  email?: string;
  emailVerified?: boolean;
  displayName?: string;
  avatarUrl?: string;
  metadata?: Record<string, unknown>;
  providerCreatedAt?: string;
  providerUpdatedAt?: string;
}

export interface SyncUserResponse {
  synced: boolean;
  profileId: string;
  identityId: string;
}
