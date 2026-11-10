import { PostDetailPage, postMetadata } from "@/components/content/PostPages";

export function generateMetadata({ params }: PageProps<"/legal/[slug]">) {
  return postMetadata("legal", params);
}

export default function Page({ params }: PageProps<"/legal/[slug]">) {
  return <PostDetailPage type="legal" params={params} />;
}
