import { revalidateTag } from "next/cache";

/** Marks cached data stale immediately. Never lets a cache hiccup fail a successful write. */
export function invalidate(tag: string): void {
  try {
    revalidateTag(tag, { expire: 0 });
  } catch (err) {
    console.warn(`revalidateTag(${tag}) failed`, err);
  }
}
