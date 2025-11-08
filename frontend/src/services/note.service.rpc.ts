/**
 * HONO RPC MIGRATION SAMPLE
 *
 * This file demonstrates how to use Hono RPC for type-safe API calls.
 * Compare this with the old approach in note.service.ts
 */

import { useQuery } from '@tanstack/react-query';
import { rpcClient } from './rpc.client';

// NOTE: Query keys for cache management (same as before)
export const noteKeys = {
  all: ['notes'] as const,
  lists: () => [...noteKeys.all, 'list'] as const,
  list: (page: number) => [...noteKeys.lists(), { page }] as const,
};

/**
 * ✨ NEW: Hono RPC version of useNotes hook
 *
 * Benefits:
 * - Full type inference from backend routes
 * - Autocomplete for available endpoints
 * - Compile-time type checking
 * - No manual type definitions needed
 */
export const useNotesRpc = () => {
  return useQuery({
    queryKey: noteKeys.lists(),
    queryFn: async () => {
      // NOTE: The RPC client provides end-to-end type safety
      // TypeScript knows exactly what endpoints are available and their types!
      const response = await rpcClient.api.notes.$get();

      // NOTE: Check if the response is OK (Hono RPC pattern)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // NOTE: Parse JSON with full type inference
      // TypeScript knows the exact shape from the backend route!
      const data = await response.json();

      // 🎯 No need to manually type 'data' - it's automatically inferred!
      // Try hovering over 'data' in VSCode - you'll see the exact type!
      return data;
    },
    staleTime: 1000 * 60 * 1, // 1 minute
  });
};

/**
 * ✨ NEW: Hono RPC version with pagination
 *
 * Shows how to pass query parameters with type safety
 */
export const useNotesRpcWithPagination = (limit: number = 20, offset: number = 0) => {
  return useQuery({
    queryKey: [...noteKeys.lists(), { limit, offset }],
    queryFn: async () => {
      // NOTE: Query parameters are type-checked!
      // Try passing invalid params - TypeScript will catch it!
      const response = await rpcClient.api.notes.$get({
        query: {
          limit: String(limit),    // Hono RPC uses strings for query params
          offset: String(offset),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    },
    staleTime: 1000 * 60 * 1,
  });
};

// ========================================
// COMPARISON: Old vs New
// ========================================

/**
 * 📊 OLD APPROACH (from note.service.ts):
 *
 * export const useNotes = () => {
 *   return useQuery({
 *     queryKey: noteKeys.lists(),
 *     queryFn: async () => {
 *       // ❌ Manual type annotation required
 *       const response = await api.get<NotesListResponse>('/notes');
 *       //                              ^^^^^^^^^^^^^^^^^^
 *       //                              Must manually specify type
 *       return response;
 *     },
 *   });
 * };
 *
 * Issues:
 * - Manual type annotations can drift from backend
 * - No autocomplete for available endpoints
 * - Type errors only caught at runtime
 * - Need to maintain separate type definitions
 */

/**
 * ✅ NEW APPROACH (with Hono RPC):
 *
 * export const useNotesRpc = () => {
 *   return useQuery({
 *     queryKey: noteKeys.lists(),
 *     queryFn: async () => {
 *       // ✅ Automatic type inference
 *       const response = await rpcClient.api.notes.$get();
 *       //                              ^^^ ^^^^^ ^^^^^
 *       //                              Full autocomplete and type safety!
 *       const data = await response.json();
 *       return data; // Type is automatically correct!
 *     },
 *   });
 * };
 *
 * Benefits:
 * - Types automatically synced with backend
 * - Full autocomplete in IDE
 * - Compile-time type checking
 * - Backend changes immediately reflected in frontend types
 */

// ========================================
// USAGE EXAMPLE
// ========================================

/**
 * In your React component:
 *
 * import { useNotesRpc } from '@/services/note.service.rpc';
 *
 * function NotesList() {
 *   const { data, isLoading, error } = useNotesRpc();
 *
 *   // 'data' is fully typed - autocomplete will show:
 *   // - data.notes
 *   // - data.total
 *   // - data.hasMore
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return (
 *     <div>
 *       {data.notes.map(note => (
 *         <div key={note.id}>{note.content}</div>
 *       ))}
 *     </div>
 *   );
 * }
 */
