<script lang="ts" setup>
import {
  createReusableTemplate,
  useDocumentVisibility,
  useIntervalFn,
  useMediaQuery,
} from "@vueuse/core";
import type { LeafletMouseEvent, Map as LeafletMap } from "leaflet";
import type { BaseLayer, WeatherLayer } from "~/utils/mapLayers";
import type {
  Alert,
  AlertArea,
  AlertsTab,
  AreaDraft,
  SheetSnap,
  StoredDetection,
} from "~/types";

useSeoMeta({
  title: "Alertas",
  description:
    "Definí zonas de alerta y recibí un email cuando se detecte un foco de incendio dentro de ellas.",
});

const session = useSupabaseSession();
const user = useSupabaseUser();
const toast = useToast();

const AREA_COLOR = "#10b981";
const INACTIVE_AREA_COLOR = "#9ca3af";

// Desktop: side panel next to the map. Mobile: full-height map with a bottom
// sheet. The panel content is the same, defined once below.
const isDesktop = useMediaQuery("(min-width: 1024px)");
const [DefinePanel, ReusePanel] = createReusableTemplate();

const areas = ref<AlertArea[]>([]);
const alerts = ref<Alert[]>([]);
const loading = ref(true);

const tab = ref<AlertsTab>("alerts");
const sheet = ref<SheetSnap>("peek");

// The panel is in "form" mode while a zone is being created or edited. On
// mobile the form is split in two steps: the location (map under a fixed pin),
// then the details, so the keyboard never covers the map while picking.
const draft = ref<AreaDraft | null>(null);
const mobileStep = ref<"location" | "details">("details");
const saving = ref(false);
const areaToDelete = ref<AlertArea | null>(null);
const deleting = ref(false);

// Linked highlight between a zone's card and its circle on the map.
const hoveredAreaId = ref<number | null>(null);
const selectedAreaId = ref<number | null>(null);
const highlightedAreaId = computed(
  () => hoveredAreaId.value ?? selectedAreaId.value,
);

const baseLayer = ref<BaseLayer>("map");
const weatherLayer = ref<WeatherLayer | null>(null);
const showLegend = ref(false);

let map: LeafletMap | null = null;
const zoom = ref(4);
// A constant, not an inline array: vue-leaflet re-centers the map whenever the
// center prop changes identity, which would undo every fit and pan on re-render.
const INITIAL_CENTER: [number, number] = [-38.4161, -63.6167];

type DetectionMarker = { openPopup: () => void };
const markers: Record<number, DetectionMarker | null> = {};

// Zones store the address alerts are sent to; the session's is the fallback
// before any zone exists.
const alertEmail = computed(
  () => areas.value[0]?.email ?? user.value?.email ?? null,
);

const tabItems = computed(() => [
  {
    label: "Alertas",
    value: "alerts",
    icon: "i-lucide-bell-ring",
    badge: alerts.value.length || undefined,
  },
  {
    label: "Zonas",
    value: "zones",
    icon: "i-lucide-map-pin",
    badge: areas.value.length || undefined,
  },
]);

// Several areas can alert on the same detection - draw each one once.
const alertedDetections = computed(() => {
  const byId = new Map<number, StoredDetection>();
  for (const alert of alerts.value)
    byId.set(alert.detection.id, alert.detection);
  return [...byId.values()];
});

const pickingOnMobile = computed(
  () =>
    !isDesktop.value && draft.value !== null && mobileStep.value === "location",
);

function token(): string {
  return session.value!.access_token;
}

async function load() {
  if (!session.value) return;
  loading.value = true;
  try {
    [areas.value, alerts.value] = await Promise.all([
      fetchAlertAreas(token()),
      fetchAlerts(token()),
    ]);
    // Returning users come for the alerts; first-timers need to create a zone.
    tab.value = areas.value.length ? "alerts" : "zones";
  } catch {
    toast.add({ title: "No se pudieron cargar las alertas", color: "error" });
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await load();
  fitAreas();
});

// New alerts arrive while the page is open (each detection run raises them):
// check every minute while the tab is visible, and right away when coming back.
const ALERTS_POLL_MS = 60 * 1000;

