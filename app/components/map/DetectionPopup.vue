<script setup lang="ts">
import type { ReportCategory, ReportPublic, StoredDetection } from "~/types";

const props = defineProps<{
  detection: StoredDetection;
}>();

const user = useSupabaseUser();
const session = useSupabaseSession();
const toast = useToast();

const reports = ref<ReportPublic[]>([]);
const loadingReports = ref(true);
const isMock = ref(false);

const category = ref<ReportCategory>("other");
const comment = ref("");
const submitting = ref(false);
const showForm = ref(false);

async function loadReports() {
  loadingReports.value = true;
  const result = await fetchReports(props.detection.id);
  reports.value = result.reports;
  isMock.value = result.isMock;
  loadingReports.value = false;
}

onMounted(loadReports);

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("es-AR");
}

async function submitReport() {
  if (!user.value || !session.value) {
    toast.add({
      title: "Iniciá sesión para reportar",
      description: "Necesitás una cuenta para reportar un falso positivo.",
      color: "warning",
    });
    return;
  }

  submitting.value = true;
  try {
    await createReport(
      props.detection.id,
      { category: category.value, comment: comment.value || null },
      session.value.access_token,
    );
    toast.add({
      title: "Reporte enviado",
      description: "Gracias por ayudar a mejorar las detecciones.",
      color: "success",
    });
    comment.value = "";
    category.value = "other";
    showForm.value = false;
    await loadReports();
  } catch {
    toast.add({
      title: "No se pudo enviar el reporte",
      color: "error",
    });
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="min-w-56 space-y-3 p-0.5">
    <div class="flex items-center justify-between gap-3">
      <span class="text-xs font-medium text-muted uppercase">Probabilidad</span>
      <UBadge variant="subtle">
        {{ (detection.probability * 100).toFixed(1) }}%
      </UBadge>
    </div>

    <p class="text-sm text-highlighted">{{ formatDate(detection.detected_at) }}</p>

    <div class="border-t border-default pt-2">
      <p class="mb-1.5 text-xs font-medium text-muted uppercase">
        Reportes ({{ detection.report_count }})
      </p>

      <p v-if="loadingReports" class="text-xs text-muted">Cargando…</p>

      <p v-else-if="isMock" class="text-xs text-warning">
        Sin conexión con el backend. Mostrando datos de ejemplo.
      </p>

      <ul v-if="!loadingReports && reports.length" class="space-y-1.5">
        <li
          v-for="report in reports"
          :key="report.id"
          class="text-xs text-toned"
        >
          <span class="font-medium text-highlighted">{{
            REPORT_CATEGORY_LABELS[report.category]
          }}</span>
          <span v-if="report.comment"> — {{ report.comment }}</span>
        </li>
      </ul>
      <p v-else-if="!loadingReports" class="text-xs text-muted">
        Sin reportes todavía.
      </p>
    </div>

    <UButton
      v-show="!showForm"
      size="xs"
      variant="subtle"
      color="neutral"
      icon="i-lucide-flag"
      block
      @click.stop="showForm = true"
    >
      Reportar falso positivo
    </UButton>

    <div v-show="showForm" class="space-y-2 border-t border-default pt-2">
      <USelect
        v-model="category"
        :items="REPORT_CATEGORY_OPTIONS"
        size="xs"
        class="w-full"
        :ui="{ content: 'min-w-48' }"
        @click.stop
      />
      <UTextarea
        v-model="comment"
        size="xs"
        placeholder="Comentario (opcional)"
        class="w-full"
        @click.stop
      />
      <div class="flex gap-1.5">
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          block
          @click.stop="showForm = false"
        >
          Cancelar
        </UButton>
        <UButton
          size="xs"
          block
          :loading="submitting"
          @click.stop="submitReport"
        >
          Enviar
        </UButton>
      </div>
    </div>
  </div>
</template>