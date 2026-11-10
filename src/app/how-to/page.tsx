import { PostListPage, listingMetadata } from "@/components/content/PostPages";

export function generateMetadata() {
  return listingMetadata("howto");
}

export default function Page() {
  return <PostListPage type="howto" />;
}
