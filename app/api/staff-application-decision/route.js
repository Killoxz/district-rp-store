import { NextResponse } from 'next/server';
import { getStaffApplication } from '@/lib/store';
import { sendEmail } from '@/lib/email';
import { buildStaffDecisionEmail } from '@/lib/emailTemplates';

// Called by the bot right after it approves/declines a staff application,
// mirroring /api/department-application-decision.
export async function POST(request) {
  const { applicationId } = await request.json();
  if (!applicationId) {
    return NextResponse.json({ error: 'applicationId required' }, { status: 400 });
  }

  const application = await getStaffApplication(applicationId);
  if (!application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  const approved = application.status === 'approved';

  const html = buildStaffDecisionEmail({ role: application.role, approved });

  const result = await sendEmail({
    to: application.email,
    subject: `District RP — Staff Application ${approved ? 'Accepted' : 'Declined'}`,
    html,
  });

  return NextResponse.json({ sent: !!result });
}
