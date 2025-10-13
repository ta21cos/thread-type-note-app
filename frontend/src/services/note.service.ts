import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { api } from './api.client';
import type { Note } from '../../../shared/types';

// NOTE: API response types
interface NotesListResponse {
  notes: Note[];
  total: number;
  hasMore: boolean;
}

interface NoteWithThreadResponse {
  note: Note;
  thread: Note[];
  depth: number;
}

interface SearchResponse {
  results: Note[];
  total: number;
}

interface CreateNoteDto {
  content: string;
  parentId?: string;
}

interface UpdateNoteDto {
  content: string;
}

// NOTE: Query keys for cache management
export const noteKeys = {
  all: ['notes'] as const,
  lists: () => [...noteKeys.all, 'list'] as const,
  list: (page: number) => [...noteKeys.lists(), { page }] as const,
  details: () => [...noteKeys.all, 'detail'] as const,
  detail: (id: string) => [...noteKeys.details(), id] as const,
  search: (query: string, type: string) => [...noteKeys.all, 'search', query, type] as const,
  mentions: (id: string) => [...noteKeys.all, 'mentions', id] as const,
};

// NOTE: Fetch all root notes
export const useNotes = () => {
  return useQuery({
    queryKey: noteKeys.lists(),
    queryFn: async () => {
      const response = await api.get<NotesListResponse>('/notes');
      return response;
    },
    staleTime: 1000 * 60 * 1, // 1 minute
  });
};

// NOTE: Fetch notes with infinite scroll
export const useInfiniteNotes = (limit: number = 20) => {
  return useInfiniteQuery({
    queryKey: [...noteKeys.lists(), { limit }],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await api.get<NotesListResponse>('/notes', {
        offset: pageParam,
        limit,
      });
      return response;
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length * limit;
    },
    initialPageParam: 0,
    staleTime: 1000 * 60 * 1,
  });
};

// NOTE: Fetch single note with thread
export const useNote = (id: string | undefined) => {
  return useQuery({
    queryKey: noteKeys.detail(id!),
    queryFn: async () => {
      const response = await api.get<NoteWithThreadResponse>(`/notes/${id}`);
      return response;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 1,
  });
};

// NOTE: Search notes
export const useSearchNotes = (query: string, type: 'content' | 'mention' = 'content') => {
  return useQuery({
    queryKey: noteKeys.search(query, type),
    queryFn: async () => {
      const response = await api.get<SearchResponse>('/notes/search', { q: query, type });
      return response;
    },
    enabled: query.length > 0,
    staleTime: 1000 * 30, // 30 seconds
  });
};

// NOTE: Get notes that mention a specific note
export const useNoteMentions = (id: string | undefined) => {
  return useQuery({
    queryKey: noteKeys.mentions(id!),
    queryFn: async () => {
      const response = await api.get<{ mentions: Note[] }>(`/notes/${id}/mentions`);
      return response;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 1,
  });
};

// NOTE: Create new note
export const useCreateNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content, parentId }: CreateNoteDto) => {
      const response = await api.post<Note>('/notes', { content, parentId });
      return response;
    },
    onSuccess: (newNote) => {
      // NOTE: Invalidate notes list to refetch
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });

      // NOTE: If it's a reply, invalidate parent thread
      if (newNote.parentId) {
        queryClient.invalidateQueries({ queryKey: noteKeys.detail(newNote.parentId) });
      }
    },
  });
};

// NOTE: Update existing note
export const useUpdateNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, content }: { id: string } & UpdateNoteDto) => {
      const response = await api.put<Note>(`/notes/${id}`, { content });
      return response;
    },
    onMutate: async ({ id, content }) => {
      // NOTE: Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: noteKeys.detail(id) });

      // NOTE: Snapshot previous value
      const previous = queryClient.getQueryData<NoteWithThreadResponse>(noteKeys.detail(id));

      // NOTE: Optimistically update
      if (previous) {
        queryClient.setQueryData<NoteWithThreadResponse>(noteKeys.detail(id), {
          ...previous,
          note: {
            ...previous.note,
            content,
            updatedAt: new Date().toISOString(),
          },
        });
      }

      return { previous };
    },
    onError: (err, { id }, context) => {
      // NOTE: Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(noteKeys.detail(id), context.previous);
      }
    },
    onSuccess: (updatedNote) => {
      // NOTE: Invalidate related queries
      queryClient.invalidateQueries({ queryKey: noteKeys.detail(updatedNote.id) });
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
    },
  });
};

// NOTE: Delete note (with cascade)
export const useDeleteNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/notes/${id}`);
      return id;
    },
    onSuccess: (deletedId) => {
      // NOTE: Invalidate all notes lists
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() });

      // NOTE: Remove deleted note from cache
      queryClient.removeQueries({ queryKey: noteKeys.detail(deletedId) });
    },
  });
};
