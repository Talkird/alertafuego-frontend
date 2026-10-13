<template>
  <div class="grid min-h-screen lg:grid-cols-2">
    <!-- Tinted column + raised card: the form reads as one contained unit.
         Dark mode: the column keeps the default background (neutral 900)
         and the card is half a step lighter (an 850, mixed from 900 and 800,
         since there's no such shade). A full 800 card would match the border
         color and hide the dividers inside it. -->
    <div class="bg-elevated/70 dark:bg-default flex flex-col p-6 sm:p-10">
      <header class="flex items-center justify-between gap-4">
        <NuxtLink to="/" class="flex items-center gap-2">
          <img src="/icon.png" alt="" class="size-7" />
          <span class="text-highlighted font-semibold">AlertaFuego</span>
        </NuxtLink>

        <div class="flex items-center gap-1">
          <UButton
            to="/"
            color="neutral"
            variant="ghost"
            icon="i-lucide-arrow-left"
            size="sm"
          >
            Volver al inicio
          </UButton>
          <UColorModeButton size="sm" />
        </div>
      </header>

      <main class="flex flex-1 items-center justify-center py-10">
        <div
          class="bg-default ring-default w-full max-w-md rounded-xl p-6 shadow-sm ring sm:p-8 dark:bg-[color-mix(in_oklch,var(--ui-color-neutral-900),var(--ui-color-neutral-800))]"
        >
          <slot />
        </div>
      </main>
    </div>

    <!-- The subject itself rather than decoration: the country the system
         watches, as GOES-19 sees it. Desktop only. -->
    <figure class="relative hidden overflow-hidden lg:block">
      <img
        src="/images/argentina-satelite.jpg"
        alt="Imagen satelital de la Argentina"
        class="absolute inset-0 size-full object-cover"
      />
      <div
        class="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/70 to-transparent"
      />
      <figcaption class="absolute inset-x-10 bottom-10 max-w-md text-white">
        <p class="text-2xl leading-snug font-semibold text-balance">
          El satélite GOES-19 observa toda la Argentina cada 10 minutos.
        </p>
        <p class="mt-2 text-sm text-white/80">
          AlertaFuego analiza cada imagen para detectar focos de incendio y
          avisarte si aparecen cerca de tus zonas.
        </p>
        <p class="mt-6 text-xs text-white/60">
          Imagen: Esri, Maxar, Earthstar Geographics
        </p>
      </figcaption>
    </figure>
  </div>
</template>
