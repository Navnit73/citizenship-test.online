import type { Adapter, AdapterUser } from "next-auth/adapters";
import { AccountModel, UserModel, VerificationTokenModel } from "@/lib/db/models";

type Options = { adminEmails?: string[] };

type UserDoc = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  emailVerified?: Date | null;
};

const toAdapterUser = (u: UserDoc): AdapterUser => ({
  id: u.id,
  email: u.email,
  name: u.name ?? null,
  image: u.image ?? null,
  emailVerified: u.emailVerified ?? null,
});

/** Minimal Auth.js adapter on our Mongoose models (JWT sessions, so no session methods). */
export function createMongooseAdapter({ adminEmails = [] }: Options = {}): Adapter {
  const admins = new Set(adminEmails.map((e) => e.trim().toLowerCase()).filter(Boolean));
  return {
    async createUser(data) {
      const email = data.email.toLowerCase();
      const user = await UserModel.create({
        email,
        name: data.name ?? undefined,
        image: data.image ?? undefined,
        emailVerified: data.emailVerified ?? undefined,
        role: admins.has(email) ? "admin" : "user",
      });
      return toAdapterUser(user);
    },
    async getUser(id) {
      const user = await UserModel.findById(id);
      return user ? toAdapterUser(user) : null;
    },
    async getUserByEmail(email) {
      const user = await UserModel.findOne({ email: email.toLowerCase() });
      return user ? toAdapterUser(user) : null;
    },
    async getUserByAccount({ provider, providerAccountId }) {
      const account = await AccountModel.findOne({ provider, providerAccountId });
      const user = account && (await UserModel.findById(account.userId));
      return user ? toAdapterUser(user) : null;
    },
    async updateUser({ id, ...patch }) {
      const user = await UserModel.findByIdAndUpdate(id, patch, { returnDocument: "after" });
      if (!user) throw new Error("User not found");
      return toAdapterUser(user);
    },
    async linkAccount(account) {
      await AccountModel.create(account);
      return account;
    },
    async createVerificationToken(token) {
      await VerificationTokenModel.create(token);
      return token;
    },
    async useVerificationToken({ identifier, token }) {
      const doc = await VerificationTokenModel.findOneAndDelete({ identifier, token });
      return doc ? { identifier: doc.identifier, token: doc.token, expires: doc.expires } : null;
    },
  };
}
