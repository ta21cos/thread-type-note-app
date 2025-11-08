# Hono RPC Migration Sample

This document demonstrates the migration of the GET `/api/notes` endpoint to Hono RPC with full type safety.

## 📁 Files Changed

1. ✅ **backend/src/api/app.ts** - Added `AppType` export
2. ✅ **tsconfig.json** - Added path mapping for backend types
3. ✅ **frontend/src/services/rpc.client.ts** - New typed RPC client
4. ✅ **frontend/src/services/note.service.rpc.ts** - Sample RPC hooks

---

## 🔧 Backend Changes

### backend/src/api/app.ts

```typescript
// Error handling
app.onError(errorHandler);

// NOTE: Export AppType for Hono RPC client type safety
export type AppType = typeof app;

export default app;
```

**What this does:**
- Exports the type of your entire Hono app
- This type includes all routes, methods, and their return types
- Frontend can import this type for compile-time safety

---

## ⚙️ TypeScript Configuration

### tsconfig.json

```json
{
  "paths": {
    "@thread-note/shared/constants": ["./shared/constants/index.ts"],
    "@thread-note/shared/types": ["./shared/types/index.ts"],
    "@thread-note/backend/api": ["./backend/src/api/app.ts"]
  }
}
```

**What this does:**
- Allows frontend to import backend types easily
- Maintains type safety across the monorepo
- No runtime dependency - just types!

---

## 💻 Frontend Changes

### 1. RPC Client (frontend/src/services/rpc.client.ts)

```typescript
import { hc } from 'hono/client';
import type { AppType } from '@thread-note/backend/api';

const isElectron = typeof window !== 'undefined' &&
  (window as typeof window & { electron?: { platform: string } }).electron !== undefined;

const API_BASE_URL = isElectron
  ? import.meta.env.VITE_BACKEND_API_ENDPOINT || 'http://localhost:3000'
  : import.meta.env.VITE_BACKEND_API_ENDPOINT || window.location.origin;

// Create typed Hono RPC client
export const rpcClient = hc<AppType>(API_BASE_URL);

export type RpcClient = typeof rpcClient;
```

**Key Points:**
- `hc<AppType>()` creates a typed client
- Same environment detection as your current API client
- Works in both Electron and web environments

---

### 2. RPC Hooks (frontend/src/services/note.service.rpc.ts)

```typescript
import { useQuery } from '@tanstack/react-query';
import { rpcClient } from './rpc.client';

export const noteKeys = {
  all: ['notes'] as const,
  lists: () => [...noteKeys.all, 'list'] as const,
};

/**
 * ✨ Type-safe hook with Hono RPC
 */
export const useNotesRpc = () => {
  return useQuery({
    queryKey: noteKeys.lists(),
    queryFn: async () => {
      // Full type safety - TypeScript knows the exact shape!
      const response = await rpcClient.api.notes.$get();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Type automatically inferred from backend!
      const data = await response.json();
      return data;
    },
    staleTime: 1000 * 60 * 1,
  });
};

/**
 * ✨ With pagination parameters (also type-safe!)
 */
export const useNotesRpcWithPagination = (limit: number = 20, offset: number = 0) => {
  return useQuery({
    queryKey: [...noteKeys.lists(), { limit, offset }],
    queryFn: async () => {
      // Query parameters are type-checked!
      const response = await rpcClient.api.notes.$get({
        query: {
          limit: String(limit),
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
```

---

## 📊 Comparison: Old vs New

### ❌ Old Approach (Current)

```typescript
// frontend/src/services/note.service.ts
export const useNotes = () => {
  return useQuery({
    queryKey: noteKeys.lists(),
    queryFn: async () => {
      // Manual type annotation - can drift from backend
      const response = await api.get<NotesListResponse>('/notes');
      //                              ^^^^^^^^^^^^^^^^^^
      //                              Must manually specify
      return response;
    },
  });
};
```

**Problems:**
- ❌ Manual type annotations required
- ❌ Types can drift from backend
- ❌ No autocomplete for endpoints
- ❌ Typos in URLs only caught at runtime
- ❌ Need to maintain separate type definitions

---

### ✅ New Approach (With Hono RPC)

