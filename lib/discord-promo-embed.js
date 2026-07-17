import { getAllPromoCodes, getBotSetting, setBotSetting } from './store.js';
import { formatCents } from './format.js';
import { findChannelIdByName, postDiscordMessage, editDiscordMessage } from './discord-bot-api.js';

const CHANNEL_NAME = 'store-info';
const MESSAGE_ID_KEY = 'promo_codes_message_id';
const CHANNEL_ID_KEY = 'promo_codes_channel_id';

function buildEmbed(codes) {
  const usable = codes.filter((c) => c.active && (c.max_uses == null || c.used_count < c.max_uses));

  const description = usable.length
    ? usable
        .map((c) => {
          const amount = c.discount_type === 'percent' ? `${c.discount_value}% off` : `${formatCents(c.discount_value)} off`;
          return `\`${c.code}\` — ${amount}`;
        })
        .join('\n')
    : 'No active promo codes right now — check back soon!';

  return {
    title: '🎟️ Active Promo Codes',
    description,
    color: 0xd0263b,
  };
}

// Keeps a single message in #store-info in sync with the current active
// promo codes, so staff never have to manually repost it. Called after any
// admin create/toggle/delete action — best-effort, since a Discord hiccup
// shouldn't block the admin action itself.
export async function syncPromoCodesEmbed() {
  try {
    const codes = await getAllPromoCodes();
    const embed = buildEmbed(codes);

    const storedMessageId = await getBotSetting(MESSAGE_ID_KEY);
    const storedChannelId = await getBotSetting(CHANNEL_ID_KEY);

    if (storedMessageId && storedChannelId) {
      const edited = await editDiscordMessage(storedChannelId, storedMessageId, { embeds: [embed] });
      if (edited) return;
      // Message was likely deleted out from under us — fall through and repost.
    }

    const channelId = storedChannelId || (await findChannelIdByName(CHANNEL_NAME));
    if (!channelId) return;

    const posted = await postDiscordMessage(channelId, { embeds: [embed] });
    if (posted) {
      await setBotSetting(MESSAGE_ID_KEY, posted.id);
      await setBotSetting(CHANNEL_ID_KEY, channelId);
    }
  } catch (error) {
    console.error('Failed to sync promo codes embed to Discord:', error);
  }
}
