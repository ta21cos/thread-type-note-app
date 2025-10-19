import React, { useState, useCallback, useMemo } from 'react';
import { Note } from '../../../shared/types';
import NoteEditor from './NoteEditor';

interface ThreadViewProps {
  rootNote: Note;
  thread: Note[];
  onReply: (parentId: string, content: string) => Promise<void>;
  onEdit: (noteId: string, content: string) => Promise<void>;
  onDelete: (noteId: string) => Promise<void>;
  currentUserId?: string;
}

interface ThreadNodeProps {
  note: Note;
  children: Note[];
  thread: Note[];
  depth: number;
  onReply: (parentId: string, content: string) => Promise<void>;
  onEdit: (noteId: string, content: string) => Promise<void>;
  onDelete: (noteId: string) => Promise<void>;
  currentUserId?: string;
}

const ThreadNode: React.FC<ThreadNodeProps> = ({
  note,
  children,
  thread,
  depth,
  onReply,
  onEdit,
  onDelete,
  currentUserId,
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleReply = useCallback(async (content: string) => {
    await onReply(note.id, content);
    setIsReplying(false);
  }, [note.id, onReply]);

  const handleEdit = useCallback(async (content: string) => {
    await onEdit(note.id, content);
    setIsEditing(false);
  }, [note.id, onEdit]);

  const handleDelete = useCallback(async () => {
    if (window.confirm(`Delete this note and all its replies? This cannot be undone.`)) {
      await onDelete(note.id);
    }
  }, [note.id, onDelete]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const renderContent = (content: string) => {
    // NOTE: Parse mentions and make them clickable
    const parts = content.split(/(@\w{6})/g);
    return parts.map((part, index) => {
      if (part.match(/^@\w{6}$/)) {
        const noteId = part.substring(1);
        return (
          <a
            key={index}
            href={`#${noteId}`}
            className="thread-node__mention"
            onClick={(e) => {
              e.preventDefault();
              // NOTE: Scroll to mentioned note if in view
              const element = document.getElementById(`note-${noteId}`);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('thread-node--highlighted');
                setTimeout(() => {
                  element.classList.remove('thread-node--highlighted');
                }, 2000);
              }
            }}
          >
            {part}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div
      id={`note-${note.id}`}
      className={`thread-node thread-node--depth-${Math.min(depth, 5)}`}
      style={{ marginLeft: `${depth * 20}px` }}
    >
      <div className="thread-node__header">
        <span className="thread-node__id">#{note.id}</span>
        <span className="thread-node__timestamp">
          {formatTimestamp(note.createdAt)}
        </span>
        {note.updatedAt && note.updatedAt !== note.createdAt && (
          <span className="thread-node__edited">(edited)</span>
        )}
        {children.length > 0 && (
          <button
            className="thread-node__toggle"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Collapse thread' : 'Expand thread'}
          >
            {isExpanded ? '−' : '+'} {children.length} {children.length === 1 ? 'reply' : 'replies'}
          </button>
        )}
      </div>

      <div className="thread-node__content">
        {isEditing ? (
          <NoteEditor
            initialContent={note.content}
            onSubmit={handleEdit}
            onCancel={() => setIsEditing(false)}
            maxLength={1000}
            autoFocus
          />
        ) : (
          <div className="thread-node__text">
            {renderContent(note.content)}
          </div>
        )}
      </div>

      <div className="thread-node__actions">
        <button
          className="thread-node__action"
          onClick={() => setIsReplying(!isReplying)}
        >
          Reply
        </button>
        <button
          className="thread-node__action"
          onClick={() => setIsEditing(!isEditing)}
        >
          Edit
        </button>
        <button
          className="thread-node__action thread-node__action--delete"
          onClick={handleDelete}
        >
          Delete
        </button>
      </div>

      {isReplying && (
        <div className="thread-node__reply-editor">
          <NoteEditor
            parentNote={note}
            onSubmit={handleReply}
            onCancel={() => setIsReplying(false)}
            placeholder={`Reply to #${note.id}...`}
            maxLength={1000}
            autoFocus
          />
        </div>
      )}

      {isExpanded && children.length > 0 && (
        <div className="thread-node__children">
          {children.map((childNote) => {
            const grandchildren = thread.filter((n: Note) => n.parentId === childNote.id);
            return (
              <ThreadNode
                key={childNote.id}
                note={childNote}
                children={grandchildren}
                thread={thread}
                depth={depth + 1}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                currentUserId={currentUserId}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export const ThreadView: React.FC<ThreadViewProps> = ({
  rootNote,
  thread,
  onReply,
  onEdit,
  onDelete,
  currentUserId,
}) => {
  // NOTE: Build thread tree structure
  const threadTree = useMemo(() => {
    const childrenMap = new Map<string, Note[]>();

    thread.forEach((note) => {
      if (note.parentId) {
        const siblings = childrenMap.get(note.parentId) || [];
        siblings.push(note);
        childrenMap.set(note.parentId, siblings);
      }
    });

    // NOTE: Sort children by timestamp (oldest to newest)
    childrenMap.forEach((children) => {
      children.sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });

    return childrenMap;
  }, [thread]);

  const rootChildren = threadTree.get(rootNote.id) || [];

  return (
    <div className="thread-view">
      <div className="thread-view__header">
        <h2>Thread</h2>
        <span className="thread-view__count">
          {thread.length} {thread.length === 1 ? 'note' : 'notes'}
        </span>
      </div>

      <div className="thread-view__content">
        <ThreadNode
          note={rootNote}
          children={rootChildren}
          thread={thread}
          depth={0}
          onReply={onReply}
          onEdit={onEdit}
          onDelete={onDelete}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );
};

export default ThreadView;