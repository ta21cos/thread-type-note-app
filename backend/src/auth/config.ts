import type { Bindings } from '../worker';

// NOTE: Auth configuration interface for OIDC broker
export interface AuthConfig {
  idp: {
    issuer: string;
    clientId: string;
    clientSecret: string;
    authorizeUrl: string;
    tokenUrl: string;
    userinfoUrl: string;
    jwksUrl: string;
  };
  self: {
    issuer: string;
    callbackUrl: string;
    accessTokenTtlSec: number;
    refreshTokenTtlSec: number;
    allowedRedirectUris: string[];
  };
}

export const getAuthConfig = (env: Bindings): AuthConfig => {
  if (!env.IDP_ISSUER || !env.IDP_CLIENT_ID) {
    throw new Error('Auth configuration missing required IDP variables');
  }

  return {
    idp: {
      issuer: env.IDP_ISSUER,
      clientId: env.IDP_CLIENT_ID,
      clientSecret: env.IDP_CLIENT_SECRET || '',
      authorizeUrl: env.IDP_AUTHORIZE_URL || `${env.IDP_ISSUER}authorize`,
      tokenUrl: env.IDP_TOKEN_URL || `${env.IDP_ISSUER}oauth/token`,
      userinfoUrl: env.IDP_USERINFO_URL || `${env.IDP_ISSUER}userinfo`,
      jwksUrl: env.IDP_JWKS_URL || `${env.IDP_ISSUER}.well-known/jwks.json`,
    },
    self: {
      issuer: env.SELF_ISSUER || 'https://auth.example.com',
      callbackUrl: env.SELF_CALLBACK_URL || 'https://auth.example.com/auth/callback',
      accessTokenTtlSec: parseInt(env.ACCESS_TOKEN_TTL_SEC || '600'),
      refreshTokenTtlSec: parseInt(env.REFRESH_TOKEN_TTL_SEC || '2592000'),
      allowedRedirectUris: (env.ALLOWED_REDIRECT_URIS || '').split(',').filter(Boolean),
    },
  };
};
