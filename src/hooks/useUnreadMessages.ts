"use client";

import { useState, useEffect } from "react";
import { useAppSelector } from "@/store";

export function useUnreadMessages() {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    let isMounted = true;

    const fetchCount = () => {
      fetch("/api/messages/unread-count")
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (isMounted && json?.data && typeof json.data.unreadCount === "number") {
            setUnreadCount(json.data.unreadCount);
          }
        })
        .catch(() => {});
    };

    fetchCount();

    // Refresh on custom event
    const handleUpdate = () => fetchCount();
    window.addEventListener("messages-updated", handleUpdate);

    // Light polling every 25 seconds
    const interval = setInterval(fetchCount, 25000);

    return () => {
      isMounted = false;
      window.removeEventListener("messages-updated", handleUpdate);
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  return unreadCount;
}
