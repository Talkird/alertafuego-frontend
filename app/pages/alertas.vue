<script lang="ts" setup>
import type { LeafletMouseEvent, Map as LeafletMap } from "leaflet";
import type { BaseLayer, WeatherLayer } from "~/utils/mapLayers";
import type { Alert, AlertArea, AreaDraft, StoredDetection } from "~/types";

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

const areas = ref<AlertArea[]>([]);
const alerts = ref<Alert[]>([]);
const loading = ref(true);

const draft = ref<AreaDraft | null>(null);
const saving = ref(false);
const areaToDelete = ref<AlertArea | null>(null);
const deleting = ref(false);

const center = ref<[number, number]>([-38.4161, -63.6167]);
const zoom = ref(4);
let map: LeafletMap | null = null;
const baseLayer = ref<BaseLayer>("map");
const weatherLayer = ref<WeatherLayer | null>(null);

// Zones store the address alerts are sent to; the session's is the fallback
// before any zone exists.
const alertEmail = computed(
  () => areas.value[0]?.email ?? user.value?.email ?? null,
);

type DetectionMarker = { openPopup: () => void };
const markers: Record<number, DetectionMarker | null> = {};

// Several areas can alert on the same detection - draw each one once.
const alertedDetections = computed(() => {
  const byId = new Map<number, StoredDetection>();
  for (const alert of alerts.value)
    byId.set(alert.detection.id, alert.detection);
  return [...byId.values()];
});

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

function onMapReady(leafletMap: LeafletMap) {
  map = leafletMap;
  fitAreas();
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

/** A zoom level that fits a circle of this radius on screen. */
function zoomForRadius(radiusKm: number): number {
  return Math.round(Math.min(11, Math.max(5, 11 - Math.log2(radiusKm / 5))));
}

function focus(lat: number, lon: number, zoomLevel: number) {
  // One setView: changing the center and zoom refs separately dropped the pan
  // while the zoom animated.
  map?.setView([lat, lon], zoomLevel);
}

function newArea() {
  draft.value = {
    id: null,
    name: "",
    lat: null,
    lon: null,
    radius_km: 25,
    min_probability: 0.65,
  };
}

function editArea(area: AlertArea) {
  draft.value = {
    id: area.id,
    name: area.name,
    lat: area.lat,
    lon: area.lon,
    radius_km: area.radius_km,
    min_probability: area.min_probability,
  };
  focus(area.lat, area.lon, zoomForRadius(area.radius_km));
}

function setDraftCenter(lat: number, lon: number) {
  if (!draft.value) return;
  draft.value.lat = lat;
  draft.value.lon = lon;
}

function onMapClick(event: LeafletMouseEvent) {
  if (!draft.value) return;
  const firstPick = draft.value.lat === null;
  setDraftCenter(event.latlng.lat, event.latlng.lng);
  // Picked on a zoomed-out map, the new circle would be a speck: zoom in once.
  const fit = zoomForRadius(draft.value.radius_km);
  if (firstPick && zoom.value < fit - 1) {
    focus(event.latlng.lat, event.latlng.lng, fit);
  }
}

function showAlert(alert: Alert) {
  // Move without animating, so the popup opens where the marker ends up rather
  // than mid-pan. Opening it takes the user straight to the image and the
  // report form.
  map?.setView([alert.detection.lat, alert.detection.lon], 9, {
    animate: false,
  });
  markers[alert.detection.id]?.openPopup();
}

function onLocate(lat: number, lon: number) {
  setDraftCenter(lat, lon);
  focus(lat, lon, zoomForRadius(draft.value?.radius_km ?? 25));
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
    if (current.id === null) {
      areas.value.push(await createAlertArea(payload, token()));
      toast.add({
        title: "Zona creada",
        description:
          "Te vamos a avisar por email cuando se detecte un foco dentro de ella.",
        color: "success",
      });
    } else {
      const updated = await updateAlertArea(current.id, payload, token());
      areas.value = areas.value.map((a) => (a.id === updated.id ? updated : a));
      toast.add({ title: "Zona actualizada", color: "success" });
    }
    draft.value = null;
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
    areaToDelete.value = null;
  } catch {
    toast.add({ title: "No se pudo eliminar la zona", color: "error" });
  } finally {
    deleting.value = false;
  }
}

