import type { Metadata } from "next";
import { modules, lessonsInModule } from "@tbt/content";
import { CourseMap } from "@/components/CourseMap";

export const metadata: Metadata = { title: "Course map", description: "Every module and lesson in Token by Token." };

export default function Learn() {
  return (
    <main className="wrap section">
      <p className="eyebrow">Course map</p>
      <h1 style={{ margin: "0 0 4px", letterSpacing: "-0.02em" }}>Your path</h1>
      <p className="sub">Foundations is free and open now. More modules are on the way.</p>
      <CourseMap modules={modules.map((m) => ({ ...m, lessonIds: lessonsInModule(m.id).map((l) => l.id) }))} />
    </main>
  );
}
