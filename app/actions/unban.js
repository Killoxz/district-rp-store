'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireUserId, isRedirectError } from '@/lib/action-helpers';
import { getSession } from '@/lib/session';
import {
  hasPurchasedProduct,
  verifyOrderContainsProduct,
  createUnbanApplication,
} from '@/lib/store';
import { notifyDiscordUnbanApplication } from '@/lib/discord-webhook';

const UNBAN_PRODUCT_ID = 'discord-unban-review';

export async function submitUnbanApplicationAction(formData) {
  const userId = await requireUserId();

  const purchased = await hasPurchasedProduct(userId, UNBAN_PRODUCT_ID);
  if (!purchased) {
    redirect('/unban-review');
  }

  const orderId = formData.get('orderId')?.toString().trim();
  if (!orderId) {
    redirect('/unban-review?error=missing_order');
  }

  const orderValid = await verifyOrderContainsProduct(userId, orderId, UNBAN_PRODUCT_ID);
  if (!orderValid) {
    redirect('/unban-review?error=invalid_order');
  }

  try {
    const robloxUsername = formData.get('robloxUsername')?.toString().trim();
    const discordUsername = formData.get('discordUsername')?.toString().trim();
    const banType = formData.get('banType')?.toString();
    const details = formData.get('details')?.toString().trim();

    if (!robloxUsername || !discordUsername || !banType || !details) {
      redirect('/unban-review?error=missing_fields');
    }

    const applicationId = await createUnbanApplication({
      userId,
      orderId,
      robloxUsername,
      discordUsername,
      banType,
      details,
    });

    const session = await getSession();

    await notifyDiscordUnbanApplication({
      id: applicationId,
      orderId,
      robloxUsername,
      discordUsername,
      banType,
      details,
      accountUsername: session?.user?.name,
    }).catch((err) => console.error('Failed to notify Discord of unban application:', err));

    revalidatePath('/unban-review');
    redirect('/unban-review?submitted=1');
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error('submitUnbanApplicationAction failed:', error);
    redirect('/unban-review?error=unknown');
  }
}
