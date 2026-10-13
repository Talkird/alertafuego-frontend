<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent, AuthFormField } from "@nuxt/ui";

definePageMeta({
  layout: "auth",
});

useSeoMeta({
  title: "Ingresar",
  description:
    "Ingresá a AlertaFuego con Google o con un enlace de acceso por email.",
});

const supabase = useSupabaseClient();
const toast = useToast();

const loading = ref(false);
// The address the link was sent to, once sent.
const sentTo = ref<string | null>(null);

const fields: AuthFormField[] = [
  {
    name: "email",
    type: "email",
    label: "Correo electrónico",
    placeholder: "tucorreo@ejemplo.com",
  },
];

const providers = [
  {
    label: "Continuar con Google",
    icon: "i-simple-icons-google",
    onClick: async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/confirm`,
        },
      });

      if (error) {
        toast.add({
          title: "No se pudo iniciar sesión con Google",
          description: error.message,
          color: "error",
        });
      }
    },
  },
];

const schema = z.object({
  email: z.email("Correo electrónico inválido"),
});

type Schema = z.output<typeof schema>;

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  loading.value = true;

  const { error } = await supabase.auth.signInWithOtp({
    email: payload.data.email,
    options: {
      emailRedirectTo: `${window.location.origin}/confirm`,
    },
  });

  loading.value = false;

  if (error) {
    toast.add({
      title: "No se pudo enviar el enlace",
      description: error.message,
      color: "error",
    });
    return;
  }

  sentTo.value = payload.data.email;
}
</script>

<template>
  <UAuthForm
    v-if="!sentTo"
    :schema="schema"
    :fields="fields"
    :providers="providers"
    :loading="loading"
    separator="o"
    title="Ingresá a AlertaFuego"
    description="Sin contraseña. Si es tu primera vez, la cuenta se crea al ingresar."
    :submit="{ label: 'Enviarme un enlace de acceso' }"
    :ui="{ header: 'text-left', title: 'text-2xl' }"
    @submit="onSubmit"
  />

  <div v-else class="space-y-6">
    <UIcon name="i-lucide-mail-check" class="text-primary size-8" />
    <div>
      <h1 class="text-highlighted text-2xl font-semibold">Revisá tu correo</h1>
      <p class="text-muted mt-1">
        Te enviamos un enlace de acceso a
        <span class="text-highlighted font-medium">{{ sentTo }}</span
        >. Abrilo desde este dispositivo para ingresar.
      </p>
    </div>
    <div class="space-y-2">
      <p class="text-muted text-sm">
        ¿No llegó? Puede tardar un minuto; revisá también la carpeta de spam.
      </p>
      <UButton
        color="neutral"
        variant="subtle"
        icon="i-lucide-arrow-left"
        @click="sentTo = null"
      >
        Usar otro correo
      </UButton>
    </div>
  </div>
</template>
