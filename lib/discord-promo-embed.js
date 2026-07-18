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
// Images are pulled from our own site rather than uploaded to Discord — a
// Discord CDN attachment URL is signed and expires after ~24h unless the
// client actively refreshes it; a plain URL to an asset we host never does.
const BANNER_IMAGE_URL = 'https://district-rp-store.vercel.app/images/shop-banner.png';
const STRIP_IMAGE_URL = 'https://district-rp-store.vercel.app/images/rules-banner-strip.png?v=2';
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
// Rebuilds the whole Components V2 layout from scratch each time (matching
// the banner/divider/text/divider/strip style used across #rules and
// #verify) rather than editing whatever Discord currently has, so there's
// never a dependency on state left behind by a previous sync.
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

    await editDiscordMessage(channelId, messageId, {
      flags: 1 << 15, // IS_COMPONENTS_V2
      embeds: [],
      components: [
        {
          type: 17, // Container
          accent_color: 0xd0263b,
          components: [
            { type: 12, items: [{ media: { url: BANNER_IMAGE_URL } }] },
            { type: 14, divider: true, spacing: 1 },
            { type: 10, content: baseDescription + buildPromoSection(usable) },
            {
              type: 1,
              components: [
                {
                  type: 2,
                  style: 5,
                  label: 'Visit Store',
                  emoji: { id: '1527805459602608299', name: 'shop' },
                  url: 'https://district-rp-store.vercel.app/#store',
                },
              ],
            },
            { type: 14, divider: true, spacing: 1 },
            { type: 12, items: [{ media: { url: STRIP_IMAGE_URL } }] },
          ],
        },
      ],
    });
  } catch (error) {
    console.error('Failed to sync promo codes embed to Discord:', error);
  }
}
