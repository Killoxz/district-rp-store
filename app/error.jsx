'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="page" style={{ textAlign: 'center' }}>
      <h1>Something went wrong</h1>
      <p>This page hit an unexpected error. You can try again, or head back home.</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
        <button className="btn btn-primary" onClick={() => reset()}>Try again</button>
        <a className="btn btn-outline" href="/">Go home</a>
      </div>
    </div>
  );
}
