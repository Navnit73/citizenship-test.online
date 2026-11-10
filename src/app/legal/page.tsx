import type { Metadata } from "next";
import { PostListPage } from "@/components/content/PostPages";

export const metadata: Metadata = { title: "Legal" };

export default function Page() {
  return <PostListPage type="legal" title="Legal" />;
}
