import mongoose from "mongoose";
import { connectDb } from "../src/lib/db/connect";
import "../src/lib/db/models";
import { seedDatabase } from "../src/lib/db/seed";

async function main() {
  await connectDb();
  console.log("Seeded:", await seedDatabase());
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
