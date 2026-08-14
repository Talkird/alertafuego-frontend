<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";

const supabase = useSupabaseClient();
const user = useSupabaseUser();

defineProps<{
  collapsed?: boolean;
}>();

async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error signing out:", error.message);
  } else {
    console.log("Signed out successfully");
    navigateTo("/login");
  }
}

const colorMode = useColorMode();

const displayUser = computed(() => ({
  name: user.value?.user_metadata?.full_name,
  avatar: {
    src: user.value?.user_metadata?.avatar_url || "/icon.png",
    alt: user.value?.email ?? "User avatar",
  },
}));

const items = computed<DropdownMenuItem[][]>(() => [
  [
    {
      type: "label",
      label: displayUser.value.name,
      avatar: displayUser.value.avatar,
    },
  ],
  [
    {
      label: "Configuración",
      icon: "i-lucide-settings",
    },
  ],
  [
    {
      label: "Apariencia",
      icon: "i-lucide-sun-moon",
      children: [
        {
          label: "Oscuro",
          icon: "i-lucide-moon",
          type: "checkbox",
          checked: colorMode.value === "dark",
          onUpdateChecked(checked: boolean) {
            if (checked) {
              colorMode.preference = "dark";
            }
          },
          onSelect(e: Event) {
            e.preventDefault();
          },
        },
        {
          label: "Claro",
          icon: "i-lucide-sun",
          type: "checkbox",
          checked: colorMode.value === "light",
          onSelect(e: Event) {
            e.preventDefault();

            colorMode.preference = "light";
          },
        },
      ],
    },
  ],

  [
    {
      label: "Repositorio de GitHub",
      icon: "i-simple-icons-github",
      to: "https://github.com/Talkird/alertafuego-frontend",
      target: "_blank",
    },
    {
      label: "Cerrar sesión",
      icon: "i-lucide-log-out",
      onClick: signOut,
    },
  ],
]);
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{
      content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)',
    }"
  >
    <UButton
      v-if="user"
      :avatar="displayUser.avatar"
      :label="collapsed ? undefined : displayUser.name"
      :trailing-icon="collapsed ? undefined : 'i-lucide-chevrons-up-down'"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :ui="{
        trailingIcon: 'text-dimmed',
      }"
    />

    <template #chip-leading="{ item }">
      <div class="inline-flex size-5 shrink-0 items-center justify-center">
        <span
          class="ring-bg size-2 rounded-full bg-(--chip-light) ring dark:bg-(--chip-dark)"
          :style="{
            '--chip-light': `var(--color-${(item as any).chip}-500)`,
            '--chip-dark': `var(--color-${(item as any).chip}-400)`,
          }"
        />
      </div>
    </template>
  </UDropdownMenu>
</template>
