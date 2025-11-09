import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import { Hono } from 'hono';
import type { ClerkClient } from '@clerk/backend';

// NOTE: Set env vars before importing clerk module
beforeAll(() => {
  process.env.CLERK_SECRET_KEY = 'sk_test_mock';
  process.env.CLERK_PUBLISHABLE_KEY = 'pk_test_mock';
});

// NOTE: Mock the getClerkClient function
const mockAuthenticateRequest = vi.fn();
const mockClerkClient: Partial<ClerkClient> = {
  authenticateRequest: mockAuthenticateRequest,
};

vi.mock('../../src/auth/clerk', () => ({
  getClerkClient: () => mockClerkClient,
}));

import { requireAuth, optionalAuth } from '../../src/auth/middleware/auth.middleware';

describe('Authentication Middleware', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    vi.clearAllMocks();
  });

  describe('requireAuth', () => {
    it('should return 401 when not authenticated', async () => {
      mockAuthenticateRequest.mockResolvedValue({
        isAuthenticated: false,
        reason: 'token-invalid',
        message: 'Invalid token',
        toAuth: () => ({ userId: null, sessionId: null }),
      });

      app.get('/protected', requireAuth, (c) => c.json({ data: 'secret' }));

      const res = await app.request('/protected');

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body).toEqual({
        error: 'Unauthorized',
        reason: 'token-invalid',
        message: 'Invalid token',
      });
    });

    it('should set userId in context when authenticated', async () => {
      mockAuthenticateRequest.mockResolvedValue({
        isAuthenticated: true,
        toAuth: () => ({ userId: 'user_123', sessionId: 'sess_456' }),
      });

      let capturedUserId: string | undefined;
      let capturedSessionId: string | undefined;

      app.get('/protected', requireAuth, (c) => {
        capturedUserId = c.get('userId');
        capturedSessionId = c.get('sessionId');
        return c.json({ data: 'secret' });
      });

      const res = await app.request('/protected');

      expect(res.status).toBe(200);
      expect(capturedUserId).toBe('user_123');
      expect(capturedSessionId).toBe('sess_456');
    });

    it('should return 401 when userId is missing', async () => {
      mockAuthenticateRequest.mockResolvedValue({
        isAuthenticated: true,
        toAuth: () => ({ userId: null, sessionId: 'sess_456' }),
      });

      app.get('/protected', requireAuth, (c) => c.json({ data: 'secret' }));

      const res = await app.request('/protected');

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body).toEqual({ error: 'Invalid session' });
    });
  });

  describe('optionalAuth', () => {
    it('should continue without auth when not authenticated', async () => {
      mockAuthenticateRequest.mockResolvedValue({
        isAuthenticated: false,
        toAuth: () => ({ userId: null, sessionId: null }),
      });

      let capturedUserId: string | undefined;

      app.get('/public', optionalAuth, (c) => {
        capturedUserId = c.get('userId');
        return c.json({ data: 'public' });
      });

      const res = await app.request('/public');

      expect(res.status).toBe(200);
      expect(capturedUserId).toBeUndefined();
    });

    it('should set userId when authenticated', async () => {
      mockAuthenticateRequest.mockResolvedValue({
        isAuthenticated: true,
        toAuth: () => ({ userId: 'user_789', sessionId: 'sess_101' }),
      });

      let capturedUserId: string | undefined;

      app.get('/public', optionalAuth, (c) => {
        capturedUserId = c.get('userId');
        return c.json({ data: 'public' });
      });

      const res = await app.request('/public');

      expect(res.status).toBe(200);
      expect(capturedUserId).toBe('user_789');
    });
  });
});
