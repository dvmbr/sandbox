<template>
  <span class="tw">
    <span class="tw-text">
      <span
        v-for="(ch, i) in renderedChars"
        :key="i"
        class="tw-ch"
        :class="{ accent: accentIndexesSet.has(i) }"
      >
        {{ ch }}
      </span>
    </span>

    <span
      v-if="cursor"
      class="tw-cursor"
      :class="{ blink: cursorBlink }"
      aria-hidden="true"
      >|</span
    >
  </span>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

/* -----------------------------
- Props
----------------------------- */
const props = defineProps({
  text: { type: String, default: "DVMBR" },

  /* typing */
  startDelay: { type: Number, default: 300 },
  minTypeMs: { type: Number, default: 40 },
  maxTypeMs: { type: Number, default: 90 },
  deleteMs: { type: Number, default: 25 },
  holdAfterType: { type: Number, default: 900 },
  holdAfterDelete: { type: Number, default: 350 },

  /* loop */
  loop: { type: Boolean, default: true },

  /* cursor */
  cursor: { type: Boolean, default: true },
  cursorBlink: { type: Boolean, default: true },

  /* highlight */
  accentIndexes: { type: Array, default: () => [] }, // e.g. [0, 1] to accent "DV"
});

/* -----------------------------
- State
----------------------------- */
const i = ref(0);
const mode = ref("typing"); // typing | holding | deleting
const rendered = ref("");

const accentIndexesSet = computed(() => new Set(props.accentIndexes));
const renderedChars = computed(() => rendered.value.split(""));

let t = null;

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clearTimer() {
  if (t) {
    clearTimeout(t);
    t = null;
  }
}

function schedule(fn, ms) {
  clearTimer();
  t = setTimeout(fn, ms);
}

function step() {
  const full = props.text;

  if (mode.value === "typing") {
    if (i.value < full.length) {
      i.value += 1;
      rendered.value = full.slice(0, i.value);
      schedule(step, rand(props.minTypeMs, props.maxTypeMs));
      return;
    }
    mode.value = "holding";
    schedule(step, props.holdAfterType);
    return;
  }

  if (mode.value === "holding") {
    mode.value = "deleting";
    schedule(step, props.deleteMs);
    return;
  }

  if (mode.value === "deleting") {
    if (i.value > 0) {
      i.value -= 1;
      rendered.value = full.slice(0, i.value);
      schedule(step, props.deleteMs);
      return;
    }

    if (!props.loop) return;

    mode.value = "typing";
    schedule(step, props.holdAfterDelete);
  }
}

function start() {
  i.value = 0;
  rendered.value = "";
  mode.value = "typing";
  schedule(step, props.startDelay);
}

onMounted(start);
onBeforeUnmount(clearTimer);

/* text 바뀌면 다시 시작 */
watch(
  () => props.text,
  () => start()
);
</script>

<style scoped>
.tw {
  display: inline-flex;
  align-items: baseline;
  gap: 0.06em;
}

.tw-text {
  display: inline-block;
}

.tw-ch {
  display: inline-block;
}

/* 강조 글자 */
.tw-ch.accent {
  font-weight: 700;
  text-shadow: 0 0 12px rgba(103, 255, 240, 0.35);
}

/* 커서 */
.tw-cursor {
  display: inline-block;
  transform: translateY(-0.03em);
  opacity: 0.9;
}

.tw-cursor.blink {
  animation: tw-blink 1s steps(1, end) infinite;
}

@keyframes tw-blink {
  0%,
  49% {
    opacity: 1;
  }
  50%,
  100% {
    opacity: 0;
  }
}
</style>
