import { Hono } from 'hono';
import syncRoute from './sync';

const app = new Hono();

// NOTE: User management routes
app.route('/sync', syncRoute);

export default app;
