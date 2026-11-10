import { PostDetailPage, postMetadata } from "@/components/content/PostPages";

export function generateMetadata({ params }: PageProps<"/p/[slug]">) {
  return postMetadata("page", params);
}

export default function Page({ params }: PageProps<"/p/[slug]">) {
  return <PostDetailPage type="page" params={params} />;
}
