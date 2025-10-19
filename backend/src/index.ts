import app from './api/app';
import { appConfig } from './config';

const port = appConfig.port;

console.log(`Server starting on port ${port}...`);

export default {
  port,
  fetch: app.fetch,
};
