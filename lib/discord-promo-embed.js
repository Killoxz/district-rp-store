import { getAllPromoCodes, getBotSetting } from './store.js';
import { formatCents } from './format.js';
import { editDiscordMessage } from './discord-bot-api.js';

// Points at the existing "District RP Store" message in #store-info (the one
// with the banner + description + Visit Store button) — seeded once via a
// one-off script, not created by this module. We only ever edit it.
const STORE_INFO_CHANNEL_ID_KEY = 'store_info_channel_id';
const STORE_INFO_MESSAGE_ID_KEY = 'store_info_message_id';
// The description text as it was before any promo codes were ever appended,
// so each sync rebuilds from a stable base instead of appending on top of
// whatever the previous sync left behind.
const BASE_DESCRIPTION_KEY = 'store_info_base_description';
// The banner is pulled from our own site rather than re-uploaded to Discord —
// a Discord CDN attachment URL is signed and expires after ~24h unless the
// client actively refreshes it, which doesn't happen for a message nothing
// is re-editing; a plain URL to an asset we host never expires.
const BANNER_IMAGE_URL = 'https://district-rp-store.vercel.app/images/banner.png';
const TICKET_EMOJI = '<:ticket:1527805234146185399>';

function buildPromoSection(usableCodes) {
  if (!usableCodes.length) return '';
  const lines = usableCodes.map((c) => {
    const amount = c.discount_type === 'percent' ? `${c.discount_value}% off` : `${formatCents(c.discount_value)} off`;
    return `\`${c.code}\` — ${amount}`;
  });
  return `\n\n**${TICKET_EMOJI} Active Promo Codes**\n${lines.join('\n')}`;
}

// Keeps the store-info message's description in sync with the current
// active promo codes — called after any admin create/toggle/delete action.
// Rebuilds both embeds from scratch each time rather than editing whatever
// Discord currently has, so there's never a dependency on a raw file
// attachment (which caused the banner to render twice before) or on state
// left behind by a previous sync.
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

    const bannerEmbed = {
      color: 0xd0263b,
      image: { url: BANNER_IMAGE_URL },
    };
    const descriptionEmbed = {
      color: 0xd0263b,
      author: { name: 'District RP Store' },
      description: baseDescription + buildPromoSection(usable),
    };

    // Explicitly clears out any raw file attachment (rather than omitting
    // the field), so the banner only ever renders via the embed above.
    await editDiscordMessage(channelId, messageId, { embeds: [bannerEmbed, descriptionEmbed], attachments: [] });
  } catch (error) {
    console.error('Failed to sync promo codes embed to Discord:', error);
  }
}
