import type { Metadata } from "next";
import { PostListPage } from "@/components/content/PostPages";

export const metadata: Metadata = { title: "How-to guides" };

export default function Page() {
  return <PostListPage type="howto" title="How-to guides" />;
}
