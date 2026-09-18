import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google({ clientId: process.env.AUTH_GOOGLE_ID, clientSecret: process.env.AUTH_GOOGLE_SECRET })],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider === "google" && profile?.sub) {
        token.provider = "google";
        token.providerAccountId = profile.sub;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.provider = typeof token.provider === "string" ? token.provider : undefined;
        session.user.providerAccountId = typeof token.providerAccountId === "string" ? token.providerAccountId : undefined;
      }
      return session;
    },
  },
});
