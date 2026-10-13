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
          ? 'Cuando se detecte un foco en alguna de tus zonas, aparece acá y te avisamos por los canales de Mi cuenta.'
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
            <span class="flex shrink-0 items-center gap-1.5">
              <UTooltip v-if="alert.emailed" text="Email enviado">
                <UIcon name="i-lucide-mail-check" class="text-muted size-4" />
              </UTooltip>
              <UTooltip v-if="alert.telegram_sent" text="Enviada por Telegram">
                <UIcon
                  name="i-simple-icons-telegram"
                  class="text-muted size-3.5"
                />
              </UTooltip>
              <UTooltip
                v-if="!alert.emailed && !alert.telegram_sent"
                text="No se envió aviso, solo aparece acá"
              >
                <UIcon name="i-lucide-bell-off" class="text-muted size-4" />
              </UTooltip>
            </span>
          </button>
        </li>
      </ul>
      <p class="text-muted mt-2 text-xs">
        Tocá una alerta para ver la imagen satelital o reportarla.
      </p>
    </template>
  </div>
</template>
