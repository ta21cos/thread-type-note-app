import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import notesRoutes from './routes/notes';
import searchRoutes from './routes/search';
import mentionsRoutes from './routes/mentions';
import { errorHandler } from './middleware/error';

// NOTE: Hono app instance and router setup
const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Routes
app.route('/api/notes', notesRoutes);
app.route('/api/notes', searchRoutes);
app.route('/api/notes', mentionsRoutes);

// Error handling
app.onError(errorHandler);

export default app;
