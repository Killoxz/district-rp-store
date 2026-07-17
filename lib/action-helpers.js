import { redirect } from 'next/navigation';
import { getSession } from './session';

// redirect() works by throwing a special error Next's router unwinds on.
// Any try/catch around code that might call redirect() must let this
// specific error re-throw instead of swallowing it as a "real" failure.
export function isRedirectError(error) {
  return typeof error?.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT');
}

export async function requireUserId() {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect('/login');
  }
  return session.user.id;
}
