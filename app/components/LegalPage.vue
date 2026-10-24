<script setup lang="ts">
defineProps<{ title: string }>();
</script>

<template>
  <UContainer class="max-w-3xl py-12 sm:py-16">
    <h1 class="text-highlighted text-3xl font-bold sm:text-4xl">{{ title }}</h1>
    <p class="text-muted mt-2 text-sm">
      Última actualización: {{ LEGAL.updated }}
    </p>
    <div class="legal mt-8">
      <slot />
    </div>
  </UContainer>
</template>

<style scoped>
@reference "../assets/css/main.css";

.legal :deep(h2) {
  @apply text-highlighted mt-10 mb-3 text-xl font-semibold;
}
.legal :deep(p),
.legal :deep(li) {
  @apply text-toned leading-7;
}
.legal :deep(p + p) {
  @apply mt-3;
}
.legal :deep(ul) {
  @apply mt-3 list-disc space-y-1.5 pl-6;
}
/* Always underlined: inside a paragraph, color alone doesn't tell a link apart
 * (WCAG 1.4.1). */
.legal :deep(a) {
  @apply text-primary underline underline-offset-2;
}
.legal :deep(strong) {
  @apply text-highlighted font-medium;
}
</style>
