'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const MIN_CHECK_MS = 1000;

export function JoinServerButton({ joinLink, discordLink }) {
  const [phase, setPhase] = useState('closed'); // closed | checking | online | offline
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleClick() {
    setPhase('checking');

    const start = Date.now();
    let online = false;
    try {
      const res = await fetch('/api/server-status');
      const data = await res.json();
      online = !!data.online;
    } catch {
      online = false;
    }

    const elapsed = Date.now() - start;
    if (elapsed < MIN_CHECK_MS) {
      await new Promise((resolve) => setTimeout(resolve, MIN_CHECK_MS - elapsed));
    }

    if (online) {
      setPhase('online');
      window.location.href = joinLink;
    } else {
      setPhase('offline');
    }
  }

  function close() {
    setPhase('closed');
  }

  const modal = phase !== 'closed' && (
        <div className="connect-overlay" role="dialog" aria-modal="true">
          <div className="connect-modal">
            <button type="button" className="connect-close" onClick={close} aria-label="Close">
              &times;
            </button>

            <div className="connect-flow">
              <div className="connect-node">
                <div className="connect-node-icon connect-node-you">You</div>
              </div>

              <div className={`connect-line ${phase === 'checking' ? 'connect-line-pending' : phase === 'online' ? 'connect-line-ok' : 'connect-line-fail'}`}>
                {phase === 'checking' && <span className="connect-spinner" />}
                {phase === 'online' && <span className="connect-icon-ok">&#10003;</span>}
                {phase === 'offline' && <span className="connect-icon-fail">&times;</span>}
              </div>

              <div className="connect-node">
                <div className="connect-node-icon connect-node-roblox">RBLX</div>
              </div>

              <div className={`connect-line ${phase === 'online' ? 'connect-line-ok' : phase === 'offline' ? 'connect-line-fail' : 'connect-line-pending'}`}>
                {phase === 'checking' && <span className="connect-spinner" />}
                {phase === 'online' && <span className="connect-icon-ok">&#10003;</span>}
                {phase === 'offline' && <span className="connect-icon-fail">&times;</span>}
              </div>

              <div className="connect-node">
                <div className="connect-node-icon connect-node-server">Server</div>
              </div>
            </div>

            {phase === 'checking' && <p className="connect-status">Checking server status&hellip;</p>}

            {phase === 'online' && (
              <div className="connect-status connect-status-ok">
                <p>Server online &mdash; launching Roblox&hellip;</p>
                <a href={joinLink} className="btn-ghost">Didn&rsquo;t open? Click here</a>
              </div>
            )}

            {phase === 'offline' && (
              <div className="connect-status connect-status-fail">
                <p className="connect-fail-title">Connection failed</p>
                <p className="connect-fail-subtitle">What can you do?</p>
                <ul>
                  <li>Try again at a later time.</li>
                  <li>Check your network connection.</li>
                  <li>
                    If the issue persists, contact staff on{' '}
                    <a href={discordLink} target="_blank" rel="noopener noreferrer">Discord</a>.
                  </li>
                </ul>
                <p className="connect-fail-detail">The District RP server is currently offline.</p>
                <button type="button" className="btn btn-outline" onClick={handleClick}>Try Again</button>
              </div>
            )}
          </div>
        </div>
      );

  return (
    <>
      <button type="button" className="btn btn-primary" onClick={handleClick}>
        Join Server
      </button>
      {mounted && modal && createPortal(modal, document.body)}
    </>
  );
}
