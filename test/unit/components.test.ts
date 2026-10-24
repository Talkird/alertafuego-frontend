import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, type Component } from "vue";
import type { Alert, ReportPublic, StoredDetection } from "~/types";
import AlertList from "~/components/alerts/AlertList.vue";
import RegionStats from "~/components/dashboard/RegionStats.vue";
import ReportStats from "~/components/dashboard/ReportStats.vue";
import DetectionPopup from "~/components/map/DetectionPopup.vue";
import MapFilters from "~/components/map/MapFilters.vue";
import MapLegend from "~/components/map/MapLegend.vue";
import PlaceSelect from "~/components/dashboard/PlaceSelect.vue";
import { UApp } from "#components";

const api = vi.hoisted(() => ({
  fetchReports: vi.fn(),
  fetchMyReport: vi.fn(),
  createReport: vi.fn(),
  updateReport: vi.fn(),
  useRegionStats: vi.fn(),
  useReportStats: vi.fn(),
  user: { value: null as object | null },
  session: { value: null as { access_token: string } | null },
}));

mockNuxtImport("fetchReports", () => api.fetchReports);
mockNuxtImport("fetchMyReport", () => api.fetchMyReport);
mockNuxtImport("createReport", () => api.createReport);
mockNuxtImport("updateReport", () => api.updateReport);
mockNuxtImport("useRegionStats", () => api.useRegionStats);
mockNuxtImport("useReportStats", () => api.useReportStats);
mockNuxtImport("useSupabaseUser", () => () => api.user);
mockNuxtImport("useSupabaseSession", () => () => api.session);

const detection: StoredDetection = {
  id: 7,
  lat: -31.4123,
  lon: -64.1987,
  probability: 0.876,
  image_time: "2026-10-01T18:30:00",
  detected_at: "2026-10-01T18:35:00",
  bbox: { west: -73.6, south: -55.1, east: -53.6, north: -21.8 },
  threshold: 0.5,
  report_count: 1,
  has_image: true,
};

const report: ReportPublic = {
  id: 1,
  verdict: "false_positive",
  category: "gas_flare",
  comment: "Petrolera",
  created_at: "2026-10-02T10:00:00",
};

/** useFetch-like result for a mocked stats composable. */
function fetched<T>(data: T, status = "success") {
  return { data: ref(data), status: ref(status), error: ref(null) };
}

/** Mounted inside UApp, as in the app: tooltips and toasts need its providers. */
async function mountInApp(
  component: Component,
  props: Record<string, unknown> = {},
) {
  const wrapper = await mountSuspended(
    defineComponent({ render: () => h(UApp, null, () => h(component, props)) }),
  );
  return wrapper.findComponent(component);
}

beforeEach(() => {
  vi.clearAllMocks();
  setActivePinia(createPinia());
  api.user.value = null;
  api.session.value = null;
  api.fetchReports.mockResolvedValue([report]);
  api.fetchMyReport.mockResolvedValue(null);
});

