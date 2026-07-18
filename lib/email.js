import { Resend } from 'resend';

const globalForResend = globalThis;

function getResend() {
  if (globalForResend.__drpResend) return globalForResend.__drpResend;
  globalForResend.__drpResend = new Resend(process.env.RESEND_API_KEY);
  return globalForResend.__drpResend;
}

// Resend's shared "onboarding@resend.dev" address only works until a real
// domain is verified on the account — swap EMAIL_FROM once one is added.
const FROM_ADDRESS = process.env.EMAIL_FROM || 'District RP <onboarding@resend.dev>';

export async function sendEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) {
    console.error('sendEmail: RESEND_API_KEY not configured, skipping send');
    return null;
  }

  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({ from: FROM_ADDRESS, to, subject, html });
    if (error) {
      console.error('Resend send failed:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Failed to send email:', err);
    return null;
  }
}
