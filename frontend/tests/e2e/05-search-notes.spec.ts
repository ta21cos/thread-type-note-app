import { test, expect } from '@playwright/test';
import {
  createNote,
  searchNotes,
  clearSearch,
  selectors,
  verifyNoteExists,
} from './setup/test-helpers';

test.describe('Search Notes', () => {
  test('should display search bar', async ({ page }) => {
    await page.goto('/');

    // NOTE: Verify search bar is visible
    await expect(page.locator(selectors.searchBar.input)).toBeVisible();
  });

  test('should filter notes by content', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create notes with unique identifiable content (using random to ensure uniqueness across parallel tests)
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const searchTerm = `UniqueSearch_${uniqueId}`;
    const note1 = `${searchTerm} JavaScript is awesome`;
    const note2 = `Python is great ${uniqueId}`;
    const note3 = `TypeScript rocks ${uniqueId}`;

    await createNote(page, note1);
    await createNote(page, note2);
    await createNote(page, note3);

    // NOTE: Wait for all notes to be created
    await verifyNoteExists(page, note1);

    // NOTE: Search for unique term
    await searchNotes(page, searchTerm);

    // NOTE: Verify only matching note is displayed
    await expect(
      page.locator(selectors.noteList.itemContent).filter({ hasText: note1 })
    ).toBeVisible();

    // NOTE: Verify only one note is shown
    const allVisibleNotes = page.locator(selectors.noteList.itemContent);
    await expect(allVisibleNotes).toHaveCount(1);
  });

  test('should show all notes when search is cleared', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create multiple notes with unique content
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const searchTerm = `Searchable_${uniqueId}`;
    const note1 = `${searchTerm} First note`;
    const note2 = `Second note ${uniqueId}`;
    const note3 = `Third note ${uniqueId}`;

    await createNote(page, note1);
    await createNote(page, note2);
    await createNote(page, note3);

    // NOTE: Perform search
    await searchNotes(page, searchTerm);

    // NOTE: Verify filtered results
    const filteredNotes = page.locator(selectors.noteList.itemContent);
    await expect(filteredNotes).toHaveCount(1);

    // NOTE: Clear search
    await clearSearch(page);

    // NOTE: Verify all 3 notes are visible again
    await verifyNoteExists(page, note1);
    await verifyNoteExists(page, note2);
    await verifyNoteExists(page, note3);
  });

  test('should update note count when searching', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create notes with unique content
    const timestamp = Date.now();
    const searchQuery = `SearchStatus${timestamp}`;
    const note1 = `Test content with ${searchQuery}`;
    const note2 = `Other note ${timestamp}`;

    await createNote(page, note1);
    await createNote(page, note2);

    // NOTE: Wait for notes to be visible
    await verifyNoteExists(page, note1);
    await verifyNoteExists(page, note2);

    // NOTE: Perform search
    await searchNotes(page, searchQuery);

    // NOTE: Verify only one note is shown
    const visibleNotes = page.locator(selectors.noteList.itemContent);
    await expect(visibleNotes).toHaveCount(1);

    // NOTE: Verify note count updates to show filtered results
    const filteredCount = await page.locator(selectors.searchBar.status).textContent();
    expect(filteredCount).toContain('1');
  });

  test('should handle no search results', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create note with unique content
    const timestamp = Date.now();
    const noteContent = `Available note ${timestamp}`;

    await createNote(page, noteContent);
    await verifyNoteExists(page, noteContent);

    // NOTE: Search for non-existent unique content (very specific to avoid matches)
    const nonExistentQuery = `zzzneverexistingqueryzzzz${timestamp}xyz123`;
    await searchNotes(page, nonExistentQuery);

    // NOTE: Verify no results
    const notes = page.locator(selectors.noteList.itemContent);
    await expect(notes).toHaveCount(0);
  });

  test('should search case-insensitively', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create note with unique mixed case content
    const timestamp = Date.now();
    const uniqueTerm = `CaseTEST${timestamp}`;
    const noteContent = `This is a ${uniqueTerm} note`;

    await createNote(page, noteContent);

    // NOTE: Search with lowercase
    await searchNotes(page, uniqueTerm.toLowerCase());

    // NOTE: Verify note is found
    await verifyNoteExists(page, noteContent);

    // NOTE: Clear and search with uppercase
    await clearSearch(page);
    await searchNotes(page, uniqueTerm.toUpperCase());

    // NOTE: Verify note is still found
    await verifyNoteExists(page, noteContent);
  });

  test('should search partial matches', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create note with unique content
    const timestamp = Date.now();
    const fullTerm = `JavaScriptFrameworks${timestamp}`;
    const noteContent = `Testing ${fullTerm} here`;

    await createNote(page, noteContent);

    // NOTE: Search with partial unique term
    const partialTerm = `Frameworks${timestamp}`;
    await searchNotes(page, partialTerm);

    // NOTE: Verify note is found
    await verifyNoteExists(page, noteContent);
  });

  test('should clear search by emptying input', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create notes with unique content
    const timestamp = Date.now();
    const searchTerm = `ClearTest${timestamp}`;
    const note1 = `${searchTerm} First`;
    const note2 = `Second ${timestamp}`;

    await createNote(page, note1);
    await createNote(page, note2);

    // NOTE: Perform search
    await searchNotes(page, searchTerm);

    // NOTE: Verify only one note is shown
    const filteredNotes = page.locator(selectors.noteList.itemContent);
    await expect(filteredNotes).toHaveCount(1);

    // NOTE: Clear search by emptying input
    await clearSearch(page);

    // NOTE: Verify search input is cleared
    const inputValue = await page.locator(selectors.searchBar.input).inputValue();
    expect(inputValue).toBe('');

    // NOTE: Verify both notes are shown
    await verifyNoteExists(page, note1);
    await verifyNoteExists(page, note2);
  });
});
