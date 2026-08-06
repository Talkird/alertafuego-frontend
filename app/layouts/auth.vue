<template>
  <div
    class="flex min-h-screen flex-col items-center justify-center gap-6 p-4"
  >
    <NuxtLink to="/" class="flex items-center gap-2">
      <img src="/icon.png" alt="AlertaFuego" class="size-8" />
      <span class="text-lg font-semibold text-highlighted">AlertaFuego</span>
    </NuxtLink>

    <div class="w-full max-w-sm">
      <slot />
    </div>
  </div>
</template>
