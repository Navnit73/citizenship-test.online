import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let server: MongoMemoryServer | undefined;

export async function startTestDb(): Promise<void> {
  server = await MongoMemoryServer.create();
  await mongoose.connect(server.getUri(), { dbName: "test" });
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
}

export async function clearTestDb(): Promise<void> {
  await Promise.all(Object.values(mongoose.models).map((m) => m.deleteMany({})));
}

export async function stopTestDb(): Promise<void> {
  await mongoose.disconnect();
  await server?.stop();
}
