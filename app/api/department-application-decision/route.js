import { NextResponse } from 'next/server';
import { getDepartmentApplication } from '@/lib/store';
import { sendEmail } from '@/lib/email';
import { buildDepartmentDecisionEmail } from '@/lib/emailTemplates';

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

  const html = buildDepartmentDecisionEmail({ department: application.department, approved, station: application.station });

  const result = await sendEmail({
    to: application.email,
    subject: `District RP — Department Application ${approved ? 'Accepted' : 'Declined'}`,
    html,
  });

  return NextResponse.json({ sent: !!result });
}
