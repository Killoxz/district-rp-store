import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getOrder, setOrderPaymentIntent } from '@/lib/store';
import { getOrCreatePaymentIntentForOrder } from '@/lib/stripe';
import { formatCents } from '@/lib/format';
import { CheckoutForm } from '@/components/CheckoutForm';

export const metadata = { title: 'Checkout | District RP' };

export default async function CheckoutPage({ params }) {
  const { orderId } = await params;
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/checkout/${orderId}`);
  }

  const order = await getOrder(orderId, session.user.id);
  if (!order) notFound();

  if (order.status === 'paid') {
    redirect(`/orders/${orderId}`);
  }

  let clientSecret;
  try {
    const { intent, isNew } = await getOrCreatePaymentIntentForOrder(order);
    if (isNew) {
      await setOrderPaymentIntent(order.id, intent.id);
    }
    clientSecret = intent.client_secret;
  } catch (error) {
    console.error('Failed to create payment intent for checkout page:', error);
    return (
      <div className="page">
        <div className="order-card">
          <h1>Checkout</h1>
          <p style={{ color: 'var(--red)' }}>
            Something went wrong setting up payment. Please try again from your{' '}
            <a href={`/orders/${orderId}`}>order page</a>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="order-card">
        <h1>Checkout</h1>

        <div className="order-items">
          {order.items.map((item) => (
            <div className="order-item-row" key={item.id}>
              <span>{item.name} &times; {item.quantity}</span>
              <span>{formatCents(item.unit_price_cents * item.quantity)}</span>
            </div>
          ))}
          {order.discount_cents > 0 && (
            <div className="order-item-row">
              <span>Promo ({order.promo_code})</span>
              <span>&minus;{formatCents(order.discount_cents)}</span>
            </div>
          )}
          <div className="order-item-row">
            <span><strong>Total</strong></span>
            <span><strong>{formatCents(order.total_cents)}</strong></span>
          </div>
        </div>

        <CheckoutForm
          clientSecret={clientSecret}
          orderId={order.id}
          publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
        />
      </div>
    </div>
  );
}
