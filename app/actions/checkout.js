'use server';

import { redirect } from 'next/navigation';
import { requireUserId, isRedirectError } from '@/lib/action-helpers';
import { createOrderFromCart, getOrder, setOrderStripeSession } from '@/lib/store';
import { createCheckoutSessionForOrder } from '@/lib/stripe';

export async function checkoutAction() {
  const userId = await requireUserId();

  let orderId;
  try {
    orderId = await createOrderFromCart(userId);
  } catch (error) {
    console.error('checkoutAction failed to create order:', error);
    redirect('/cart');
  }

  await redirectToStripeForOrder(orderId, userId);
}

export async function retryPaymentAction(formData) {
  const userId = await requireUserId();
  const orderId = formData.get('orderId')?.toString();
  if (!orderId) redirect('/cart');

  await redirectToStripeForOrder(orderId, userId);
}

async function redirectToStripeForOrder(orderId, userId) {
  try {
    const order = await getOrder(orderId, userId);
    if (!order) throw new Error('Order not found');

    const session = await createCheckoutSessionForOrder(order);
    await setOrderStripeSession(orderId, session.id);

    redirect(session.url);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error('Failed to create Stripe checkout session:', error);
    redirect(`/orders/${orderId}?error=stripe_failed`);
  }
}
