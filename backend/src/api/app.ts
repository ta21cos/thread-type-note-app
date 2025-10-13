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

// Routes - Order matters! Specific routes before generic ones
app.route('/api/notes', searchRoutes);  // /search route
app.route('/api/notes', mentionsRoutes); // /:id/mentions route
app.route('/api/notes', notesRoutes);   // /:id route (must be last)

// Error handling
app.onError(errorHandler);

export default app;
