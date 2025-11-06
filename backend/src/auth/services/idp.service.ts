import { jwtVerify, createRemoteJWKSet } from 'jose';
import type { AuthConfig } from '../config';

// NOTE: Auth0 token response structure
export interface Auth0TokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
}

export interface ExchangeCodeParams {
  code: string;
  redirectUri: string;
  config: AuthConfig;
}

export const exchangeCodeForTokens = async ({
  code,
  redirectUri,
  config,
}: ExchangeCodeParams): Promise<Auth0TokenResponse> => {
  const response = await fetch(config.idp.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: config.idp.clientId,
      client_secret: config.idp.clientSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Auth0 token exchange failed: ${error}`);
  }

  return (await response.json()) as Auth0TokenResponse;
};

// NOTE: Auth0 ID token claims
export interface IdTokenClaims {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  nonce?: string;
  email?: string;
  email_verified?: boolean;
}

export interface ValidateIdTokenParams {
  idToken: string;
  expectedNonce: string;
  config: AuthConfig;
}

export const validateIdToken = async ({
  idToken,
  expectedNonce,
  config,
}: ValidateIdTokenParams): Promise<IdTokenClaims> => {
  const JWKS = createRemoteJWKSet(new URL(config.idp.jwksUrl));

  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: config.idp.issuer,
    audience: config.idp.clientId,
  });

  // NOTE: Verify nonce to prevent replay attacks
  if (payload.nonce !== expectedNonce) {
    throw new Error('ID token nonce mismatch');
  }

  return payload as IdTokenClaims;
};
