<script setup lang="ts">
import type {
  ReportCategory,
  ReportCreate,
  ReportPublic,
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

const category = ref<ReportCategory>("other");
const comment = ref("");
const submitting = ref(false);
const showForm = ref(false);

function openForm() {
  if (myReport.value) {
    category.value = myReport.value.category;
    comment.value = myReport.value.comment ?? "";
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

function formatDate(iso: string): string {
  const utcIso = iso.endsWith("Z") ? iso : `${iso}Z`;
  return new Date(utcIso).toLocaleString("es-AR", { hour12: false });
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
      category: category.value,
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
      :icon="myReport ? 'i-lucide-pencil' : 'i-lucide-flag'"
      block
      @click.stop="openForm"
    >
      {{ myReport ? "Editar reporte" : "Reportar falso positivo" }}
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