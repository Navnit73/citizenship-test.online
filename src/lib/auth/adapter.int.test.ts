// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import "@/lib/db/models";
import { UserModel } from "@/lib/db/models";
import { clearTestDb, startTestDb, stopTestDb } from "@/lib/db/test-utils";
import { createMongooseAdapter } from "./adapter";

beforeAll(startTestDb, 180_000);
afterAll(stopTestDb);
beforeEach(clearTestDb);

const adapter = createMongooseAdapter({ adminEmails: ["boss@example.com"] });

describe("mongoose auth adapter", () => {
  it("creates users with the default role and finds them by id and email", async () => {
    const user = await adapter.createUser!({
      email: "Jo@Example.com",
      id: "",
      emailVerified: null,
    });
    expect(user.email).toBe("jo@example.com");
    expect((await UserModel.findById(user.id))!.role).toBe("user");
    expect((await adapter.getUser!(user.id))!.email).toBe("jo@example.com");
    expect((await adapter.getUserByEmail!("JO@example.com"))!.id).toBe(user.id);
    expect(await adapter.getUserByEmail!("nobody@example.com")).toBeNull();
  });
  it("bootstraps admins from the allow-list", async () => {
    const user = await adapter.createUser!({
      email: "boss@example.com",
      id: "",
      emailVerified: null,
    });
    expect((await UserModel.findById(user.id))!.role).toBe("admin");
  });
  it("links provider accounts and resolves users from them", async () => {
    const user = await adapter.createUser!({ email: "a@example.com", id: "", emailVerified: null });
    await adapter.linkAccount!({
      userId: user.id,
      type: "oidc",
      provider: "google",
      providerAccountId: "g-1",
    });
    expect(
      (await adapter.getUserByAccount!({ provider: "google", providerAccountId: "g-1" }))!.id,
    ).toBe(user.id);
    expect(
      await adapter.getUserByAccount!({ provider: "google", providerAccountId: "nope" }),
    ).toBeNull();
  });
  it("updates users", async () => {
    const user = await adapter.createUser!({ email: "a@example.com", id: "", emailVerified: null });
    const updated = await adapter.updateUser!({ id: user.id, name: "Ann" });
    expect(updated.name).toBe("Ann");
  });
  it("verification tokens are single use", async () => {
    const expires = new Date(Date.now() + 60_000);
    await adapter.createVerificationToken!({ identifier: "a@example.com", token: "t1", expires });
    expect(
      await adapter.useVerificationToken!({ identifier: "a@example.com", token: "t1" }),
    ).toMatchObject({ token: "t1" });
    expect(
      await adapter.useVerificationToken!({ identifier: "a@example.com", token: "t1" }),
    ).toBeNull();
  });
});
