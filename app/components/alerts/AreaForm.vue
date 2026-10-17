<script setup lang="ts">
import type { AreaDraft } from "~/types";

const draft = defineModel<AreaDraft>({ required: true });

defineProps<{
  saving?: boolean;
  /** Mobile: the center (or the polygon) is placed in a separate map step, so
   * the form only shows it with a button to go back to that step. */
  relocatable?: boolean;
}>();

const emit = defineEmits<{
  save: [];
  cancel: [];
  locate: [lat: number, lon: number];
  relocate: [];
}>();

const { locating, locate } = useMyLocation();

// The slider works in whole percent; the API takes a 0-1 probability.
const minProbabilityPct = computed({
  get: () => Math.round(draft.value.min_probability * 100),
  set: (value: number) => (draft.value.min_probability = value / 100),
});

const kindItems = [
  { label: "Círculo", value: "circle" },
  { label: "Polígono", value: "polygon" },
  { label: "Provincia o depto.", value: "region" },
];

const points = computed(() => draft.value.polygon.length);

const { provinces, departments } = useRegions();

// Picking a province selects all of it; the department list then narrows it.
// A department's code starts with its province's (2 digits).
const provinceCode = computed({
  get: () => draft.value.region_code?.slice(0, 2),
  set: (code: string | undefined) => (draft.value.region_code = code ?? null),
});

const departmentItems = computed(() => {
  const province = provinceCode.value;
  if (!province) return [];
  return [
    { code: province, name: "Toda la provincia" },
    ...departments.filter((d) => d.province_code === province),
  ];
});

const regionCode = computed({
  get: () => draft.value.region_code ?? undefined,
  set: (code: string | undefined) => (draft.value.region_code = code ?? null),
});

const canSave = computed(
  () =>
    draft.value.name.trim() !== "" &&
    (draft.value.kind === "region"
      ? draft.value.region_code !== null
      : draft.value.kind === "polygon"
        ? draft.value.polygon.length >= 3
        : draft.value.lat !== null && draft.value.lon !== null),
);
</script>

<template>
  <form class="space-y-4" @submit.prevent="canSave && emit('save')">
    <UFormField label="Nombre">
      <UInput
        v-model="draft.name"
        placeholder="Ej: Campo en Corrientes"
        :maxlength="100"
        class="w-full"
        :autofocus="!relocatable || draft.id === null"
      />
    </UFormField>

    <UTabs
      v-model="draft.kind"
      :items="kindItems"
      :content="false"
      size="xs"
      :ui="{ list: 'w-full', trigger: 'flex-1' }"
    />

    <template v-if="draft.kind === 'region'">
      <UFormField label="Provincia">
        <USelectMenu
          v-model="provinceCode"
          :items="provinces"
          value-key="code"
          label-key="name"
          placeholder="Elegí una provincia"
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="Departamento"
        help="Te avisamos por los focos dentro de sus límites."
      >
        <USelectMenu
          v-model="regionCode"
          :items="departmentItems"
          value-key="code"
          label-key="name"
          :disabled="!provinceCode"
          placeholder="Toda la provincia"
          class="w-full"
        />
      </UFormField>
    </template>

    <UFormField
      v-else-if="draft.kind === 'polygon'"
      label="Polígono"
      :help="
        relocatable
          ? undefined
          : points < 3
            ? 'Hacé click en el mapa para marcar cada vértice (mínimo 3).'
            : 'Seguí haciendo click para agregar vértices.'
      "
    >
      <div class="flex items-center gap-2">
        <p class="flex-1 text-xs">
          <span v-if="points" class="text-highlighted">
            {{ points }} {{ points === 1 ? "vértice" : "vértices" }}
          </span>
          <span v-else class="text-muted">Sin dibujar</span>
        </p>
        <UButton
          v-if="relocatable"
          size="xs"
          color="neutral"
          variant="subtle"
          icon="i-lucide-pentagon"
          @click="emit('relocate')"
        >
          {{ points ? "Cambiar" : "Dibujar en el mapa" }}
        </UButton>
        <template v-else>
          <UButton
            size="xs"
            color="neutral"
            variant="subtle"
            icon="i-lucide-undo-2"
            :disabled="!points"
            @click="draft.polygon.pop()"
          >
            Deshacer
          </UButton>
          <UButton
            size="xs"
            color="neutral"
            variant="subtle"
            icon="i-lucide-eraser"
            :disabled="!points"
            @click="draft.polygon = []"
          >
            Borrar
          </UButton>
        </template>
      </div>
    </UFormField>

    <UFormField v-else-if="relocatable" label="Centro">
      <div class="flex items-center gap-2">
        <p class="text-highlighted flex-1 font-mono text-xs">
          <template v-if="draft.lat !== null && draft.lon !== null">
            {{ draft.lat.toFixed(4) }}, {{ draft.lon.toFixed(4) }}
          </template>
          <span v-else class="text-muted">Sin ubicar</span>
        </p>
        <UButton
          size="xs"
          color="neutral"
          variant="subtle"
          icon="i-lucide-map-pin"
          @click="emit('relocate')"
        >
          {{ draft.lat === null ? "Elegir en el mapa" : "Cambiar" }}
        </UButton>
      </div>
    </UFormField>

    <UFormField
      v-else
      label="Centro"
      :help="
        draft.lat === null
          ? 'Hacé click en el mapa para ubicarlo.'
          : 'Hacé click en el mapa para moverlo.'
      "
    >
      <div class="flex items-center gap-2">
        <p class="text-highlighted flex-1 font-mono text-xs">
          <template v-if="draft.lat !== null && draft.lon !== null">
            {{ draft.lat.toFixed(4) }}, {{ draft.lon.toFixed(4) }}
          </template>
          <span v-else class="text-muted">Sin ubicar</span>
        </p>
        <UButton
          size="xs"
          color="neutral"
          variant="subtle"
          icon="i-lucide-locate-fixed"
          :loading="locating"
          @click="locate((lat, lon) => emit('locate', lat, lon))"
        >
          Mi ubicación
        </UButton>
      </div>
    </UFormField>

    <UFormField
      v-if="draft.kind === 'circle'"
      :label="`Radio: ${draft.radius_km} km`"
    >
      <USlider v-model="draft.radius_km" :min="5" :max="200" :step="5" />
    </UFormField>

    <UFormField
      :label="`Probabilidad mínima: ${minProbabilityPct}%`"
      help="Más alta, menos falsas alarmas, pero podrías perderte focos reales."
    >
      <USlider v-model="minProbabilityPct" :min="50" :max="100" :step="5" />
    </UFormField>

    <div class="flex gap-2">
      <UButton color="neutral" variant="subtle" block @click="emit('cancel')">
        Cancelar
      </UButton>
      <UButton type="submit" block :loading="saving" :disabled="!canSave">
        {{ draft.id === null ? "Crear zona" : "Guardar" }}
      </UButton>
    </div>
  </form>
</template>
