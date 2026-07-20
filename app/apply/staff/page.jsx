import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { submitStaffApplicationAction } from '@/app/actions/staffApplication';
import StaffApplicationForm from './StaffApplicationForm';

export const metadata = { title: 'Staff Application | District RP' };

const ERROR_MESSAGES = {
  missing_fields: 'Please fill in every required field before submitting.',
  unknown: 'Something went wrong submitting your application. Please try again.',
};

export default async function StaffApplicationPage({ searchParams }) {
  const sp = await searchParams;
  const session = await getSession();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/apply/staff');
  }

  const error = sp?.error;
  const submitted = sp?.submitted === '1';

  return (
    <div className="page">
      <h1>Staff Application</h1>
      <p>
        Apply to join the District RP team as Discord Staff or an In-Game Moderator. This is a longer
        application across a few steps — take your time. Staff will review it in Discord and you&rsquo;ll be
        notified here on the site (and by email) once a decision is made.
      </p>

      {submitted && (
        <p style={{ color: 'var(--green)', fontSize: 13, marginBottom: 16 }}>
          Application submitted — staff will review it in Discord.
        </p>
      )}

      {error && (
        <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 16 }}>
          {ERROR_MESSAGES[error] || ERROR_MESSAGES.unknown}
        </p>
      )}

      <StaffApplicationForm action={submitStaffApplicationAction} />
    </div>
  );
}
