// NOTE: Shared TypeScript interfaces for Note entities
export interface Note {
  id: string; // 6-char alphanumeric ID
  content: string; // Markdown content (max 1000 chars)
  parentId?: string; // Reference to parent note (null for root)
  createdAt: Date;
  updatedAt: Date;
  depth: number; // Thread depth (0 for root)
}

export interface Mention {
  id: string;
  fromNoteId: string;
  toNoteId: string;
  position: number; // Character position in content
  createdAt: Date;
}

export interface SearchIndex {
  noteId: string;
  content: string; // Preprocessed for search
  tokens: string[];
  mentions: string[];
  updatedAt: Date;
}

// NOTE: API request/response types
export interface CreateNoteRequest {
  content: string;
  parentId?: string;
}

export interface UpdateNoteRequest {
  content: string;
}

export interface NoteListResponse {
  notes: Note[];
  total: number;
  hasMore: boolean;
}

export interface NoteDetailResponse {
  note: Note;
  thread: Note[];
}

export interface SearchResponse {
  results: Note[];
  total: number;
}

export interface MentionsResponse {
  mentions: Array<{
    note: Note;
    position: number;
  }>;
}

export interface ErrorResponse {
  error: string;
  message: string;
  details?: unknown;
}
