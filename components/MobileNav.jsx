'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function MobileNav({ links }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button className="nav-toggle" aria-label="Toggle menu" onClick={() => setOpen((v) => !v)}>
        <span></span><span></span><span></span>
      </button>
      <nav className={`main-nav${open ? ' open' : ''}`}>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={pathname === link.href ? 'active' : ''}
            onClick={() => setOpen(false)}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
