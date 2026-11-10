import { PostListPage, listingMetadata } from "@/components/content/PostPages";

export function generateMetadata() {
  return listingMetadata("blog");
}

export default function Page() {
  return <PostListPage type="blog" />;
}
