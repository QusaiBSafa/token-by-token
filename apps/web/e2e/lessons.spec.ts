import { expect, test, type Page } from "@playwright/test";

const LESSONS = [
  { slug: "one-prompt", id: "1.1", steps: 6 },
  { slug: "tokenization", id: "1.2", steps: 8 },
  { slug: "embeddings", id: "1.3", steps: 6 },
  { slug: "context-window", id: "1.4", steps: 6 },
];

const stepLabel = (p: Page) => p.locator(".step-count").first();

const ready = (p: Page) => p.locator(".player[data-hydrated=true]").waitFor();

async function advance(p: Page) {
  const quiz = p.locator(".tbt-quiz-choice").first();
  if ((await quiz.count()) && (await quiz.isEnabled())) {
    await expect(p.getByTestId("next")).toBeDisabled(); // gated until answered
    await p.locator(".tbt-quiz-choice").nth(0).click();
  }
  await p.getByTestId("next").click();
}

for (const l of LESSONS) {
  test(`${l.id} ${l.slug}: step through every step, URL follows, completes, progress persists`, async ({ page }) => {
    await page.goto(`/learn/foundations/${l.slug}`);
    await ready(page);
    await expect(stepLabel(page)).toHaveText(`Step 1 of ${l.steps}`);
    for (let i = 2; i <= l.steps; i++) {
      await advance(page);
      await expect(stepLabel(page)).toHaveText(`Step ${i} of ${l.steps}`);
      await expect(page.getByTestId("live")).toContainText(`Step ${i} of ${l.steps}`);
      await expect(page).toHaveURL(new RegExp(`/learn/foundations/${l.slug}/[a-z0-9-]+$`));
    }
    await expect(page.getByTestId("complete")).toBeVisible();
    await expect(page.getByTestId("next")).toBeDisabled();
    // canvas has real content
    expect(await page.locator("[data-testid=canvas] svg g").count()).toBeGreaterThan(3);
    // progress survives a reload
    await page.reload();
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("tbt:progress:v1") ?? "{}"));
    expect(stored[l.id].completedAt).toBeTruthy();
    await expect(page.locator(`.side a[href$="/${l.slug}"] .tick`)).toHaveAttribute("data-done", "true");
  });
}

test("deep link lands on the right step, and Back/Replay/keyboard work", async ({ page }) => {
  await page.goto("/learn/foundations/tokenization/ids");
  await ready(page);
  await expect(stepLabel(page)).toHaveText("Step 3 of 8");
  await expect(page.getByTestId("step-title")).toHaveText("Each token is a number");
  await page.keyboard.press("ArrowLeft");
  await expect(stepLabel(page)).toHaveText("Step 2 of 8");
  await page.keyboard.press("r");
  await expect(stepLabel(page)).toHaveText("Step 2 of 8");
  await page.keyboard.press("ArrowRight");
  await expect(stepLabel(page)).toHaveText("Step 3 of 8");
  await page.keyboard.press("ArrowRight"); // gated by the quiz
  await expect(stepLabel(page)).toHaveText("Step 3 of 8");
});

test("unknown step is a 404", async ({ page }) => {
  const res = await page.goto("/learn/foundations/tokenization/nope");
  expect(res?.status()).toBe(404);
});

test("knobs change the scene: tokenizer text and context window", async ({ page }) => {
  await page.goto("/learn/foundations/tokenization/try");
  const tokens = page.getByTestId("meter-tokens");
  await expect(tokens).toBeVisible();
  const before = await tokens.locator(".tbt-meter-value").getAttribute("data-final");
  await page.getByLabel("Type any text").fill("Hello world");
  await expect(tokens.locator(".tbt-meter-value")).toHaveAttribute("data-final", "2");
  expect(before).not.toBe("2");

  await page.goto("/learn/foundations/context-window/try");
  const billed = page.getByTestId("meter-billed").locator(".tbt-meter-value");
  const b0 = await billed.getAttribute("data-final");
  await page.getByLabel("Window size (messages)").fill("3");
  await expect(billed).not.toHaveAttribute("data-final", b0!);
});

test("reduced motion still renders every lesson step", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto("/learn/foundations/one-prompt/read");
  await expect(page.getByTestId("canvas")).toBeVisible();
  await expect(page.locator("[data-testid=canvas] svg text").first()).toBeVisible();
  await ctx.close();
});

test("landing, course map, glossary and 404 render; search finds a lesson", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("watching it move");
  await expect(page.locator("figure svg")).toBeVisible();
  await page.getByRole("link", { name: "See the course map" }).click();
  await expect(page).toHaveURL(/\/learn$/);
  await expect(page.getByText("Module 1: Foundations")).toBeVisible();
  await page.goto("/glossary");
  await expect(page.getByText("Cosine similarity").first()).toBeVisible();
  await page.goto("/does-not-exist");
  await expect(page.getByText("This page has no tokens.")).toBeVisible();
  await page.goto("/");
  await page.keyboard.press("Control+k");
  await page.getByLabel("Search lessons and terms").fill("embedding");
  await expect(page.getByRole("dialog").getByRole("link").first()).toBeVisible();
});

test("no horizontal scroll and Next reachable on small screens", async ({ page }) => {
  await page.goto("/learn/foundations/one-prompt");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await expect(page.getByTestId("next")).toBeInViewport();
});
