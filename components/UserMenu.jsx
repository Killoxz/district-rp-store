'use client';

import { signIn, signOut } from 'next-auth/react';

export function UserMenu({ user }) {
  if (!user) {
    return (
      <button className="btn btn-outline" onClick={() => signIn('roblox')}>
        Log in
      </button>
    );
  }

  return (
    <div className="user-chip">
      {user.image ? (
        <img className="user-avatar" src={user.image} alt={user.name} />
      ) : (
        <span className="user-avatar" />
      )}
      <span>{user.name}</span>
      <button className="btn-ghost" onClick={() => signOut({ callbackUrl: '/' })}>
        Log out
      </button>
    </div>
  );
}
