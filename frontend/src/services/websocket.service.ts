import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { noteKeys } from './note.service';
import type { Note } from '../../../shared/types';

// NOTE: WebSocket message types
export type WsMessageType = 'note.created' | 'note.updated' | 'note.deleted';

export interface WsMessage {
  type: WsMessageType;
  data: Note | { id: string };
  timestamp: string;
}

interface UseWebSocketOptions {
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

// NOTE: WebSocket hook for real-time note updates
export const useWebSocket = ({
  onOpen,
  onClose,
  onError,
  reconnectInterval = 3000,
  maxReconnectAttempts = 5,
}: UseWebSocketOptions = {}) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const queryClient = useQueryClient();

  const connect = useCallback(() => {
    // NOTE: Construct WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        reconnectAttemptsRef.current = 0;
        onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WsMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        onError?.(error);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        onClose?.();

        // NOTE: Attempt reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          console.log(
            `Reconnecting... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else {
          console.error('Max reconnection attempts reached');
        }
      };
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
    }
  }, [onOpen, onClose, onError, reconnectInterval, maxReconnectAttempts]);

  const handleMessage = useCallback(
    ({ type, data }: WsMessage) => {
      switch (type) {
        case 'note.created': {
          const newNote = data as Note;
          // NOTE: Invalidate notes list to show new note
          queryClient.invalidateQueries({ queryKey: noteKeys.lists() });

          // NOTE: If it's a reply, invalidate parent thread
          if (newNote.parentId) {
            queryClient.invalidateQueries({ queryKey: noteKeys.detail(newNote.parentId) });
          }
          break;
        }

        case 'note.updated': {
          const updatedNote = data as Note;
          // NOTE: Invalidate specific note and lists
          queryClient.invalidateQueries({ queryKey: noteKeys.detail(updatedNote.id) });
          queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
          break;
        }

        case 'note.deleted': {
          const { id } = data as { id: string };
          // NOTE: Remove from cache and invalidate lists
          queryClient.removeQueries({ queryKey: noteKeys.detail(id) });
          queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
          break;
        }

        default:
          console.warn('Unknown WebSocket message type:', type);
      }
    },
    [queryClient]
  );

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const send = useCallback((message: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  // NOTE: Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    send,
    disconnect,
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
  };
};
