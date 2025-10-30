import { Hono } from 'hono';
import app from './api/app';
import { initD1Database } from './db/d1';
import { setDb, type Database } from './db';

// NOTE: Cloudflare Workers environment bindings
export type Bindings = {
  DB: D1Database;
  NODE_ENV?: string;
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
