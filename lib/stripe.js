import Stripe from 'stripe';

const globalForStripe = globalThis;

export function getStripe() {
  if (globalForStripe.__drpStripe) return globalForStripe.__drpStripe;

  globalForStripe.__drpStripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return globalForStripe.__drpStripe;
}

export async function createCheckoutSessionForOrder(order) {
  const stripe = getStripe();
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: order.items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: 'usd',
        product_data: { name: item.name },
        unit_amount: item.unit_price_cents,
      },
    })),
    metadata: { orderId: order.id },
    success_url: `${baseUrl}/orders/${order.id}?paid=1`,
    cancel_url: `${baseUrl}/cart`,
  });

  return session;
}
