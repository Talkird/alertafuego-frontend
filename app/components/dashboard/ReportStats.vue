<script setup lang="ts">
import type { ReportCategory } from "~/types";

const { query } = storeToRefs(useFiltersStore());

const { data: stats, error } = useReportStats(query);
useFetchErrorToast(error, "No se pudieron cargar las estadísticas");

const confirmed = computed(() =>
  (stats.value ?? [])
    .filter((s) => s.verdict === "confirmed_fire")
    .reduce((sum, s) => sum + s.report_count, 0),
);

const falsePositives = computed(() =>
  (stats.value ?? []).filter((s) => s.verdict === "false_positive"),
);

const falsePositiveTotal = computed(() =>
  falsePositives.value.reduce((sum, s) => sum + s.report_count, 0),
);

const total = computed(() => confirmed.value + falsePositiveTotal.value);

const categories = computed(() =>
  falsePositives.value
    .map((s) => ({
      category: s.category as ReportCategory,
      count: s.report_count,
    }))
    .sort((a, b) => b.count - a.count),
);

const maxCategory = computed(() => categories.value[0]?.count ?? 1);
</script>

<template>
  <UCard>
    <template #header>
      <p class="text-highlighted text-sm font-medium">Reportes de usuarios</p>
    </template>

    <p v-if="!total" class="text-muted text-sm">
      Sin reportes en este período.
    </p>

    <div v-else class="space-y-5">
      <div class="grid grid-cols-3 gap-3">
        <div>
          <p class="text-muted text-xs">Confirmados</p>
          <p class="text-highlighted text-2xl font-semibold tabular-nums">
            {{ confirmed }}
          </p>
        </div>
        <div>
          <p class="text-muted text-xs">Falsos positivos</p>
          <p class="text-highlighted text-2xl font-semibold tabular-nums">
            {{ falsePositiveTotal }}
          </p>
        </div>
        <div>
          <p class="text-muted text-xs">Precisión reportada</p>
          <p class="text-highlighted text-2xl font-semibold tabular-nums">
            {{ Math.round((confirmed / total) * 100) }}%
          </p>
        </div>
      </div>

      <div v-if="categories.length" class="space-y-2.5">
        <p class="text-muted text-sm">Motivos de falso positivo</p>
        <div v-for="item in categories" :key="item.category" class="space-y-1">
          <div class="flex items-baseline justify-between gap-3 text-sm">
            <span class="text-highlighted">
              {{ REPORT_CATEGORY_LABELS[item.category] }}
            </span>
            <span class="text-toned tabular-nums">{{ item.count }}</span>
          </div>
          <div class="bg-elevated h-2 rounded">
            <div
              class="bg-primary h-2 rounded"
              :style="{ width: `${(item.count / maxCategory) * 100}%` }"
            />
          </div>
        </div>
      </div>

      <p class="text-muted text-xs">
        Precisión reportada: reportes que confirman un incendio sobre el total
        de reportes. Solo cuenta detecciones que alguien reportó.
      </p>
    </div>
  </UCard>
</template>
