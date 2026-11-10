import { PostDetailPage, postMetadata } from "@/components/content/PostPages";

export function generateMetadata({ params }: PageProps<"/how-to/[slug]">) {
  return postMetadata("howto", params);
}

export default function Page({ params }: PageProps<"/how-to/[slug]">) {
  return <PostDetailPage type="howto" params={params} />;
}
