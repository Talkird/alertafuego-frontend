/**
 * Usability on a phone (the "mobile" project: Pixel 7 viewport and touch):
 * nothing overflows sideways, and the app's navigation and main flows work.
 */
import type { Page } from "@playwright/test";
import { expect, signIn, test } from "./fixtures";

async function horizontalOverflow(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
}

for (const [path, text] of [
  ["/", "Detección temprana"],
  ["/login", "Ingresá a AlertaFuego"],
  ["/terminos", "Términos"],
  ["/privacidad", "Política de privacidad"],
] as const) {
  test(`${path} fits the screen width`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByText(text).first()).toBeVisible();
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });
}

test.describe("signed in", () => {
  test.beforeEach(({ context }) => signIn(context));

  for (const [path, text] of [
    ["/mapa", "Probabilidad de fuego"],
    ["/estadisticas", "Reportes de usuarios"],
    ["/alertas", "Casa en las sierras"],
    ["/cuenta", "vecino@example.com"],
  ] as const) {
    test(`${path} fits the screen width`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByText(text).first()).toBeVisible();
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    });
  }

  test("the sidebar becomes a menu", async ({ page }) => {
    await page.goto("/mapa");
    const nav = page.getByRole("navigation");
    await expect(nav.getByRole("link", { name: "Estadísticas" })).toBeHidden();

    await page.getByRole("button", { name: "Abrir barra lateral" }).tap();
    await nav.getByRole("link", { name: "Estadísticas" }).tap();
    await expect(page).toHaveURL(/\/estadisticas$/);
    // Choosing a section closes the menu.
    await expect(nav.getByRole("link", { name: "Estadísticas" })).toBeHidden();
  });

  test("detection detail opens with a tap", async ({ page }) => {
    await page.goto("/mapa");
    await page
      .locator(".leaflet-overlay-pane path.leaflet-interactive")
      .first()
      .tap();
    const popup = page.locator(".leaflet-popup");
    await expect(popup.getByText("Probabilidad de fuego")).toBeVisible();
    // The popup fits on screen.
    const box = (await popup.boundingBox())!;
    const width = page.viewportSize()!.width;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
  });
});
