import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

// Single-process in-memory throttle. Good enough for a single-instance
// self-hosted deployment; resets on restart, which is an acceptable
// trade-off for a single-admin internal tool.
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

function isLockedOut(key: string): boolean {
  const entry = loginAttempts.get(key);
  if (!entry) return false;
  if (entry.lockedUntil > Date.now()) return true;
  if (entry.lockedUntil > 0) loginAttempts.delete(key);
  return false;
}

function recordFailedAttempt(key: string) {
  const entry = loginAttempts.get(key) ?? { count: 0, lockedUntil: 0 };
  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_MS;
  }
  loginAttempts.set(key, entry);
}

function clearAttempts(key: string) {
  loginAttempts.delete(key);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email" },
        password: { label: "Mot de passe" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const key = email.trim().toLowerCase();
        if (isLockedOut(key)) {
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          recordFailedAttempt(key);
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          recordFailedAttempt(key);
          return null;
        }

        clearAttempts(key);
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
});
