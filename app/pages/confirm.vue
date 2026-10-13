<script setup lang="ts">
const user = useSupabaseUser();

definePageMeta({
  layout: "auth",
});

const toast = useToast();

watch(
  user,
  () => {
    if (user.value) {
      toast.add({ title: "Sesión iniciada", color: "success" });
      return navigateTo("/mapa");
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="flex flex-col items-center gap-3 text-center">
    <UIcon
      name="i-lucide-loader-circle"
      class="text-primary size-6 animate-spin"
    />
    <p class="text-muted text-sm">Iniciando sesión…</p>
  </div>
</template>
