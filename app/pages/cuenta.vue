<script setup lang="ts">
import { useIntervalFn } from "@vueuse/core";
import type { AccountSettings } from "~/types";

useSeoMeta({
  title: "Mi cuenta",
  description: "Por dónde te llegan los avisos de tus zonas de alerta.",
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

const noChannel = computed(
  () =>
    !!account.value &&
    !account.value.email_alerts &&
    !account.value.telegram_connected,
);

// --- Email --------------------------------------------------------------------

const togglingEmail = ref(false);

async function toggleEmail(enabled: boolean) {
  togglingEmail.value = true;
  const ok = await run(
    () => setEmailAlerts(enabled, token()),
    "No se pudo cambiar el aviso por email",
  );
  togglingEmail.value = false;
  if (ok)
    toast.add({
      title: enabled
        ? "Avisos por email activados"
        : "Avisos por email desactivados",
      color: enabled ? "success" : "neutral",
    });
}

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

// --- Telegram -----------------------------------------------------------------

const connecting = ref(false);
/** The bot link while waiting for the user to press Start in Telegram. */
const telegramLink = ref<string | null>(null);
let linkExpiresAt = 0;

// Once the bot link is open, Telegram tells the backend when the user presses
// Start: check every few seconds until it shows up as connected.
const { pause: stopWaiting, resume: startWaiting } = useIntervalFn(
  async () => {
    if (Date.now() > linkExpiresAt) {
      stopWaiting();
      telegramLink.value = null;
      return;
    }
    try {
      const latest = await fetchAccount(token());
      if (!latest.telegram_connected) return;
      account.value = latest;
      stopWaiting();
      telegramLink.value = null;
      toast.add({
        title: "Telegram conectado",
        description: "Las alertas de tus zonas van a llegar a ese chat.",
        icon: "i-simple-icons-telegram",
        color: "success",
      });
    } catch {
      // Silent: the next check retries.
    }
  },
  3000,
  { immediate: false },
);

async function connectTelegram() {
  // Open the tab right away, inside the click: a window opened after an await
  // is blocked as a popup. Its address is set once the link arrives.
  const tab = window.open("", "_blank");
  connecting.value = true;
  try {
    const link = await createTelegramLink(token());
    telegramLink.value = link.url;
    // The API's times are naive UTC.
    linkExpiresAt = Date.parse(`${link.expires_at}Z`);
    if (tab) tab.location.href = link.url;
    startWaiting();
  } catch (error) {
    tab?.close();
    if (!isUnauthorized(error))
      toast.add({ title: "No se pudo conectar Telegram", color: "error" });
  } finally {
    connecting.value = false;
  }
}

function cancelConnecting() {
  stopWaiting();
  telegramLink.value = null;
}

const testing = ref(false);

async function testTelegram() {
  testing.value = true;
  try {
    await sendTelegramTest(token());
    toast.add({
      title: "Mensaje de prueba enviado",
      description: "Fijate en tu chat con el bot.",
      color: "success",
    });
  } catch (error) {
    if (isUnauthorized(error)) return;
    // 409: the bot was blocked in Telegram, so the backend disconnected it.
    const blocked = (error as { statusCode?: number }).statusCode === 409;
    toast.add({
      title: blocked
        ? "El bot está bloqueado en Telegram"
        : "No se pudo enviar el mensaje",
      description: blocked
        ? "Lo desconectamos. Volvé a conectarlo para recibir alertas."
        : undefined,
      color: "error",
    });
    if (blocked)
      await run(() => fetchAccount(token()), "No se pudo cargar tu cuenta");
  } finally {
    testing.value = false;
  }
}

async function disconnect() {
  if (
    await run(
      () => disconnectTelegram(token()),
      "No se pudo desconectar Telegram",
    )
  ) {
    toast.add({ title: "Telegram desconectado", color: "neutral" });
  }
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
            </div>
          </div>
        </UPageCard>

        <UPageCard
          title="Canales de aviso"
          description="Por dónde te avisamos cuando se detecta un foco en tus zonas. Las alertas también quedan siempre en la página Alertas."
          variant="subtle"
        >
          <div v-if="loading" class="space-y-6" aria-hidden="true">
            <div v-for="i in 3" :key="i" class="flex gap-3">
              <USkeleton class="size-5 rounded-full" />
              <div class="flex-1 space-y-2">
                <USkeleton class="h-4 w-24" />
                <USkeleton class="h-4 w-64 max-w-full" />
              </div>
            </div>
          </div>

          <div v-else-if="account" class="divide-default divide-y">
            <UAlert
              v-if="noChannel"
              icon="i-lucide-bell-off"
              color="warning"
              variant="subtle"
              title="No tenés ningún canal activo"
              description="Las alertas solo van a aparecer en la página Alertas. Activá el email o conectá Telegram para enterarte al momento."
              class="mb-5"
            />

            <!-- Email -->
            <section class="space-y-3 pb-5">
              <div class="flex items-start gap-3">
                <UIcon
                  name="i-lucide-mail"
                  class="text-muted mt-0.5 size-5 shrink-0"
                />
                <div class="min-w-0 flex-1">
                  <p class="text-highlighted font-medium">Email</p>
                  <p class="text-muted text-sm break-all">
                    {{ account.alert_email }}
                    <UBadge
                      v-if="!account.uses_account_email"
                      label="Confirmado"
                      color="success"
                      variant="subtle"
                      size="sm"
                      class="ms-1 align-middle"
                    />
                  </p>
                </div>
                <USwitch
                  :model-value="account.email_alerts"
                  :loading="togglingEmail"
                  aria-label="Avisos por email"
                  @update:model-value="toggleEmail"
                />
              </div>

              <div class="space-y-3 ps-8">
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
                    size="sm"
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
                    size="sm"
                    @click="useAccountEmail"
                  >
                    Volver a {{ user?.email }}
                  </UButton>
                </div>
              </div>
            </section>

            <!-- Telegram -->
            <section class="space-y-3 py-5">
              <div class="flex items-start gap-3">
                <UIcon
                  name="i-simple-icons-telegram"
                  class="mt-0.5 size-5 shrink-0 text-[#26A5E4]"
                />
                <div class="min-w-0 flex-1">
                  <p class="text-highlighted font-medium">Telegram</p>
                  <p class="text-muted text-sm">
                    <template v-if="account.telegram_connected">
                      Conectado como
                      <span class="text-highlighted">{{
                        account.telegram_name
                      }}</span>
                    </template>
                    <template v-else-if="account.telegram_available">
                      Recibí los avisos al instante en un chat con el bot de
                      AlertaFuego.
                    </template>
                    <template v-else>Todavía no está disponible.</template>
                  </p>
                </div>
                <UBadge
                  v-if="account.telegram_connected"
                  label="Conectado"
                  color="success"
                  variant="subtle"
                />
              </div>

              <div v-if="account.telegram_available" class="space-y-3 ps-8">
                <UAlert
                  v-if="telegramLink"
                  icon="i-lucide-loader-circle"
                  color="info"
                  variant="subtle"
                  title="Esperando a Telegram…"
                  description="En el chat con el bot, tocá Iniciar. Esta página se actualiza sola cuando quede conectado."
                  :ui="{ icon: 'animate-spin' }"
                  :actions="[
                    {
                      label: 'Abrir Telegram',
                      color: 'info',
                      variant: 'solid',
                      to: telegramLink,
                      target: '_blank',
                    },
                    {
                      label: 'Cancelar',
                      color: 'neutral',
                      variant: 'subtle',
                      onClick: cancelConnecting,
                    },
                  ]"
                  orientation="horizontal"
                />

                <div
                  v-else-if="account.telegram_connected"
                  class="flex flex-wrap gap-2"
                >
                  <UButton
                    color="neutral"
                    variant="subtle"
                    size="sm"
                    icon="i-lucide-send"
                    :loading="testing"
                    @click="testTelegram"
                  >
                    Enviar mensaje de prueba
                  </UButton>
                  <UButton
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    @click="disconnect"
                  >
                    Desconectar
                  </UButton>
                </div>

                <UButton
                  v-else
                  size="sm"
                  icon="i-simple-icons-telegram"
                  :loading="connecting"
                  @click="connectTelegram"
                >
                  Conectar Telegram
                </UButton>
              </div>
            </section>

            <!-- Phone: shown ahead of WhatsApp/SMS alerts, not stored yet. -->
            <section class="flex items-start gap-3 pt-5">
              <UIcon
                name="i-lucide-smartphone"
                class="text-muted mt-0.5 size-5 shrink-0"
              />
              <div class="min-w-0 flex-1 space-y-3">
                <div>
                  <p class="text-highlighted font-medium">
                    Teléfono
                    <UBadge
                      label="Próximamente"
                      color="neutral"
                      variant="subtle"
                      size="sm"
                      class="ms-1 align-middle"
                    />
                  </p>
                  <p class="text-muted text-sm">
                    Para recibir los avisos por WhatsApp o SMS.
                  </p>
                </div>
                <UInput
                  type="tel"
                  placeholder="+54 9 11 1234-5678"
                  icon="i-lucide-phone"
                  disabled
                  class="w-full max-w-xs"
                />
              </div>
            </section>
          </div>
        </UPageCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
