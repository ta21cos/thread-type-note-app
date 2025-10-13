import { describe, it, expect } from 'vitest';

// NOTE: Contract test for GET /api/notes/search (search notes)
// This test MUST fail until the endpoint is implemented
describe('GET /api/notes/search', () => {
  it('should search notes by content', async () => {
    const response = await fetch('http://localhost:3000/api/notes/search?q=test&type=content');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('results');
    expect(data).toHaveProperty('total');
    expect(Array.isArray(data.results)).toBe(true);
  });

  it('should search notes by mention', async () => {
    const response = await fetch('http://localhost:3000/api/notes/search?q=abc123&type=mention');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toBeDefined();
  });

  it('should default to content search when type not specified', async () => {
    const response = await fetch('http://localhost:3000/api/notes/search?q=test');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toBeDefined();
  });

  it('should respect limit parameter (default 20)', async () => {
    const response = await fetch('http://localhost:3000/api/notes/search?q=test&limit=5');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results.length).toBeLessThanOrEqual(5);
  });

  it('should require query parameter', async () => {
    const response = await fetch('http://localhost:3000/api/notes/search');

    expect(response.status).toBe(400);
  });
});
