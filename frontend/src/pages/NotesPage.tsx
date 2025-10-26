import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SplitView } from '../layouts/SplitView';
import { NoteList } from '../components/NoteList';
import { ThreadView } from '../components/ThreadView';
import {
  useInfiniteNotes,
  useNote,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
} from '../services/note.service';
import { useNotesUI } from '../store/notes.store';

export const NotesPage: React.FC = () => {
  const { noteId } = useParams<{ noteId?: string }>();
  const navigate = useNavigate();
  const {
    selectedNoteId,
    setSelectedNoteId,
    replyingToNoteId,
    stopReply,
  } = useNotesUI();

  // NOTE: Fetch notes with infinite scroll
  const {
    data: notesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: notesLoading,
  } = useInfiniteNotes(20);

  // NOTE: Fetch selected note with thread
  const { data: noteData, isLoading: noteLoading } = useNote(selectedNoteId ?? undefined);

  // NOTE: Create note mutation
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  // NOTE: Real-time updates to be implemented in the future
  // TODO: Implement WebSocket or polling for real-time note updates

  // NOTE: Sync URL param with selected note
  useEffect(() => {
    if (noteId && noteId !== selectedNoteId) {
      setSelectedNoteId(noteId);
    }
  }, [noteId, selectedNoteId, setSelectedNoteId]);

  // NOTE: Update URL when note is selected
  const handleNoteSelect = (id: string) => {
    setSelectedNoteId(id);
    navigate(`/notes/${id}`);
  };

  // NOTE: Create new note or reply
  const handleCreateNote = async (content: string) => {
    try {
      const newNote = await createNote.mutateAsync({
        content,
        parentId: replyingToNoteId || undefined,
      });

      // NOTE: Select newly created note
      if (!replyingToNoteId) {
        handleNoteSelect(newNote.id);
      }

      stopReply();
    } catch (error) {
      console.error('Failed to create note:', error);
      throw error;
    }
  };

  // NOTE: Load more notes for infinite scroll
  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // NOTE: Flatten paginated notes
  const displayNotes = notesData?.pages.flatMap((page) => page.notes) || [];

  return (
    <div className="notes-page">
      {/* NOTE: Split view layout */}
      <SplitView
        left={
          <NoteList
            notes={displayNotes}
            selectedNoteId={selectedNoteId ?? undefined}
            onNoteSelect={handleNoteSelect}
            onLoadMore={handleLoadMore}
            hasMore={hasNextPage}
            loading={notesLoading || isFetchingNextPage}
            onCreateNote={!replyingToNoteId ? handleCreateNote : undefined}
          />
        }
        right={
          <div className="notes-page__right">
            {selectedNoteId && noteData?.note ? (
              <ThreadView
                rootNote={noteData.note}
                thread={noteData.thread || []}
                onReply={async (parentId: string, content: string) => {
                  await createNote.mutateAsync({
                    content,
                    parentId,
                  });
                }}
                onEdit={async (noteId: string, content: string) => {
                  try {
                    await updateNote.mutateAsync({ id: noteId, content });
                  } catch (error) {
                    console.error('Failed to update note:', error);
                  }
                }}
                onDelete={async (noteId: string) => {
                  try {
                    await deleteNote.mutateAsync(noteId);

                    // NOTE: Clear selection if deleted note was selected
                    if (selectedNoteId === noteId) {
                      setSelectedNoteId(null);
                      navigate('/');
                    }
                  } catch (error) {
                    console.error('Failed to delete note:', error);
                  }
                }}
              />
            ) : noteLoading ? (
              <div className="notes-page__loading">
                <div className="spinner" />
                <p>Loading thread...</p>
              </div>
            ) : (
              <div className="notes-page__empty">
                <p>Select a note to view its thread</p>
              </div>
            )}
          </div>
        }
      />
    </div>
  );
};
