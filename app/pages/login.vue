<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent, AuthFormField } from "@nuxt/ui";

definePageMeta({
  layout: "auth",
});

const supabase = useSupabaseClient();
const toast = useToast();

const loading = ref(false);
const sent = ref(false);

const fields: AuthFormField[] = [
  {
    name: "email",
    type: "email",
    label: "Correo electrónico",
    placeholder: "tucorreo@ejemplo.com",
    required: true,
  },
];

const providers = [
  {
    label: "Google",
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

  sent.value = true;
}
</script>

<template>
  <UAuthForm
    v-if="!sent"
    :schema="schema"
    :fields="fields"
    :providers="providers"
    :loading="loading"
    separator="o"
    title="Iniciar sesión"
    description="Te enviaremos un enlace de acceso a tu correo electrónico."
    :submit="{ label: 'Enviar enlace de acceso' }"
    @submit="onSubmit"
  />

  <UAlert
    v-else
    icon="i-lucide-mail-check"
    color="success"
    variant="subtle"
    title="Revisá tu correo"
    description="Te enviamos un enlace de acceso. Abrilo desde este dispositivo para iniciar sesión."
  />
</template>
