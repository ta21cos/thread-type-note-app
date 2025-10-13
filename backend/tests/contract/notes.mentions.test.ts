import { describe, it, expect } from 'vitest';

// NOTE: Contract test for GET /api/notes/:id/mentions (get notes mentioning this note)
// This test MUST fail until the endpoint is implemented
describe('GET /api/notes/:id/mentions', () => {
  it('should return list of notes mentioning the specified note', async () => {
    const response = await fetch('http://localhost:3000/api/notes/abc123/mentions');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('mentions');
    expect(Array.isArray(data.mentions)).toBe(true);
  });

  it('should include note object and position in each mention', async () => {
    const response = await fetch('http://localhost:3000/api/notes/abc123/mentions');
    const data = await response.json();

    expect(response.status).toBe(200);
    if (data.mentions.length > 0) {
      expect(data.mentions[0]).toHaveProperty('note');
      expect(data.mentions[0]).toHaveProperty('position');
      expect(typeof data.mentions[0].position).toBe('number');
    }
  });

  it('should return empty array for note with no mentions', async () => {
    const response = await fetch('http://localhost:3000/api/notes/nomention/mentions');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.mentions).toEqual([]);
  });

  it('should return 404 for non-existent note', async () => {
    const response = await fetch('http://localhost:3000/api/notes/999999/mentions');

    expect(response.status).toBe(404);
  });
});
