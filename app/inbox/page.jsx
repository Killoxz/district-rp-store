import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getNotificationsForUser } from '@/lib/store';

export const metadata = { title: 'Inbox | District RP' };

export default async function InboxPage() {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/inbox');
  }

  const notifications = await getNotificationsForUser(session.user.id);

  return (
    <div className="page">
      <h1>Inbox</h1>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <p>Nothing here yet — you'll see updates on things like unban review decisions here.</p>
        </div>
      ) : (
        <div className="inbox-list">
          {notifications.map((n) => (
            <div className={`inbox-item${n.read ? '' : ' unread'}`} key={n.id}>
              <div className="inbox-item-header">
                <strong>{n.title}</strong>
                <span>{new Date(n.created_at).toLocaleString()}</span>
              </div>
              <p>{n.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
