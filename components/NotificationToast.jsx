'use client';

import { useEffect, useState } from 'react';
import { consumeUnreadNotificationsAction } from '@/app/actions/notifications';

export function NotificationToast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    let cancelled = false;

    consumeUnreadNotificationsAction().then((notifications) => {
      if (cancelled || notifications.length === 0) return;

      setToasts(notifications);
      notifications.forEach((n, idx) => {
        setTimeout(() => dismiss(n.id), 8000 + idx * 1500);
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  function dismiss(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack">
      {toasts.map((toast) => (
        <div className="toast" key={toast.id}>
          <button className="toast-close" onClick={() => dismiss(toast.id)} aria-label="Dismiss">
            &times;
          </button>
          <div className="toast-title">{toast.title}</div>
          <p className="toast-message">{toast.message}</p>
        </div>
      ))}
    </div>
  );
}
