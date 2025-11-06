// NOTE: PKCE (Proof Key for Code Exchange) verification service

export interface PKCEVerifyParams {
  codeVerifier: string;
  codeChallenge: string;
  method?: 'S256';
}

export const verifyPKCE = async ({
  codeVerifier,
  codeChallenge,
  method = 'S256',
}: PKCEVerifyParams): Promise<boolean> => {
  if (method !== 'S256') {
    throw new Error('Only S256 PKCE method is supported');
  }

  // NOTE: Verify code_verifier length constraints (43-128 characters)
  if (codeVerifier.length < 43 || codeVerifier.length > 128) {
    throw new Error('Code verifier must be between 43 and 128 characters');
  }

  // NOTE: SHA256(code_verifier) -> base64url
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hash);

  // NOTE: Base64url encode (no padding, replace +/ with -_)
  const base64url = btoa(String.fromCharCode(...hashArray))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return base64url === codeChallenge;
};
