import { QuestionForm } from "@/components/admin/QuestionForm";

export default async function Page({ params }: PageProps<"/admin/questions/[id]">) {
  const { id } = await params;
  return <QuestionForm id={id} />;
}
