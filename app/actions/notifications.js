'use server';

import { getSession } from '@/lib/session';
import { consumeUnreadNotifications } from '@/lib/store';

// Deliberately doesn't use requireUserId() here — this runs in the
// background on every page load to drive the popup toast, and we don't want
// an anonymous visitor redirected to /login just because of that check.
export async function consumeUnreadNotificationsAction() {
  const session = await getSession();
  if (!session?.user?.id) return [];

  try {
    return await consumeUnreadNotifications(session.user.id);
  } catch (error) {
    console.error('Failed to consume unread notifications:', error);
    return [];
  }
}
