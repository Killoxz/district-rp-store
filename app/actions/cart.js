'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  createOrderFromCart,
} from '@/lib/store';
import { requireUserId, isRedirectError } from '@/lib/action-helpers';

export async function addToCartAction(formData) {
  const userId = await requireUserId();

  try {
    const productId = formData.get('productId');
    const customAmount = formData.get('customAmount');

    await addToCart(userId, productId, {
      quantity: 1,
      customPriceCents: customAmount ? Math.round(Number(customAmount) * 100) : undefined,
    });

    revalidatePath('/', 'layout');
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error('addToCartAction failed:', error);
  }
}

export async function updateQuantityAction(formData) {
  const userId = await requireUserId();

  try {
    const cartItemId = Number(formData.get('cartItemId'));
    const delta = Number(formData.get('delta'));
    const currentQuantity = Number(formData.get('currentQuantity'));

    await updateCartItemQuantity(userId, cartItemId, currentQuantity + delta);

    revalidatePath('/', 'layout');
    revalidatePath('/cart');
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error('updateQuantityAction failed:', error);
  }
}

export async function removeCartItemAction(formData) {
  const userId = await requireUserId();

  try {
    const cartItemId = Number(formData.get('cartItemId'));
    await removeCartItem(userId, cartItemId);

    revalidatePath('/', 'layout');
    revalidatePath('/cart');
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error('removeCartItemAction failed:', error);
  }
}

export async function checkoutAction() {
  const userId = await requireUserId();

  let orderId;
  try {
    orderId = await createOrderFromCart(userId);
  } catch (error) {
    console.error('checkoutAction failed:', error);
    redirect('/cart');
  }

  revalidatePath('/', 'layout');
  redirect(`/orders/${orderId}`);
}
