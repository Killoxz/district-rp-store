import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getVerifyToken, markVerifyTokenUsed, recordDiscordVerification } from '@/lib/store';
import { applyDiscordVerification } from '@/lib/discord-verify';

export const metadata = { title: 'Verify | District RP' };

function ErrorCard({ title, message }) {
  return (
    <div className="page">
      <div className="login-card">
        <h1>{title}</h1>
        <p>{message}</p>
      </div>
    </div>
  );
}

export default async function VerifyDiscordPage({ searchParams }) {
  const sp = await searchParams;
  const token = sp?.token;

  if (!token) {
    return <ErrorCard title="Invalid link" message="This verification link is missing its token. Go back to Discord and click Verify again." />;
  }

  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/verify-discord?token=${token}`)}`);
  }

  const tokenRow = await getVerifyToken(token);
  if (!tokenRow) {
    return <ErrorCard title="Invalid link" message="This verification link isn't valid. Go back to Discord and click Verify again." />;
  }
  if (tokenRow.used) {
    return <ErrorCard title="Already used" message="This verification link has already been used. Go back to Discord and click Verify again if you need to re-verify." />;
  }
  if (new Date(tokenRow.expires_at).getTime() < Date.now()) {
    return <ErrorCard title="Link expired" message="This verification link has expired. Go back to Discord and click Verify again for a fresh one." />;
  }

  const result = await applyDiscordVerification(tokenRow.discord_id, session.user.name);
  if (!result.ok) {
    const message =
      result.reason === 'not_in_server'
        ? "We couldn't find you in the District RP Discord server. Make sure you've joined the server, then click Verify again."
        : 'Something went wrong finishing verification on our end. Please try again in a moment.';
    return <ErrorCard title="Verification failed" message={message} />;
  }

  await markVerifyTokenUsed(token);
  await recordDiscordVerification(tokenRow.discord_id, null, session.user.robloxId, session.user.name);

  return (
    <div className="page">
      <div className="login-card">
        <h1>{result.alreadyVerified ? "You're already verified" : "You're verified!"}</h1>
        <p>
          Verified as <strong>{session.user.name}</strong>. You can close this tab and head back to Discord — the rest of the server is unlocked.
        </p>
      </div>
    </div>
  );
}
