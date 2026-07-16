import Image from 'next/image';
import { LoginButton } from '@/components/LoginButton';

export const metadata = { title: 'Log in | District RP' };

const ERROR_MESSAGES = {
  OAuthSignin: 'Could not start the Roblox sign-in. Please try again.',
  OAuthCallback: 'Roblox sign-in failed to complete. Please try again.',
  Configuration: 'Roblox login isn’t configured yet — the site owner needs to add real Roblox OAuth credentials.',
  Default: 'Something went wrong signing you in. Please try again.',
};

export default async function LoginPage({ searchParams }) {
  const sp = await searchParams;
  const callbackUrl = sp?.callbackUrl || '/';
  const error = sp?.error;

  return (
    <div className="login-card">
      <Image
        src="/images/server-icon.png"
        alt="District RP"
        width={48}
        height={48}
        className="login-icon"
        style={{ margin: '0 auto 16px', borderRadius: 10, objectFit: 'cover' }}
      />
      <h1>Log in to District RP</h1>
      <p>Sign in with your Roblox account to add items to your cart and check out.</p>

      {error && (
        <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 16 }}>
          {ERROR_MESSAGES[error] || ERROR_MESSAGES.Default}
        </p>
      )}

      <LoginButton callbackUrl={callbackUrl} />
    </div>
  );
}