describe("DetectionPopup", () => {
  it("shows the detection and its reports", async () => {
    const wrapper = await mountSuspended(DetectionPopup, {
      props: { detection },
    });
    await flushPromises();
    const text = wrapper.text();
    expect(text).toContain("87.6%");
    expect(text).toContain("-31.4123, -64.1987");
    expect(text).toContain("Reportes (1)");
    expect(text).toContain("Antorcha de gas — Petrolera");
    expect(text).toContain("Ver imagen");
    expect(api.fetchReports).toHaveBeenCalledWith(7);
    expect(api.fetchMyReport).not.toHaveBeenCalled(); // signed out
  });

  it("no image button when the detection has none", async () => {
    const wrapper = await mountSuspended(DetectionPopup, {
      props: { detection: { ...detection, has_image: false } },
    });
    expect(wrapper.text()).not.toContain("Ver imagen");
  });

  it("signed out: sending a report asks to sign in", async () => {
    const wrapper = await mountSuspended(DetectionPopup, {
      props: { detection },
    });
    await flushPromises();
    await wrapper
      .findAll("button")
      .find((b) => b.text() === "Reportar")!
      .trigger("click");
    await wrapper
      .findAll("button")
      .find((b) => b.text() === "Enviar")!
      .trigger("click");
    expect(api.createReport).not.toHaveBeenCalled();
  });

  it("signed in: sends a false-positive report with category", async () => {
    api.user.value = { id: "u1" };
    api.session.value = { access_token: "tok" };
    api.createReport.mockResolvedValue({ ...report, id: 2, category: "other" });
    const wrapper = await mountSuspended(DetectionPopup, {
      props: { detection },
    });
    await flushPromises();
    expect(api.fetchMyReport).toHaveBeenCalledWith(7, "tok");

    await wrapper
      .findAll("button")
      .find((b) => b.text() === "Reportar")!
      .trigger("click");
    await wrapper.find("textarea").setValue("Es una quema");
    await wrapper
      .findAll("button")
      .find((b) => b.text() === "Enviar")!
      .trigger("click");
    await flushPromises();

    expect(api.createReport).toHaveBeenCalledWith(
      7,
      { verdict: "false_positive", category: "other", comment: "Es una quema" },
      "tok",
    );
    // Reloads the list after sending, and the button turns into "Editar reporte".
    expect(api.fetchReports).toHaveBeenCalledTimes(2);
    expect(wrapper.text()).toContain("Editar reporte");
  });

  it("signed in with an earlier report: edits it", async () => {
    api.user.value = { id: "u1" };
    api.session.value = { access_token: "tok" };
    api.fetchMyReport.mockResolvedValue(report);
    api.updateReport.mockResolvedValue(report);
    const wrapper = await mountSuspended(DetectionPopup, {
      props: { detection },
    });
    await flushPromises();

    await wrapper
      .findAll("button")
      .find((b) => b.text() === "Editar reporte")!
      .trigger("click");
    expect(wrapper.find("textarea").element.value).toBe("Petrolera");
    await wrapper
      .findAll("button")
      .find((b) => b.text() === "Enviar")!
      .trigger("click");
    await flushPromises();

    expect(api.updateReport).toHaveBeenCalledWith(
      7,
      {
        verdict: "false_positive",
        category: "gas_flare",
        comment: "Petrolera",
      },
      "tok",
    );
    expect(api.createReport).not.toHaveBeenCalled();
  });

  it("report list failing to load shows no reports instead of breaking", async () => {
    api.fetchReports.mockRejectedValue(new Error("offline"));
    const wrapper = await mountSuspended(DetectionPopup, {
      props: { detection },
    });
    await flushPromises();
    expect(wrapper.text()).toContain("Sin reportes todavía.");
  });
});

describe("MapFilters", () => {
  const props = {
    range: { start: new Date(2026, 8, 1), end: new Date(2026, 9, 1) },
    recentMinutes: 0,
    minConfidence: DEFAULT_MIN_CONFIDENCE,
    maxReports: 20,
  };

  it("no active-filter badge with the defaults", async () => {
    const wrapper = await mountSuspended(MapFilters, { props });
    const button = wrapper
      .findAll("button")
      .find((b) => b.text().startsWith("Filtros"))!;
    expect(button.text()).toBe("Filtros");
  });

  it("counts the filters changed from their defaults", async () => {
    const wrapper = await mountSuspended(MapFilters, {
      props: { ...props, minConfidence: 80, maxReports: 3 },
    });
    const button = wrapper
      .findAll("button")
      .find((b) => b.text().startsWith("Filtros"))!;
    expect(button.text()).toBe("Filtros 2");
  });

  it("hides the date picker for a recent window", async () => {
    const byDates = await mountSuspended(MapFilters, { props });
    const recent = await mountSuspended(MapFilters, {
      props: { ...props, recentMinutes: 60 },
    });
    expect(
      byDates.findComponent({ name: "DashboardDateRangePicker" }).exists(),
    ).toBe(true);
    expect(
      recent.findComponent({ name: "DashboardDateRangePicker" }).exists(),
    ).toBe(false);
  });
});

describe("MapLegend", () => {
  it("lists the three probability levels", async () => {
    const wrapper = await mountSuspended(MapLegend);
    expect(wrapper.findAll("li").map((li) => li.text())).toEqual([
      "80% o más",
      "65 a 80%",
      "Menos de 65%",
    ]);
  });
});

