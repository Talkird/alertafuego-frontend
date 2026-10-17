<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import type { AlertArea } from "~/types";

const props = defineProps<{
  areas: AlertArea[];
  loading: boolean;
  /** How alerts reach the user (channels set in Mi cuenta). */
  delivery: string | null;
  /** Zone highlighted from the map (hovered or clicked circle). */
  highlightedId: number | null;
}>();

const emit = defineEmits<{
  create: [];
  focus: [area: AlertArea];
  edit: [area: AlertArea];
  remove: [area: AlertArea];
  toggle: [area: AlertArea, active: boolean];
  hover: [id: number | null];
}>();

const { regionLabel } = useRegions();

function menuItems(area: AlertArea): DropdownMenuItem[] {
  return [
    {
      label: "Editar",
      icon: "i-lucide-pencil",
      onSelect: () => emit("edit", area),
    },
    {
      label: "Eliminar",
      icon: "i-lucide-trash-2",
      color: "error",
      onSelect: () => emit("remove", area),
    },
  ];
}

// A zone clicked on the map may be off-screen in a long list.
watch(
  () => props.highlightedId,
  (id) => {
    if (id !== null) {
      document
        .getElementById(`zone-${id}`)
        ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  },
);
</script>

<template>
  <div class="space-y-3">
    <p v-if="loading" class="text-muted text-sm">Cargando…</p>

    <UEmpty
      v-else-if="!areas.length"
      icon="i-lucide-map-pin-plus"
      title="Todavía no tenés zonas"
      description="Elegí un punto y un radio, por ejemplo tu campo o tu localidad, o una provincia o departamento, y te avisamos cuando se detecte un foco dentro."
      :actions="[
        {
          label: 'Crear una zona',
          icon: 'i-lucide-plus',
          onClick: () => emit('create'),
        },
      ]"
    />

    <template v-else>
      <p v-if="delivery" class="text-muted text-sm">
        {{ delivery }}
        <ULink to="/cuenta" class="text-primary font-medium">Cambiar</ULink>
      </p>

      <ul class="space-y-2">
        <li
          v-for="area in areas"
          :id="`zone-${area.id}`"
          :key="area.id"
          class="ring-default flex items-center gap-3 rounded-lg p-3 ring transition-shadow"
          :class="{ 'ring-primary ring-2': highlightedId === area.id }"
          @mouseenter="emit('hover', area.id)"
          @mouseleave="emit('hover', null)"
        >
          <button
            type="button"
            class="min-w-0 flex-1 text-left"
            @click="emit('focus', area)"
          >
            <span class="text-highlighted block truncate font-medium">
              {{ area.name }}
            </span>
            <span class="text-muted block text-xs">
              {{
                area.region ? regionLabel(area.region) : `${area.radius_km} km`
              }}
              · probabilidad ≥
              {{ Math.round(area.min_probability * 100) }}%
              <template v-if="!area.active"> · pausada</template>
            </span>
          </button>

          <USwitch
            :model-value="area.active"
            :aria-label="area.active ? 'Pausar avisos' : 'Reanudar avisos'"
            @update:model-value="emit('toggle', area, $event)"
          />

          <UDropdownMenu :items="menuItems(area)" :content="{ align: 'end' }">
            <UButton
              icon="i-lucide-ellipsis-vertical"
              color="neutral"
              variant="subtle"
              size="sm"
              aria-label="Más acciones"
            />
          </UDropdownMenu>
        </li>
      </ul>
    </template>
  </div>
</template>
