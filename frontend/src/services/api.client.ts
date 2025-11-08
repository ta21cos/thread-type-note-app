// NOTE: Hono RPC client for type-safe API calls
import { hc } from 'hono/client';
import type { AppType } from '../../../backend/src/api/types';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// NOTE: Detect if running in Electron
const isElectron = typeof window !== 'undefined' &&
  (window as typeof window & { electron?: { platform: string } }).electron !== undefined

// NOTE: In Electron, use full backend URL (can't use relative paths)
const getBaseUrl = (): string => {
  if (isElectron) {
    return import.meta.env.VITE_BACKEND_API_ENDPOINT || 'http://localhost:3000';
  }

  if (import.meta.env.VITE_BACKEND_API_ENDPOINT) {
    return import.meta.env.VITE_BACKEND_API_ENDPOINT;
  }

  // NOTE: For web, use same origin
  return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
};

// NOTE: Create typed RPC client
export const client = hc<AppType>(getBaseUrl());
