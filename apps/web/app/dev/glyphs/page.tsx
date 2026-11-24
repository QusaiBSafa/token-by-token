import { notFound } from "next/navigation";
import { GlyphGallery } from "@/components/GlyphGallery";

export const metadata = { title: "Glyph gallery", robots: { index: false } };

export default function GlyphsPage() {
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_ENABLE_DEV !== "1") notFound();
  return (
    <main className="wrap section">
      <h1>Glyph gallery</h1>
      <p>Every glyph in every state, light and dark. Dev only.</p>
      <GlyphGallery />
    </main>
  );
}
