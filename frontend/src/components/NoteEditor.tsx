import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Note } from '../../../shared/types';

interface NoteEditorProps {
  initialContent?: string;
  parentNote?: Note;
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  maxLength?: number;
  autoFocus?: boolean;
  onMentionTrigger?: (searchTerm: string) => void;
  onMentionInsert?: (insertFn: (noteId: string) => void) => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  initialContent = '',
  parentNote,
  onSubmit,
  onCancel,
  placeholder = 'Write a note...',
  maxLength = 1000,
  autoFocus = false,
  onMentionTrigger,
  onMentionInsert,
}) => {
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // NOTE: Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value;

      if (newContent.length > maxLength) {
        setError(`Content exceeds ${maxLength} characters`);
        return;
      }

      setContent(newContent);
      setError(null);
      setCursorPosition(e.target.selectionStart);

      // NOTE: Detect @ mention trigger
      if (onMentionTrigger) {
        const beforeCursor = newContent.slice(0, e.target.selectionStart);
        const mentionMatch = beforeCursor.match(/@(\w*)$/);
        if (mentionMatch) {
          onMentionTrigger(mentionMatch[1]);
        }
      }
    },
    [maxLength, onMentionTrigger]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError('Note content cannot be empty');
      return;
    }

    if (content.length > maxLength) {
      setError(`Content exceeds ${maxLength} characters`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(content.trim());
      setContent('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // NOTE: Submit with Cmd/Ctrl + Enter
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit(e as React.FormEvent);
      }

      // NOTE: Cancel with Escape
      if (e.key === 'Escape' && onCancel) {
        e.preventDefault();
        onCancel();
      }
    },
    [onCancel]
  );

  const insertMention = useCallback((noteId: string) => {
    if (!textareaRef.current) return;

    const beforeCursor = content.slice(0, cursorPosition);
    const afterCursor = content.slice(cursorPosition);

    // NOTE: Replace the partial mention with complete one
    const beforeWithoutPartial = beforeCursor.replace(/@\w*$/, '');
    const newContent = `${beforeWithoutPartial}@${noteId} ${afterCursor}`;

    setContent(newContent);

    // NOTE: Move cursor after the mention
    setTimeout(() => {
      if (textareaRef.current) {
        const newPosition = beforeWithoutPartial.length + noteId.length + 2;
        textareaRef.current.selectionStart = newPosition;
        textareaRef.current.selectionEnd = newPosition;
        textareaRef.current.focus();
      }
    }, 0);
  }, [content, cursorPosition]);

  // NOTE: Expose insertMention function to parent component
  useEffect(() => {
    if (onMentionInsert) {
      onMentionInsert(insertMention);
    }
  }, [onMentionInsert, insertMention]);

  return (
    <div className="note-editor">
      {parentNote && (
        <div className="note-editor__reply-context">
          <span className="note-editor__reply-label">Replying to #{parentNote.id}</span>
          <div className="note-editor__reply-preview">
            {parentNote.content.substring(0, 100)}
            {parentNote.content.length > 100 && '...'}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="note-editor__form">
        <div className="note-editor__input-wrapper">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`note-editor__textarea ${error ? 'note-editor__textarea--error' : ''}`}
            disabled={isSubmitting}
            rows={3}
          />

          <div className="note-editor__footer">
            <div className="note-editor__char-count">
              <span className={content.length > maxLength * 0.9 ? 'text-warning' : ''}>
                {content.length} / {maxLength}
              </span>
            </div>

            <div className="note-editor__actions">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="note-editor__button note-editor__button--cancel"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                className="note-editor__button note-editor__button--submit"
                disabled={isSubmitting || !content.trim() || content.length > maxLength}
              >
                {isSubmitting ? 'Saving...' : parentNote ? 'Reply' : 'Create Note'}
              </button>
            </div>
          </div>

          {error && (
            <div className="note-editor__error">
              {error}
            </div>
          )}
        </div>

        <div className="note-editor__hints">
          <span>Tip: Use @ID to mention other notes • Press Cmd/Ctrl+Enter to submit</span>
        </div>
      </form>
    </div>
  );
};

export default NoteEditor;