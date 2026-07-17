import { getAllPromoCodes, getBotSetting } from './store.js';
import { formatCents } from './format.js';
import { getDiscordMessage, editDiscordMessage } from './discord-bot-api.js';

// Points at the existing "District RP Store" message in #store-info (the one
// with the banner + description + Visit Store button) — seeded once via a
// one-off script, not created by this module. We only ever edit it.
const STORE_INFO_CHANNEL_ID_KEY = 'store_info_channel_id';
const STORE_INFO_MESSAGE_ID_KEY = 'store_info_message_id';

const PROMO_EMBED_TITLE = '🎟️ Active Promo Codes';

function buildPromoEmbed(usableCodes) {
  const description = usableCodes
    .map((c) => {
      const amount = c.discount_type === 'percent' ? `${c.discount_value}% off` : `${formatCents(c.discount_value)} off`;
      return `\`${c.code}\` — ${amount}`;
    })
    .join('\n');

  return {
    title: PROMO_EMBED_TITLE,
    description,
    color: 0xd0263b,
  };
}

// Keeps the store-info message's promo codes section in sync with what's
// currently active — called after any admin create/toggle/delete action.
// Adds a dedicated embed to the message when there's at least one usable
// code, and removes it again once none are left. Best-effort: failures are
// logged, never thrown, since a Discord hiccup shouldn't block the admin
// action itself.
export async function syncPromoCodesEmbed() {
  try {
    const channelId = await getBotSetting(STORE_INFO_CHANNEL_ID_KEY);
    const messageId = await getBotSetting(STORE_INFO_MESSAGE_ID_KEY);
    if (!channelId || !messageId) {
      console.error('syncPromoCodesEmbed: store_info message reference not configured');
      return;
    }

    const current = await getDiscordMessage(channelId, messageId);
    if (!current) return;

    const codes = await getAllPromoCodes();
    const usable = codes.filter((c) => c.active && (c.max_uses == null || c.used_count < c.max_uses));

    const baseEmbeds = (current.embeds || []).filter((e) => e.title !== PROMO_EMBED_TITLE);
    const nextEmbeds = usable.length ? [...baseEmbeds, buildPromoEmbed(usable)] : baseEmbeds;

    await editDiscordMessage(channelId, messageId, { embeds: nextEmbeds });
  } catch (error) {
    console.error('Failed to sync promo codes embed to Discord:', error);
  }
}
