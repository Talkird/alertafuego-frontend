<script setup lang="ts">
import type { ButtonProps, TimelineItem } from "@nuxt/ui";

definePageMeta({
  layout: "landing",
});

useSeoMeta({
  title: "Detección temprana de incendios",
  description:
    "AlertaFuego detecta focos de incendio en Argentina casi en tiempo real a partir de imágenes del satélite GOES-19 y un modelo de inteligencia artificial.",
});

const heroLinks: ButtonProps[] = [
  {
    label: "Ingresar al mapa",
    to: "/mapa",
    icon: "i-lucide-map",
    size: "xl",
  },
  {
    label: "Cómo funciona",
    to: "#como-funciona",
    color: "neutral",
    variant: "subtle",
    size: "xl",
  },
];

const features = [
  {
    icon: "i-lucide-satellite",
    title: "Imágenes GOES-19",
    description:
      "Se analizan las 16 bandas del sensor ABI del satélite geoestacionario GOES-19, que observa el continente de forma continua.",
  },
  {
    icon: "i-lucide-brain-circuit",
    title: "Modelo de inteligencia artificial",
    description:
      "Una red de segmentación, entrenada con los productos de incendios VIIRS como referencia, estima la probabilidad de fuego en cada píxel.",
  },
  {
    icon: "i-lucide-shield-check",
    title: "Cobertura nacional",
    description:
      "Las detecciones se limitan al polígono real del territorio argentino, lo que evita falsos positivos en países limítrofes.",
  },
  {
    icon: "i-lucide-map-pinned",
    title: "Mapa interactivo",
    description:
      "Los focos se visualizan sobre la cartografía del IGN y pueden filtrarse por fecha, probabilidad y cantidad de reportes.",
  },
  {
    icon: "i-lucide-message-square-warning",
    title: "Reportes colaborativos",
    description:
      "Cada usuario puede confirmar un incendio o señalarlo como falso positivo, indicando la causa: quema controlada, actividad industrial, reflejo solar, entre otras.",
  },
  {
    icon: "i-lucide-chart-column",
    title: "Panel de estadísticas",
    description:
      "La evolución de las detecciones puede consultarse por día, semana, mes o año, junto con el detalle de cada registro.",
  },
];

const steps: TimelineItem[] = [
  {
    title: "Captura",
    icon: "i-lucide-satellite",
    description:
      "El sensor ABI del GOES-19 registra el continente en 16 bandas espectrales, desde el visible hasta el infrarrojo térmico.",
  },
  {
    title: "Análisis",
    icon: "i-lucide-brain-circuit",
    description:
      "El modelo procesa la imagen más reciente y estima la probabilidad de que exista un foco activo en cada píxel.",
  },
  {
    title: "Registro",
    icon: "i-lucide-database",
    description:
      "Las detecciones dentro del territorio argentino se almacenan con su ubicación, probabilidad, hora de captura y una imagen de la banda infrarroja de 3,9 µm.",
  },
  {
    title: "Validación",
    icon: "i-lucide-badge-check",
    description:
      "Cada detección se publica en el mapa, donde los usuarios pueden confirmarla o señalarla como falso positivo mediante reportes.",
  },
];

const metrics = [
  { value: "16", label: "Bandas espectrales" },
  { value: "10 min", label: "Entre imágenes de disco completo" },
  { value: "2 km", label: "Resolución nominal en infrarrojo" },
  { value: "35.786 km", label: "Altitud de la órbita" },
];
</script>

<template>
  <div>
    <UPageHero
      description="AlertaFuego analiza imágenes del satélite GOES-19 con un modelo de inteligencia artificial para identificar focos de incendio en todo el territorio nacional, casi en tiempo real."
      :links="heroLinks"
    >
      <template #top>
        <div
          class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-2/3 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--ui-primary)_15%,transparent),transparent_70%)]"
        />
      </template>

      <template #title>
        Detección temprana de incendios
        <span class="text-primary">en Argentina</span>
      </template>
    </UPageHero>

    <UPageSection
      id="funcionalidades"
      headline="Funcionalidades"
      title="Información satelital al servicio de la prevención"
      description="Detección automática, visualización geográfica y validación colaborativa, reunidas en una sola plataforma."
      class="scroll-mt-(--ui-header-height)"
    >
      <UPageGrid>
        <UPageCard
          v-for="feature in features"
          :key="feature.title"
          v-bind="feature"
          spotlight
        />
      </UPageGrid>
    </UPageSection>

    <UPageSection
      id="como-funciona"
      headline="Cómo funciona"
      title="Del satélite al mapa"
      description="Cada análisis toma la imagen más reciente del GOES-19 y la procesa en etapas de captura, análisis y registro antes de llegar a los usuarios, quienes aportan la validación final mediante sus reportes."
      orientation="horizontal"
      class="scroll-mt-(--ui-header-height)"
    >
      <UTimeline :items="steps" :default-value="steps.length - 1" />
    </UPageSection>

    <UPageSection
      headline="La fuente de datos"
      title="El satélite detrás del sistema"
      description="GOES-19 es el satélite geoestacionario operativo de la NOAA sobre el continente americano. Su posición fija sobre el ecuador permite observar la Argentina de forma ininterrumpida."
    >
      <UPageGrid class="lg:grid-cols-4">
        <UPageCard
          v-for="metric in metrics"
          :key="metric.label"
          :title="metric.value"
          :description="metric.label"
          variant="subtle"
          :ui="{
            wrapper: 'items-center text-center',
            title: 'text-primary text-3xl font-bold',
          }"
        />
      </UPageGrid>
    </UPageSection>

    <UPageSection>
      <UPageCTA
        title="¿Quiere saber dónde hay focos activos en el país?"
        description="Ingrese con su cuenta de Google o mediante un enlace de acceso único para acceder al mapa y al panel de estadísticas."
        :links="[{ label: 'Comenzar gratis', to: '/mapa', size: 'xl' }]"
        variant="naked"
      />
    </UPageSection>
  </div>
</template>
