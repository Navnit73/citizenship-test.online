import { PostListPage, listingMetadata } from "@/components/content/PostPages";

export function generateMetadata() {
  return listingMetadata("guide");
}

export default function Page() {
  return <PostListPage type="guide" />;
}
