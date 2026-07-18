import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { submitDepartmentApplicationAction } from '@/app/actions/departmentApplication';

export const metadata = { title: 'Department Application | District RP' };

const ERROR_MESSAGES = {
  missing_fields: 'Please fill in every required field before submitting.',
  unknown: 'Something went wrong submitting your application. Please try again.',
};

export default async function DepartmentApplicationPage({ searchParams }) {
  const sp = await searchParams;
  const session = await getSession();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/apply/department');
  }

  const error = sp?.error;
  const submitted = sp?.submitted === '1';

  return (
    <div className="page">
      <h1>Department Application</h1>
      <p>
        Apply to join a District RP department. Staff will review your application in Discord and you'll be
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

      <form action={submitDepartmentApplicationAction} className="application-form">
        <div className="field">
          <label htmlFor="department">Department</label>
          <select id="department" name="department" required defaultValue="">
            <option value="" disabled>Choose a department&hellip;</option>
            <option value="police">Police Department</option>
            <option value="sheriff">Sheriff&rsquo;s Department</option>
            <option value="fire">Fire Department</option>
            <option value="ems">EMS</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="discordUsername">Discord Username</label>
          <input id="discordUsername" name="discordUsername" type="text" required />
        </div>

        <div className="field">
          <label htmlFor="email">Email Address</label>
          <input id="email" name="email" type="email" required placeholder="you@example.com" />
        </div>

        <div className="field">
          <label htmlFor="age">Age</label>
          <input id="age" name="age" type="number" min="1" max="120" />
        </div>

        <div className="field">
          <label htmlFor="availability">Availability</label>
          <input id="availability" name="availability" type="text" placeholder="e.g. Weekends, evenings EST" />
        </div>

        <div className="field">
          <label htmlFor="experience">Prior RP / Department Experience</label>
          <textarea id="experience" name="experience" rows={4} placeholder="Optional — any relevant past experience." />
        </div>

        <div className="field">
          <label htmlFor="reason">Why do you want to join this department?</label>
          <textarea id="reason" name="reason" rows={6} required />
        </div>

        <button type="submit" className="btn btn-primary">Submit Application</button>
      </form>
    </div>
  );
}
