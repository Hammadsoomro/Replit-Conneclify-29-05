import { useEffect, useRef, useCallback, useState } from "react";
import { useAuth } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";

type MessageHandler = (data: any) => void;

interface UseWebSocketOptions {
  onNewMessage?: MessageHandler;
  onConversationUpdated?: MessageHandler;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handlersRef = useRef(options);

  handlersRef.current = options;

  const connect = useCallback(() => {
    if (!user?.id || wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "auth", userId: user.id }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "auth_success") {
          setIsConnected(true);
          return;
        }

        if (data.type === "new_message" || data.type === "new_inbound_message") {
          const conversationId = data.message?.conversationId || data.conversationId;
          queryClient.invalidateQueries({ 
            queryKey: ["/api/conversations", conversationId, "messages"] 
          });
          queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
          queryClient.invalidateQueries({ queryKey: ["/api/phone-numbers"] });
          handlersRef.current.onNewMessage?.(data);
        }

        if (data.type === "message_status" || data.type === "message_status_updated") {
          const conversationId = data.message?.conversationId || data.conversationId;
          queryClient.invalidateQueries({ 
            queryKey: ["/api/conversations", conversationId, "messages"] 
          });
          queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
        }

        if (data.type === "conversation_updated") {
          queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
          handlersRef.current.onConversationUpdated?.(data);
        }

        // Handle phone number assignment changes (for team members)
        if (data.type === "phone_assignment_changed") {
          queryClient.invalidateQueries({ queryKey: ["/api/phone-numbers"] });
          queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
        }
      } catch (err) {
        console.error("WebSocket message parse error:", err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [user?.id]);

  const subscribeToConversation = useCallback((conversationId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "subscribe", conversationId }));
    }
  }, []);

  const unsubscribeFromConversation = useCallback((conversationId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "unsubscribe", conversationId }));
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
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
    subscribeToConversation,
    unsubscribeFromConversation,
  };
}
