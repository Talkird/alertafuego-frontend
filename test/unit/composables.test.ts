import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { signOut, navigateToMock, session, fetchMock } = vi.hoisted(() => ({
  signOut: vi.fn(),
  navigateToMock: vi.fn(),
  session: { value: null as { access_token: string } | null },
  fetchMock: vi.fn(),
}));

// $fetch is an auto-import in app code: replaced here, so nothing reaches the network.
mockNuxtImport("$fetch", () => fetchMock);
mockNuxtImport("useSupabaseClient", () => () => ({ auth: { signOut } }));
mockNuxtImport("useSupabaseSession", () => () => session);
mockNuxtImport("navigateTo", () => navigateToMock);

const API = "http://api.test";

beforeEach(() => {
  fetchMock.mockReset();
  signOut.mockReset();
  navigateToMock.mockReset();
  session.value = null;
});

describe("authFetchOptions", () => {
  it("sends the token to the API", () => {
    const options = authFetchOptions("tok");
    expect(options.baseURL).toBe(API);
    expect(options.headers).toEqual({ Authorization: "Bearer tok" });
  });

  it("a 401 signs out locally and goes to /login", async () => {
    const options = authFetchOptions("tok");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (options.onResponseError as any)({ response: { status: 401 } });
    await vi.waitFor(() =>
      expect(navigateToMock).toHaveBeenCalledWith("/login"),
    );
    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("other errors don't sign out", async () => {
    const options = authFetchOptions("tok");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (options.onResponseError as any)({ response: { status: 500 } });
    expect(signOut).not.toHaveBeenCalled();
  });

  it("isUnauthorized", () => {
    expect(isUnauthorized({ statusCode: 401 })).toBe(true);
    expect(isUnauthorized({ statusCode: 404 })).toBe(false);
    expect(isUnauthorized(null)).toBe(false);
  });
});

describe("useReports", () => {
  it("fetchReports is public", async () => {
    fetchMock.mockResolvedValue([]);
    await fetchReports(5);
    expect(fetchMock).toHaveBeenCalledWith("/detections/5/reports", {
      baseURL: API,
    });
  });

  it("fetchMyReport: null when the user hasn't reported", async () => {
    fetchMock.mockRejectedValue({ statusCode: 404 });
    expect(await fetchMyReport(5, "tok")).toBeNull();
  });

  it("fetchMyReport: other errors propagate", async () => {
    fetchMock.mockRejectedValue({ statusCode: 500 });
    await expect(fetchMyReport(5, "tok")).rejects.toEqual({ statusCode: 500 });
  });

  it("createReport POSTs and updateReport PATCHes with the token", async () => {
    const payload = { verdict: "confirmed_fire" as const, category: null };
    await createReport(5, payload, "tok");
    await updateReport(5, payload, "tok");
    const [[createUrl, create], [updateUrl, update]] = fetchMock.mock.calls;
    expect(createUrl).toBe("/detections/5/reports");
    expect(create).toMatchObject({
      method: "POST",
      body: payload,
      headers: { Authorization: "Bearer tok" },
    });
    expect(updateUrl).toBe("/detections/5/reports");
    expect(update).toMatchObject({ method: "PATCH", body: payload });
  });
});

describe("useAlerts / useAccount", () => {
  it("alert zones CRUD hit the right endpoints", async () => {
    await fetchAlertAreas("tok");
    await createAlertArea({ name: "Casa", region_code: "14" }, "tok");
    await updateAlertArea(3, { active: false }, "tok");
    await deleteAlertArea(3, "tok");
    await fetchAlerts("tok");
    const calls = fetchMock.mock.calls.map(([url, opts]) => [url, opts.method]);
    expect(calls).toEqual([
      ["/alert-areas", undefined],
      ["/alert-areas", "POST"],
      ["/alert-areas/3", "PATCH"],
      ["/alert-areas/3", "DELETE"],
      ["/alerts", undefined],
    ]);
  });

  it("confirmAlertEmail needs no token", async () => {
    await confirmAlertEmail("abc");
    const [url, options] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/account/alert-email/confirm");
    expect(options).toEqual({
      baseURL: API,
      method: "POST",
      body: { token: "abc" },
    });
  });

  it("account settings calls", async () => {
    await setEmailAlerts(false, "tok");
    await requestAlertEmail("otro@example.com", "tok");
    await createTelegramLink("tok");
    await sendTelegramTest("tok");
    expect(
      fetchMock.mock.calls.map(([url, o]) => [url, o.method, o.body]),
    ).toEqual([
      ["/account", "PATCH", { email_alerts: false }],
      ["/account/alert-email", "POST", { email: "otro@example.com" }],
      ["/account/telegram/link", "POST", undefined],
      ["/account/telegram/test", "POST", undefined],
    ]);
  });
});

describe("placeHeaders", () => {
  it("sends the token only when filtering by an alert zone", () => {
    session.value = { access_token: "tok" };
    expect(placeHeaders({ region_code: "14" } as never).value).toEqual({});
    expect(placeHeaders({ area_id: 2 }).value).toEqual({
      Authorization: "Bearer tok",
    });
  });

  it("no token without a session", () => {
    expect(placeHeaders({ area_id: 2 }).value).toEqual({});
  });
});

describe("useRegions", () => {
  it("lists provinces and labels departments with their province", () => {
    const { provinces, departments, byCode, regionLabel } = useRegions();
    expect(provinces).toHaveLength(24);
    expect(departments.length).toBeGreaterThan(400);
    expect(regionLabel(byCode.get("14")!)).toBe("Córdoba");
    const department = departments.find((d) => d.province_code === "14")!;
    expect(regionLabel(department)).toBe(`${department.name}, Córdoba`);
  });

  it("outlineBounds of a multipolygon", () => {
    const outline = {
      type: "MultiPolygon",
      coordinates: [
        [
          [
            [-66, -35],
            [-62, -35],
            [-62, -29],
            [-66, -29],
            [-66, -35],
          ],
        ],
        [
          [
            [-70, -40],
            [-69, -40],
            [-69, -39],
            [-70, -40],
          ],
        ],
      ],
    };
    expect(outlineBounds(outline as never)).toEqual([
      [-40, -70],
      [-29, -62],
    ]);
  });
});

describe("useDetections", () => {
  it("queries /detections with the filters", async () => {
    fetchMock.mockResolvedValue([{ id: 1 }]);
    const { data } = await useDetections({ since: "2026-10-01", limit: 5000 });
    expect(data.value).toEqual([{ id: 1 }]);
    const [url, options] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/detections");
    expect(options.baseURL).toBe(API);
    expect(options.query).toEqual({ since: "2026-10-01", limit: 5000 });
  });
});
