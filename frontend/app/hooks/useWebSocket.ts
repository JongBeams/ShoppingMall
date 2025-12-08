/**
 * WebSocket Hook with Auto-Reconnection
 * 자동 재연결 기능이 있는 WebSocket 훅
 */

import { useEffect, useRef, useState, useCallback } from 'react';

interface UseWebSocketOptions {
  url: string;
  onMessage?: (event: MessageEvent) => void;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  reconnectOnClose?: boolean;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  reconnectAttempts: number;
  sendMessage: (data: string | object) => void;
  closeConnection: () => void;
  reconnect: () => void;
}

export function useWebSocket({
  url,
  onMessage,
  onOpen,
  onClose,
  onError,
  reconnectInterval = 3000,
  maxReconnectAttempts = 10,
  reconnectOnClose = true,
}: UseWebSocketOptions): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const shouldReconnectRef = useRef(true);

  const connect = useCallback(() => {
    try {
      console.log(`[WebSocket] Connecting to ${url}...`);

      const ws = new WebSocket(url);

      ws.onopen = (event) => {
        console.log('[WebSocket] Connected');
        setIsConnected(true);
        setReconnectAttempts(0);
        onOpen?.(event);
      };

      ws.onmessage = (event) => {
        onMessage?.(event);
      };

      ws.onclose = (event) => {
        console.log('[WebSocket] Disconnected', event);
        setIsConnected(false);
        onClose?.(event);

        // 재연결 시도
        if (shouldReconnectRef.current && reconnectOnClose && reconnectAttempts < maxReconnectAttempts) {
          console.log(`[WebSocket] Reconnecting in ${reconnectInterval}ms... (Attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts((prev) => prev + 1);
            connect();
          }, reconnectInterval);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          console.error('[WebSocket] Max reconnect attempts reached');
        }
      };

      ws.onerror = (event) => {
        console.error('[WebSocket] Error', event);
        onError?.(event);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[WebSocket] Connection error', error);
    }
  }, [url, onMessage, onOpen, onClose, onError, reconnectInterval, maxReconnectAttempts, reconnectOnClose, reconnectAttempts]);

  const sendMessage = useCallback((data: string | object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      wsRef.current.send(message);
    } else {
      console.warn('[WebSocket] Cannot send message, connection is not open');
    }
  }, []);

  const closeConnection = useCallback(() => {
    shouldReconnectRef.current = false;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const reconnect = useCallback(() => {
    closeConnection();
    shouldReconnectRef.current = true;
    setReconnectAttempts(0);
    connect();
  }, [closeConnection, connect]);

  useEffect(() => {
    shouldReconnectRef.current = true;
    connect();

    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    isConnected,
    reconnectAttempts,
    sendMessage,
    closeConnection,
    reconnect,
  };
}
