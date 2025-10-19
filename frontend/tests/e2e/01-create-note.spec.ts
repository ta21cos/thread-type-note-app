import { test, expect } from '@playwright/test';
import { createNote, selectors, verifyNoteExists } from './setup/test-helpers';

test.describe('Create Note', () => {
  test('should create a new root note', async ({ page }) => {
    // NOTE: Navigate to the app
    await page.goto('/');

    // NOTE: Verify editor is visible
    await expect(page.locator(selectors.noteEditor.textarea)).toBeVisible();

    // NOTE: Create a note with unique content
    const uniqueContent = `Test note created at ${Date.now()}`;
    await createNote(page, uniqueContent);

    // NOTE: Verify note appears in list
    await verifyNoteExists(page, uniqueContent);

    // NOTE: Verify editor is cleared
    const editorContent = await page.locator(selectors.noteEditor.textarea).inputValue();
    expect(editorContent).toBe('');
  });

  test('should display note ID in the list', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create a note with unique content
    const uniqueContent = `Note with ID ${Date.now()}`;
    const noteId = await createNote(page, uniqueContent);

    // NOTE: Verify note ID is visible and has correct format (6 characters)
    const noteIdElement = page.locator(selectors.noteList.itemId, { hasText: `#${noteId}` });
    await expect(noteIdElement).toBeVisible();
    await expect(noteIdElement).toHaveText(/#[a-zA-Z0-9]{6}/);
  });

  test('should not submit empty note', async ({ page }) => {
    await page.goto('/');

    // NOTE: Verify submit button is disabled when editor is empty
    const submitButton = page.locator(selectors.noteEditor.submitButton);
    await expect(submitButton).toBeDisabled();

    // NOTE: Try to submit empty note (button should be disabled)
    await expect(submitButton).toHaveAttribute('disabled', '');
  });

  test('should create multiple notes independently', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create notes with unique timestamps
    const timestamp = Date.now();
    const note1Content = `Independent note 1 ${timestamp}`;
    const note2Content = `Independent note 2 ${timestamp}`;
    const note3Content = `Independent note 3 ${timestamp}`;

    // NOTE: Create first note
    await createNote(page, note1Content);

    // NOTE: Create second note
    await createNote(page, note2Content);

    // NOTE: Create third note
    await createNote(page, note3Content);

    // NOTE: Verify all notes exist (order-independent)
    await verifyNoteExists(page, note1Content);
    await verifyNoteExists(page, note2Content);
    await verifyNoteExists(page, note3Content);
  });
});
