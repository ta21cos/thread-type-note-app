import { Hono } from 'hono';
import { noteService } from '../../services/note.service';
import { threadService } from '../../services/thread.service';
import { deleteService } from '../../services/delete.service';
import {
  validateCreateNote,
  validateUpdateNote,
  validateNoteId,
  validatePagination,
} from '../middleware/validation';
import type {
  NoteListResponse,
  NoteDetailResponse,
} from '@thread-note/shared/types';

const app = new Hono();

// GET /api/notes - List root notes
app.get('/', validatePagination, async (c) => {
  const { limit, offset } = c.req.valid('query');
  const result = await noteService.getRootNotes(limit, offset);

  const response: NoteListResponse = {
    notes: result.notes,
    total: result.total,
    hasMore: result.hasMore,
  };

  return c.json(response);
});

// POST /api/notes - Create note
app.post('/', validateCreateNote, async (c) => {
  const data = c.req.valid('json');
  const note = await noteService.createNote(data);
  return c.json(note, 201);
});

// GET /api/notes/:id - Get note with thread
app.get('/:id', validateNoteId, async (c) => {
  const { id } = c.req.valid('param');
  const includeThread = c.req.query('includeThread') !== 'false';

  const note = await noteService.getNoteById(id);
  if (!note) {
    return c.json({ error: 'Not Found', message: 'Note not found' }, 404);
  }

  const response: NoteDetailResponse = includeThread
    ? {
        note,
        thread: await threadService.getThread(id),
      }
    : {
        note,
        thread: undefined as unknown, // NOTE: Don't include thread property when not requested
      };

  // Remove undefined properties
  if (response.thread === undefined) {
    delete (response as Record<string, unknown>).thread;
  }

  return c.json(response);
});

// PUT /api/notes/:id - Update note
app.put('/:id', validateNoteId, validateUpdateNote, async (c) => {
  const { id } = c.req.valid('param');
  const data = c.req.valid('json');

  const updated = await noteService.updateNote(id, data);
  return c.json(updated);
});

// DELETE /api/notes/:id - Delete note (cascade)
app.delete('/:id', validateNoteId, async (c) => {
  const { id } = c.req.valid('param');
  await deleteService.deleteNote(id);
  return c.body(null, 204);
});

export default app;
