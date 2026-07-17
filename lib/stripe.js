import Stripe from 'stripe';

const globalForStripe = globalThis;

export function getStripe() {
  if (globalForStripe.__drpStripe) return globalForStripe.__drpStripe;

  globalForStripe.__drpStripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return globalForStripe.__drpStripe;
}

// Reuses an existing PaymentIntent for this order if it's still usable (e.g.
// the customer just refreshed the checkout page), otherwise creates a fresh
// one. Caller is responsible for persisting a newly-created intent's id via
// setOrderPaymentIntent — kept out of here so this module doesn't need to
// import the data layer.
export async function getOrCreatePaymentIntentForOrder(order) {
  const stripe = getStripe();

  if (order.stripe_payment_intent_id) {
    const existing = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id);
    if (!['succeeded', 'canceled'].includes(existing.status)) {
      return { intent: existing, isNew: false };
    }
  }

  const intent = await stripe.paymentIntents.create({
    amount: order.total_cents,
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
    metadata: { orderId: order.id },
  });

  return { intent, isNew: true };
}