async function pollAlerts() {
  if (!session.value || loading.value) return;
  try {
    const latest = await fetchAlerts(token());
    const known = new Set(alerts.value.map((a) => a.id));
    const fresh = latest.filter((a) => !known.has(a.id));
    alerts.value = latest;
    const first = fresh[0];
    if (!first) return;
    toast.add({
      title:
        fresh.length === 1
          ? `Nuevo foco en «${first.area_name}»`
          : `${fresh.length} focos nuevos en tus zonas`,
      description: "Tocá Ver para ver la imagen satelital o reportarlo.",
      icon: "i-lucide-flame",
      color: "warning",
      // A new fire in the user's zone: longer than the default 5 s.
      duration: 20000,
      actions: [
        {
          label: "Ver",
          onClick: () => {
            tab.value = "alerts";
            showAlert(first);
          },
        },
      ],
    });
  } catch {
    // Silent: the page keeps what it has, and the next poll retries.
  }
}

const { pause: pausePolling, resume: resumePolling } = useIntervalFn(
  pollAlerts,
  ALERTS_POLL_MS,
);
const visibility = useDocumentVisibility();
watch(visibility, (value) => {
  if (value !== "visible") return pausePolling();
  pollAlerts();
  resumePolling();
});

function onMapReady(leafletMap: LeafletMap) {
  map = leafletMap;
  fitAreas();
}

/** A zoom level that fits a circle of this radius on screen. */
function zoomForRadius(radiusKm: number): number {
  return Math.round(Math.min(11, Math.max(5, 11 - Math.log2(radiusKm / 5))));
}

/** Bounding box of a circle, in [[south, west], [north, east]] degrees. */
function circleBounds(lat: number, lon: number, radiusKm: number) {
  const dLat = radiusKm / 111.32;
  const dLon = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
  return [
    [lat - dLat, lon - dLon],
    [lat + dLat, lon + dLon],
  ] as [[number, number], [number, number]];
}

// Open on the user's zones rather than the whole continent, where a 25 km
// circle is barely visible. Runs once both the map and the zones are loaded.
function fitAreas() {
  if (!map || !areas.value.length) return;
  // The map is created inside <ClientOnly>, before the flex layout settles;
  // without this Leaflet fits to a stale container size.
  map.invalidateSize();
  const boxes = areas.value.map((a) => circleBounds(a.lat, a.lon, a.radius_km));
  map.fitBounds(
    [
      [
        Math.min(...boxes.map((b) => b[0][0])),
        Math.min(...boxes.map((b) => b[0][1])),
      ],
      [
        Math.max(...boxes.map((b) => b[1][0])),
        Math.max(...boxes.map((b) => b[1][1])),
      ],
    ],
    { padding: [32, 32], maxZoom: 11 },
  );
}

function focus(lat: number, lon: number, zoomLevel: number) {
  // One setView: changing the center and zoom separately dropped the pan
  // while the zoom animated.
  map?.setView([lat, lon], zoomLevel);
}

function focusArea(area: AlertArea) {
  selectedAreaId.value = area.id;
  focus(area.lat, area.lon, zoomForRadius(area.radius_km));
  if (!isDesktop.value) sheet.value = "peek";
}

function selectAreaOnMap(area: AlertArea) {
  if (draft.value) return;
  selectedAreaId.value = area.id;
  tab.value = "zones";
  if (!isDesktop.value) sheet.value = "half";
}

function newArea() {
  selectedAreaId.value = null;
  draft.value = {
    id: null,
    name: "",
    lat: null,
    lon: null,
    radius_km: 25,
    min_probability: 0.65,
  };
  if (!isDesktop.value) {
    mobileStep.value = "location";
    sheet.value = "peek";
    // The pin starts at the map's center; zoom in so the circle is visible.
    const center = map?.getCenter();
    if (center) {
      setDraftCenter(center.lat, center.lng);
      if (zoom.value < zoomForRadius(25) - 1) {
        focus(center.lat, center.lng, zoomForRadius(25));
      }
    }
  }
}

