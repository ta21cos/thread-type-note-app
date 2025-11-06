// NOTE: Refresh token hashing and verification using PBKDF2

export interface HashRefreshTokenParams {
  token: string;
  salt?: string;
}

export const hashRefreshToken = async ({ token, salt }: HashRefreshTokenParams): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(token + (salt || ''));

  // NOTE: Use PBKDF2 with 100k iterations for security
  const keyMaterial = await crypto.subtle.importKey('raw', data, 'PBKDF2', false, ['deriveBits']);

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode('refresh-token-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const hashArray = new Uint8Array(derivedBits);
  return btoa(String.fromCharCode(...hashArray));
};

export interface VerifyRefreshTokenParams {
  token: string;
  hash: string;
}

export const verifyRefreshToken = async ({ token, hash }: VerifyRefreshTokenParams): Promise<boolean> => {
  const computedHash = await hashRefreshToken({ token });
  return computedHash === hash;
};
