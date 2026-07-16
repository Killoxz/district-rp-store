'use client';

// This only fires for errors thrown by the root layout itself (e.g. Header
// failing to render) — anything below the layout is caught by error.jsx
// instead. It has to render its own <html>/<body> since it replaces the
// entire root layout when it triggers.
export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: '80px 20px' }}>
        <h1>Something went wrong</h1>
        <p>District RP hit an unexpected error loading the page.</p>
        <button onClick={() => reset()} style={{ padding: '10px 20px', marginTop: 20, cursor: 'pointer' }}>
          Try again
        </button>
      </body>
    </html>
  );
}
