<script setup lang="ts">
const user = useSupabaseUser();

definePageMeta({
  layout: "auth",
});

watch(
  user,
  () => {
    if (user.value) {
      // Redirect to protected page
      return navigateTo("/");
    }
  },
  { immediate: true },
);
</script>

<template>
  <div>Esperando inicio de sesión...</div>
</template>
