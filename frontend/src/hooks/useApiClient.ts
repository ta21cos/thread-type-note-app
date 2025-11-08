import { useAuth } from '@clerk/clerk-react';
import { apiFetch } from '../services/api.client';

export const useApiClient = () => {
  const { getToken } = useAuth();

  const fetchWithAuth = async <T>(
    endpoint: string,
    options: RequestInit & { params?: Record<string, string | number | boolean | undefined> } = {}
  ): Promise<T> => {
    const token = await getToken();
    return apiFetch<T>(endpoint, { ...options, token });
  };

  return {
    get: <T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>) =>
      fetchWithAuth<T>(endpoint, { method: 'GET', params }),

    post: <T>(endpoint: string, body?: unknown) =>
      fetchWithAuth<T>(endpoint, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      }),

    put: <T>(endpoint: string, body?: unknown) =>
      fetchWithAuth<T>(endpoint, {
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
      }),

    delete: <T>(endpoint: string) => fetchWithAuth<T>(endpoint, { method: 'DELETE' }),
  };
};
