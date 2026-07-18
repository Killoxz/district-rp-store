import { NextResponse } from 'next/server';
import { getDepartmentApplication } from '@/lib/store';
import { sendEmail } from '@/lib/email';

const DEPARTMENT_LABELS = {
  police: 'Police Department',
  sheriff: "Sheriff's Department",
  fire: 'Fire Department',
  ems: 'EMS',
};

// Called by the bot right after it approves/declines a department
// application, so the email is centralized here where Resend is already
// configured rather than duplicated into the bot project.
export async function POST(request) {
  const { applicationId } = await request.json();
  if (!applicationId) {
    return NextResponse.json({ error: 'applicationId required' }, { status: 400 });
  }

  const application = await getDepartmentApplication(applicationId);
  if (!application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  const approved = application.status === 'approved';
  const departmentLabel = DEPARTMENT_LABELS[application.department] || application.department;

  const html = approved
    ? `<p>Congratulations! Your application to join the <strong>${departmentLabel}</strong> has been <strong>accepted</strong>.</p>
       <p>Staff will follow up with next steps in Discord.</p>`
    : `<p>Thanks for applying to the <strong>${departmentLabel}</strong>. Unfortunately your application was <strong>declined</strong> this time.</p>
       <p>You're welcome to reach out to staff in Discord if you have questions, or apply again in the future.</p>`;

  const result = await sendEmail({
    to: application.email,
    subject: `District RP — Department Application ${approved ? 'Accepted' : 'Declined'}`,
    html,
  });

  return NextResponse.json({ sent: !!result });
}
