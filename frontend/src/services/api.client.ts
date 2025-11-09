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

if (!import.meta.env.VITE_BACKEND_API_ENDPOINT) {
  throw new Error('VITE_BACKEND_API_ENDPOINT is not set');
}

// NOTE: Create typed RPC client with backend API endpoint
export const client = hc<AppType>(import.meta.env.VITE_BACKEND_API_ENDPOINT);
