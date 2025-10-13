import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotesUIProvider } from './store/notes.store';
import { AppRouter } from './router';

// NOTE: Configure TanStack Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 1, // 1 minute
      gcTime: 1000 * 60 * 5, // 5 minutes (renamed from cacheTime in v5)
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <NotesUIProvider>
        <AppRouter />
      </NotesUIProvider>
    </QueryClientProvider>
  );
};

export default App;
