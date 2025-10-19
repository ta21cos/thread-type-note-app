import React, { useEffect, useRef, useCallback } from 'react';
import { Note } from '../../../shared/types';

interface NoteListProps {
  notes: Note[];
  selectedNoteId?: string;
  onNoteSelect: (noteId: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
}

export const NoteList: React.FC<NoteListProps> = ({
  notes,
  selectedNoteId,
  onNoteSelect,
  onLoadMore,
  hasMore = false,
  loading = false,
}) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // NOTE: Infinite scroll implementation
  useEffect(() => {
    if (!hasMore || !onLoadMore) return;

    const callback: IntersectionObserverCallback = (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && !loading) {
        onLoadMore();
      }
    };

    observerRef.current = new IntersectionObserver(callback, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    });

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, onLoadMore]);

  const handleNoteClick = useCallback(
    (noteId: string) => {
      onNoteSelect(noteId);
    },
    [onNoteSelect]
  );

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="note-list">
      <div className="note-list__header">
        <h2>Notes</h2>
        <span className="note-list__count">{notes.length} notes</span>
      </div>

      <div className="note-list__items">
        {notes.map((note) => (
          <div
            key={note.id}
            className={`note-item ${
              selectedNoteId === note.id ? 'note-item--selected' : ''
            }`}
            onClick={() => handleNoteClick(note.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleNoteClick(note.id);
              }
            }}
          >
            <div className="note-item__header">
              <span className="note-item__id">#{note.id}</span>
              <span className="note-item__timestamp">
                {formatTimestamp(note.createdAt)}
              </span>
            </div>
            <div className="note-item__content">
              {truncateContent(note.content)}
            </div>
            {note.replyCount !== undefined && note.replyCount > 0 && (
              <div className="note-item__reply-indicator">
                {note.replyCount} {note.replyCount === 1 ? 'reply' : 'replies'}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="note-list__loading">
            <div className="spinner" />
            <span>Loading more notes...</span>
          </div>
        )}

        {hasMore && !loading && (
          <div ref={loadMoreRef} className="note-list__load-more">
            <button onClick={onLoadMore}>Load More</button>
          </div>
        )}

        {!loading && notes.length === 0 && (
          <div className="note-list__empty">
            <p>No notes yet. Create your first note!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteList;