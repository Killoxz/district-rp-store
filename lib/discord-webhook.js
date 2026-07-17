import { formatCents } from './format';
import { postToDiscordChannelByName } from './discord-bot-api';

// Posts straight into a Discord channel via its webhook URL — no bot needed.
// Set up under Channel Settings > Integrations > Webhooks in Discord.
export async function notifyDiscordOrderPaid(order) {
  const webhookUrl = process.env.DISCORD_ORDER_WEBHOOK_URL;
  if (!webhookUrl) return;

  const itemLines = order.items
    .map((item) => `• ${item.name} x${item.quantity} — ${formatCents(item.unit_price_cents * item.quantity)}`)
    .join('\n');

  const body = {
    embeds: [
      {
        title: 'New paid order',
        color: 0x1c8a4b,
        fields: [
          { name: 'Buyer', value: order.buyer_username || 'Unknown', inline: true },
          { name: 'Order ID', value: order.id, inline: true },
          { name: 'Total', value: formatCents(order.total_cents), inline: true },
          { name: 'Items', value: itemLines || 'N/A' },
        ],
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error('Discord webhook responded with', res.status, await res.text());
    }
  } catch (error) {
    console.error('Failed to post Discord order notification:', error);
  }
}

// Posted via the bot's own identity (see discord-bot-api.js) rather than a
// plain webhook, since this message needs working Approve/Decline buttons.
export async function notifyDiscordUnbanApplication(application) {
  const usernameMismatch =
    application.accountUsername && application.accountUsername.toLowerCase() !== application.robloxUsername.toLowerCase();

  const embed = {
    color: 0xd0263b,
    title: 'New Unban Review Application',
    fields: [
      {
        name: 'Roblox Username (entered on form)',
        value: usernameMismatch ? `⚠️ ${application.robloxUsername}` : application.robloxUsername,
        inline: true,
      },
      { name: 'Logged in as (Roblox account)', value: application.accountUsername || 'Unknown', inline: true },
      { name: 'Discord Username', value: application.discordUsername, inline: true },
      { name: 'Ban Type', value: application.banType === 'discord' ? 'Discord Ban' : 'In-Game Ban', inline: true },
      { name: 'Order ID', value: application.orderId || 'N/A', inline: true },
      { name: 'Details', value: application.details },
    ],
    footer: { text: `Application ID: ${application.id}${usernameMismatch ? ' — ⚠️ entered username does not match logged-in account' : ''}` },
    timestamp: new Date().toISOString(),
  };

  const components = [
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 3,
          label: 'Approve',
          custom_id: `unban_decision:${application.id}:approve`,
          emoji: { name: '✅' },
        },
        {
          type: 2,
          style: 4,
          label: 'Decline',
          custom_id: `unban_decision:${application.id}:decline`,
          emoji: { name: '❌' },
        },
      ],
    },
  ];

  try {
    await postToDiscordChannelByName('unban-review-info', { embeds: [embed], components });
  } catch (error) {
    console.error('Failed to post unban application to Discord:', error);
  }
}
