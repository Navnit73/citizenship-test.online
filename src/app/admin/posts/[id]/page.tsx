import { PostEditor } from "@/components/admin/PostEditor";

export default async function Page({ params }: PageProps<"/admin/posts/[id]">) {
  const { id } = await params;
  return <PostEditor id={id} />;
}
