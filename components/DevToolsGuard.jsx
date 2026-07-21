'use client';

import { useEffect } from 'react';

// Best-effort deterrents against casual right-click saving / devtools
// shortcuts. This does NOT and cannot prevent someone from viewing source,
// reading network requests, or downloading assets — anything sent to a
// browser is inherently readable by that browser. It only removes the
// easy/obvious paths for casual visitors.
export function DevToolsGuard() {
  useEffect(() => {
    function blockContextMenu(e) {
      e.preventDefault();
    }

    function blockShortcuts(e) {
      const key = e.key?.toLowerCase();
      const blockedCombo =
        key === 'f12' ||
        (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(key)) ||
        (e.metaKey && e.altKey && ['i', 'j', 'c'].includes(key)) ||
        (e.ctrlKey && key === 'u') ||
        (e.metaKey && key === 'u');

      if (blockedCombo) {
        e.preventDefault();
      }
    }

    document.addEventListener('contextmenu', blockContextMenu);
    document.addEventListener('keydown', blockShortcuts);

    return () => {
      document.removeEventListener('contextmenu', blockContextMenu);
      document.removeEventListener('keydown', blockShortcuts);
    };
  }, []);

  return null;
}
