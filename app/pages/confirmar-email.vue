<script setup lang="ts">
// Opened from the confirmation email, maybe on a device where the user isn't
// logged in: the token in the link is all the backend needs.
definePageMeta({
  layout: "auth",
});

useSeoMeta({ title: "Confirmar email" });

const route = useRoute();
const user = useSupabaseUser();

const state = ref<"loading" | "confirmed" | "failed">("loading");
const email = ref("");

onMounted(async () => {
  const token = route.query.token;
  if (typeof token !== "string" || !token) {
    state.value = "failed";
    return;
  }
  try {
    email.value = (await confirmAlertEmail(token)).email;
    state.value = "confirmed";
  } catch {
    state.value = "failed";
  }
});
</script>

<template>
  <div
    v-if="state === 'loading'"
    class="flex flex-col items-center gap-3 text-center"
  >
    <UIcon
      name="i-lucide-loader-circle"
      class="text-primary size-6 animate-spin"
    />
    <p class="text-muted text-sm">Confirmando tu email…</p>
  </div>

  <div v-else class="flex flex-col items-center gap-4 text-center">
    <UIcon
      :name="state === 'confirmed' ? 'i-lucide-mail-check' : 'i-lucide-mail-x'"
      :class="[
        'size-10',
        state === 'confirmed' ? 'text-success' : 'text-error',
      ]"
    />
    <template v-if="state === 'confirmed'">
      <h1 class="text-highlighted text-xl font-semibold">Email confirmado</h1>
      <p class="text-muted text-sm text-balance">
        Desde ahora, los avisos de tus zonas llegan a
        <span class="text-highlighted font-medium break-all">{{ email }}</span
        >.
      </p>
    </template>
    <template v-else>
      <h1 class="text-highlighted text-xl font-semibold">
        El enlace no funciona
      </h1>
      <p class="text-muted text-sm text-balance">
        Puede que haya vencido (dura 24 horas), que ya lo hayas usado o que
        hayas pedido otro después. Pedí uno nuevo desde Mi cuenta.
      </p>
    </template>
    <UButton :to="user ? '/cuenta' : '/'" class="mt-2">
      {{ user ? "Ir a Mi cuenta" : "Ir al inicio" }}
    </UButton>
  </div>
</template>
