'use server';

import { revalidatePath } from 'next/cache';
import { requireUserId } from '@/lib/action-helpers';
import { isAdmin, createPromoCode, togglePromoCodeActive, deletePromoCode } from '@/lib/store';
import { syncPromoCodesEmbed } from '@/lib/discord-promo-embed';

async function requireAdmin() {
  const userId = await requireUserId();
  const admin = await isAdmin(userId);
  if (!admin) {
    throw new Error('Not authorized');
  }
  return userId;
}

export async function createPromoCodeAction(formData) {
  await requireAdmin();

  const code = formData.get('code')?.toString().trim();
  const discountType = formData.get('discountType')?.toString();
  const amountInput = formData.get('amount')?.toString();
  const maxUsesInput = formData.get('maxUses')?.toString().trim();

  if (!code || !discountType || !amountInput) return;

  const discountValue =
    discountType === 'percent' ? Math.round(Number(amountInput)) : Math.round(Number(amountInput) * 100);

  await createPromoCode({
    code,
    discountType,
    discountValue,
    maxUses: maxUsesInput ? Number(maxUsesInput) : null,
  });

  await syncPromoCodesEmbed();
  revalidatePath('/admin/promo-codes');
}

export async function togglePromoCodeActiveAction(formData) {
  await requireAdmin();
  const id = formData.get('id')?.toString();
  if (!id) return;
  await togglePromoCodeActive(id);
  await syncPromoCodesEmbed();
  revalidatePath('/admin/promo-codes');
}

export async function deletePromoCodeAction(formData) {
  await requireAdmin();
  const id = formData.get('id')?.toString();
  if (!id) return;
  await deletePromoCode(id);
  await syncPromoCodesEmbed();
  revalidatePath('/admin/promo-codes');
}
