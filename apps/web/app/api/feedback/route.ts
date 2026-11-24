import { z } from "zod";
import { track } from "@vercel/analytics/server";

const body = z.object({ lessonId: z.string().max(10), stepId: z.string().max(40), helpful: z.boolean(), note: z.string().max(500).optional() });

/** "Was this step clear?" Forwarded to Vercel Analytics as a custom event. No personal data is stored. */
export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ ok: false }, { status: 400 });
  const { lessonId, stepId, helpful } = parsed.data;
  try {
    await track("step_feedback", { lessonId, stepId, helpful });
  } catch {
    /* analytics unavailable locally: still succeed */
  }
  return Response.json({ ok: true });
}
