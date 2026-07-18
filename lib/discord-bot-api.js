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

export async function findChannelIdByName(channelName) {
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!guildId || !process.env.DISCORD_BOT_TOKEN) return null;

  const channels = await discordApi('GET', `/guilds/${guildId}/channels`);
  if (!channels) return null;

  const channel = channels.find((c) => c.name === channelName);
  if (!channel) {
    console.error(`Discord channel "${channelName}" not found`);
    return null;
  }
  return channel.id;
}

export async function postToDiscordChannelByName(channelName, payload) {
  const channelId = await findChannelIdByName(channelName);
  if (!channelId) return null;
  return discordApi('POST', `/channels/${channelId}/messages`, payload);
}

export async function postDiscordMessage(channelId, payload) {
  return discordApi('POST', `/channels/${channelId}/messages`, payload);
}

export async function editDiscordMessage(channelId, messageId, payload) {
  return discordApi('PATCH', `/channels/${channelId}/messages/${messageId}`, payload);
}

export async function getDiscordMessage(channelId, messageId) {
  return discordApi('GET', `/channels/${channelId}/messages/${messageId}`);
}

export async function deleteDiscordMessage(channelId, messageId) {
  return discordApi('DELETE', `/channels/${channelId}/messages/${messageId}`);
}

export async function getGuildRoles() {
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!guildId) return null;
  return discordApi('GET', `/guilds/${guildId}/roles`);
}

export async function getGuildMember(userId) {
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!guildId) return null;
  return discordApi('GET', `/guilds/${guildId}/members/${userId}`);
}

export async function addGuildMemberRole(userId, roleId) {
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!guildId) return null;
  return discordApi('PUT', `/guilds/${guildId}/members/${userId}/roles/${roleId}`);
}

export async function removeGuildMemberRole(userId, roleId) {
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!guildId) return null;
  return discordApi('DELETE', `/guilds/${guildId}/members/${userId}/roles/${roleId}`);
}

export async function setGuildMemberNickname(userId, nick) {
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!guildId) return null;
  return discordApi('PATCH', `/guilds/${guildId}/members/${userId}`, { nick });
}
