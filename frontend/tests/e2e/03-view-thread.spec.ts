import { test, expect } from '@playwright/test';
import { createNote, selectNoteByContent, replyToNote, selectors } from './setup/test-helpers';

test.describe('View Thread', () => {
  test('should display thread view when note is selected', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create a note with unique content
    const timestamp = Date.now();
    const noteContent = `Test note for thread view ${timestamp}`;

    await createNote(page, noteContent);

    // NOTE: Select the note
    await selectNoteByContent(page, noteContent);

    // NOTE: Verify thread view is displayed
    await expect(page.locator(selectors.threadView.container)).toBeVisible();

    // NOTE: Verify thread header
    await expect(page.locator('.thread-view__header')).toContainText('Thread');
  });

  test('should show empty state when no note is selected', async ({ page }) => {
    await page.goto('/');

    // NOTE: Verify empty state is shown (before any note is selected)
    await expect(page.locator('.notes-page__empty')).toBeVisible();
    await expect(page.locator('.notes-page__empty')).toContainText('Select a note');
  });

  test('should display note content in thread view', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create a note with unique specific content
    const timestamp = Date.now();
    const noteContent = `This is my thread content ${timestamp}`;
    await createNote(page, noteContent);

    // NOTE: Select the note
    await selectNoteByContent(page, noteContent);

    // NOTE: Verify content is displayed in thread view
    const threadContent = page.locator(selectors.threadView.node).first().locator(selectors.threadView.nodeContent);
    await expect(threadContent).toContainText(noteContent);
  });

  test('should display chronological ordering in thread', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create root note with unique content
    const timestamp = Date.now();
    const rootContent = `Root note ${timestamp}`;
    const reply1Content = `First reply ${timestamp}`;
    const reply2Content = `Second reply ${timestamp}`;
    const reply3Content = `Third reply ${timestamp}`;

    await createNote(page, rootContent);

    // NOTE: Select and create replies
    await selectNoteByContent(page, rootContent);
    await replyToNote({ page, content: reply1Content });
    await replyToNote({ page, content: reply2Content });
    await replyToNote({ page, content: reply3Content });

    // NOTE: Get all thread nodes
    const threadNodes = page.locator(selectors.threadView.nodeContent);

    // NOTE: Verify order (oldest to newest)
    await expect(threadNodes.nth(0)).toContainText(rootContent);
    await expect(threadNodes.nth(1)).toContainText(reply1Content);
    await expect(threadNodes.nth(2)).toContainText(reply2Content);
    await expect(threadNodes.nth(3)).toContainText(reply3Content);
  });

  test('should highlight selected note in list', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create multiple notes with unique content
    const timestamp = Date.now();
    const note1Content = `Note 1 ${timestamp}`;
    const note2Content = `Note 2 ${timestamp}`;
    const note3Content = `Note 3 ${timestamp}`;

    await createNote(page, note1Content);
    await createNote(page, note2Content);
    await createNote(page, note3Content);

    // NOTE: Select second note
    await selectNoteByContent(page, note2Content);

    // NOTE: Verify second note is highlighted
    const selectedNote = page.locator(selectors.noteList.selected);
    await expect(selectedNote).toBeVisible();
    await expect(selectedNote).toContainText(note2Content);
  });

  test('should show note count in thread header', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create root note with unique content
    const timestamp = Date.now();
    const rootContent = `Root ${timestamp}`;
    const reply1Content = `Reply 1 ${timestamp}`;
    const reply2Content = `Reply 2 ${timestamp}`;

    await createNote(page, rootContent);

    // NOTE: Select and add replies
    await selectNoteByContent(page, rootContent);
    await replyToNote({ page, content: reply1Content });
    await replyToNote({ page, content: reply2Content });

    // NOTE: Verify note count (1 root + 2 replies = 3 notes)
    const threadCount = page.locator('.thread-view__count');
    await expect(threadCount).toContainText('3 notes');
  });

  test('should display action buttons in thread', async ({ page }) => {
    await page.goto('/');

    // NOTE: Create and select note with unique content
    const timestamp = Date.now();
    const noteContent = `Test note for actions ${timestamp}`;

    await createNote(page, noteContent);
    await selectNoteByContent(page, noteContent);

    // NOTE: Verify action buttons are present
    await expect(page.locator(selectors.threadView.replyButton)).toBeVisible();
    await expect(page.locator(selectors.threadView.editButton)).toBeVisible();
    await expect(page.locator(selectors.threadView.deleteButton)).toBeVisible();
  });
});
