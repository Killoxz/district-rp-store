'use server';

import { redirect } from 'next/navigation';
import { requireUserId, isRedirectError } from '@/lib/action-helpers';
import { getSession } from '@/lib/session';
import { createStaffApplication } from '@/lib/store';
import { notifyDiscordStaffApplication } from '@/lib/discord-webhook';

export async function submitStaffApplicationAction(formData) {
  const userId = await requireUserId();

  try {
    const role = formData.get('role')?.toString();
    const discordUsername = formData.get('discordUsername')?.toString().trim();
    const email = formData.get('email')?.toString().trim();
    const ageInput = formData.get('age')?.toString().trim();
    const timezone = formData.get('timezone')?.toString().trim();
    const availability = formData.get('availability')?.toString().trim();
    const priorExperience = formData.get('priorExperience')?.toString().trim();
    const whyJoin = formData.get('whyJoin')?.toString().trim();
    const strengths = formData.get('strengths')?.toString().trim();
    const hasMicrophone = formData.get('hasMicrophone')?.toString().trim();
    const scenario1 = formData.get('scenario1')?.toString().trim();
    const scenario2 = formData.get('scenario2')?.toString().trim();
    const scenario3 = formData.get('scenario3')?.toString().trim();
    const additionalInfo = formData.get('additionalInfo')?.toString().trim();

    if (!role || !discordUsername || !email || !whyJoin || !scenario1 || !scenario2 || !scenario3) {
      redirect('/apply/staff?error=missing_fields');
    }

    const session = await getSession();
    const robloxUsername = session?.user?.name || 'Unknown';

    const applicationId = await createStaffApplication({
      userId,
      role,
      discordUsername,
      email,
      age: ageInput ? Number(ageInput) : null,
      timezone,
      availability,
      priorExperience,
      whyJoin,
      strengths,
      hasMicrophone,
      scenario1,
      scenario2,
      scenario3,
      additionalInfo,
    });

    await notifyDiscordStaffApplication({
      id: applicationId,
      role,
      robloxUsername,
      discordUsername,
      age: ageInput ? Number(ageInput) : null,
      timezone,
      availability,
      priorExperience,
      whyJoin,
      strengths,
      hasMicrophone,
      scenario1,
      scenario2,
      scenario3,
      additionalInfo,
    }).catch((err) => console.error('Failed to notify Discord of staff application:', err));

    redirect('/apply/staff?submitted=1');
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error('submitStaffApplicationAction failed:', error);
    redirect('/apply/staff?error=unknown');
  }
}
