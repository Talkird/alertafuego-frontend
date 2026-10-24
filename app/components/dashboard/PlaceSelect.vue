<script setup lang="ts">
import type { SelectMenuItem } from "@nuxt/ui";
import type { AlertArea, Place } from "~/types";

const place = defineModel<Place>({ required: true });

const session = useSupabaseSession();
const { provinces, departments, regionLabel } = useRegions();

const areas = ref<AlertArea[]>([]);
onMounted(async () => {
  if (!session.value) return;
  try {
    areas.value = await fetchAlertAreas(session.value.access_token);
  } catch {
    // Without them the list just has no "Mis zonas": still usable.
  }
});

// The menu works on string keys; Place is what the rest of the page uses.
const toKey = (value: Place) =>
  value.kind === "region"
    ? `region:${value.code}`
    : value.kind === "area"
      ? `area:${value.id}`
      : "country";

function fromKey(key: string): Place {
  const [kind, id] = key.split(":");
  if (kind === "region") return { kind: "region", code: id! };
  if (kind === "area") {
    const area = areas.value.find((a) => a.id === Number(id));
    return {
      kind: "area",
      id: Number(id),
      regionCode: area?.region?.code ?? null,
    };
  }
  return { kind: "country" };
}

const key = computed({
  get: () => toKey(place.value),
  set: (value: string) => (place.value = fromKey(value)),
});

const items = computed<SelectMenuItem[][]>(() => {
  const groups: SelectMenuItem[][] = [
    [{ label: "Todo el país", value: "country", icon: "i-lucide-globe" }],
  ];
  if (areas.value.length)
    groups.push([
      { type: "label", label: "Mis zonas" },
      ...areas.value.map((a) => ({
        label: a.name,
        value: `area:${a.id}`,
        icon: "i-lucide-map-pin",
      })),
    ]);
  groups.push(
    [
      { type: "label", label: "Provincias" },
      ...provinces.map((r) => ({
        label: r.name,
        value: `region:${r.code}`,
      })),
    ],
    [
      { type: "label", label: "Departamentos" },
      ...departments.map((r) => ({
        label: regionLabel(r),
        value: `region:${r.code}`,
      })),
    ],
  );
  return groups;
});

// The trigger shows the chosen place: its accessible name has to include that
// visible text (WCAG 2.5.3), not only "Lugar".
// Every item above is an object with a value.
const selectedLabel = computed(
  () =>
    (items.value.flat() as { value?: string; label?: string }[]).find(
      (item) => item.value === key.value,
    )?.label ?? "",
);
</script>

<template>
  <USelectMenu
    v-model="key"
    :items="items"
    value-key="value"
    icon="i-lucide-map-pinned"
    :search-input="{ placeholder: 'Buscar lugar…' }"
    :content="{ align: 'end' }"
    class="w-44 sm:w-56"
    :aria-label="`Lugar: ${selectedLabel}`"
  />
</template>