function editArea(area: AlertArea) {
  selectedAreaId.value = area.id;
  draft.value = {
    id: area.id,
    name: area.name,
    lat: area.lat,
    lon: area.lon,
    radius_km: area.radius_km,
    min_probability: area.min_probability,
  };
  focus(area.lat, area.lon, zoomForRadius(area.radius_km));
  if (!isDesktop.value) {
    mobileStep.value = "details";
    sheet.value = "full";
  }
}

function cancelDraft() {
  draft.value = null;
  sheet.value = "peek";
}

function setDraftCenter(lat: number, lon: number) {
  if (!draft.value) return;
  draft.value.lat = lat;
  draft.value.lon = lon;
}

// Desktop: the center is placed by clicking the map.
function onMapClick(event: LeafletMouseEvent) {
  if (!draft.value || !isDesktop.value) return;
  const firstPick = draft.value.lat === null;
  setDraftCenter(event.latlng.lat, event.latlng.lng);
  // Picked on a zoomed-out map, the new circle would be a speck: zoom in once.
  const fit = zoomForRadius(draft.value.radius_km);
  if (firstPick && zoom.value < fit - 1) {
    focus(event.latlng.lat, event.latlng.lng, fit);
  }
}

// Mobile: the center follows the map under a fixed pin, which is far more
// precise on a touchscreen than tapping a point.
function onMapMove() {
  if (!pickingOnMobile.value || !map) return;
  const center = map.getCenter();
  setDraftCenter(center.lat, center.lng);
}

function onLocate(lat: number, lon: number) {
  setDraftCenter(lat, lon);
  focus(lat, lon, zoomForRadius(draft.value?.radius_km ?? 25));
}

const { locating, locate } = useMyLocation();

function confirmLocation() {
  mobileStep.value = "details";
  sheet.value = "full";
}

function relocate() {
  if (!draft.value || draft.value.lat === null || draft.value.lon === null)
    return;
  mobileStep.value = "location";
  sheet.value = "peek";
  focus(draft.value.lat, draft.value.lon, zoomForRadius(draft.value.radius_km));
}

async function saveDraft() {
  const current = draft.value;
  if (!current || current.lat === null || current.lon === null) return;

  saving.value = true;
  const payload = {
    name: current.name.trim(),
    lat: current.lat,
    lon: current.lon,
    radius_km: current.radius_km,
    min_probability: current.min_probability,
  };
  try {
    let saved: AlertArea;
    if (current.id === null) {
      saved = await createAlertArea(payload, token());
      areas.value.push(saved);
      toast.add({
        title: "Zona creada",
        description:
          "Te vamos a avisar por email cuando se detecte un foco dentro de ella.",
        color: "success",
      });
    } else {
      saved = await updateAlertArea(current.id, payload, token());
      areas.value = areas.value.map((a) => (a.id === saved.id ? saved : a));
      toast.add({ title: "Zona actualizada", color: "success" });
    }
    draft.value = null;
    tab.value = "zones";
    // Show the new circle; on mobile the sheet stays low so it isn't covered.
    focusArea(saved);
  } catch {
    toast.add({ title: "No se pudo guardar la zona", color: "error" });
  } finally {
    saving.value = false;
  }
}

async function setActive(area: AlertArea, active: boolean) {
  try {
    const updated = await updateAlertArea(area.id, { active }, token());
    areas.value = areas.value.map((a) => (a.id === updated.id ? updated : a));
    // Pausing is easy to forget and silently stops the emails: say what it does.
    toast.add(
      active
        ? {
            title: "Avisos reanudados",
            description: `Te vamos a avisar de nuevo por focos en «${area.name}».`,
            color: "success",
          }
        : {
            title: "Avisos pausados",
            description: `No vas a recibir emails por «${area.name}» hasta que la reactives.`,
            color: "neutral",
          },
    );
  } catch {
    toast.add({ title: "No se pudo actualizar la zona", color: "error" });
  }
}

