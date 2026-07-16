const ERLC_API_BASE = 'https://api.policeroleplay.community/v1';
const CACHE_MS = 15000;

// Multiple browser tabs poll this independently — cache the upstream call
// for a few seconds so we don't hammer ERLC's API (and hit its rate limit)
// every time a page loads.
const globalForErlc = globalThis;

export async function getErlcServerStatus() {
  const now = Date.now();
  const cached = globalForErlc.__erlcCache;
  if (cached && now - cached.ts < CACHE_MS) {
    return cached.data;
  }

  const data = await fetchServerStatus();
  globalForErlc.__erlcCache = { ts: now, data };
  return data;
}

async function fetchServerStatus() {
  const key = process.env.ERLC_SERVER_KEY;
  if (!key || key === 'placeholder-erlc-key') {
    return { configured: false, online: false };
  }

  try {
    const res = await fetch(`${ERLC_API_BASE}/server`, {
      headers: { 'server-key': key },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.error(`ERLC API responded with ${res.status}`);
      return { configured: true, online: false };
    }

    const data = await res.json();
    return {
      configured: true,
      online: true,
      currentPlayers: data.CurrentPlayers ?? 0,
      maxPlayers: data.MaxPlayers ?? 0,
      name: data.Name || null,
    };
  } catch (error) {
    console.error('ERLC server status fetch failed:', error);
    return { configured: true, online: false };
  }
}
