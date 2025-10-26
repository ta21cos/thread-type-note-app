import app from './api/app';
import { appConfig } from './config';
import { initBunDatabase } from './db/bun';
import { setDb } from './db';

const port = appConfig.port;

console.log(`Server starting on port ${port}...`);

// NOTE: Initialize Bun SQLite database for local development
const bunDb = initBunDatabase(appConfig.databaseUrl);
setDb(bunDb);

export default {
  port,
  fetch: app.fetch,
};
