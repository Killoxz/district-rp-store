'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSession } from 'next-auth/react';

const MIN_CHECK_MS = 1000;

function ConnectLineIcon({ phase, failsHere }) {
  if (phase === 'checking') return <span className="connect-spinner" />;
  if (phase === 'online') return <span className="connect-icon-ok">&#10003;</span>;
  // offline: the failure shows on the Roblox->Server line; the first line
  // (You->Roblox) still succeeded, since reaching Roblox itself worked fine.
  return failsHere ? <span className="connect-icon-fail">&times;</span> : <span className="connect-icon-ok">&#10003;</span>;
}

export function JoinServerButton({ joinLink, discordLink }) {
  const { data: session } = useSession();
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

  const youAvatar = session?.user?.image;
  // The You->Roblox hop always "succeeds" once we've resolved a status (the
  // client launching is never in question) — only You/Roblox->Server can
  // fail, mirroring the reference where only the last hop showed red.
  function lineClass(failsHere) {
    if (phase === 'checking') return 'connect-line-pending';
    if (phase === 'offline' && failsHere) return 'connect-line-fail';
    return 'connect-line-ok';
  }

  const modal = phase !== 'closed' && (
    <div className="connect-overlay" role="dialog" aria-modal="true">
      <div className="connect-modal">
        <button type="button" className="connect-close" onClick={close} aria-label="Close">
          &times;
        </button>

        <div className="connect-banner">
          <div
            className="connect-banner-img"
            style={{ backgroundImage: 'url(/images/banner.png)' }}
          />
          <div className="connect-banner-overlay" />
          <div className="connect-banner-tags">
            <span className="connect-arrow">&larr;</span>
            <span className="connect-tag-pill">DISTRICT RP</span>
            <span className="connect-tag-pill">SERIOUS RP</span>
            <span className="connect-tag-pill">ERLC</span>
            <span className="connect-arrow">&rarr;</span>
          </div>
        </div>

        <div className="connect-flow">
          <div className="connect-node">
            <div className="connect-node-icon">
              {youAvatar ? (
                <img src={youAvatar} alt="" />
              ) : (
                <span className="connect-node-fallback">You</span>
              )}
            </div>
            <span className="connect-node-label">You</span>
          </div>

          <div className={`connect-line ${lineClass(false)}`}>
            <ConnectLineIcon phase={phase} failsHere={false} />
          </div>

          <div className="connect-node">
            <div className="connect-node-icon connect-node-icon-white">
              <img src="/images/roblox-logo.png" alt="" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }} />
              <span className="connect-node-fallback" style={{ display: 'none' }}>RBLX</span>
            </div>
            <span className="connect-node-label">Roblox</span>
          </div>

          <div className={`connect-line ${lineClass(true)}`}>
            <ConnectLineIcon phase={phase} failsHere={true} />
          </div>

          <div className="connect-node">
            <div className="connect-node-icon">
              <img src="/images/server-icon.png" alt="" />
            </div>
            <span className="connect-node-label">Server</span>
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
            <p className="connect-fail-subtitle">Error details</p>
            <p className="connect-fail-detail">Failed to reach the District RP ERLC server &mdash; the server appears to be offline.</p>
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
