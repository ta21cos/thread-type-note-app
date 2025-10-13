import { describe, it, expect, beforeEach } from 'vitest';
import { db, notes } from '../../src/db';

// NOTE: Integration test for search functionality
// This test MUST fail until services are implemented
describe('Search by Content Scenario', () => {
  beforeEach(async () => {
    await db.delete(notes);
  });

  it('should find notes by content using FTS5', async () => {
    const noteService = await import('../../src/services/note.service');

    await noteService.createNote({ content: 'JavaScript is awesome' });
    await noteService.createNote({ content: 'Python programming' });
    await noteService.createNote({ content: 'JavaScript frameworks' });

    const searchService = await import('../../src/services/search.service');
    const results = await searchService.searchByContent('JavaScript');

    expect(results.length).toBe(2);
    expect(results.every((note) => note.content.includes('JavaScript'))).toBe(true);
  });

  it('should return empty array for no matches', async () => {
    const noteService = await import('../../src/services/note.service');
    await noteService.createNote({ content: 'Test note' });

    const searchService = await import('../../src/services/search.service');
    const results = await searchService.searchByContent('nonexistent');

    expect(results).toEqual([]);
  });

  it('should be case-insensitive', async () => {
    const noteService = await import('../../src/services/note.service');
    await noteService.createNote({ content: 'JavaScript Tutorial' });

    const searchService = await import('../../src/services/search.service');
    const results = await searchService.searchByContent('javascript');

    expect(results.length).toBe(1);
  });
});
