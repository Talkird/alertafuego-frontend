import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

describe("filters store", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("defaults to the last 30 days", () => {
    const store = useFiltersStore();
    const days =
      (store.range.end.getTime() - store.range.start.getTime()) / 86_400_000;
    expect(Math.round(days)).toBe(30);
  });

  it("queries whole days, including the last one", () => {
    const store = useFiltersStore();
    store.range = {
      start: new Date(2026, 9, 1, 15, 30),
      end: new Date(2026, 9, 7, 0, 0),
    };
    expect(store.query).toEqual({
      since: new Date(2026, 9, 1, 0, 0, 0, 0).toISOString(),
      until: new Date(2026, 9, 7, 23, 59, 59, 999).toISOString(),
    });
  });

  it("place query: country, region or alert zone", () => {
    const store = useFiltersStore();
    expect(store.placeQuery).toEqual({});
    store.place = { kind: "region", code: "14" };
    expect(store.placeQuery).toEqual({ region_code: "14" });
    store.place = { kind: "area", id: 3, regionCode: null };
    expect(store.placeQuery).toEqual({ area_id: 3 });
  });

  it.each([
    [{ kind: "country" } as const, "choice"],
    [{ kind: "region", code: "14" } as const, "department"],
    [{ kind: "region", code: "14014" } as const, "none"],
    [{ kind: "area", id: 1, regionCode: null } as const, "department"],
    [{ kind: "area", id: 1, regionCode: "14014" } as const, "none"],
  ])("region breakdown for %o is %s", (place, breakdown) => {
    const store = useFiltersStore();
    store.place = place;
    expect(store.regionBreakdown).toBe(breakdown);
  });
});
