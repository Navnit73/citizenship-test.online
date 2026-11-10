import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import { createMongooseAdapter } from "@/lib/auth/adapter";
import { sendMagicLink } from "@/lib/auth/email";
import type { Role } from "@/lib/auth/permissions";
import { testLoginEnabled, verifyTestPassword } from "@/lib/auth/test-login";
import { connectDb } from "@/lib/db/connect";
import { UserModel } from "@/lib/db/models";

const ROLE_RECHECK_MS = 5 * 60 * 1000;

export const { handlers, auth, signIn, signOut } = NextAuth(async () => {
  await connectDb();
  return {
    adapter: createMongooseAdapter({
      adminEmails: (process.env.ADMIN_EMAILS ?? "").split(","),
    }),
    session: { strategy: "jwt" },
    pages: { signIn: "/login", verifyRequest: "/login?check-email=1" },
    providers: [
      Nodemailer({
        server:
          process.env.EMAIL_SERVER ||
          "smtp://localhost:25" /* placeholder: sending is done by sendMagicLink */,
        from: process.env.EMAIL_FROM,
        sendVerificationRequest: sendMagicLink,
      }),
      ...(process.env.AUTH_GOOGLE_ID ? [Google({ allowDangerousEmailAccountLinking: false })] : []),
      ...(testLoginEnabled()
        ? [
            Credentials({
              id: "test-login",
              name: "Test login",
              credentials: { email: {}, password: {} },
              async authorize(c) {
                if (!verifyTestPassword(c?.password, process.env.TEST_LOGIN_PASSWORD!)) return null;
                await connectDb();
                const user = await UserModel.findOne({ email: String(c?.email).toLowerCase() });
                return user ? { id: String(user.id), email: user.email, name: user.name } : null;
              },
            }),
          ]
        : []),
    ],
    callbacks: {
      // Roles live in the DB; refresh them periodically so demotions take effect quickly.
      async jwt({ token, user }) {
        if (user?.id) token.uid = user.id;
        const stale = !token.roleCheckedAt || Date.now() - token.roleCheckedAt > ROLE_RECHECK_MS;
        if (token.uid && (user || stale)) {
          const doc = await UserModel.findById(token.uid).select("role");
          token.role = (doc?.role as Role | undefined) ?? undefined;
          token.roleCheckedAt = Date.now();
        }
        return token;
      },
      session({ session, token }) {
        if (token.uid) session.user.id = token.uid;
        if (token.role) session.user.role = token.role;
        return session;
      },
    },
  };
});
