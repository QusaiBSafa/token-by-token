import { notFound } from "next/navigation";
import { lessons } from "@tbt/content";
import { Authoring } from "@/components/Authoring";

export const metadata = { title: "Lesson authoring", robots: { index: false } };
export const dynamicParams = false;
export function generateStaticParams() { return lessons.map((l) => ({ id: l.id })); }

export default async function DevLesson({ params }: { params: Promise<{ id: string }> }) {
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_ENABLE_DEV !== "1") notFound();
  const { id } = await params;
  if (!lessons.some((l) => l.id === id)) notFound();
  return <Authoring lessonId={id} />;
}
