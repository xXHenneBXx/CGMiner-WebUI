import { useEffect, useRef } from "react";

/**
 * useWebSocket(url, onMessage)
 * reconnects on close with exponential backoff
 */
export default function useWebSocket(url, onMessage) {
  const wsRef = useRef(null);
  const backoffRef = useRef(1000);

  useEffect(() => {
    let cancelled = false;
    function connect() {
      if (cancelled) return;
      try {
        const ws = new WebSocket(url);
        wsRef.current = ws;
        ws.onopen = () => {
          backoffRef.current = 1000;
          console.debug("WS open", url);
        };
        ws.onmessage = (ev) => { onMessage(ev.data); };
        ws.onclose = () => {
          if (cancelled) return;
          console.warn("WS closed, reconnecting in", backoffRef.current);
          setTimeout(() => { backoffRef.current = Math.min(30000, backoffRef.current * 1.5); connect(); }, backoffRef.current);
        };
        ws.onerror = (e) => {
          console.error("WS error", e);
          ws.close();
        };
      } catch (e) {
        console.error("WS connect failed", e);
        setTimeout(() => connect(), backoffRef.current);
      }
    }
    connect();
    return () => { cancelled = true; if (wsRef.current) wsRef.current.close(); };
  }, [url, onMessage]);
}
