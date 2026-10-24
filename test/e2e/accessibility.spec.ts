/**
 * Usability: automated accessibility checks (axe-core, WCAG 2.1 A and AA) on
 * every page, signed out and signed in.
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, signIn, test, type ApiMock } from "./fixtures";
import type { Page } from "@playwright/test";

const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function audit(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  // A readable summary on failure: rule, impact and the first offending nodes.
  return results.violations.map((v) => ({
    rule: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.slice(0, 3).map((n) => n.target.join(" ")),
  }));
}

const PUBLIC_PAGES = [
  ["/", "Detección temprana"],
  ["/login", "Ingresá a AlertaFuego"],
  ["/terminos", "Términos"],
  ["/privacidad", "Política de privacidad"],
  ["/confirmar-email?token=abc", "email"],
] as const;

for (const [path, text] of PUBLIC_PAGES) {
  test(`${path} has no WCAG A/AA violations`, async ({ page }) => {
    await page.route("http://api.test/account/alert-email/confirm", (route) =>
      route.fulfill({ json: { email: "otro@example.com" } }),
    );
    await page.goto(path);
    await expect(page.getByText(text).first()).toBeVisible();
    expect(await audit(page)).toEqual([]);
  });
}

const APP_PAGES = [
  ["/mapa", "3 focos"],
  ["/estadisticas", "Reportes de usuarios"],
  ["/alertas", "Casa en las sierras"],
  ["/cuenta", "vecino@example.com"],
] as const;

test.describe("signed in", () => {
  test.beforeEach(({ context }) => signIn(context));

  for (const [path, text] of APP_PAGES) {
    test(`${path} has no WCAG A/AA violations`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByText(text).first()).toBeVisible();
      expect(await audit(page)).toEqual([]);
    });
  }

  test("detection popup has no WCAG A/AA violations", async ({
    page,
    api,
  }: {
    page: Page;
    api: ApiMock;
  }) => {
    expect(api.detections.length).toBeGreaterThan(0);
    await page.goto("/mapa");
    await page
      .locator(".leaflet-overlay-pane path.leaflet-interactive")
      .first()
      .click();
    const popup = page.locator(".leaflet-popup");
    await expect(popup.getByText("Reportes (1)")).toBeVisible();
    // Leaflet fades the popup in: measured mid-fade, every color fails contrast.
    await expect
      .poll(() => popup.evaluate((e) => getComputedStyle(e).opacity))
      .toBe("1");
    expect(await audit(page)).toEqual([]);
  });
});

test.describe("dark mode", () => {
  test.use({ colorScheme: "dark" });

  for (const [path, text] of PUBLIC_PAGES.slice(0, 2)) {
    test(`${path} has no WCAG A/AA violations`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByText(text).first()).toBeVisible();
      await expect(page.locator("html")).toHaveClass(/dark/);
      expect(await audit(page)).toEqual([]);
    });
  }

  for (const [path, text] of APP_PAGES) {
    test(`${path} signed in has no WCAG A/AA violations`, async ({
      page,
      context,
    }) => {
      await signIn(context);
      await page.goto(path);
      await expect(page.getByText(text).first()).toBeVisible();
      await expect(page.locator("html")).toHaveClass(/dark/);
      expect(await audit(page)).toEqual([]);
    });
  }
});
