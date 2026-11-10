/**
 * Starts an in-memory MongoDB, seeds it, then serves the production build.
 * Used by Playwright so e2e tests need no external database.
 */
import { spawn } from "node:child_process";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

async function main() {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri("citizenship_e2e");

  const { connectDb } = await import("../src/lib/db/connect");
  await import("../src/lib/db/models");
  const { seedDatabase } = await import("../src/lib/db/seed");
  await connectDb();
  await seedDatabase();
  const { UserModel } = await import("../src/lib/db/models");
  for (const [role, email] of Object.entries({
    admin: "admin@e2e.test",
    editor: "editor@e2e.test",
    author: "author@e2e.test",
    user: "user@e2e.test",
  })) {
    await UserModel.findOneAndUpdate({ email }, { email, role }, { upsert: true });
  }
  const editor = await UserModel.findOne({ email: "editor@e2e.test" });
  const { seedContent } = await import("../src/lib/db/seed/content");
  await seedContent(String(editor!.id), { publish: true });
  await mongoose.disconnect();

  const next = spawn("npx", ["next", "start", "-p", "3100"], {
    stdio: "inherit",
    env: process.env,
  });
  const shutdown = async () => {
    next.kill();
    await mongod.stop();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  next.on("exit", shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
