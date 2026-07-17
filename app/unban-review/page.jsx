import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import {
  hasPurchasedProduct,
  findMostRecentOrderForProduct,
  getUnbanApplicationsForUser,
} from '@/lib/store';
import { submitUnbanApplicationAction } from '@/app/actions/unban';

export const metadata = { title: 'Unban Review Application | District RP' };

const UNBAN_PRODUCT_ID = 'discord-unban-review';

const ERROR_MESSAGES = {
  missing_order: 'Enter the Order ID from your purchase confirmation.',
  invalid_order: "That Order ID doesn't match a Discord + In-Game Unban Review purchase on your account.",
  missing_fields: 'Please fill in every field before submitting.',
  unknown: 'Something went wrong submitting your application. Please try again.',
};

export default async function UnbanReviewPage({ searchParams }) {
  const sp = await searchParams;
  const session = await getSession();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/unban-review');
  }

  const userId = session.user.id;
  const purchased = await hasPurchasedProduct(userId, UNBAN_PRODUCT_ID);

  if (!purchased) {
    return (
      <div className="page">
        <h1>Unban Review Application</h1>
        <div className="empty-state">
          <p>This form is only available to customers who've purchased the Discord + In-Game Unban Review product.</p>
          <Link href="/#store">Go to the store &rarr;</Link>
        </div>
      </div>
    );
  }

  const [recentOrderId, applications] = await Promise.all([
    findMostRecentOrderForProduct(userId, UNBAN_PRODUCT_ID),
    getUnbanApplicationsForUser(userId),
  ]);

  const error = sp?.error;
  const submitted = sp?.submitted === '1';

  return (
    <div className="page">
      <h1>Unban Review Application</h1>
      <p>
        You've purchased Discord + In-Game Unban Review. To confirm it's really your purchase, enter the
        Order ID shown on your order confirmation page, then fill out the rest of the form below.
      </p>

      {submitted && (
        <p style={{ color: 'var(--green)', fontSize: 13, marginBottom: 16 }}>
          Application submitted — staff will follow up in Discord.
        </p>
      )}

      {error && (
        <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 16 }}>
          {ERROR_MESSAGES[error] || ERROR_MESSAGES.unknown}
        </p>
      )}

      <form action={submitUnbanApplicationAction} className="application-form">
        <div className="field">
          <label htmlFor="orderId">Order ID</label>
          <input
            id="orderId"
            name="orderId"
            type="text"
            defaultValue={recentOrderId || ''}
            placeholder="order_xxxxxxxx"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="robloxUsername">Roblox Username</label>
          <input id="robloxUsername" name="robloxUsername" type="text" required />
        </div>

        <div className="field">
          <label htmlFor="discordUsername">Discord Username</label>
          <input id="discordUsername" name="discordUsername" type="text" required />
        </div>

        <div className="field">
          <label htmlFor="banType">Ban Type</label>
          <select id="banType" name="banType" required defaultValue="discord">
            <option value="discord">Discord Ban</option>
            <option value="in_game">In-Game Ban</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="details">Details</label>
          <textarea
            id="details"
            name="details"
            rows={6}
            required
            placeholder="Explain the ban, roughly when it happened, and why you think it should be reviewed."
          />
        </div>

        <button type="submit" className="btn btn-primary">Submit Application</button>
      </form>

      {applications.length > 0 && (
        <div className="application-history">
          <h2>Your Submitted Applications</h2>
          {applications.map((app) => (
            <div className="application-row" key={app.id}>
              <div>
                <strong>{app.ban_type === 'discord' ? 'Discord Ban' : 'In-Game Ban'}</strong>
                <span className="order-id">{app.id}</span>
              </div>
              <p>{app.details}</p>
              <span className="app-status">Status: {app.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
