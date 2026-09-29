<script setup lang="ts">
import type {
  ReportCategory,
  ReportCreate,
  ReportPublic,
  ReportVerdict,
  StoredDetection,
} from "~/types";

const props = defineProps<{
  detection: StoredDetection;
}>();

const user = useSupabaseUser();
const session = useSupabaseSession();
const toast = useToast();

const reports = ref<ReportPublic[]>([]);
const loadingReports = ref(true);
const myReport = ref<ReportPublic | null>(null);

const verdict = ref<ReportVerdict>("false_positive");
const category = ref<ReportCategory>("other");
const comment = ref("");
const submitting = ref(false);
const showForm = ref(false);
const showImageModal = ref(false);

const config = useRuntimeConfig();
const imageUrl = computed(
  () => `${config.public.apiBase}/detections/${props.detection.id}/image`,
);

function openForm() {
  if (myReport.value) {
    verdict.value = myReport.value.verdict;
    category.value = myReport.value.category ?? "other";
    comment.value = myReport.value.comment ?? "";
  } else {
    verdict.value = "false_positive";
    category.value = "other";
    comment.value = "";
  }
  showForm.value = true;
}

async function loadReports() {
  loadingReports.value = true;
  try {
    reports.value = await fetchReports(props.detection.id);
  } catch {
    reports.value = [];
  } finally {
    loadingReports.value = false;
  }
}

async function loadMyReport() {
  if (!session.value) {
    myReport.value = null;
    return;
  }
  myReport.value = await fetchMyReport(
    props.detection.id,
    session.value.access_token,
  );
}

onMounted(() => {
  loadReports();
  loadMyReport();
});

function toLocalDate(iso: string): Date {
  const utcIso = iso.endsWith("Z") ? iso : `${iso}Z`;
  return new Date(utcIso);
}

function formatFecha(iso: string): string {
  return toLocalDate(iso).toLocaleDateString("es-AR");
}

function formatHora(iso: string): string {
  return toLocalDate(iso).toLocaleTimeString("es-AR", { hour12: false });
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
    const payload: ReportCreate = {
      verdict: verdict.value,
      category: verdict.value === "false_positive" ? category.value : null,
      comment: comment.value || null,
    };
    const isEdit = !!myReport.value;

    myReport.value = isEdit
      ? await updateReport(
          props.detection.id,
          payload,
          session.value.access_token,
        )
      : await createReport(
          props.detection.id,
          payload,
          session.value.access_token,
        );

    toast.add({
      title: isEdit ? "Reporte actualizado" : "Reporte enviado",
      description: "Gracias por ayudar a mejorar las detecciones.",
      color: "success",
    });
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
      <span class="text-muted text-xs font-medium uppercase">Probabilidad</span>
      <UBadge variant="subtle">
        {{ (detection.probability * 100).toFixed(1) }}%
      </UBadge>
    </div>

    <p class="text-highlighted text-sm">
      Fecha: {{ formatFecha(detection.detected_at) }}
    </p>
    <p class="text-highlighted text-sm">
      Hora: {{ formatHora(detection.detected_at) }}
    </p>

    <UButton
      v-if="detection.has_image"
      size="xs"
      variant="subtle"
      color="neutral"
      icon="i-lucide-image"
      block
      @click.stop="showImageModal = true"
    >
      Ver imagen
    </UButton>

    <UModal v-model:open="showImageModal" title="Imagen satelital">
      <template #body>
        <img
          :src="imageUrl"
          alt="Imagen infrarroja de la detección"
          class="w-full rounded"
        />
      </template>
    </UModal>

    <div class="border-default border-t pt-2">
      <p class="text-muted mb-1.5 text-xs font-medium uppercase">
        Reportes ({{ detection.report_count }})
      </p>

      <p v-if="loadingReports" class="text-muted text-xs">Cargando…</p>

      <ul v-if="!loadingReports && reports.length" class="space-y-1.5">
        <li
          v-for="report in reports"
          :key="report.id"
          class="text-toned text-xs"
        >
          <span class="text-highlighted font-medium">{{
            report.verdict === "confirmed_fire"
              ? REPORT_VERDICT_LABELS.confirmed_fire
              : REPORT_CATEGORY_LABELS[report.category!]
          }}</span>
          <span v-if="report.comment"> — {{ report.comment }}</span>
        </li>
      </ul>
      <p v-else-if="!loadingReports" class="text-muted text-xs">
        Sin reportes todavía.
      </p>
    </div>

    <UButton
      v-show="!showForm"
      size="xs"
      variant="subtle"
      color="neutral"
      :icon="myReport ? 'i-lucide-pencil' : 'i-lucide-flag'"
      block
      @click.stop="openForm"
    >
      {{ myReport ? "Editar reporte" : "Reportar" }}
    </UButton>

    <div v-show="showForm" class="border-default space-y-2 border-t pt-2">
      <USelect
        v-model="verdict"
        :items="REPORT_VERDICT_OPTIONS"
        size="xs"
        class="w-full"
        :ui="{ content: 'min-w-48' }"
        @click.stop
      />
      <USelect
        v-if="verdict === 'false_positive'"
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
        autoresize
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
