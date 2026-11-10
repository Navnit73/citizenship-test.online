import type { Metadata } from "next";
import { PostListPage } from "@/components/content/PostPages";

export const metadata: Metadata = { title: "Blog" };

export default function Page() {
  return <PostListPage type="blog" title="Blog" />;
}
