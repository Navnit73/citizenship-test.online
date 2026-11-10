import type { Metadata } from "next";
import { PostListPage } from "@/components/content/PostPages";

export const metadata: Metadata = { title: "Guides" };

export default function Page() {
  return <PostListPage type="guide" title="Guides" />;
}
