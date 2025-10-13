import { Hono } from 'hono';
import { mentionService } from '../../services/mention.service';
import { validateNoteId } from '../middleware/validation';
import type { MentionsResponse } from '@thread-note/shared/types';

const app = new Hono();

// GET /api/notes/:id/mentions - Get notes mentioning this note
app.get('/:id/mentions', validateNoteId, async (c) => {
  const { id } = c.req.valid('param');

  // NOTE: Check if note exists first
  const { noteService } = await import('../../services/note.service');
  const note = await noteService.getNoteById(id);
  if (!note) {
    return c.json({ error: 'Not Found', message: 'Note not found' }, 404);
  }

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
