import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe subset of the auth config — no providers, no Prisma/bcrypt.
 * This is what src/proxy.ts (Edge middleware) uses to verify the session
 * JWT; the full config with the Credentials provider lives in auth.ts and
 * is only ever imported from Node.js runtime code (Server Components,
 * Server Actions, the /api/auth route handler).
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.id === "string") {
        session.user.id = token.id;
      }
      return session;
    },
  },
};
