import { findChannelIdByName, getGuildChannels, postDiscordMessage } from './discord-bot-api.js';

// Turns any "#channel-name" written in plain text into a real clickable
// Discord channel mention (<#id>) — lets callers just write "#rules" and
// have it link properly, instead of hardcoding channel IDs everywhere.
async function linkifyChannelMentions(text) {
  const channels = await getGuildChannels();
  if (!channels) return text;

  return text.replace(/#([a-z0-9-]+)/g, (match, name) => {
    const channel = channels.find((c) => c.name === name);
    return channel ? `<#${channel.id}>` : match;
  });
}

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

  const linkedBullets = await Promise.all(bullets.map((b) => linkifyChannelMentions(b)));
  const content = linkedBullets.map((b) => `• ${b}`).join('\n');

  return postDiscordMessage(channelId, { content });
}
