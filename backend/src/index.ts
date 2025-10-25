import app from './api/app';
import { appConfig } from './config';

const port = appConfig.port;

console.log(`Server starting on port ${port}...`);

// NOTE: Database is auto-initialized in db/index.ts for Bun environment

export default {
  port,
  fetch: app.fetch,
};
