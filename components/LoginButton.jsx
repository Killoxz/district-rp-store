'use client';

import { signIn } from 'next-auth/react';

export function LoginButton({ callbackUrl }) {
  return (
    <button className="btn btn-roblox" onClick={() => signIn('roblox', { callbackUrl: callbackUrl || '/' })}>
      Log in with Roblox
    </button>
  );
}
