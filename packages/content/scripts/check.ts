import { lessons, lessonSchema, copyEn, glossary, sceneSchema, resolveScene, defaultKnobs, modules } from "../src";

/** Validate every lesson: schema, referenced ids, caption keys, quiz target, derive() output. */
export function validate(): string[] {
  const errors: string[] = [];
  const err = (lesson: string, msg: string) => errors.push(`[${lesson}] ${msg}`);
  const glossaryIds = new Set(glossary.map((g) => g.id));
  const seenLessonIds = new Set<string>();
  for (const lesson of lessons) {
    const L = lesson.id;
    if (seenLessonIds.has(L)) err(L, "duplicate lesson id");
    seenLessonIds.add(L);
    const { derive: _d, trace: _t, ...data } = lesson;
    const parsed = lessonSchema.safeParse(data);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) err(L, `schema: ${issue.path.join(".")} ${issue.message}`);
      continue;
    }
    if (!modules.some((m) => m.id === lesson.module)) err(L, `unknown module ${lesson.module}`);
    const stepIds = new Set<string>();
    lesson.steps.forEach((step, i) => {
      if (stepIds.has(step.id)) err(L, `duplicate step id ${step.id}`);
      stepIds.add(step.id);
      if (!(step.captionKey in copyEn)) err(L, `missing caption ${step.captionKey}`);
      const knobs = defaultKnobs(lesson);
      for (const scene of [step.scene, resolveScene(lesson, i, knobs)]) {
        const r = sceneSchema.safeParse(scene);
        if (!r.success) err(L, `step ${step.id}: ${r.error.issues[0]?.message}`);
        const ids = new Set(scene.nodes.map((n) => n.id));
        if (ids.size !== scene.nodes.length) err(L, `step ${step.id}: duplicate node ids`);
        for (const h of scene.highlight ?? []) if (!ids.has(h)) err(L, `step ${step.id}: highlight ${h} is not a node`);
        for (const e of scene.edges) {
          if (!ids.has(e.from) || !ids.has(e.to)) err(L, `step ${step.id}: edge ${e.id} references a missing node`);
        }
        const edgeIds = new Set(scene.edges.map((e) => e.id));
        for (const f of scene.flows ?? []) if (!edgeIds.has(f.edge)) err(L, `step ${step.id}: flow edge ${f.edge} missing`);
        for (const s of scene.sequence ?? []) for (const id of s.ids) if (!ids.has(id)) err(L, `step ${step.id}: sequence id ${id} missing`);
      }
    });
    if (lesson.quiz && !stepIds.has(lesson.quiz.revealAtStep)) err(L, `quiz revealAtStep ${lesson.quiz.revealAtStep} is not a step`);
    if (lesson.quiz && (lesson.quiz.answer < 0 || lesson.quiz.answer >= lesson.quiz.choices.length)) err(L, "quiz answer index out of range");
    for (const k of lesson.knobs ?? []) for (const s of k.showAtSteps ?? []) if (!stepIds.has(s)) err(L, `knob ${k.id} showAtSteps ${s} is not a step`);
    for (const term of lesson.terms ?? []) if (!glossaryIds.has(term)) err(L, `unknown glossary term ${term}`);
  }
  return errors;
}

if (process.argv[1] && /check\.ts$/.test(process.argv[1])) {
  const errors = validate();
  if (errors.length) {
    console.error(errors.join("\n"));
    console.error(`\ncontent:check failed with ${errors.length} error(s)`);
    process.exit(1);
  }
  console.log(`content:check ok: ${lessons.length} lessons, ${lessons.reduce((n, l) => n + l.steps.length, 0)} steps`);
}
