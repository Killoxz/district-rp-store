import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getOrder } from '@/lib/store';
import { formatCents } from '@/lib/format';
import { retryPaymentAction } from '@/app/actions/checkout';

export const metadata = { title: 'Order | District RP' };

export default async function OrderPage({ params, searchParams }) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/orders/${id}`);
  }

  const order = await getOrder(id, session.user.id);
  if (!order) notFound();

  const discordLink = process.env.DISCORD_SUPPORT_LINK || '#';
  const isPaid = order.status === 'paid';
  const stripeFailed = sp?.error === 'stripe_failed';

  return (
    <div className="page">
      <div className="order-card">
        <h1>{isPaid ? 'Payment Confirmed' : 'Order Received'}</h1>
        <p>
          Order <span className="order-id">{order.id}</span> for <strong>{session.user.name}</strong>{' '}
          {isPaid
            ? 'has been paid. Staff have been notified and will deliver your item(s) shortly.'
            : 'is awaiting payment.'}
        </p>

        <div className="order-items">
          {order.items.map((item) => (
            <div className="order-item-row" key={item.id}>
              <span>{item.name} &times; {item.quantity}</span>
              <span>{formatCents(item.unit_price_cents * item.quantity)}</span>
            </div>
          ))}
          <div className="order-item-row">
            <span><strong>Total</strong></span>
            <span><strong>{formatCents(order.total_cents)}</strong></span>
          </div>
        </div>

        {isPaid ? (
          <div className="payment-box">
            <h2>You're all set</h2>
            <p>
              Keep your order ID (<span className="order-id">{order.id}</span>) handy — if your item hasn't
              arrived after a while, reach out on Discord with it.
            </p>
            <a className="btn btn-outline" href={discordLink} target="_blank" rel="noopener noreferrer">
              Open Discord
            </a>
          </div>
        ) : (
          <div className="payment-box">
            <h2>Complete Your Payment</h2>
            {stripeFailed && (
              <p style={{ color: 'var(--red)' }}>
                Something went wrong starting checkout. Please try again below.
              </p>
            )}
            <p>Pay {formatCents(order.total_cents)} securely by card to finish this order.</p>
            <form action={retryPaymentAction}>
              <input type="hidden" name="orderId" value={order.id} />
              <button type="submit" className="btn btn-primary">Pay Now</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
