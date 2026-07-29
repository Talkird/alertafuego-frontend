<script setup lang="ts">
import { eachDayOfInterval } from "date-fns";
import type { Period, Range } from "~/types";

const model = defineModel<Period>({ required: true });

const props = defineProps<{
  range: Range;
}>();

const labels: Record<Period, string> = {
  daily: "Diario",
  weekly: "Semanal",
  monthly: "Mensual",
  yearly: "Anual",
};

const days = computed(() => eachDayOfInterval(props.range));

const periods = computed<Period[]>(() => {
  if (days.value.length <= 8) return ["daily"];
  if (days.value.length <= 31) return ["daily", "weekly"];
  if (days.value.length <= 366) return ["weekly", "monthly"];
  return ["monthly", "yearly"];
});

const items = computed(() =>
  periods.value.map((value) => ({ label: labels[value], value })),
);

// Ensure the model value is always a valid period
watch(periods, () => {
  if (!periods.value.includes(model.value)) {
    model.value = periods.value[0]!;
  }
});
</script>

<template>
  <USelect
    v-model="model"
    :items="items"
    variant="ghost"
    class="data-[state=open]:bg-elevated"
    :ui="{
      trailingIcon:
        'group-data-[state=open]:rotate-180 transition-transform duration-200',
    }"
  />
</template>
