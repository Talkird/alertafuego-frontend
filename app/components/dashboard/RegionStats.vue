<script setup lang="ts">
import type { RegionKind } from "~/types";

const TOP = 10;
const SKELETON_WIDTHS = [100, 72, 54, 38, 24];

const kindOptions = [
  { label: "Provincias", value: "province" },
  { label: "Departamentos", value: "department" },
];

const {
  query: rangeQuery,
  placeQuery,
  regionBreakdown,
} = storeToRefs(useFiltersStore());

// The user picks provinces or departments for the whole country; inside a
// province or a zone, only departments make sense (see regionBreakdown).
const chosenKind = ref<RegionKind>("province");
const kind = computed<RegionKind>(() =>
  regionBreakdown.value === "choice" ? chosenKind.value : "department",
);
const query = computed(() => ({
  kind: kind.value,
  ...rangeQuery.value,
  ...placeQuery.value,
}));

const { data: regions, status, error } = useRegionStats(query);
useFetchErrorToast(error, "No se pudieron cargar las estadísticas");

const top = computed(() => (regions.value ?? []).slice(0, TOP));
const max = computed(() => top.value[0]?.detection_count ?? 1);
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <p class="text-highlighted text-sm font-medium">
          {{
            regionBreakdown === "choice"
              ? "Focos por región"
              : "Focos por departamento"
          }}
        </p>
        <USelect
          v-if="regionBreakdown === 'choice'"
          v-model="chosenKind"
          :items="kindOptions"
          size="xs"
          class="w-36"
        />
      </div>
    </template>

    <!-- Ranked-bar placeholders, like the list they stand in for. -->
    <div v-if="status === 'pending'">
      <p class="sr-only" aria-live="polite">Cargando focos por región…</p>
      <ol aria-hidden="true" class="space-y-2.5">
        <li v-for="width in SKELETON_WIDTHS" :key="width" class="space-y-1">
          <div class="flex items-center justify-between gap-3 py-0.5">
            <USkeleton class="h-4 w-28" />
            <USkeleton class="h-4 w-6" />
          </div>
          <USkeleton class="h-2" :style="{ width: `${width}%` }" />
        </li>
      </ol>
    </div>
    <p v-else-if="!top.length" class="text-muted text-sm">
      Sin focos en este período.
    </p>

    <ol v-else class="space-y-2.5">
      <li v-for="region in top" :key="region.code">
        <UTooltip
          :text="`Probabilidad máxima: ${Math.round(region.max_probability * 100)}%`"
          :content="{ side: 'top', align: 'start' }"
        >
          <div class="w-full space-y-1">
            <div class="flex items-baseline justify-between gap-3 text-sm">
              <span class="text-highlighted truncate">
                {{ region.name }}
                <span v-if="region.province_name" class="text-muted text-xs">
                  · {{ region.province_name }}
                </span>
              </span>
              <span class="text-toned shrink-0 tabular-nums">
                {{ region.detection_count }}
              </span>
            </div>
            <div class="bg-elevated h-2 rounded">
              <div
                class="bg-primary h-2 rounded"
                :style="{
                  width: `${(region.detection_count / max) * 100}%`,
                }"
              />
            </div>
          </div>
        </UTooltip>
      </li>
    </ol>

    <p v-if="(regions?.length ?? 0) > TOP" class="text-muted mt-3 text-xs">
      {{ regions!.length - TOP }} regiones más con focos en este período.
    </p>
  </UCard>
</template>
