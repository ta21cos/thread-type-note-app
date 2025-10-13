import { describe, it, expect } from 'vitest';

// NOTE: Contract test for GET /api/notes/:id (get note with thread)
// This test MUST fail until the endpoint is implemented
describe('GET /api/notes/:id', () => {
  it('should return note details with thread', async () => {
    const response = await fetch('http://localhost:3000/api/notes/abc123?includeThread=true');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('note');
    expect(data).toHaveProperty('thread');
    expect(Array.isArray(data.thread)).toBe(true);
  });

  it('should return only note without thread when includeThread=false', async () => {
    const response = await fetch('http://localhost:3000/api/notes/abc123?includeThread=false');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('note');
    expect(data.thread).toBeUndefined();
  });

  it('should return 404 for non-existent note', async () => {
    const response = await fetch('http://localhost:3000/api/notes/999999');

    expect(response.status).toBe(404);
  });

  it('should validate ID format (6-char alphanumeric)', async () => {
    const response = await fetch('http://localhost:3000/api/notes/invalid-id');

    expect(response.status).toBe(400);
  });
});
