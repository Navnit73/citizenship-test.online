import { PostDetailPage, postMetadata } from "@/components/content/PostPages";

export function generateMetadata({ params }: PageProps<"/blog/[slug]">) {
  return postMetadata("blog", params);
}

export default function Page({ params }: PageProps<"/blog/[slug]">) {
  return <PostDetailPage type="blog" params={params} />;
}
