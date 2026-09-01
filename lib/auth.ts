import { NextAuthOptions } from 'next-auth'
import AzureADProvider from 'next-auth/providers/azure-ad'
import { JWT } from 'next-auth/jwt'

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const res = await fetch(
      `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: process.env.MICROSOFT_CLIENT_ID!,
          client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
          refresh_token: token.refreshToken as string,
          scope: 'openid profile email offline_access User.ReadBasic.All',
        }),
      }
    )
    const refreshed = await res.json()
    if (!res.ok) throw refreshed
    return {
      ...token,
      accessToken: refreshed.access_token,
      accessTokenExpires: Date.now() + refreshed.expires_in * 1000,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
    }
  } catch {
    return { ...token, error: 'RefreshAccessTokenError' }
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      id: 'microsoft',
      name: 'Microsoft',
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: process.env.MICROSOFT_TENANT_ID!,
      authorization: {
        params: {
          scope: 'openid profile email offline_access User.ReadBasic.All',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      const email =
        (profile as Record<string, unknown>)?.preferred_username ??
        (profile as Record<string, unknown>)?.email ?? ''
      return typeof email === 'string' && email.toLowerCase().endsWith('@americloudtelecom.com')
    },
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.accessTokenExpires = account.expires_at
          ? account.expires_at * 1000
          : Date.now() + 3600 * 1000
      }
      if (profile) {
        token.name = (profile as Record<string, unknown>).name as string ?? token.name
        token.email =
          (profile as Record<string, unknown>).preferred_username as string ??
          (profile as Record<string, unknown>).email as string ??
          token.email
      }
      if (Date.now() < (token.accessTokenExpires ?? 0)) return token
      return refreshAccessToken(token)
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.name = token.name ?? session.user.name
        session.user.email = token.email ?? session.user.email
      }
      session.accessToken = token.accessToken
      return session
    },
  },
  pages: { signIn: '/login', error: '/login' },
  session: { strategy: 'jwt' },
}