async function confirmDelete() {
  const area = areaToDelete.value;
  if (!area) return;

  deleting.value = true;
  try {
    await deleteAlertArea(area.id, token());
    areas.value = areas.value.filter((a) => a.id !== area.id);
    // The backend deletes the area's alerts along with it.
    alerts.value = alerts.value.filter((a) => a.area_id !== area.id);
    if (draft.value?.id === area.id) draft.value = null;
    if (selectedAreaId.value === area.id) selectedAreaId.value = null;
    areaToDelete.value = null;
    toast.add({ title: `Zona «${area.name}» eliminada`, color: "success" });
  } catch {
    toast.add({ title: "No se pudo eliminar la zona", color: "error" });
  } finally {
    deleting.value = false;
  }
}

function showAlert(alert: Alert) {
  if (!isDesktop.value) sheet.value = "peek";
  // Move without animating, so the popup opens where the marker ends up rather
  // than mid-pan. Opening it takes the user straight to the image and the
  // report form.
  map?.setView([alert.detection.lat, alert.detection.lon], 9, {
    animate: false,
  });
  markers[alert.detection.id]?.openPopup();
}
</script>

<template>
  <UDashboardPanel id="alerts" :ui="{ body: 'p-0 sm:p-0 gap-0' }">
    <template #header>
      <UDashboardNavbar title="Alertas">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            icon="i-lucide-plus"
            :disabled="draft !== null"
            @click="newArea"
          >
            Nueva zona
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <DefinePanel>
        <section v-if="draft" class="space-y-4">
          <h2 class="text-highlighted text-base font-semibold">
            {{ draft.id === null ? "Nueva zona" : "Editar zona" }}
          </h2>
          <AlertsAreaForm
            v-model="draft"
            :saving="saving"
            :relocatable="!isDesktop"
            @save="saveDraft"
            @cancel="cancelDraft"
            @locate="onLocate"
            @relocate="relocate"
          />
        </section>

        <template v-else>
          <UTabs
            v-model="tab"
            :items="tabItems"
            :content="false"
            variant="link"
            class="mb-4"
            :ui="{ list: 'w-full', trigger: 'flex-1' }"
          />

          <AlertsAlertList
            v-if="tab === 'alerts'"
            :alerts="alerts"
            :loading="loading"
            :has-zones="areas.length > 0"
            @select="showAlert"
            @create="newArea"
          />
          <AlertsZoneList
            v-else
            :areas="areas"
            :loading="loading"
            :email="alertEmail"
            :highlighted-id="highlightedAreaId"
            @create="newArea"
            @focus="focusArea"
            @edit="editArea"
            @remove="areaToDelete = $event"
            @toggle="setActive"
            @hover="hoveredAreaId = $event"
          />
        </template>
      </DefinePanel>

      <ClientOnly>
        <div class="relative h-full lg:flex" style="--sheet-peek: 11rem">
          <aside
            v-if="isDesktop"
            class="border-default w-96 shrink-0 overflow-y-auto border-r p-4"
          >
            <ReusePanel />
          </aside>

          <!-- On mobile the map stops above the peeking sheet, so its center
               (and the pin) and the attribution stay visible. -->
          <div
            :data-picking="draft && isDesktop ? '' : undefined"
            :class="
              isDesktop
                ? 'relative flex-1'
                : 'absolute inset-x-0 top-0 bottom-[calc(var(--sheet-peek)-1rem)]'
            "
          >
            <p
              v-if="draft && isDesktop"
              class="bg-default/90 ring-default text-highlighted pointer-events-none absolute top-3 left-1/2 z-[1000] -translate-x-1/2 rounded-lg px-3 py-1.5 text-sm shadow-sm ring"
            >
              Hacé click en el mapa para ubicar el centro
            </p>

            <LMap
              v-model:zoom="zoom"
              class="h-full w-full"
              :center="INITIAL_CENTER"
              :min-zoom="3"
              :max-bounds="[
                [-90, -180],
                [90, 180],
              ]"
              :max-bounds-viscosity="1.0"
              :use-global-leaflet="false"
              @ready="onMapReady"
              @click="onMapClick"
              @move="onMapMove"
            >
              <MapTileLayers :base="baseLayer" :weather="weatherLayer" />

              <LCircle
                v-for="area in areas"
                :key="area.id"
                :lat-lng="[area.lat, area.lon]"
                :radius="area.radius_km * 1000"
                :color="area.active ? AREA_COLOR : INACTIVE_AREA_COLOR"
                :fill-opacity="highlightedAreaId === area.id ? 0.2 : 0.08"
                :weight="highlightedAreaId === area.id ? 3 : 2"
                :interactive="!draft"
                @click="selectAreaOnMap(area)"
                @mouseover="hoveredAreaId = area.id"
                @mouseout="hoveredAreaId = null"
              />

              <LCircle
                v-if="draft && draft.lat !== null && draft.lon !== null"
                :lat-lng="[draft.lat, draft.lon]"
                :radius="draft.radius_km * 1000"
                :color="AREA_COLOR"
                :fill-opacity="0.15"
                :weight="2"
                dash-array="6 6"
                :interactive="false"
              />

              <MapDetectionMarker
                v-for="detection in alertedDetections"
                :key="detection.id"
                :ref="
                  (el) => (markers[detection.id] = el as DetectionMarker | null)
                "
                :detection="detection"
              />
            </LMap>

            <!-- Fixed pin for the mobile location step: its tip marks the
                 map's center. -->
            <UIcon
              v-if="pickingOnMobile"
              name="i-lucide-map-pin"
              class="text-primary pointer-events-none absolute top-1/2 left-1/2 z-[1000] size-10 -translate-x-1/2 -translate-y-full drop-shadow"
            />

            <div
              class="absolute top-3 right-3 z-[1000] flex flex-col items-end gap-2"
            >
              <MapLayerPicker
                v-model:base="baseLayer"
                v-model:weather="weatherLayer"
              />
              <UButton
                v-if="!isDesktop && (alertedDetections.length || weatherLayer)"
                color="neutral"
                variant="outline"
                icon="i-lucide-info"
                class="bg-default shadow-sm"
                :aria-pressed="showLegend"
                @click="showLegend = !showLegend"
              >
                Leyenda
              </UButton>
              <!-- Mobile: the legends are opt-in, so they don't cover the
                   small map. -->
              <div
                v-if="!isDesktop && showLegend"
                class="flex flex-col items-end gap-2"
              >
                <MapWeatherLegend v-if="weatherLayer" :layer="weatherLayer" />
                <MapLegend v-if="alertedDetections.length" />
              </div>
            </div>

            <div
              v-if="isDesktop"
              class="pointer-events-none absolute bottom-6 left-3 z-[1000] flex flex-col items-start gap-2"
            >
              <MapWeatherLegend v-if="weatherLayer" :layer="weatherLayer" />
              <MapLegend v-if="alertedDetections.length" />
            </div>
          </div>

          <AlertsBottomSheet v-if="!isDesktop" v-model="sheet">
            <!-- Location step: just enough sheet to explain and confirm. -->
            <div v-if="pickingOnMobile" class="space-y-3">
              <div class="flex items-start gap-2">
                <p class="text-highlighted flex-1 text-sm font-medium">
                  Mové el mapa hasta que el pin quede en el centro de tu zona
                </p>
                <UButton
                  size="sm"
                  color="neutral"
                  variant="link"
                  class="-me-2 -mt-1"
                  @click="cancelDraft"
                >
                  Cancelar
                </UButton>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <UButton
                  color="neutral"
                  variant="subtle"
                  icon="i-lucide-locate-fixed"
                  :loading="locating"
                  block
                  @click="locate(onLocate)"
                >
                  Mi ubicación
                </UButton>
                <UButton block @click="confirmLocation">
                  Usar esta ubicación
                </UButton>
              </div>
            </div>

            <ReusePanel v-else />
          </AlertsBottomSheet>
        </div>
      </ClientOnly>

      <UModal
        :open="areaToDelete !== null"
        title="Eliminar zona"
        :description="`Se eliminan la zona «${areaToDelete?.name}» y su historial de alertas.`"
        @update:open="(open: boolean) => !open && (areaToDelete = null)"
      >
        <template #footer>
          <div class="flex w-full justify-end gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              @click="areaToDelete = null"
            >
              Cancelar
            </UButton>
            <UButton color="error" :loading="deleting" @click="confirmDelete">
              Eliminar
            </UButton>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
