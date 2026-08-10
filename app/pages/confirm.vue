<script setup lang="ts">
const user = useSupabaseUser();

definePageMeta({
  layout: "auth",
});

watch(
  user,
  () => {
    if (user.value) {
      return navigateTo("/");
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="text-center">Esperando inicio de sesión...</div>
</template>
