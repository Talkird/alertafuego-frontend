/** Navigability: the routes a visitor and a signed-in user move through. */
import { expect, signIn, test } from "./fixtures";

test.describe("visitor", () => {
  test("landing leads to sign in", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/AlertaFuego/);
    await page.getByRole("link", { name: "Iniciar sesión" }).first().click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText("Ingresá a AlertaFuego")).toBeVisible();
  });

  test("legal pages are reachable from the landing footer", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Términos" }).click();
    await expect(page).toHaveURL(/\/terminos$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Términos",
    );
    await page.goto("/");
    await page.getByRole("link", { name: "Privacidad" }).click();
    await expect(page).toHaveURL(/\/privacidad$/);
  });

  for (const path of ["/mapa", "/estadisticas", "/alertas", "/cuenta"]) {
    test(`${path} requires signing in`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login$/);
    });
  }

  test("login validates the email", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill("no-es-un-mail");
    await page
      .getByRole("button", { name: "Enviarme un enlace de acceso" })
      .click();
    await expect(page.getByText("Correo electrónico inválido")).toBeVisible();
  });

  test("login sends a magic link", async ({ page }) => {
    const otp = page.waitForRequest((r) => r.url().includes("/auth/v1/otp"));
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill("vecino@example.com");
    await page
      .getByRole("button", { name: "Enviarme un enlace de acceso" })
      .click();
    expect((await otp).postDataJSON()).toMatchObject({
      email: "vecino@example.com",
    });
    await expect(
      page.getByRole("heading", { name: "Revisá tu correo" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Usar otro correo" }).click();
    await expect(page.getByLabel("Correo electrónico")).toBeVisible();
  });
});

test.describe("signed in", () => {
  test.beforeEach(({ context }) => signIn(context));

  test("sidebar moves between the app's sections", async ({ page }) => {
    await page.goto("/mapa");
    const nav = page.getByRole("navigation");
    await nav.getByRole("link", { name: "Estadísticas" }).click();
    await expect(page).toHaveURL(/\/estadisticas$/);
    await expect(
      page.getByText("Focos por región", { exact: true }),
    ).toBeVisible();

    await nav.getByRole("link", { name: "Alertas" }).click();
    await expect(page).toHaveURL(/\/alertas$/);
    await expect(page.getByText("Casa en las sierras").first()).toBeVisible();

    await nav.getByRole("link", { name: "Mapa" }).click();
    await expect(page).toHaveURL(/\/mapa$/);
  });

  test("user menu opens the account page", async ({ page }) => {
    await page.goto("/mapa");
    await page.getByRole("button", { name: /Vecina de Prueba/ }).click();
    await page.getByRole("menuitem", { name: "Mi cuenta" }).click();
    await expect(page).toHaveURL(/\/cuenta$/);
    await expect(page.getByText("vecino@example.com").first()).toBeVisible();
  });

  test("old /dashboard URL redirects to statistics", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/estadisticas$/);
  });

  test("landing offers to go to the map", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Ir al mapa" }).first().click();
    await expect(page).toHaveURL(/\/mapa$/);
  });

  test("an expired session sends the user to sign in", async ({
    page,
    api,
  }) => {
    await page.route("http://api.test/account", (route) =>
      route.fulfill({ status: 401, json: { detail: "Invalid token" } }),
    );
    await page.goto("/cuenta");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText("Tu sesión expiró").first()).toBeVisible();
    expect(api.requests.some((r) => r.url().endsWith("/account"))).toBe(false);
  });
});
