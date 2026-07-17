import { upsertUserFromRoblox } from './store.js';

// Roblox's OAuth 2.0 / OpenID Connect implementation for "Sign in with Roblox".
// Docs: https://create.roblox.com/docs/cloud/reference/oauth2
const RobloxProvider = {
  id: 'roblox',
  name: 'Roblox',
  type: 'oauth',
  wellKnown: 'https://apis.roblox.com/oauth/.well-known/openid-configuration',
  authorization: { params: { scope: 'openid profile' } },
  idToken: true,
  checks: ['pkce', 'state'],
  // Roblox signs ID tokens with ES256; the OAuth client defaults to
  // expecting RS256 unless told otherwise, which fails signature
  // validation with "unexpected JWT alg received, expected RS256, got: ES256".
  client: {
    id_token_signed_response_alg: 'ES256',
  },
  clientId: process.env.ROBLOX_CLIENT_ID,
  clientSecret: process.env.ROBLOX_CLIENT_SECRET,
  profile(profile) {
    return {
      id: profile.sub,
      name: profile.preferred_username || profile.nickname || profile.name,
      image: profile.picture,
    };
  },
};

export const authOptions = {
  providers: [RobloxProvider],
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  logger: {
    error(code, metadata) {
      const err = metadata?.error || metadata;
      console.error('[next-auth error]', code, {
        providerId: metadata?.providerId,
        name: err?.name,
        message: err?.message,
        cause: err?.cause,
        stack: err?.stack,
      });
    },
    warn(code) {
      console.warn('[next-auth warn]', code);
    },
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        try {
          const robloxId = profile.sub;
          const username = profile.preferred_username || profile.nickname || profile.name;
          const avatarUrl = profile.picture;

          const dbUserId = await upsertUserFromRoblox({ robloxId, username, avatarUrl });

          token.dbUserId = dbUserId;
          token.robloxId = robloxId;
          token.username = username;
          token.avatarUrl = avatarUrl;
        } catch (error) {
          // Don't let a DB hiccup during sign-in take the whole server down —
          // worst case the user ends up without a dbUserId and gets bounced
          // back to /login by the pages that require one.
          console.error('Failed to upsert user during sign-in:', error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.dbUserId;
      session.user.robloxId = token.robloxId;
      session.user.name = token.username;
      session.user.image = token.avatarUrl;
      return session;
    },
  },
};
