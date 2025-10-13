import { describe, it, expect } from 'vitest';

// NOTE: Contract test for PUT /api/notes/:id (update note)
// This test MUST fail until the endpoint is implemented
describe('PUT /api/notes/:id', () => {
  it('should update note content', async () => {
    const response = await fetch('http://localhost:3000/api/notes/abc123', {
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
    const response = await fetch('http://localhost:3000/api/notes/abc123', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: longContent }),
    });

    expect(response.status).toBe(400);
  });

  it('should reject empty content', async () => {
    const response = await fetch('http://localhost:3000/api/notes/abc123', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: '' }),
    });

    expect(response.status).toBe(400);
  });

  it('should return 404 for non-existent note', async () => {
    const response = await fetch('http://localhost:3000/api/notes/999999', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Test' }),
    });

    expect(response.status).toBe(404);
  });
});
