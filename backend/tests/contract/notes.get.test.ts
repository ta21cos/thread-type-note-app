import { describe, it, expect } from 'vitest';

// NOTE: Contract test for GET /api/notes (list root notes)
// This test MUST fail until the endpoint is implemented
describe('GET /api/notes', () => {
  it('should return paginated list of root notes', async () => {
    const response = await fetch('http://localhost:3000/api/notes?limit=20&offset=0');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('notes');
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('hasMore');
    expect(Array.isArray(data.notes)).toBe(true);
  });

  it('should respect limit parameter (max 100)', async () => {
    const response = await fetch('http://localhost:3000/api/notes?limit=5');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.notes.length).toBeLessThanOrEqual(5);
  });

  it('should return only root notes (no parent)', async () => {
    const response = await fetch('http://localhost:3000/api/notes');
    const data = await response.json();

    data.notes.forEach((note: any) => {
      expect(note.parentId).toBeNull();
    });
  });
});
