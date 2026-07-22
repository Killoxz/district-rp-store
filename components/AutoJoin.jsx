'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

const MIN_CHECK_MS = 1000;

function ConnectLineIcon({ phase, failsHere }) {
  if (phase === 'checking') return <span className="connect-spinner" />;
  if (phase === 'online') return <span className="connect-icon-ok">&#10003;</span>;
  return failsHere ? <span className="connect-icon-fail">&times;</span> : <span className="connect-icon-ok">&#10003;</span>;
}

// Same check-then-launch flow as the homepage's Join Server button, but
// fires automatically on page load instead of waiting for a click — this is
// what Discord's "Join Server" button links to, since Discord only allows
// http(s) URLs on message buttons and can't open a roblox:// link directly.
export function AutoJoin({ joinLink, discordLink }) {
  const { data: session } = useSession();
  const [phase, setPhase] = useState('checking');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function run() {
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

      if (cancelled) return;

      if (online) {
        setPhase('online');
        window.location.href = joinLink;
      } else {
        setPhase('offline');
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [joinLink, attempt]);

  function retry() {
    setPhase('checking');
    setAttempt((n) => n + 1);
  }

  const youAvatar = session?.user?.image;

  function lineClass(failsHere) {
    if (phase === 'checking') return 'connect-line-pending';
    if (phase === 'offline' && failsHere) return 'connect-line-fail';
    return 'connect-line-ok';
  }

  return (
    <div className="connect-modal" style={{ margin: '40px auto', maxWidth: 440 }}>
      <div className="connect-banner">
        <div className="connect-banner-img" style={{ backgroundImage: 'url(/images/banner.png)' }} />
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
            {youAvatar ? <img src={youAvatar} alt="" /> : <span className="connect-node-fallback">You</span>}
          </div>
          <span className="connect-node-label">You</span>
        </div>

        <div className={`connect-line ${lineClass(false)}`}>
          <ConnectLineIcon phase={phase} failsHere={false} />
        </div>

        <div className="connect-node">
          <div className="connect-node-icon">
            <img
              src="/images/roblox-logo.png"
              alt=""
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextSibling.style.display = 'flex';
              }}
            />
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
          <button type="button" className="btn btn-outline" onClick={retry}>Try Again</button>
        </div>
      )}
    </div>
  );
}
