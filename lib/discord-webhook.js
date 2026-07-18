import { formatCents } from './format';
import { postToDiscordChannelByName } from './discord-bot-api';

// Images are pulled from our own site rather than uploaded to Discord — a
// Discord CDN attachment URL is signed and expires after ~24h unless the
// client actively refreshes it; a plain URL to an asset we host never does.
const APPLY_BANNER_URL = 'https://district-rp-store.vercel.app/images/apply-banner.png';
const STRIP_IMAGE_URL = 'https://district-rp-store.vercel.app/images/rules-banner-strip.png?v=2';
const SIREN_EMOJI = '<:siren:1528151306848436264>';
const CLIPBOARD_EMOJI = '<:clipboard:1528151347843825805>';
const IS_COMPONENTS_V2 = 1 << 15;

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
          emoji: { id: '1527805525151191151', name: 'verified' },
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

const DEPARTMENT_LABELS = {
  police: 'Police Department',
  sheriff: "Sheriff's Department",
  fire: 'Fire Department',
  ems: 'EMS',
};

// Posted via the bot's own identity so the Approve/Decline buttons work,
// same reasoning as the unban review application above. Uses the same
// Components V2 banner/divider/text/strip layout as #rules, #verify, and
// #store-info rather than a classic embed.
export async function notifyDiscordDepartmentApplication(application) {
  const departmentLabel = DEPARTMENT_LABELS[application.department] || application.department;

  const lines = [
    `• Department: ${SIREN_EMOJI} ${departmentLabel}`,
    `• Roblox Username: ${application.robloxUsername}`,
    `• Discord Username: ${application.discordUsername}`,
    `• Age: ${application.age ? String(application.age) : 'N/A'}`,
    `• Availability: ${application.availability || 'N/A'}`,
    `• Prior Experience: ${application.experience || 'None listed'}`,
    `• Why do you want to join: ${application.reason}`,
  ];

  const content = `**${CLIPBOARD_EMOJI} New Department Application**\n\n${lines.join('\n')}\n\n-# Application ID: ${application.id}`;

  const payload = {
    flags: IS_COMPONENTS_V2,
    components: [
      {
        type: 17,
        accent_color: 0xd0263b,
        components: [
          { type: 12, items: [{ media: { url: APPLY_BANNER_URL } }] },
          { type: 14, divider: true, spacing: 1 },
          { type: 10, content },
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 3,
                label: 'Approve',
                custom_id: `dept_decision:${application.id}:approve`,
                emoji: { id: '1527805525151191151', name: 'verified' },
              },
              {
                type: 2,
                style: 4,
                label: 'Decline',
                custom_id: `dept_decision:${application.id}:decline`,
                emoji: { name: '❌' },
              },
            ],
          },
          { type: 14, divider: true, spacing: 1 },
          { type: 12, items: [{ media: { url: STRIP_IMAGE_URL } }] },
        ],
      },
    ],
  };

  try {
    await postToDiscordChannelByName('department-applications', payload);
  } catch (error) {
    console.error('Failed to post department application to Discord:', error);
  }
}
