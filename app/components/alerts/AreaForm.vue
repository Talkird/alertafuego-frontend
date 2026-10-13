<script setup lang="ts">
import type { AreaDraft } from "~/types";

const draft = defineModel<AreaDraft>({ required: true });

defineProps<{
  saving?: boolean;
}>();

const emit = defineEmits<{
  save: [];
  cancel: [];
  locate: [lat: number, lon: number];
}>();

const toast = useToast();
const locating = ref(false);

// The slider works in whole percent; the API takes a 0-1 probability.
const minProbabilityPct = computed({
  get: () => Math.round(draft.value.min_probability * 100),
  set: (value: number) => (draft.value.min_probability = value / 100),
});

const canSave = computed(
  () =>
    draft.value.name.trim() !== "" &&
    draft.value.lat !== null &&
    draft.value.lon !== null,
);

function useMyLocation() {
  if (!navigator.geolocation) {
    toast.add({
      title: "Tu navegador no comparte ubicación",
      color: "warning",
    });
    return;
  }
  locating.value = true;
  navigator.geolocation.getCurrentPosition(
    (position) => {
      locating.value = false;
      emit("locate", position.coords.latitude, position.coords.longitude);
    },
    () => {
      locating.value = false;
      toast.add({ title: "No se pudo obtener tu ubicación", color: "warning" });
    },
  );
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="canSave && emit('save')">
    <UFormField label="Nombre">
      <UInput
        v-model="draft.name"
        placeholder="Ej: Campo en Corrientes"
        :maxlength="100"
        class="w-full"
        autofocus
      />
    </UFormField>

    <UFormField
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
          @click="useMyLocation"
        >
          Mi ubicación
        </UButton>
      </div>
    </UFormField>

    <UFormField :label="`Radio: ${draft.radius_km} km`">
      <USlider v-model="draft.radius_km" :min="5" :max="200" :step="5" />
    </UFormField>

    <UFormField
      :label="`Probabilidad mínima: ${minProbabilityPct}%`"
      help="Más alta, menos falsas alarmas, pero podrías perderte focos reales."
    >
      <USlider v-model="minProbabilityPct" :min="50" :max="100" :step="5" />
    </UFormField>

    <div class="flex gap-2">
      <UButton color="neutral" variant="ghost" block @click="emit('cancel')">
        Cancelar
      </UButton>
      <UButton type="submit" block :loading="saving" :disabled="!canSave">
        {{ draft.id === null ? "Crear zona" : "Guardar" }}
      </UButton>
    </div>
  </form>
</template>
