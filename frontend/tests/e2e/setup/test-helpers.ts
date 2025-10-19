import { expect, Page } from '@playwright/test';

// NOTE: Page object selectors for E2E tests

export const selectors = {
  // NOTE: Note Editor
  noteEditor: {
    textarea: '.note-editor__textarea',
    submitButton: '.note-editor__button--submit',
    cancelButton: '.note-editor__button--cancel',
    charCount: '.note-editor__char-count',
    error: '.note-editor__error',
  },

  // NOTE: Note List
  noteList: {
    container: '.note-list',
    items: '.note-item',
    itemContent: '.note-item__content',
    itemId: '.note-item__id',
    selected: '.note-item--selected',
    empty: '.note-list__empty',
    loading: '.note-list__loading',
  },

  // NOTE: Thread View
  threadView: {
    container: '.thread-view',
    node: '.thread-node',
    nodeId: '.thread-node__id',
    nodeContent: '.thread-node__text',
    replyButton: '.thread-node__action:has-text("Reply")',
    editButton: '.thread-node__action:has-text("Edit")',
    deleteButton: '.thread-node__action--delete',
    mention: '.thread-node__mention',
  },

  // NOTE: Search Bar
  searchBar: {
    input: '.search-bar__input',
    clearButton: '.search-bar__clear',
    status: '.search-bar__status',
  },
};

// NOTE: Common test actions

export async function createNote(page: Page, content: string): Promise<string> {
  // NOTE: Listen for API response
  const responsePromise = page.waitForResponse(
    (response) => response.url().includes('/api/notes') && response.request().method() === 'POST',
    { timeout: 5000 }
  );

  await page.fill(selectors.noteEditor.textarea, content);
  await page.click(selectors.noteEditor.submitButton);

  // NOTE: Wait for API response
  const response = await responsePromise;
  const data = await response.json();
  const noteId = data.note?.id || data.id;

  // NOTE: Wait for note to appear in list
  await waitForNoteWithContent(page, content);

  return noteId;
}

export async function waitForNoteWithContent(page: Page, content: string, timeout: number = 5000) {
  await page.waitForFunction(
    ({ contentText, selector }) => {
      const notes = Array.from(document.querySelectorAll(selector));
      return notes.some((note) => {
        const contentEl = note.querySelector('.note-item__content');
        return contentEl?.textContent?.includes(contentText);
      });
    },
    { contentText: content, selector: selectors.noteList.items },
    { timeout }
  );
}

export async function findNoteByContent(page: Page, content: string): Promise<number> {
  const notes = page.locator(selectors.noteList.items);
  const count = await notes.count();

  for (let i = 0; i < count; i++) {
    const noteContent = await notes.nth(i).locator(selectors.noteList.itemContent).textContent();
    if (noteContent?.includes(content)) {
      return i;
    }
  }

  throw new Error(`Note with content "${content}" not found`);
}

export async function replyToNote({
  page,
  content,
}: {
  page: Page;
  content: string;
}): Promise<string> {
  // NOTE: Click reply button on the first visible note in thread
  await page.click(selectors.threadView.replyButton);

  // NOTE: Wait for reply editor to appear
  await page.waitForSelector(selectors.noteEditor.textarea);

  // NOTE: Listen for API response
  const responsePromise = page.waitForResponse(
    (response) => response.url().includes('/api/notes') && response.request().method() === 'POST',
    { timeout: 5000 }
  );

  // NOTE: Fill and submit reply (scope to thread view to avoid main editor)
  const threadView = page.locator(selectors.threadView.container);
  await threadView.locator(selectors.noteEditor.textarea).fill(content);
  await threadView.locator(selectors.noteEditor.submitButton).click();

  // NOTE: Wait for API response
  const response = await responsePromise;
  const data = await response.json();
  const noteId = data.note?.id || data.id;

  // NOTE: Wait for reply to appear in thread
  await page.waitForFunction(
    ({ contentText }) => {
      const nodes = Array.from(document.querySelectorAll('.thread-node__text'));
      return nodes.some((node) => node.textContent?.includes(contentText));
    },
    { contentText: content },
    { timeout: 5000 }
  );

  return noteId;
}

export async function selectNoteFromList(page: Page, noteIndex: number = 0) {
  const notes = page.locator(selectors.noteList.items);
  await notes.nth(noteIndex).click();

  // NOTE: Wait for thread view to load
  await page.waitForSelector(selectors.threadView.container, { timeout: 5000 });
}

export async function selectNoteByContent(page: Page, content: string) {
  const noteIndex = await findNoteByContent(page, content);
  await selectNoteFromList(page, noteIndex);
}

export async function getNoteIdFromList(page: Page, noteIndex: number = 0): Promise<string> {
  const noteId = page.locator(selectors.noteList.items).nth(noteIndex).locator(selectors.noteList.itemId);
  const text = await noteId.textContent();
  return text?.replace('#', '') || '';
}

export async function searchNotes(page: Page, query: string) {
  await page.fill(selectors.searchBar.input, query);

  // NOTE: Wait for search to complete (debounced)
  await page.waitForTimeout(500);
}

export async function clearSearch(page: Page) {
  await page.click(selectors.searchBar.clearButton);

  // NOTE: Wait for full list to return
  await page.waitForTimeout(500);
}

export async function deleteNote(page: Page) {
  // NOTE: This function should NOT set up dialog handler
  // The test should set it up before calling this function
  // to avoid race conditions

  // NOTE: Listen for API response
  const responsePromise = page.waitForResponse(
    (response) => response.url().includes('/api/notes/') && response.request().method() === 'DELETE',
    { timeout: 5000 }
  );

  // NOTE: Click delete button
  await page.click(selectors.threadView.deleteButton);

  // NOTE: Wait for deletion to complete
  await responsePromise;

  // NOTE: Give UI time to update
  await page.waitForTimeout(500);
}

export async function waitForNoteCount(page: Page, expectedCount: number) {
  await page.waitForFunction(
    ({ selector, count }) => {
      const notes = document.querySelectorAll(selector);
      return notes.length === count;
    },
    { selector: selectors.noteList.items, count: expectedCount },
    { timeout: 5000 }
  );
}

export async function getNoteCount(page: Page): Promise<number> {
  const notes = page.locator(selectors.noteList.items);
  return await notes.count();
}

export async function verifyNoteContent(page: Page, content: string, noteIndex?: number) {
  if (noteIndex !== undefined) {
    const noteContent = page.locator(selectors.noteList.items).nth(noteIndex).locator(selectors.noteList.itemContent);
    await expect(noteContent).toContainText(content);
  } else {
    // NOTE: Verify note exists anywhere in the list
    await expect(page.locator(selectors.noteList.itemContent).filter({ hasText: content })).toBeVisible();
  }
}

export async function verifyNoteExists(page: Page, content: string) {
  await expect(page.locator(selectors.noteList.itemContent).filter({ hasText: content })).toBeVisible();
}

export async function verifyThreadNodeContent(page: Page, content: string, nodeIndex: number = 0) {
  const nodeContent = page.locator(selectors.threadView.node).nth(nodeIndex).locator(selectors.threadView.nodeContent);
  await expect(nodeContent).toContainText(content);
}

export async function clickMentionLink(page: Page, noteId: string) {
  await page.click(`.thread-node__mention:has-text("@${noteId}")`);

  // NOTE: Wait for scroll animation
  await page.waitForTimeout(500);
}
