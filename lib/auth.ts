import { NextAuthOptions } from 'next-auth'
import AzureADProvider from 'next-auth/providers/azure-ad'

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      id: 'microsoft',
      name: 'Microsoft',
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: process.env.MICROSOFT_TENANT_ID!,
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      const email =
        (profile as Record<string, unknown>)?.preferred_username ??
        (profile as Record<string, unknown>)?.email ??
        ''
      return typeof email === 'string' && email.toLowerCase().endsWith('@americloudtelecom.com')
    },
    async jwt({ token, profile }) {
      if (profile) {
        token.name = (profile as Record<string, unknown>).name as string ?? token.name
        token.email =
          (profile as Record<string, unknown>).preferred_username as string ??
          (profile as Record<string, unknown>).email as string ??
          token.email
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.name = token.name ?? session.user.name
        session.user.email = token.email ?? session.user.email
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
}
