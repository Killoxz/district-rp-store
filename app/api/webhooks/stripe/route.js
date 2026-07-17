import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { markOrderPaid, getOrderById } from '@/lib/store';
import { notifyDiscordOrderPaid } from '@/lib/discord-webhook';

export async function POST(request) {
  const stripe = getStripe();
  const signature = request.headers.get('stripe-signature');
  const rawBody = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error('Stripe webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata?.orderId;

    if (orderId) {
      try {
        await markOrderPaid(orderId);
        const order = await getOrderById(orderId);
        if (order) {
          await notifyDiscordOrderPaid(order);
        }
      } catch (error) {
        console.error('Failed to process paid order from Stripe webhook:', error);
        return NextResponse.json({ error: 'Failed to process order' }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
