<script setup lang="ts">
import type { AccountSettings } from "~/types";

useSeoMeta({
  title: "Mi cuenta",
  description:
    "Dónde te llegan las alertas y los valores para tus zonas nuevas.",
});

const session = useSupabaseSession();
const user = useSupabaseUser();
const toast = useToast();

const account = ref<AccountSettings | null>(null);
const loading = ref(true);

const displayName = computed(
  () =>
    user.value?.user_metadata?.full_name ?? user.value?.email?.split("@")[0],
);
const signInMethod = computed(() =>
  user.value?.app_metadata?.provider === "google"
    ? "Ingresás con tu cuenta de Google."
    : "Ingresás con un enlace que te enviamos por email.",
);

function token(): string {
  return session.value!.access_token;
}

/** Run an account request; on failure toast `errorTitle` (401 is handled already). */
async function run(
  request: () => Promise<AccountSettings>,
  errorTitle: string,
): Promise<boolean> {
  try {
    account.value = await request();
    return true;
  } catch (error) {
    if (!isUnauthorized(error))
      toast.add({ title: errorTitle, color: "error" });
    return false;
  }
}

onMounted(async () => {
  // No session: the auth redirect handles it. Don't sit on the skeleton.
  if (session.value)
    await run(() => fetchAccount(token()), "No se pudo cargar tu cuenta");
  loading.value = false;
});

// --- Alert email --------------------------------------------------------------

const editingEmail = ref(false);
const newEmail = ref("");
const sendingEmail = ref(false);
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const emailValid = computed(() => EMAIL_PATTERN.test(newEmail.value.trim()));

function startEditingEmail() {
  newEmail.value = "";
  editingEmail.value = true;
}

async function sendConfirmation(email = newEmail.value.trim()) {
  sendingEmail.value = true;
  const ok = await run(
    () => requestAlertEmail(email, token()),
    "No se pudo enviar el enlace de confirmación",
  );
  sendingEmail.value = false;
  if (!ok) return;
  editingEmail.value = false;
  // The account's own address applies right away, with no link.
  if (account.value?.pending_email) {
    toast.add({
      title: "Te enviamos un enlace",
      description: `Abrilo desde ${account.value.pending_email} para confirmar.`,
      icon: "i-lucide-mail",
      color: "success",
    });
  } else {
    toast.add({
      title: "Los avisos van a llegar al email de tu cuenta",
      color: "success",
    });
  }
}

async function useAccountEmail() {
  if (
    await run(() => resetAlertEmail(token()), "No se pudo cambiar el email")
  ) {
    toast.add({
      title: "Los avisos van a llegar al email de tu cuenta",
      color: "success",
    });
  }
}

async function cancelPending() {
  if (
    await run(
      () => cancelPendingAlertEmail(token()),
      "No se pudo cancelar el cambio",
    )
  ) {
    toast.add({ title: "Cambio de email cancelado", color: "neutral" });
  }
}

// --- New zone defaults --------------------------------------------------------

const radiusKm = ref(25);
const minProbabilityPct = ref(65);
const savingDefaults = ref(false);

watch(account, (value) => {
  if (!value) return;
  radiusKm.value = value.default_radius_km;
  minProbabilityPct.value = Math.round(value.default_min_probability * 100);
});

const defaultsChanged = computed(
  () =>
    !!account.value &&
    (radiusKm.value !== account.value.default_radius_km ||
      minProbabilityPct.value !==
        Math.round(account.value.default_min_probability * 100)),
);

async function saveDefaults() {
  savingDefaults.value = true;
  const ok = await run(
    () =>
      updateAccount(
        {
          default_radius_km: radiusKm.value,
          default_min_probability: minProbabilityPct.value / 100,
        },
        token(),
      ),
    "No se pudieron guardar los valores",
  );
  savingDefaults.value = false;
  if (ok) toast.add({ title: "Valores guardados", color: "success" });
}
</script>

