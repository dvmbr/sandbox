<template>
  <div class="mist" ref="rootEl">
    <div
      v-for="b in blobs"
      :key="b.id"
      class="blob"
      :style="{
        '--w': b.w,
        '--h': b.h,
        '--x': b.x,
        '--y': b.y,
        '--a': b.a,
        '--s1': b.s1,
        '--s2': b.s2,
        '--s3': b.s3,
        '--s4': b.s4,
        '--s5': b.s5,
      }"
    />
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";

const rootEl = ref(null);
const blobs = ref([]);
let nextId = 1;

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function parsePx(px) {
  return Number(String(px).replace("px", "")) || 0;
}

/* Treat each blob as an ellipse in % space (based on its px size vs container size) */
function getRadiiPercent(blob, rootW, rootH) {
  const wPx = parsePx(blob.w);
  const hPx = parsePx(blob.h);

  const rx = (wPx / 2 / Math.max(1, rootW)) * 100;
  const ry = (hPx / 2 / Math.max(1, rootH)) * 100;

  return { rx, ry };
}

/*
  Ellipse overlap test in % space:
  overlap if (dx/(rxSum))^2 + (dy/(rySum))^2 < 1
*/
function isOverlapping(a, b, rootW, rootH, padding) {
  const ra = getRadiiPercent(a, rootW, rootH);
  const rb = getRadiiPercent(b, rootW, rootH);

  const dx = a.x - b.x;
  const dy = a.y - b.y;

  const rxSum = (ra.rx + rb.rx) * padding;
  const rySum = (ra.ry + rb.ry) * padding;

  const nx = dx / Math.max(1e-6, rxSum);
  const ny = dy / Math.max(1e-6, rySum);

  return nx * nx + ny * ny < 1;
}

function overlapsAny(candidate, others, rootW, rootH, padding) {
  for (const o of others) {
    if (isOverlapping(candidate, o, rootW, rootH, padding)) return true;
  }
  return false;
}

function createRandomBlob(id) {
  const w = Math.round(rand(260, 560));
  const h = Math.round(rand(200, 480));

  // Make sure stops are ordered and within 0..100
  const s1 = 0;
  const s2 = Math.round(rand(20, 30)); // was ~15%
  const s3 = Math.round(rand(35, 70)); // was ~60%
  const s4 = Math.round(rand(75, 95)); // was ~85%
  const s5 = 100;

  return {
    id,
    w: `${w}px`,
    h: `${h}px`,
    x: Number(rand(0, 100).toFixed(2)),
    y: Number(rand(0, 100).toFixed(2)),
    a: Number(rand(0.45, 0.85).toFixed(2)),

    // gradient stop positions (numbers)
    s1,
    s2,
    s3,
    s4,
    s5,
  };
}

function generateInitialMist() {
  const rect = rootEl.value?.getBoundingClientRect();
  const rootW = rect?.width || 1;
  const rootH = rect?.height || 1;

  const init = [];
  const target = 10;
  const maxTriesPerBlob = 800;
  const padding = 0.8;

  while (init.length < target) {
    let placed = false;

    for (let t = 0; t < maxTriesPerBlob; t++) {
      const candidate = createRandomBlob(nextId++);

      if (!overlapsAny(candidate, init, rootW, rootH, padding)) {
        init.push(candidate);
        placed = true;
        break;
      }
    }

    // If container is too small to fit 2 big blobs without overlap,
    // stop to keep the "no overlap" rule strict.
    if (!placed) break;
  }

  blobs.value = init;
}

onMounted(() => {
  generateInitialMist();
});
</script>

<style scoped>
.mist {
  width: 100%;
  height: 60vh;
  background: #ddd;
  overflow: hidden;
  position: relative;
}

.blob {
  position: absolute;
  left: calc(var(--x) * 1%);
  top: calc(var(--y) * 1%);
  transform: translate(-50%, -50%);

  width: var(--w);
  height: var(--h);
  border-radius: 999px;

  filter: blur(22px) contrast(120%);
  mix-blend-mode: normal;

  background: radial-gradient(
    closest-side,
    rgba(110, 10, 10, calc(var(--a) * 0.9)) 0%,
    rgba(130, 20, 20, calc(var(--a) * 0.75)) 15%,
    rgba(150, 40, 40, calc(var(--a) * 0.5)) 60%,
    rgba(170, 60, 60, calc(var(--a) * 0.4)) 85%,
    rgba(190, 70, 70, calc(var(--a) * 0.2)) 100%
  );
}
</style>
