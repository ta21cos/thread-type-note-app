import { describe, it, expect } from 'vitest';

// NOTE: Contract test for DELETE /api/notes/:id (delete note with cascade)
// This test MUST fail until the endpoint is implemented
describe('DELETE /api/notes/:id', () => {
  it('should delete note and return 204', async () => {
    const response = await fetch('http://localhost:3000/api/notes/abc123', {
      method: 'DELETE',
    });

    expect(response.status).toBe(204);
  });

  it('should cascade delete all child notes', async () => {
    // Delete parent
    await fetch('http://localhost:3000/api/notes/parent123', {
      method: 'DELETE',
    });

    // Verify children are also deleted
    const childResponse = await fetch('http://localhost:3000/api/notes/child456');
    expect(childResponse.status).toBe(404);
  });

  it('should return 404 for non-existent note', async () => {
    const response = await fetch('http://localhost:3000/api/notes/999999', {
      method: 'DELETE',
    });

    expect(response.status).toBe(404);
  });
});