describe("RegionStats", () => {
  it("ranks the regions and notes the rest", async () => {
    const regions = Array.from({ length: 12 }, (_, i) => ({
      code: String(10 + i),
      name: `Provincia ${i}`,
      province_name: null,
      detection_count: 100 - i,
      max_probability: 0.9,
    }));
    api.useRegionStats.mockReturnValue(fetched(regions));
    const wrapper = await mountInApp(RegionStats);
    expect(wrapper.findAll("ol > li")).toHaveLength(10);
    expect(wrapper.text()).toContain("Provincia 0");
    expect(wrapper.text()).toContain(
      "2 regiones más con focos en este período.",
    );
  });

  it("empty and loading states", async () => {
    api.useRegionStats.mockReturnValue(fetched([]));
    expect((await mountSuspended(RegionStats)).text()).toContain(
      "Sin focos en este período.",
    );
    api.useRegionStats.mockReturnValue(fetched([], "pending"));
    expect((await mountSuspended(RegionStats)).text()).toContain(
      "Cargando focos por región…",
    );
  });

  it("asks for departments inside a province", async () => {
    api.useRegionStats.mockReturnValue(fetched([]));
    useFiltersStore().place = { kind: "region", code: "14" };
    const wrapper = await mountSuspended(RegionStats);
    expect(wrapper.text()).toContain("Focos por departamento");
    const query = toValue(api.useRegionStats.mock.calls[0]![0]);
    expect(query).toMatchObject({ kind: "department", region_code: "14" });
  });
});

describe("ReportStats", () => {
  it("totals and reported precision", async () => {
    api.useReportStats.mockReturnValue(
      fetched([
        { verdict: "confirmed_fire", category: null, report_count: 3 },
        { verdict: "false_positive", category: "gas_flare", report_count: 1 },
      ]),
    );
    const text = (await mountSuspended(ReportStats)).text();
    expect(text).toMatch(/Confirmados\s*3/);
    expect(text).toMatch(/Falsos positivos\s*1/);
    expect(text).toMatch(/Precisión reportada\s*75%/);
    expect(text).toContain("Antorcha de gas");
  });

  it("no reports", async () => {
    api.useReportStats.mockReturnValue(fetched([]));
    expect((await mountSuspended(ReportStats)).text()).toContain(
      "Sin reportes en este período.",
    );
  });
});

describe("AlertList", () => {
  const alert: Alert = {
    id: 1,
    area_id: 2,
    area_name: "Casa",
    created_at: "2026-10-01T18:40:00",
    emailed: true,
    telegram_sent: false,
    detection,
  };

  it("empty state depends on having zones", async () => {
    const noZones = await mountSuspended(AlertList, {
      props: { alerts: [], loading: false, hasZones: false },
    });
    expect(noZones.text()).toContain("Todavía no hay alertas");
    const withZones = await mountSuspended(AlertList, {
      props: { alerts: [], loading: false, hasZones: true },
    });
    expect(withZones.text()).toContain("Sin alertas por ahora");
  });

  it("lists alerts and emits select", async () => {
    const wrapper = await mountInApp(AlertList, {
      alerts: [alert],
      loading: false,
      hasZones: true,
    });
    expect(wrapper.text()).toContain("Casa");
    await wrapper.find("button").trigger("click");
    expect(wrapper.emitted("select")?.[0]).toEqual([alert]);
  });
});

describe("PlaceSelect", () => {
  // Regression for the axe finding label-content-name-mismatch (WCAG 2.5.3).
  it("its accessible name includes the place it shows", async () => {
    const country = await mountInApp(PlaceSelect, {
      modelValue: { kind: "country" },
    });
    expect(country.find("button").attributes("aria-label")).toBe(
      "Lugar: Todo el país",
    );
    const cordoba = await mountInApp(PlaceSelect, {
      modelValue: { kind: "region", code: "14" },
    });
    expect(cordoba.find("button").attributes("aria-label")).toBe(
      "Lugar: Córdoba",
    );
  });
});
