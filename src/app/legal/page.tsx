import { PostListPage, listingMetadata } from "@/components/content/PostPages";

export function generateMetadata() {
  return listingMetadata("legal");
}

export default function Page() {
  return <PostListPage type="legal" />;
}
