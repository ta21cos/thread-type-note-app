import { Hono } from 'hono';
import { searchService } from '../../services/search.service';
import { validateSearch } from '../middleware/validation';
import type { SearchResponse } from '@thread-note/shared/types';

const app = new Hono();

// GET /api/notes/search - Search notes
app.get('/search', validateSearch, async (c) => {
  const { q, type, limit } = c.req.valid('query');

  let results;
  if (type === 'mention') {
    results = await searchService.searchByMention(q);
  } else {
    results = await searchService.searchByContent(q, limit);
  }

  const response: SearchResponse = {
    results,
    total: results.length,
  };

  return c.json(response);
});

export default app;
