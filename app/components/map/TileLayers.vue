<script setup lang="ts">
import type { BaseLayer, WeatherLayer } from "~/utils/mapLayers";

defineProps<{
  base: BaseLayer;
  weather: WeatherLayer | null;
}>();

const owmApiKey = useRuntimeConfig().public.owmApiKey;
</script>

<template>
  <!-- af-tiles-ign: only this layer is color-inverted in dark mode (main.css);
       inverting satellite imagery would make it unreadable. -->
  <!-- IGN's tile server goes down or slows to a crawl at times (often at night),
       leaving the map blank. Esri's gray canvas goes underneath as a backdrop:
       IGN's opaque tiles cover it wherever they load. The base variant, without
       Esri's place labels (they name the Malvinas "Falkland Islands"). -->
  <LTileLayer
    v-if="base === 'map'"
    url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
    attribution="Base &amp;copy; Esri"
    layer-type="base"
    name="Mapa (Esri)"
    class-name="af-tiles-ign"
    :z-index="0"
    :options="{ maxNativeZoom: 16 }"
    no-wrap
  />
  <LTileLayer
    v-if="base === 'map'"
    url="https://wms.ign.gob.ar/geoserver/gwc/service/tms/1.0.0/capabaseargenmap@EPSG%3A3857@png/{z}/{x}/{-y}.png"
    attribution='&amp;copy; <a href="https://www.ign.gob.ar/">Instituto Geográfico Nacional</a>'
    layer-type="base"
    name="Argenmap (IGN)"
    class-name="af-tiles-ign"
    :z-index="1"
    no-wrap
  />
  <!-- Esri has zoom 18 only in some areas (cities); elsewhere in Argentina it
       returns a "Map data not yet available" tile. Zoom 17 is available
       nationwide, so request at most 17 and let Leaflet upscale beyond it. -->
  <LTileLayer
    v-else
    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
    attribution="Imágenes &amp;copy; Esri, Maxar, Earthstar Geographics"
    layer-type="base"
    name="Satélite (Esri)"
    :options="{ maxNativeZoom: 17 }"
    no-wrap
  />

  <!-- z-index keeps the overlay above the base layer, which is re-added (on
       top, by default) whenever the user switches between map and satellite. -->
  <LTileLayer
    v-if="weather && owmApiKey"
    :key="weather"
    :url="`https://tile.openweathermap.org/map/${weather}/{z}/{x}/{y}.png?appid=${owmApiKey}`"
    attribution='Clima &amp;copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>'
    layer-type="overlay"
    :opacity="0.75"
    :z-index="10"
  />
</template>
