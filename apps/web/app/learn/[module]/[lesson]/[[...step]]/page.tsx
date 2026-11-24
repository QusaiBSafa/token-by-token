import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLesson, lessons } from "@tbt/content";
import { LessonPlayer } from "@/components/LessonPlayer";

type Params = { module: string; lesson: string; step?: string[] };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return lessons.flatMap((l) => [
    { module: l.module, lesson: l.slug, step: [] },
    ...l.steps.map((s) => ({ module: l.module, lesson: l.slug, step: [s.id] })),
  ]);
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const p = await params;
  const lesson = getLesson(p.module, p.lesson);
  if (!lesson) return {};
  const step = lesson.steps.find((s) => s.id === p.step?.[0]);
  const title = step ? `${lesson.number} ${lesson.title}: ${step.title}` : `${lesson.number} ${lesson.title}`;
  return { title, description: lesson.summary, openGraph: { title, description: lesson.summary } };
}

export default async function LessonPage({ params }: { params: Promise<Params> }) {
  const p = await params;
  const lesson = getLesson(p.module, p.lesson);
  if (!lesson) notFound();
  const stepId = p.step?.[0];
  const idx = stepId ? lesson.steps.findIndex((s) => s.id === stepId) : 0;
  if (idx < 0) notFound();
  return <LessonPlayer lessonId={lesson.id} initialStep={idx} />;
}
