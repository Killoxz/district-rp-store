'use client';

import { useEffect, useState } from 'react';

const POLL_MS = 20000;

export function ServerStatus() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch('/api/server-status');
        const data = await res.json();
        if (!cancelled) setStatus(data);
      } catch {
        if (!cancelled) setStatus({ configured: true, online: false });
      }
    }

    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (!status) {
    return (
      <span className="stat"><i className="dot dot-pending"></i> Checking server&hellip;</span>
    );
  }

  if (!status.configured) {
    return (
      <span className="stat"><i className="dot dot-pending"></i> Live stats not set up yet</span>
    );
  }

  if (!status.online) {
    return (
      <span className="stat"><i className="dot dot-offline"></i> Server Offline</span>
    );
  }

  return (
    <>
      <span className="stat"><i className="dot dot-online"></i> Online</span>
      <span className="stat"><i className="dot dot-players"></i> {status.currentPlayers} / {status.maxPlayers} players</span>
    </>
  );
}
