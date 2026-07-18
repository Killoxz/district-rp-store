'use server';

import { redirect } from 'next/navigation';
import { requireUserId, isRedirectError } from '@/lib/action-helpers';
import { getSession } from '@/lib/session';
import { createDepartmentApplication } from '@/lib/store';
import { notifyDiscordDepartmentApplication } from '@/lib/discord-webhook';

export async function submitDepartmentApplicationAction(formData) {
  const userId = await requireUserId();

  try {
    const department = formData.get('department')?.toString();
    const discordUsername = formData.get('discordUsername')?.toString().trim();
    const email = formData.get('email')?.toString().trim();
    const ageInput = formData.get('age')?.toString().trim();
    const experience = formData.get('experience')?.toString().trim();
    const reason = formData.get('reason')?.toString().trim();
    const availability = formData.get('availability')?.toString().trim();

    if (!department || !discordUsername || !email || !reason) {
      redirect('/apply/department?error=missing_fields');
    }

    const session = await getSession();
    const robloxUsername = session?.user?.name || 'Unknown';

    const applicationId = await createDepartmentApplication({
      userId,
      department,
      discordUsername,
      email,
      age: ageInput ? Number(ageInput) : null,
      experience,
      reason,
      availability,
    });

    await notifyDiscordDepartmentApplication({
      id: applicationId,
      department,
      robloxUsername,
      discordUsername,
      age: ageInput ? Number(ageInput) : null,
      experience,
      reason,
      availability,
    }).catch((err) => console.error('Failed to notify Discord of department application:', err));

    redirect('/apply/department?submitted=1');
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error('submitDepartmentApplicationAction failed:', error);
    redirect('/apply/department?error=unknown');
  }
}
