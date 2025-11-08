import { hc } from 'hono/client';
import type { AppType } from '@thread-note/backend/api';

// NOTE: Detect if running in Electron
const isElectron = typeof window !== 'undefined' &&
  (window as typeof window & { electron?: { platform: string } }).electron !== undefined;

// NOTE: In Electron, use full backend URL (can't use relative paths)
const API_BASE_URL = isElectron
  ? import.meta.env.VITE_BACKEND_API_ENDPOINT || 'http://localhost:3000'
  : import.meta.env.VITE_BACKEND_API_ENDPOINT || window.location.origin;

// NOTE: Create typed Hono RPC client
// This client provides end-to-end type safety between backend and frontend
// No need to manually define request/response types - they're inferred from the backend!
export const rpcClient = hc<AppType>(API_BASE_URL);

// NOTE: Export the type for use in React hooks
export type RpcClient = typeof rpcClient;
