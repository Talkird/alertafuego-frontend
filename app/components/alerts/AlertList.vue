<script setup lang="ts">
import type { Alert } from "~/types";

defineProps<{
  alerts: Alert[];
  loading: boolean;
  hasZones: boolean;
}>();

const emit = defineEmits<{
  select: [alert: Alert];
  create: [];
}>();

function formatDateTime(iso: string): string {
  return parseUtc(iso).toLocaleString("es-AR", {
    hour12: false,
    dateStyle: "short",
    timeStyle: "short",
  });
}
</script>

<template>
  <div>
    <p v-if="loading" class="text-muted text-sm">Cargando…</p>

    <UEmpty
      v-else-if="!alerts.length"
      icon="i-lucide-bell-ring"
      :title="hasZones ? 'Sin alertas por ahora' : 'Todavía no hay alertas'"
      :description="
        hasZones
          ? 'Cuando se detecte un foco en alguna de tus zonas, aparece acá y te llega un email.'
          : 'Las alertas aparecen cuando se detecta un foco dentro de una de tus zonas.'
      "
      :actions="
        hasZones
          ? []
          : [
              {
                label: 'Crear una zona',
                icon: 'i-lucide-plus',
                onClick: () => emit('create'),
              },
            ]
      "
    />

    <template v-else>
      <ul class="divide-default divide-y">
        <li v-for="alert in alerts" :key="alert.id">
          <button
            type="button"
            class="hover:bg-elevated/50 flex w-full items-center gap-3 rounded px-1 py-2.5 text-left"
            @click="emit('select', alert)"
          >
            <span
              class="size-2.5 shrink-0 rounded-full"
              :style="{
                backgroundColor: detectionColor(alert.detection.probability),
              }"
            />
            <span class="min-w-0 flex-1">
              <span class="text-highlighted block truncate text-sm">
                {{ alert.area_name }}
              </span>
              <span class="text-muted block text-xs tabular-nums">
                {{ formatDateTime(alert.detection.image_time) }} ·
                {{ Math.round(alert.detection.probability * 100) }}%
              </span>
            </span>
            <UTooltip
              :text="alert.emailed ? 'Email enviado' : 'Email no enviado'"
            >
              <UIcon
                :name="
                  alert.emailed ? 'i-lucide-mail-check' : 'i-lucide-mail-x'
                "
                class="text-muted size-4 shrink-0"
              />
            </UTooltip>
          </button>
        </li>
      </ul>
      <p class="text-muted mt-2 text-xs">
        Tocá una alerta para ver la imagen satelital o reportarla.
      </p>
    </template>
  </div>
</template>
