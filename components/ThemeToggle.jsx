'use client';

import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function toggle() {
    const root = document.documentElement;
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('drp-theme', next);
  }

  if (!mounted) return <button className="theme-toggle" aria-label="Toggle dark mode" />;

  return (
    <button className="theme-toggle" aria-label="Toggle dark mode" onClick={toggle}>
      <span className="icon-sun">&#9728;</span>
      <span className="icon-moon">&#9789;</span>
    </button>
  );
}
