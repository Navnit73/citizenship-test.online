import { TestBuilder } from "@/components/admin/TestBuilder";

export default async function Page({ params }: PageProps<"/admin/tests/[id]">) {
  const { id } = await params;
  return <TestBuilder id={id} />;
}
