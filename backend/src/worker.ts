import { Hono } from 'hono';
import app from './api/app';
import { initD1Database } from './db/d1';
import { setDb, type Database } from './db';

// NOTE: Cloudflare Workers environment bindings
export type Bindings = {
  DB: D1Database;
  AUTH_KV: KVNamespace;
  RATE_LIMIT_KV: KVNamespace;
  NODE_ENV?: string;

  // Auth0 / IDP configuration
  IDP_ISSUER?: string;
  IDP_CLIENT_ID?: string;
  IDP_CLIENT_SECRET?: string;
  IDP_AUTHORIZE_URL?: string;
  IDP_TOKEN_URL?: string;
  IDP_USERINFO_URL?: string;
  IDP_JWKS_URL?: string;

  // Self OIDC configuration
  SELF_ISSUER?: string;
  SELF_CALLBACK_URL?: string;
  ACCESS_TOKEN_TTL_SEC?: string;
  REFRESH_TOKEN_TTL_SEC?: string;
  ALLOWED_REDIRECT_URIS?: string;
};

// NOTE: Create Hono app with D1 binding support
const worker = new Hono<{ Bindings: Bindings }>();

// NOTE: Middleware to initialize D1 database per request
// In Cloudflare Workers, we initialize DB for each request as Workers can be distributed
worker.use('*', async (c, next) => {
  // NOTE: Initialize D1 database with binding from Workers environment
  const db = initD1Database(c.env.DB as D1Database);
  setDb(db as Database);

  await next();
});

// NOTE: Mount main app routes
worker.route('/', app);

// NOTE: Export for Cloudflare Workers
export default worker;
