import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitMap = new Map<string, RateLimitEntry>();

function isRateLimited(key: string, maxAttempts = 5, windowMs = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count++;
  if (entry.count > maxAttempts) {
    return true;
  }
  rateLimitMap.set(key, entry);
  return false;
}

function getClientIp(req: unknown): string | null {
  if (!req) return null;
  const r = req as { headers?: Record<string, unknown>; socket?: { remoteAddress?: string } };
  const forwarded = r.headers?.["x-forwarded-for"];
  if (forwarded) {
    return typeof forwarded === "string"
      ? forwarded.split(",")[0].trim()
      : Array.isArray(forwarded)
      ? forwarded[0]
      : null;
  }
  return r.socket?.remoteAddress || null;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const emailKey = credentials.email.toLowerCase();
        const ip = getClientIp(req);

        if (isRateLimited(`email:${emailKey}`)) {
          throw new Error("TOO_MANY_ATTEMPTS");
        }
        if (ip && isRateLimited(`ip:${ip}`)) {
          throw new Error("TOO_MANY_ATTEMPTS");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
        token.image = user.image;
      }
      if (trigger === "update" && session) {
        token.name = (session as { name?: string }).name;
        token.image = (session as { image?: string }).image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as { id: string }).id = token.sub as string;
        (session.user as { role: string }).role = token.role as string;
        (session.user as { image?: string | null }).image = token.image as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/jack/login",
  },
};
