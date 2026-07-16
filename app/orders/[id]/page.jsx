import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getOrder } from '@/lib/store';
import { formatCents } from '@/lib/format';

export const metadata = { title: 'Order | District RP' };

export default async function OrderPage({ params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/orders/${id}`);
  }

  const order = await getOrder(id, session.user.id);
  if (!order) notFound();

  const paypalLink = process.env.PAYPAL_LINK || '#';
  const discordLink = process.env.DISCORD_SUPPORT_LINK || '#';

  return (
    <div className="page">
      <div className="order-card">
        <h1>Order Received</h1>
        <p>
          Order <span className="order-id">{order.id}</span> for <strong>{session.user.name}</strong> is
          awaiting payment. Complete payment below, then keep your order ID for Support.
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

        <div className="payment-box">
          <h2>Complete Your Payment</h2>
          <p>
            Pay {formatCents(order.total_cents)} via PayPal, then open a Discord support ticket with your
            order ID (<span className="order-id">{order.id}</span>) and payment confirmation so staff can
            deliver your item.
          </p>
          <a className="btn btn-primary" href={paypalLink} target="_blank" rel="noopener noreferrer">
            Pay with PayPal
          </a>{' '}
          <a className="btn btn-outline" href={discordLink} target="_blank" rel="noopener noreferrer">
            Open Discord Ticket
          </a>
        </div>
      </div>
    </div>
  );
}
