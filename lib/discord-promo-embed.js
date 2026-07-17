import { getAllPromoCodes, getBotSetting } from './store.js';
import { formatCents } from './format.js';
import { editDiscordMessage } from './discord-bot-api.js';

// Points at the existing "District RP Store" message in #store-info (the one
// with the banner attachment + description + Visit Store button) — seeded
// once via a one-off script, not created by this module. We only ever edit it.
const STORE_INFO_CHANNEL_ID_KEY = 'store_info_channel_id';
const STORE_INFO_MESSAGE_ID_KEY = 'store_info_message_id';
// The description text as it was before any promo codes were ever appended,
// so each sync rebuilds from a stable base instead of appending on top of
// whatever the previous sync left behind.
const BASE_DESCRIPTION_KEY = 'store_info_base_description';

function buildPromoSection(usableCodes) {
  if (!usableCodes.length) return '';
  const lines = usableCodes.map((c) => {
    const amount = c.discount_type === 'percent' ? `${c.discount_value}% off` : `${formatCents(c.discount_value)} off`;
    return `\`${c.code}\` — ${amount}`;
  });
  return `\n\n**🎟️ Active Promo Codes**\n${lines.join('\n')}`;
}

// Keeps the store-info message's description in sync with the current
// active promo codes — called after any admin create/toggle/delete action.
// Rebuilds the description embed from scratch each time (base text + promo
// section) rather than editing embeds fetched from Discord, since resending
// the banner's own image-embed verbatim caused it to render twice alongside
// the message's own file attachment.
export async function syncPromoCodesEmbed() {
  try {
    const channelId = await getBotSetting(STORE_INFO_CHANNEL_ID_KEY);
    const messageId = await getBotSetting(STORE_INFO_MESSAGE_ID_KEY);
    const baseDescription = await getBotSetting(BASE_DESCRIPTION_KEY);
    if (!channelId || !messageId || !baseDescription) {
      console.error('syncPromoCodesEmbed: store_info message reference not configured');
      return;
    }

    const codes = await getAllPromoCodes();
    const usable = codes.filter((c) => c.active && (c.max_uses == null || c.used_count < c.max_uses));

    const embed = {
      color: 0xd0263b,
      author: { name: 'District RP Store' },
      description: baseDescription + buildPromoSection(usable),
    };

    await editDiscordMessage(channelId, messageId, { embeds: [embed] });
  } catch (error) {
    console.error('Failed to sync promo codes embed to Discord:', error);
  }
}
