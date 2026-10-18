<script setup lang="ts">
import type {
  ButtonProps,
  PricingPlanProps,
  TabsItem,
  TimelineItem,
} from "@nuxt/ui";

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
    trailingIcon: "i-lucide-arrow-right",
    to: "/mapa",
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
      "Una red de segmentación, entrenada con los productos de incendios VIIRS como referencia, estima la probabilidad de fuego en cada píxel del territorio argentino.",
  },
  {
    icon: "i-lucide-map-pinned",
    title: "Mapa interactivo",
    description:
      "Los focos se visualizan sobre la cartografía del IGN y pueden filtrarse por fecha, probabilidad y cantidad de reportes.",
  },
  {
    icon: "i-lucide-bell-ring",
    title: "Alertas por zona",
    description:
      "Marcá un punto y un radio, por ejemplo tu campo o tu localidad, y recibí un email cuando se detecte un foco dentro de esa zona.",
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
      "La evolución de las detecciones por día, semana, mes o año, y su distribución por provincia, departamento y hora del día.",
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

const user = useSupabaseUser();

type Billing = "monthly" | "yearly";
const billing = ref<Billing>("monthly");
const billingItems: TabsItem[] = [
  { label: "Mensual", value: "monthly" },
  { label: "Anual", value: "yearly" },
];

// No payments yet: every plan's button leads into the app (login first if needed).
const plans = computed<PricingPlanProps[]>(() => {
  const to = user.value ? "/mapa" : "/login";
  const yearly = billing.value === "yearly";
  const paid = (monthly: string, annual: string) => ({
    price: yearly ? annual : monthly,
    billingCycle: yearly ? "/año" : "/mes",
  });
  // Four plans side by side: let titles and features wrap instead of truncating.
  const ui = {
    root: "xl:p-8",
    titleWrapper: "flex-wrap gap-2",
    title: "whitespace-normal!",
    description: "xl:min-h-18",
    feature: "items-start",
    featureTitle: "whitespace-normal!",
  };
  const list: PricingPlanProps[] = [
    {
      title: "Comunidad",
      description:
        "Ciudadanía, brigadas, municipios pequeños, ONGs y academia.",
      price: "Gratis",
      features: [
        "Mapa nacional con todas las detecciones",
        "Filtros y reportes comunitarios",
        "Acceso público a la API de detecciones para usos sin fines de lucro",
      ],
      button: {
        label: "Empezar gratis",
        to,
        color: "neutral",
        variant: "subtle",
      },
    },
    {
      title: "Alerta",
      description: "Productores y propietarios rurales.",
      ...paid("USD 15", "USD 150"),
      features: [
        "Alertas por hasta 3 zonas",
        "Avisos por email, WhatsApp y Telegram",
        "Análisis de tus zonas",
        "Reportes exportables de tus zonas",
      ],
      button: {
        label: "Elegir Alerta",
        to,
        color: "neutral",
        variant: "subtle",
      },
    },
    {
      title: "Análisis",
      description:
        "Productores y empresas medianas, asesores técnicos y consultoras.",
      ...paid("USD 30", "USD 300"),
      features: [
        "Todo lo del plan Alerta",
        "Hasta 10 zonas de alerta",
        "Dashboard completo con filtros por provincia y departamento",
        "Reportes exportables",
      ],
      button: { label: "Elegir Análisis", to },
      badge: "Recomendado",
      highlight: true,
    },
    {
      title: "Organización",
      description:
        "Empresas agroforestales, de energía, aseguradoras y organismos públicos.",
      ...paid("USD 120", "USD 1.200"),
      features: [
        "Todo lo del plan Análisis",
        "Hasta 25 zonas de alerta",
        "Hasta 10 cuentas de usuario",
      ],
      button: {
        label: "Elegir Organización",
        to,
        color: "neutral",
        variant: "subtle",
      },
    },
  ];
  return list.map((plan) => ({ ...plan, ui }));
});
</script>

<template>
  <div>
    <UPageHero
      description="AlertaFuego analiza imágenes del satélite GOES-19 con un modelo de inteligencia artificial para identificar focos de incendio en todo el territorio nacional, casi en tiempo real."
      :links="heroLinks"
    >
      <template #top>
        <div
          class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--ui-primary)_15%,transparent),transparent_70%)]"
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
      description="Detección automática, mapa, alertas por email y validación colaborativa, en una sola plataforma."
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
      id="fuente-de-datos"
      headline="La fuente de datos"
      title="El satélite detrás del sistema"
      class="scroll-mt-(--ui-header-height)"
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
            root: 'hover:bg-elevated hover:ring-accented transition duration-200 motion-safe:hover:-translate-y-0.5',
            wrapper: 'items-center text-center',
            title: 'text-primary text-3xl font-bold',
          }"
        />
      </UPageGrid>
    </UPageSection>

    <UPageSection
      id="planes"
      headline="Planes"
      title="Un plan para cada necesidad"
      description="El mapa nacional es gratis para todos. Los planes pagos suman alertas y análisis para tus zonas y regiones."
      class="scroll-mt-(--ui-header-height)"
    >
      <div class="flex justify-center">
        <UTabs
          v-model="billing"
          :items="billingItems"
          :content="false"
          color="primary"
          size="sm"
          class="w-56"
        />
      </div>
      <UPricingPlans :plans="plans" class="xl:grid-cols-4" />
    </UPageSection>

    <UPageSection :ui="{ container: 'py-0 sm:py-0 lg:py-0' }">
      <UPageCTA
        title="¿Querés saber dónde hay focos activos en el país?"
        description="Ingresá con tu cuenta de Google o con un enlace de acceso por email para ver el mapa, las estadísticas y configurar tus alertas."
        :links="[
          {
            label: 'Ingresar al mapa',
            to: '/mapa',
            size: 'xl',
          },
        ]"
        variant="naked"
        :ui="{
          title: 'mx-auto max-w-xl text-balance',
          description: 'mx-auto max-w-xl text-balance',
        }"
      />
    </UPageSection>
  </div>
</template>