<template>
  <UDashboardPanel id="cuenta">
    <template #header>
      <UDashboardNavbar title="Mi cuenta">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <UPageCard variant="subtle">
          <div class="flex items-center gap-4">
            <UAvatar
              :src="user?.user_metadata?.avatar_url || '/icon.png'"
              :alt="displayName"
              size="xl"
            />
            <div class="min-w-0">
              <p class="text-highlighted truncate font-semibold">
                {{ displayName }}
              </p>
              <p class="text-muted truncate text-sm">{{ user?.email }}</p>
              <p class="text-muted mt-1 text-xs">{{ signInMethod }}</p>
            </div>
          </div>
        </UPageCard>

        <UPageCard
          title="Email para alertas"
          description="Adónde te llegan los avisos de tus zonas. Puede ser otro distinto al de tu cuenta, por ejemplo uno que lea más gente."
          variant="subtle"
        >
          <div v-if="loading" class="space-y-2" aria-hidden="true">
            <USkeleton class="h-5 w-64" />
            <USkeleton class="h-8 w-40" />
          </div>

          <template v-else-if="account">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
              <UIcon name="i-lucide-mail" class="text-muted size-5" />
              <span class="text-highlighted font-medium break-all">
                {{ account.alert_email }}
              </span>
              <UBadge
                :label="
                  account.uses_account_email ? 'De tu cuenta' : 'Confirmado'
                "
                :color="account.uses_account_email ? 'neutral' : 'success'"
                variant="subtle"
              />
            </div>

            <UAlert
              v-if="account.pending_email"
              icon="i-lucide-mail-question"
              color="info"
              variant="subtle"
              title="Falta confirmar"
              :description="`Te enviamos un enlace a ${account.pending_email}. Hasta que lo abras, los avisos siguen llegando a ${account.alert_email}. El enlace vence en 24 horas.`"
              :actions="[
                {
                  label: 'Reenviar',
                  color: 'info',
                  variant: 'solid',
                  loading: sendingEmail,
                  onClick: () => sendConfirmation(account!.pending_email!),
                },
                {
                  label: 'Cancelar cambio',
                  color: 'neutral',
                  variant: 'subtle',
                  onClick: cancelPending,
                },
              ]"
              orientation="horizontal"
            />

            <form
              v-if="editingEmail"
              class="flex flex-col gap-2 sm:flex-row sm:items-start"
              @submit.prevent="emailValid && sendConfirmation()"
            >
              <UFormField
                class="flex-1"
                help="Te vamos a enviar un enlace para confirmar que es tuyo."
              >
                <UInput
                  v-model="newEmail"
                  type="email"
                  placeholder="nombre@ejemplo.com"
                  autocomplete="email"
                  autofocus
                  class="w-full"
                />
              </UFormField>
              <div class="flex gap-2">
                <UButton
                  color="neutral"
                  variant="subtle"
                  @click="editingEmail = false"
                >
                  Cancelar
                </UButton>
                <UButton
                  type="submit"
                  :loading="sendingEmail"
                  :disabled="!emailValid"
                >
                  Enviar enlace
                </UButton>
              </div>
            </form>

            <div v-else class="flex flex-wrap gap-2">
              <UButton
                color="neutral"
                variant="subtle"
                icon="i-lucide-pencil"
                @click="startEditingEmail"
              >
                {{
                  account.uses_account_email
                    ? "Usar otro email"
                    : "Cambiar email"
                }}
              </UButton>
              <UButton
                v-if="!account.uses_account_email"
                color="neutral"
                variant="ghost"
                @click="useAccountEmail"
              >
                Volver a {{ user?.email }}
              </UButton>
            </div>
          </template>
        </UPageCard>

        <UPageCard
          title="Valores para zonas nuevas"
          description="Con qué radio y probabilidad mínima empieza cada zona que crees. No cambia las zonas que ya tenés."
          variant="subtle"
        >
          <div v-if="loading" class="space-y-4" aria-hidden="true">
            <USkeleton class="h-10 w-full" />
            <USkeleton class="h-10 w-full" />
          </div>

          <form
            v-else-if="account"
            class="space-y-4"
            @submit.prevent="saveDefaults"
          >
            <UFormField :label="`Radio: ${radiusKm} km`">
              <USlider v-model="radiusKm" :min="5" :max="200" :step="5" />
            </UFormField>
            <UFormField
              :label="`Probabilidad mínima: ${minProbabilityPct}%`"
              help="Más alta, menos falsas alarmas, pero podrías perderte focos reales."
            >
              <USlider
                v-model="minProbabilityPct"
                :min="50"
                :max="100"
                :step="5"
              />
            </UFormField>
            <div class="flex justify-end">
              <UButton
                type="submit"
                :loading="savingDefaults"
                :disabled="!defaultsChanged"
              >
                Guardar
              </UButton>
            </div>
          </form>
        </UPageCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
