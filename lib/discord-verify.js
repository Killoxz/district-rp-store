import { getGuildRoles, getGuildMember, addGuildMemberRole, removeGuildMemberRole, setGuildMemberNickname } from './discord-bot-api.js';

const CIVILIAN_ROLE_NAME = 'Civilian';
const UNVERIFIED_ROLE_NAME = 'Unverified';

// Applies the same role swap + nickname the bot used to do directly, except
// entirely over Discord's REST API — this works even if the bot process
// itself isn't currently running, since the website already has its own
// bot-token access for posting messages.
export async function applyDiscordVerification(discordId, robloxUsername) {
  const member = await getGuildMember(discordId);
  if (!member) {
    return { ok: false, reason: 'not_in_server' };
  }

  const roles = await getGuildRoles();
  if (!roles) {
    return { ok: false, reason: 'roles_lookup_failed' };
  }

  const civilianRole = roles.find((r) => r.name === CIVILIAN_ROLE_NAME);
  const unverifiedRole = roles.find((r) => r.name === UNVERIFIED_ROLE_NAME);
  const alreadyVerified = civilianRole ? member.roles.includes(civilianRole.id) : false;

  if (unverifiedRole && member.roles.includes(unverifiedRole.id)) {
    await removeGuildMemberRole(discordId, unverifiedRole.id);
  }
  if (civilianRole && !member.roles.includes(civilianRole.id)) {
    await addGuildMemberRole(discordId, civilianRole.id);
  }

  // Best-effort — Discord blocks renaming the server owner or anyone above
  // the bot's own role, regardless of permissions.
  await setGuildMemberNickname(discordId, robloxUsername);

  return { ok: true, alreadyVerified };
}
