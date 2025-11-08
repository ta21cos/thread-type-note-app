import { describe, it, expect, beforeAll } from 'vitest';
import { db, notes } from '../../src/db';

const API_BASE_URL = process.env.API_BASE_URL;

// NOTE: Contract test for GET /api/notes/:id/mentions (get notes mentioning this note)
describe('GET /api/notes/:id/mentions', () => {
  beforeAll(async () => {
    // NOTE: Create test data for mention tests
    await db.insert(notes).values({
      id: 'abc123',
      content: 'Note to be mentioned',
      depth: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).onConflictDoNothing();

    await db.insert(notes).values({
      id: 'noment',
      content: 'Note with no mentions',
      depth: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).onConflictDoNothing();
  });

  it('should return list of notes mentioning the specified note', async () => {
    const response = await fetch(`${API_BASE_URL}/api/notes/abc123/mentions`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('mentions');
    expect(Array.isArray(data.mentions)).toBe(true);
  });

  it('should include note object and position in each mention', async () => {
    const response = await fetch(`${API_BASE_URL}/api/notes/abc123/mentions`);
    const data = await response.json();

    expect(response.status).toBe(200);
    if (data.mentions.length > 0) {
      expect(data.mentions[0]).toHaveProperty('note');
      expect(data.mentions[0]).toHaveProperty('position');
      expect(typeof data.mentions[0].position).toBe('number');
    }
  });

  it('should return empty array for note with no mentions', async () => {
    const response = await fetch(`${API_BASE_URL}/api/notes/noment/mentions`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.mentions).toEqual([]);
  });

  it('should return 404 for non-existent note', async () => {
    const response = await fetch(`${API_BASE_URL}/api/notes/999999/mentions`);

    expect(response.status).toBe(404);
  });
});
