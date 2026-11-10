import { PostDetailPage, postMetadata } from "@/components/content/PostPages";

export function generateMetadata({ params }: PageProps<"/guides/[slug]">) {
  return postMetadata("guide", params);
}

export default function Page({ params }: PageProps<"/guides/[slug]">) {
  return <PostDetailPage type="guide" params={params} />;
}
