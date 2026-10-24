/** Functional: the fire map, its filters, a detection's detail and reporting it. */
import { expect, signIn, test } from "./fixtures";

test.beforeEach(({ context }) => signIn(context));

const markers = (page: import("@playwright/test").Page) =>
  page.locator(".leaflet-overlay-pane path.leaflet-interactive");

test("shows the detections from the API", async ({ page, api }) => {
  await page.goto("/mapa");
  await expect(page.getByText("3 focos")).toBeVisible();
  await expect(markers(page)).toHaveCount(3);

  const request = api.requests.find(
    (r) => new URL(r.url()).pathname === "/detections",
  )!;
  const params = new URL(request.url()).searchParams;
  expect(params.get("limit")).toBe("5000");
  // The default period: the last 30 days, whole days.
  const days =
    (Date.parse(params.get("until")!) - Date.parse(params.get("since")!)) /
    86_400_000;
  expect(Math.round(days)).toBe(31);
});

test("probability filter hides weaker detections", async ({ page }) => {
  await page.goto("/mapa");
  await expect(markers(page)).toHaveCount(3);

  await page.getByRole("button", { name: "Filtros" }).click();
  const slider = page.getByRole("slider").first();
  await slider.focus();
  // 50% -> 80%, in steps of 5.
  for (let i = 0; i < 6; i++) await slider.press("ArrowRight");
  await expect(page.getByText("Probabilidad mínima: 80%")).toBeVisible();

  await expect(page.getByText("1 de 3 focos")).toBeVisible();
  await expect(markers(page)).toHaveCount(1);

  await page.getByRole("button", { name: "Restablecer filtros" }).click();
  await expect(page.getByText("3 focos")).toBeVisible();
});

test("max-reports filter hides reported detections", async ({ page }) => {
  await page.goto("/mapa");
  await page.getByRole("button", { name: "Filtros" }).click();
  const slider = page.getByRole("slider").nth(1);
  await slider.focus();
  await slider.press("Home"); // 0 reports allowed
  await expect(page.getByText("2 de 3 focos")).toBeVisible();
});

test("recent-window period queries the last hour", async ({ page, api }) => {
  await page.goto("/mapa");
  await expect(page.getByText("3 focos")).toBeVisible();
  const before = api.requests.length;

  await page.getByRole("combobox", { name: "Período" }).click();
  await page.getByRole("option", { name: "Última hora" }).click();

  await expect
    .poll(() =>
      api.requests
        .slice(before)
        .find((r) => new URL(r.url()).pathname === "/detections"),
    )
    .toBeTruthy();
  const request = api.requests
    .slice(before)
    .find((r) => new URL(r.url()).pathname === "/detections")!;
  const params = new URL(request.url()).searchParams;
  const minutes = (Date.now() - Date.parse(params.get("since")!)) / 60_000;
  expect(minutes).toBeGreaterThan(59);
  expect(minutes).toBeLessThan(65);
  expect(params.get("until")).toBeNull();
});

test("empty period says so", async ({ page, api }) => {
  api.detections = [];
  await page.goto("/mapa");
  await expect(
    page.getByText("No hay focos detectados en este período."),
  ).toBeVisible();
});

test("API failure shows an error toast", async ({ page }) => {
  await page.route("http://api.test/detections?**", (route) =>
    route.fulfill({ status: 500, body: "boom" }),
  );
  await page.goto("/mapa");
  await expect(
    page.getByText("No se pudieron cargar los focos").first(),
  ).toBeVisible();
});

test("detection detail: data, reports and satellite image", async ({
  page,
}) => {
  await page.goto("/mapa");
  await markers(page).first().click();

  const popup = page.locator(".leaflet-popup");
  await expect(popup.getByText("Probabilidad de fuego")).toBeVisible();
  await expect(popup.getByText("92.0%")).toBeVisible();
  await expect(popup.getByText("-31.4000, -64.2000")).toBeVisible();
  await expect(popup.getByText("Reportes (1)")).toBeVisible();
  await expect(popup.getByText("Antorcha de gas")).toBeVisible();

  await popup.getByRole("button", { name: "Ver imagen" }).click();
  const dialog = page.getByRole("dialog", { name: "Imagen satelital" });
  await expect(
    dialog.getByRole("img", { name: "Imagen infrarroja de la detección" }),
  ).toBeVisible();
});

test("report a detection as a false positive", async ({ page, api }) => {
  await page.goto("/mapa");
  await markers(page).first().click();
  const popup = page.locator(".leaflet-popup");
  // The popup resizes when its reports load: wait, as a person would.
  await expect(popup.getByText("Reportes (1)")).toBeVisible();
  await popup.getByRole("button", { name: "Reportar" }).click();
  await popup
    .getByPlaceholder("Comentario (opcional)")
    .fill("Es la antorcha de la refinería");

  const sent = page.waitForRequest(
    (r) => r.method() === "POST" && r.url().endsWith("/detections/1/reports"),
  );
  await popup.getByRole("button", { name: "Enviar" }).click();
  const request = await sent;

  expect(request.postDataJSON()).toEqual({
    verdict: "false_positive",
    category: "other",
    comment: "Es la antorcha de la refinería",
  });
  expect(request.headers()["authorization"]).toMatch(/^Bearer /);
  await expect(page.getByText("Reporte enviado").first()).toBeVisible();
  await expect(popup.getByText("Reportes (2)")).toBeVisible();
  await expect(
    popup.getByRole("button", { name: "Editar reporte" }),
  ).toBeVisible();
  expect(api.reports[1]).toHaveLength(2);
});

test("confirm a detection as a real fire", async ({ page }) => {
  await page.goto("/mapa");
  await markers(page).first().click();
  const popup = page.locator(".leaflet-popup");
  // The popup resizes when its reports load: wait, as a person would.
  await expect(popup.getByText("Reportes (1)")).toBeVisible();
  await popup.getByRole("button", { name: "Reportar" }).click();
  await popup.getByRole("combobox").first().click();
  await page.getByRole("option", { name: "Incendio confirmado" }).click();
  // The category only applies to false positives.
  await expect(popup.getByRole("combobox")).toHaveCount(1);

  const sent = page.waitForRequest(
    (r) => r.method() === "POST" && r.url().endsWith("/detections/1/reports"),
  );
  await popup.getByRole("button", { name: "Enviar" }).click();
  expect((await sent).postDataJSON()).toMatchObject({
    verdict: "confirmed_fire",
    category: null,
  });
});
