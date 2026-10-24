/**
 * Test doubles for the backend API and Supabase Auth, as Playwright routes.
 *
 * Responses follow the backend's OpenAPI contract (StoredDetection,
 * ReportPublic, AlertArea, AccountSettings...). Every request is recorded, so
 * tests can check what the app sent. Any other external request (map tiles,
 * fonts) is aborted: the tests don't depend on the network.
 */
import {
  test as base,
  type BrowserContext,
  type Request,
} from "@playwright/test";

export const API = "http://api.test";
export const SUPABASE = "http://supabase.test";

const USER_ID = "8d0c0d4e-1c1a-4c55-9d38-6f0d6b1c2e11";
export const USER_EMAIL = "vecino@example.com";

/** Naive UTC, as the backend sends it. */
function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3_600_000).toISOString().slice(0, 19);
}

export function detection(
  id: number,
  lat: number,
  lon: number,
  probability: number,
  reportCount = 0,
) {
  return {
    id,
    lat,
    lon,
    probability,
    image_time: hoursAgo(id),
    detected_at: hoursAgo(id),
    bbox: { west: -73.6, south: -55.1, east: -53.6, north: -21.8 },
    threshold: 0.5,
    report_count: reportCount,
    has_image: true,
  };
}

/** Three detections spread over the country, low to high probability. */
export const DETECTIONS = [
  detection(1, -31.4, -64.2, 0.92, 1), // Córdoba
  detection(2, -27.5, -59.0, 0.7), // Chaco
  detection(3, -38.9, -68.1, 0.55), // Neuquén
];

export const REPORTS = {
  1: [
    {
      id: 10,
      verdict: "false_positive",
      category: "gas_flare",
      comment: "Antorcha de la planta",
      created_at: hoursAgo(1),
    },
  ],
} as Record<number, unknown[]>;

const ACCOUNT = {
  email_alerts: true,
  alert_email: USER_EMAIL,
  uses_account_email: true,
  pending_email: null,
  telegram_available: true,
  telegram_connected: false,
  telegram_name: null,
};

const AREA = {
  id: 1,
  name: "Casa en las sierras",
  email: USER_EMAIL,
  lat: -31.4,
  lon: -64.5,
  radius_km: 20,
  polygon: null,
  region: null,
  min_probability: 0.65,
  active: true,
  created_at: hoursAgo(48),
};

const ALERT = {
  id: 1,
  area_id: 1,
  area_name: AREA.name,
  created_at: hoursAgo(1),
  emailed: true,
  telegram_sent: false,
  detection: DETECTIONS[0],
};

// 1x1 transparent PNG.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

export interface ApiMock {
  /** Every request the app sent to the backend. */
  requests: Request[];
  /** The detections GET /detections returns (mutable per test). */
  detections: ReturnType<typeof detection>[];
  /** Reports per detection id; POSTed reports are added here. */
  reports: Record<number, unknown[]>;
}

function base64url(value: string): string {
  return Buffer.from(value).toString("base64url");
}

/** An unsigned-looking HS256 token: Supabase's client checks HS256 tokens by
 * calling GET /auth/v1/user, which the routes below answer. */
function accessToken(): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      sub: USER_ID,
      email: USER_EMAIL,
      aud: "authenticated",
      role: "authenticated",
      iat: now,
      exp: now + 3600,
      session_id: "test-session",
      user_metadata: { full_name: "Vecina de Prueba" },
    }),
  );
  // Any valid base64url: Supabase's client checks the token's shape, not this signature.
  const signature = Buffer.alloc(32, 1).toString("base64url");
  return `${header}.${payload}.${signature}`;
}

const USER = {
  id: USER_ID,
  aud: "authenticated",
  role: "authenticated",
  email: USER_EMAIL,
  app_metadata: { provider: "email" },
  user_metadata: { full_name: "Vecina de Prueba" },
  created_at: "2026-01-01T00:00:00Z",
};

/** A signed-in session, stored as @supabase/ssr stores it: a cookie. */
export async function signIn(context: BrowserContext) {
  const session = {
    access_token: accessToken(),
    refresh_token: "test-refresh-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: USER,
  };
  await context.addCookies([
    {
      name: "sb-supabase-auth-token",
      value: `base64-${base64url(JSON.stringify(session))}`,
      domain: "localhost",
      path: "/",
    },
  ]);
}

async function mockNetwork(context: BrowserContext): Promise<ApiMock> {
  const mock: ApiMock = {
    requests: [],
    detections: [...DETECTIONS],
    reports: structuredClone(REPORTS),
  };

  // Registered first, so it only gets what the specific routes below don't.
  await context.route(/^https?:\/\/(?!localhost)/, (route) => route.abort());

  await context.route(`${SUPABASE}/**`, async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/auth/v1/user") return route.fulfill({ json: USER });
    if (path === "/auth/v1/otp") return route.fulfill({ json: {} });
    if (path === "/auth/v1/logout") return route.fulfill({ status: 204 });
    return route.fulfill({ status: 404, json: { message: "not mocked" } });
  });

  await context.route(`${API}/**`, async (route) => {
    const request = route.request();
    mock.requests.push(request);
    const { pathname } = new URL(request.url());
    const method = request.method();
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, json: body });

    if (pathname === "/detections") return json(mock.detections);
    let match = pathname.match(/^\/detections\/(\d+)\/image$/);
    if (match) return route.fulfill({ body: PNG, contentType: "image/png" });
    match = pathname.match(/^\/detections\/(\d+)\/reports(\/mine)?$/);
    if (match) {
      const id = Number(match[1]);
      if (match[2])
        return json({ detail: "You have not reported this detection" }, 404);
      if (method === "POST") {
        const body = request.postDataJSON();
        const created = {
          id: 99,
          detection_id: id,
          user_id: USER_ID,
          ...body,
          created_at: hoursAgo(0),
        };
        mock.reports[id] = [...(mock.reports[id] ?? []), created];
        return json(created, 201);
      }
      return json(mock.reports[id] ?? []);
    }
    if (pathname === "/stats/regions")
      return json([
        {
          code: "14",
          name: "Córdoba",
          province_name: null,
          detection_count: 12,
          max_probability: 0.92,
        },
        {
          code: "22",
          name: "Chaco",
          province_name: null,
          detection_count: 5,
          max_probability: 0.7,
        },
      ]);
    if (pathname === "/stats/hourly")
      return json(
        Array.from({ length: 24 }, (_, hour) => ({
          hour,
          detection_count: hour % 5,
        })),
      );
    if (pathname === "/stats/reports")
      return json([
        { verdict: "confirmed_fire", category: null, report_count: 3 },
        { verdict: "false_positive", category: "gas_flare", report_count: 1 },
      ]);
    if (pathname === "/stats/recurrence")
      return json({ cell_size_deg: 0.02, cells: [] });
    if (pathname === "/alert-areas")
      return json(
        method === "GET" ? [AREA] : AREA,
        method === "POST" ? 201 : 200,
      );
    if (pathname === "/alerts") return json([ALERT]);
    if (pathname === "/account") return json(ACCOUNT);
    return json({ detail: "not mocked" }, 404);
  });

  return mock;
}

export const test = base.extend<{ api: ApiMock }>({
  api: [
    async ({ context }, use) => {
      await use(await mockNetwork(context));
    },
    { auto: true },
  ],
});

export { expect } from "@playwright/test";
