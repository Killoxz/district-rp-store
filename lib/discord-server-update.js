import { findChannelIdByName, postDiscordMessage } from './discord-bot-api.js';

const IS_COMPONENTS_V2 = 1 << 15;

// Posts a new bullet-point entry to #server-updates — called any time a
// Discord-facing change gets made and pushed, so members can see what
// changed without having to notice it themselves. Each call is a fresh
// message (a running log), unlike #server-status which edits one message
// in place.
export async function postServerUpdate(title, bullets) {
  const channelId = await findChannelIdByName('server-updates');
  if (!channelId) {
    console.error('postServerUpdate: #server-updates channel not found');
    return null;
  }

  const content = `**🔧 ${title}**\n\n${bullets.map((b) => `• ${b}`).join('\n')}`;

  return postDiscordMessage(channelId, {
    flags: IS_COMPONENTS_V2,
    components: [{ type: 17, accent_color: 0xd0263b, components: [{ type: 10, content }] }],
  });
}
