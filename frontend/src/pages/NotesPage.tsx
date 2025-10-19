import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SplitView } from '../layouts/SplitView';
import { NoteList } from '../components/NoteList';
import { ThreadView } from '../components/ThreadView';
import { NoteEditor } from '../components/NoteEditor';
import { SearchBar } from '../components/SearchBar';
import { useInfiniteNotes, useNote, useCreateNote, useUpdateNote, useDeleteNote, useSearchNotes } from '../services/note.service';
import { useNotesUI } from '../store/notes.store';

export const NotesPage: React.FC = () => {
  const { noteId } = useParams<{ noteId?: string }>();
  const navigate = useNavigate();
  const {
    selectedNoteId,
    setSelectedNoteId,
    isSearchOpen,
    searchQuery,
    setSearchQuery,
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

  // NOTE: Search notes
  const { data: searchData, isLoading: searchLoading } = useSearchNotes(
    searchQuery,
    'content'
  );

  // NOTE: Create note mutation
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  // NOTE: Connect to WebSocket for real-time updates
  // TODO: Re-enable when backend WebSocket is implemented
  // useWebSocket({
  //   onOpen: () => console.log('Connected to real-time updates'),
  //   onError: (error) => console.error('WebSocket error:', error),
  // });

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
  const allNotes = notesData?.pages.flatMap((page) => page.notes) || [];

  // NOTE: Display search results or all notes
  const displayNotes = isSearchOpen && searchQuery
    ? searchData?.results || []
    : allNotes;

  return (
    <div className="notes-page">
      {/* NOTE: Search bar */}
      <div className="notes-page__header">
        <SearchBar
          onSearch={setSearchQuery}
          initialValue={searchQuery}
          onClear={() => setSearchQuery('')}
        />
      </div>

      {/* NOTE: Split view layout */}
      <SplitView
        left={
          <div className="notes-page__left">
            {/* NOTE: Editor for new notes */}
            {!replyingToNoteId && (
              <div className="notes-page__editor">
                <NoteEditor
                  onSubmit={handleCreateNote}
                  placeholder="Write a new note..."
                  maxLength={1000}
                />
              </div>
            )}

            {/* NOTE: Notes list */}
            <NoteList
              notes={displayNotes}
              selectedNoteId={selectedNoteId ?? undefined}
              onNoteSelect={handleNoteSelect}
              onLoadMore={handleLoadMore}
              hasMore={hasNextPage}
              loading={notesLoading || isFetchingNextPage || searchLoading}
            />
          </div>
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
