'use server';

import { redirect } from 'next/navigation';
import { requireUserId, isRedirectError } from '@/lib/action-helpers';
import { createOrderFromCart, createOrderForSingleItem } from '@/lib/store';

export async function checkoutAction(formData) {
  const userId = await requireUserId();
  const promoCode = formData.get('promoCode')?.toString().trim() || undefined;

  let orderId;
  try {
    orderId = await createOrderFromCart(userId, promoCode);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error.message === 'INVALID_PROMO') {
      redirect('/cart?error=invalid_promo');
    }
    if (error.message === 'PROMO_NOT_APPLICABLE') {
      redirect('/cart?error=promo_not_applicable');
    }
    console.error('checkoutAction failed to create order:', error);
    redirect('/cart?error=checkout_failed');
  }

  redirect(`/checkout/${orderId}`);
}

export async function buyNowAction(formData) {
  const userId = await requireUserId();

  const productId = formData.get('productId')?.toString();
  const customAmount = formData.get('customAmount');
  const promoCode = formData.get('promoCode')?.toString().trim() || undefined;

  let orderId;
  try {
    orderId = await createOrderForSingleItem(userId, productId, {
      quantity: 1,
      customPriceCents: customAmount ? Math.round(Number(customAmount) * 100) : undefined,
      promoCode,
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error.message === 'INVALID_PROMO') {
      redirect('/?error=invalid_promo#store');
    }
    if (error.message === 'PROMO_NOT_APPLICABLE') {
      redirect('/?error=promo_not_applicable#store');
    }
    console.error('buyNowAction failed to create order:', error);
    redirect('/?error=checkout_failed#store');
  }

  redirect(`/checkout/${orderId}`);
}
