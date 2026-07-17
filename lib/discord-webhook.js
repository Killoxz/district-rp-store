import { formatCents } from './format';

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
