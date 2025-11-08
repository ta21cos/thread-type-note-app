import { describe, it, expect, beforeAll } from 'vitest';
import { db, notes } from '../../src/db';
import { eq } from 'drizzle-orm';

const API_BASE_URL = process.env.API_BASE_URL;

// NOTE: Contract test for PUT /api/notes/:id (update note)
describe('PUT /api/notes/:id', () => {
  beforeAll(async () => {
    // NOTE: Ensure test note exists for update tests
    const existing = await db.select().from(notes).where(eq(notes.id, 'abc123'));
    if (existing.length === 0) {
      await db.insert(notes).values({
        id: 'abc123',
        content: 'Original content',
        depth: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  });

  it('should update note content', async () => {
    const response = await fetch(`${API_BASE_URL}/api/notes/abc123`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Updated content' }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.content).toBe('Updated content');
    expect(data).toHaveProperty('updatedAt');
  });

  it('should reject content exceeding 1000 characters', async () => {
    const longContent = 'a'.repeat(1001);
    const response = await fetch(`${API_BASE_URL}/api/notes/abc123`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: longContent }),
    });

    expect(response.status).toBe(400);
  });

  it('should reject empty content', async () => {
    const response = await fetch(`${API_BASE_URL}/api/notes/abc123`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: '' }),
    });

    expect(response.status).toBe(400);
  });

  it('should return 404 for non-existent note', async () => {
    const response = await fetch(`${API_BASE_URL}/api/notes/999999`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Test' }),
    });

    expect(response.status).toBe(404);
  });
});
