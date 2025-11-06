import { SignJWT, jwtVerify } from 'jose';

// NOTE: JWT token claims structure
export interface TokenClaims {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  jti: string;
  scope?: string;
}

export interface GenerateAccessTokenParams {
  userId: string;
  audience: string;
  ttlSeconds: number;
  issuer: string;
  scope?: string;
  privateKey: CryptoKey;
  kid: string;
}

export const generateAccessToken = async ({
  userId,
  audience,
  ttlSeconds,
  issuer,
  scope,
  privateKey,
  kid,
}: GenerateAccessTokenParams): Promise<string> => {
  const now = Math.floor(Date.now() / 1000);
  const jti = crypto.randomUUID();

  const jwt = await new SignJWT({
    sub: userId,
    aud: audience,
    scope: scope || '',
  })
    .setProtectedHeader({ alg: 'RS256', kid })
    .setIssuer(issuer)
    .setIssuedAt(now)
    .setExpirationTime(now + ttlSeconds)
    .setJti(jti)
    .sign(privateKey);

  return jwt;
};

export interface VerifyAccessTokenParams {
  token: string;
  issuer: string;
  audience: string;
  publicKey: CryptoKey;
}

export const verifyAccessToken = async ({
  token,
  issuer,
  audience,
  publicKey,
}: VerifyAccessTokenParams): Promise<TokenClaims> => {
  const { payload } = await jwtVerify(token, publicKey, {
    issuer,
    audience,
  });

  return payload as TokenClaims;
};