function formatDateTime(iso: string): string {
  return parseUtc(iso).toLocaleString("es-AR", {
    hour12: false,
    dateStyle: "short",
    timeStyle: "short",
  });
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
      <div class="flex min-h-full shrink-0 flex-col lg:h-full lg:flex-row">
        <aside
          class="border-default order-2 space-y-6 p-4 lg:order-1 lg:w-96 lg:shrink-0 lg:overflow-y-auto lg:border-r"
        >
          <section v-if="draft" class="space-y-3">
            <h2 class="text-highlighted font-semibold">
              {{ draft.id === null ? "Nueva zona" : "Editar zona" }}
            </h2>
            <AlertsAreaForm
              v-model="draft"
              :saving="saving"
              @save="saveDraft"
              @cancel="draft = null"
              @locate="onLocate"
            />
          </section>

          <section class="space-y-3">
            <div>
              <h2 class="text-highlighted font-semibold">Mis zonas</h2>
              <p v-if="alertEmail" class="text-muted text-sm">
                Los avisos llegan a {{ alertEmail }}
              </p>
            </div>

            <p v-if="loading" class="text-muted text-sm">Cargando…</p>

            <UEmpty
              v-else-if="!areas.length && !draft"
              icon="i-lucide-bell"
              title="Todavía no tenés zonas"
              description="Creá una zona con un punto y un radio, y te avisamos por email cuando se detecte un foco dentro de ella."
              :actions="[
                {
                  label: 'Nueva zona',
                  icon: 'i-lucide-plus',
                  onClick: newArea,
                },
              ]"
            />

            <ul v-else class="space-y-2">
              <li
                v-for="area in areas"
                :key="area.id"
                class="border-default space-y-2 rounded-lg border p-3"
              >
                <div class="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    class="text-highlighted truncate text-left font-medium hover:underline"
                    @click="
                      focus(area.lat, area.lon, zoomForRadius(area.radius_km))
                    "
                  >
                    {{ area.name }}
                  </button>
                  <USwitch
                    :model-value="area.active"
                    :aria-label="
                      area.active ? 'Desactivar zona' : 'Activar zona'
                    "
                    @update:model-value="setActive(area, $event)"
                  />
                </div>

                <p class="text-muted text-xs">
                  Radio {{ area.radius_km }} km · Probabilidad ≥
                  {{ Math.round(area.min_probability * 100) }}%
                  <template v-if="!area.active"> · Pausada</template>
                </p>

                <div class="flex gap-1">
                  <UButton
                    size="xs"
                    color="neutral"
                    variant="subtle"
                    icon="i-lucide-pencil"
                    :disabled="draft !== null"
                    @click="editArea(area)"
                  >
                    Editar
                  </UButton>
                  <UButton
                    size="xs"
                    color="error"
                    variant="ghost"
                    icon="i-lucide-trash-2"
                    @click="areaToDelete = area"
                  >
                    Eliminar
                  </UButton>
                </div>
              </li>
            </ul>
          </section>

          <section class="space-y-3">
            <h2 class="text-highlighted font-semibold">Alertas recientes</h2>

            <p v-if="!loading && !alerts.length" class="text-muted text-sm">
              Todavía no hubo focos en tus zonas. Cuando se detecte uno, aparece
              acá y te llega un email.
            </p>

            <ul class="divide-default divide-y">
              <li v-for="alert in alerts" :key="alert.id">
                <button
                  type="button"
                  class="hover:bg-elevated/50 flex w-full items-center gap-3 rounded px-1 py-2 text-left"
                  @click="showAlert(alert)"
                >
                  <span
                    class="size-2.5 shrink-0 rounded-full"
                    :style="{
                      backgroundColor: detectionColor(
                        alert.detection.probability,
                      ),
                    }"
                  />
                  <span class="min-w-0 flex-1">
                    <span class="text-highlighted block truncate text-sm">
                      {{ alert.area_name }}
                    </span>
                    <span class="text-muted block text-xs tabular-nums">
                      {{ formatDateTime(alert.detection.image_time) }} ·
                      {{ Math.round(alert.detection.probability * 100) }}%
                    </span>
                  </span>
                  <UTooltip
                    :text="alert.emailed ? 'Email enviado' : 'Email no enviado'"
                  >
                    <UIcon
                      :name="
                        alert.emailed
                          ? 'i-lucide-mail-check'
                          : 'i-lucide-mail-x'
                      "
                      class="text-muted size-4 shrink-0"
                    />
                  </UTooltip>
                </button>
              </li>
            </ul>
            <p v-if="alerts.length" class="text-muted text-xs">
              Tocá una alerta para ver la imagen satelital o reportarla.
            </p>
          </section>
        </aside>

        <div
          class="relative order-1 h-80 shrink-0 lg:order-2 lg:h-auto lg:flex-1"
        >
          <p
            v-if="draft"
            class="bg-default/90 border-default text-highlighted pointer-events-none absolute top-3 left-1/2 z-[1000] -translate-x-1/2 rounded-lg border px-3 py-1.5 text-sm shadow"
          >
            Hacé click en el mapa para ubicar el centro
          </p>

          <LMap
            v-model:center="center"
            v-model:zoom="zoom"
            class="h-full w-full"
            :class="{ 'cursor-crosshair': draft }"
            :min-zoom="3"
            :max-bounds="[
              [-90, -180],
              [90, 180],
            ]"
            :max-bounds-viscosity="1.0"
            :use-global-leaflet="false"
            @ready="onMapReady"
            @click="onMapClick"
          >
            <MapTileLayers :base="baseLayer" :weather="weatherLayer" />

            <LCircle
              v-for="area in areas"
              :key="area.id"
              :lat-lng="[area.lat, area.lon]"
              :radius="area.radius_km * 1000"
              :color="area.active ? AREA_COLOR : INACTIVE_AREA_COLOR"
              :fill-opacity="0.08"
              :weight="2"
              :interactive="false"
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

          <MapLayerPicker
            v-model:base="baseLayer"
            v-model:weather="weatherLayer"
            class="absolute top-3 right-3 z-[1000]"
          />

          <div
            class="pointer-events-none absolute bottom-6 left-3 z-[1000] flex flex-col items-start gap-2"
          >
            <MapWeatherLegend v-if="weatherLayer" :layer="weatherLayer" />
            <MapLegend v-if="alertedDetections.length" />
          </div>
        </div>
      </div>

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
