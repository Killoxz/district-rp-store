const BASE = 'https://discord.com/api/v10';

// Posting through the bot's own identity (rather than a plain incoming
// webhook) so messages can include interactive components — buttons only
// route their click interactions back to whichever application owns them,
// and a raw webhook message has no such owner to route to.
async function discordApi(method, path, body) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return null;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    console.error(`Discord API ${method} ${path} failed:`, res.status, await res.text());
    return null;
  }
  return res.status === 204 ? null : res.json();
}

export async function postToDiscordChannelByName(channelName, payload) {
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!guildId || !process.env.DISCORD_BOT_TOKEN) return null;

  const channels = await discordApi('GET', `/guilds/${guildId}/channels`);
  if (!channels) return null;

  const channel = channels.find((c) => c.name === channelName);
  if (!channel) {
    console.error(`Discord channel "${channelName}" not found`);
    return null;
  }

  return discordApi('POST', `/channels/${channel.id}/messages`, payload);
}