```typescript
export const useNotesRpc = () => {
  return useQuery({
    queryKey: noteKeys.lists(),
    queryFn: async () => {
      // Automatic type inference from backend
      const response = await rpcClient.api.notes.$get();
      //                              ^^^ ^^^^^ ^^^^^
      //                              Full autocomplete!

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data; // Type is automatically correct!
    },
  });
};
```

**Benefits:**
- ✅ Types automatically synced with backend
- ✅ Full autocomplete in IDE
- ✅ Compile-time type checking
- ✅ Backend changes immediately reflected
- ✅ No manual type definitions needed

---

## 🎯 Usage Example

### In a React Component

```typescript
import { useNotesRpc } from '@/services/note.service.rpc';

function NotesList() {
  const { data, isLoading, error } = useNotesRpc();

  // 'data' is fully typed - hover in VSCode to see:
  // {
  //   notes: Note[];
  //   total: number;
  //   hasMore: boolean;
  // }

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Total Notes: {data.total}</h1>
      {data.notes.map(note => (
        <div key={note.id}>
          <p>{note.content}</p>
          <small>{note.createdAt}</small>
        </div>
      ))}
      {data.hasMore && <button>Load More</button>}
    </div>
  );
}
```

---

## 🧪 Test It Out

### 1. Start the backend
```bash
cd backend
bun run dev
```

### 2. In a separate terminal, test TypeScript compilation
```bash
cd frontend
bun run typecheck
```

### 3. Try it in your IDE
Open `frontend/src/services/note.service.rpc.ts` and type:

```typescript
rpcClient.api.
//            ^ Press Ctrl+Space here
```

You'll see autocomplete for all available routes!

---

## 🔍 Type Safety Demo

### Example 1: Wrong Endpoint (Compile Error)

```typescript
// ❌ TypeScript Error: Property 'doesntExist' does not exist
const response = await rpcClient.api.doesntExist.$get();
```

### Example 2: Wrong Query Params (Compile Error)

```typescript
// ❌ TypeScript Error: Invalid query parameter
const response = await rpcClient.api.notes.$get({
  query: {
    invalidParam: 'test' // TypeScript will complain!
  }
});
```

### Example 3: Type Inference

```typescript
const response = await rpcClient.api.notes.$get();
const data = await response.json();

// Hover over 'data' - you'll see the exact type!
// TypeScript knows it has: notes, total, hasMore
console.log(data.notes); // ✅ OK
console.log(data.invalid); // ❌ Compile error!
```

---

## 📈 What's Inferred?

The RPC client automatically infers:

1. **Available endpoints** - Only valid routes show in autocomplete
2. **HTTP methods** - `$get`, `$post`, `$put`, `$delete`
3. **Request types** - Query params, JSON body, route params
4. **Response types** - Exact shape of JSON responses
5. **Zod validation** - Respects your existing validators

All from your backend code - no duplication!

---

## 🚀 Next Steps

To fully migrate to Hono RPC:

1. ✅ **Done**: GET /api/notes endpoint
2. **TODO**: Migrate remaining endpoints:
   - POST /api/notes (create note)
   - GET /api/notes/:id (get note by ID)
   - PUT /api/notes/:id (update note)
   - DELETE /api/notes/:id (delete note)
   - GET /api/notes/search (search)
   - GET /api/notes/:id/mentions (mentions)

3. **TODO**: Update all React components to use RPC hooks
4. **TODO**: Remove old `api.client.ts` when migration complete
5. **TODO**: Update tests to use RPC client

---

## 💡 Pro Tips

1. **IntelliSense is your friend** - Hover over everything to see types
2. **Let TypeScript guide you** - If it compiles, it's correct!
3. **Backend changes auto-sync** - Change backend, frontend types update
4. **No runtime overhead** - All types stripped at build time
5. **Works with your existing Zod validators** - No changes needed!

---

## 🐛 Troubleshooting

### "Cannot find module '@thread-note/backend/api'"

**Solution:** Make sure you've updated `tsconfig.json` with the path mapping.

### "Type is not assignable"

**Solution:** Your backend and frontend might be out of sync. Rebuild backend first:
```bash
cd backend && bun run build
```

### No autocomplete in IDE

**Solution:** Restart your TypeScript server:
- VSCode: Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"

---

## 📚 Additional Resources

- [Hono RPC Docs](https://hono.dev/docs/guides/rpc)
- [Zod Validator](https://hono.dev/docs/helpers/zod-validator)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)

---

**Happy coding with type-safe APIs! 🎉**
