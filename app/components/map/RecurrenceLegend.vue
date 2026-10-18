<template>
  <div
    class="bg-default/90 ring-default pointer-events-auto rounded-lg px-3 py-2 text-xs shadow-sm ring backdrop-blur"
  >
    <p class="text-highlighted font-medium">Recurrencia</p>
    <p class="text-muted mb-1.5">Días con fuego por zona de ~2 km</p>
    <ul class="space-y-1">
      <li
        v-for="level in RECURRENCE_LEVELS"
        :key="level.label"
        class="text-toned flex items-center gap-2"
      >
        <!-- Same subtle style as the cells: light fill, solid outline. -->
        <span
          class="size-2.5 rounded-full border-[1.5px]"
          :style="{
            borderColor: level.color,
            backgroundColor: `${level.color}59`,
          }"
        />
        {{ level.label }}
      </li>
    </ul>
  </div>
</template>
