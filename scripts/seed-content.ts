import mongoose from "mongoose";
import { connectDb } from "../src/lib/db/connect";
import { UserModel } from "../src/lib/db/models";
import { seedContent } from "../src/lib/db/seed/content";

async function main() {
  await connectDb();
  const admin = await UserModel.findOne({ role: "admin" });
  if (!admin)
    throw new Error("No admin user yet. Sign in once with an email in ADMIN_EMAILS, then re-run.");
  console.log("Seeded content (drafts):", await seedContent(String(admin.id)));
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
