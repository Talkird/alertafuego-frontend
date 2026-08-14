<script setup lang="ts">
import type { NuxtError } from "#app";

definePageMeta({
  layout: "auth",
});

const props = defineProps<{ error: NuxtError }>();
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <UPageCard class="w-full max-w-md">
      <p>Error: {{ error.status }}</p>
      <NuxtLink to="/">Volver a la página principal</NuxtLink>
    </UPageCard>
  </div>
</template>
