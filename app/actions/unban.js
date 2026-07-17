'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireUserId, isRedirectError } from '@/lib/action-helpers';
import { hasPurchasedProduct, createUnbanApplication } from '@/lib/store';

const UNBAN_PRODUCT_ID = 'discord-unban-review';

export async function submitUnbanApplicationAction(formData) {
  const userId = await requireUserId();

  const purchased = await hasPurchasedProduct(userId, UNBAN_PRODUCT_ID);
  if (!purchased) {
    redirect('/unban-review');
  }

  try {
    const robloxUsername = formData.get('robloxUsername')?.toString().trim();
    const discordUsername = formData.get('discordUsername')?.toString().trim();
    const banType = formData.get('banType')?.toString();
    const details = formData.get('details')?.toString().trim();
    const orderId = formData.get('orderId')?.toString().trim() || null;

    if (!robloxUsername || !discordUsername || !banType || !details) {
      throw new Error('Missing required fields');
    }

    await createUnbanApplication({
      userId,
      orderId,
      robloxUsername,
      discordUsername,
      banType,
      details,
    });

    revalidatePath('/unban-review');
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error('submitUnbanApplicationAction failed:', error);
  }
}
