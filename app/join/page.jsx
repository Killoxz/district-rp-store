import { AutoJoin } from '@/components/AutoJoin';

export const metadata = { title: 'Joining District RP…' };

export default function JoinPage() {
  const joinLink = process.env.ROBLOX_JOIN_LINK || '#';
  const discordLink = process.env.DISCORD_SUPPORT_LINK || '#';

  return (
    <div className="page">
      <AutoJoin joinLink={joinLink} discordLink={discordLink} />
    </div>
  );
}
