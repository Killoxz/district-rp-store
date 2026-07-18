import { findChannelIdByName, postDiscordMessage } from './discord-bot-api.js';

// Posts a new bullet-point entry to #server-updates — called any time a
// Discord-facing change gets made and pushed, so members can see what
// changed without having to notice it themselves. Plain message content
// (no embed/container) to match Discord's native audit-log look. Each call
// is a fresh message (a running log), unlike #server-status which edits one
// message in place.
export async function postServerUpdate(bullets) {
  const channelId = await findChannelIdByName('server-updates');
  if (!channelId) {
    console.error('postServerUpdate: #server-updates channel not found');
    return null;
  }

  const content = bullets.map((b) => `• ${b}`).join('\n');

  return postDiscordMessage(channelId, { content });
}
