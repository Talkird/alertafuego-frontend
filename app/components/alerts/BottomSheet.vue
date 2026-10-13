<script setup lang="ts">
// A persistent, non-modal bottom sheet over the map (mobile Alertas). UDrawer is
// a modal dialog (focus trap, portal), which doesn't suit a sheet that stays
// open while the user pans the map behind it.
import type { SheetSnap } from "~/types";

const snap = defineModel<SheetSnap>({ required: true });

const HEIGHTS: Record<SheetSnap, string> = {
  peek: "var(--sheet-peek)",
  half: "55%",
  full: "calc(100% - 2.5rem)",
};
const ORDER: SheetSnap[] = ["peek", "half", "full"];

const dragOffset = ref(0);
const dragging = ref(false);
let dragStartY = 0;

function onPointerDown(event: PointerEvent) {
  dragging.value = true;
  dragStartY = event.clientY;
  (event.target as HTMLElement).setPointerCapture(event.pointerId);
}

function onPointerMove(event: PointerEvent) {
  if (!dragging.value) return;
  dragOffset.value = event.clientY - dragStartY;
}

function onPointerUp() {
  if (!dragging.value) return;
  const moved = dragOffset.value;
  dragging.value = false;
  dragOffset.value = 0;
  // A tap on the handle cycles up; a drag of 40px or more moves one step.
  const index = ORDER.indexOf(snap.value);
  if (Math.abs(moved) < 8) {
    snap.value = ORDER[(index + 1) % ORDER.length]!;
  } else if (moved < -40) {
    snap.value = ORDER[Math.min(index + 1, ORDER.length - 1)]!;
  } else if (moved > 40) {
    snap.value = ORDER[Math.max(index - 1, 0)]!;
  }
}

const style = computed(() => ({
  height: `calc(${HEIGHTS[snap.value]} - ${dragOffset.value}px)`,
  transition: dragging.value ? "none" : "height 200ms ease-out",
}));
</script>

<template>
  <section
    class="bg-default ring-default absolute inset-x-0 bottom-0 z-[1001] flex flex-col rounded-t-2xl shadow-lg ring motion-reduce:transition-none"
    :style="style"
  >
    <button
      type="button"
      class="flex w-full shrink-0 cursor-grab touch-none justify-center py-2.5"
      :aria-label="snap === 'full' ? 'Achicar panel' : 'Agrandar panel'"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <span class="bg-accented h-1.5 w-10 rounded-full" />
    </button>

    <div class="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
      <slot />
    </div>
  </section>
</template>
