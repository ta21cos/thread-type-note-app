import { Hono } from 'hono';
import { mentionService } from '../../services/mention.service';
import { validateNoteId } from '../middleware/validation';
import type { MentionsResponse } from '@thread-note/shared/types';

const app = new Hono();

// GET /api/notes/:id/mentions - Get notes mentioning this note
app.get('/:id/mentions', validateNoteId, async (c) => {
  const { id } = c.req.valid('param');
  const mentionsWithNotes = await mentionService.getMentionsWithNotes(id);

  const response: MentionsResponse = {
    mentions: mentionsWithNotes.map((m) => ({
      note: m.note,
      position: m.mention.position,
    })),
  };

  return c.json(response);
});

export default app;
