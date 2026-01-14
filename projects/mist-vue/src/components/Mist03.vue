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
      }"
    ></div>

    <div class="controls">
      <button class="btn" @click="removeMist" :disabled="blobs.length <= MIN">
        Remove
      </button>

      <div class="count">{{ blobs.length }}</div>

      <button class="btn" @click="addMist">Add</button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";

const rootEl = ref(null);

const MIN = 5;
const blobs = ref([]);
let nextId = 1;

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function parsePx(px) {
  return Number(String(px).replace("px", "")) || 0;
}

/* -----------------------------
  Blob -> Ellipse in px space
----------------------------- */
function getEllipsePx(blob, rootW, rootH) {
  const w = parsePx(blob.w);
  const h = parsePx(blob.h);

  const cx = (blob.x / 100) * rootW;
  const cy = (blob.y / 100) * rootH;

  const rx = w / 2;
  const ry = h / 2;

  return { cx, cy, rx, ry };
}

function ellipseBBox(e) {
  return {
    left: e.cx - e.rx,
    right: e.cx + e.rx,
    top: e.cy - e.ry,
    bottom: e.cy + e.ry,
  };
}

function bboxIntersects(b1, b2) {
  return !(
    b2.left >= b1.right ||
    b2.right <= b1.left ||
    b2.top >= b1.bottom ||
    b2.bottom <= b1.top
  );
}

function isPointInEllipse(x, y, e) {
  const nx = (x - e.cx) / Math.max(1e-9, e.rx);
  const ny = (y - e.cy) / Math.max(1e-9, e.ry);
  return nx * nx + ny * ny <= 1;
}

/* -----------------------------
  2-phase overlap check

  Phase 1 (cheap) ->
  - bbox must intersect
  - centers must be "near" enough (expanded by padding)
  If not near -> skip expensive area calc.

  Phase 2 (expensive) ->
  - approximate overlap area by grid sampling
  - compare overlap ratio vs threshold
----------------------------- */
function ellipseAreaPx2(e) {
  return Math.PI * e.rx * e.ry;
}

function ellipseOverlapAreaPx2(e1, e2, stepsX = 110, stepsY = 110) {
  const left = Math.max(e1.cx - e1.rx, e2.cx - e2.rx);
  const right = Math.min(e1.cx + e1.rx, e2.cx + e2.rx);
  const top = Math.max(e1.cy - e1.ry, e2.cy - e2.ry);
  const bottom = Math.min(e1.cy + e1.ry, e2.cy + e2.ry);

  if (right <= left || bottom <= top) return 0;

  const boxW = right - left;
  const boxH = bottom - top;

  const dx = boxW / stepsX;
  const dy = boxH / stepsY;

  let insideBoth = 0;
  const total = stepsX * stepsY;

  for (let iy = 0; iy < stepsY; iy++) {
    const y = top + (iy + 0.5) * dy;
    for (let ix = 0; ix < stepsX; ix++) {
      const x = left + (ix + 0.5) * dx;
      if (isPointInEllipse(x, y, e1) && isPointInEllipse(x, y, e2))
        insideBoth++;
    }
  }

  return (insideBoth / total) * boxW * boxH;
}

/*
  Cheap "near" test -> if centers are far beyond summed radii, they can't overlap much.
  nearPadding > 1 makes it more conservative (more pairs go to phase2).
*/
function isNearEnough(e1, e2, nearPadding = 1.25) {
  const dx = Math.abs(e1.cx - e2.cx);
  const dy = Math.abs(e1.cy - e2.cy);

  // If far on x or y beyond radii sum -> not near
  const nearX = dx <= (e1.rx + e2.rx) * nearPadding;
  const nearY = dy <= (e1.ry + e2.ry) * nearPadding;

  return nearX && nearY;
}

/*
  Returns true if overlap area ratio >= overlapRatioLimit
  overlapRatio = overlapArea / min(area1, area2)
*/
function isOverlappingByArea2Phase(a, b, rootW, rootH, opts) {
  const {
    overlapRatioLimit = 0.06,
    nearPadding = 1.25,
    stepsX = 110,
    stepsY = 110,
  } = opts || {};

  const e1 = getEllipsePx(a, rootW, rootH);
  const e2 = getEllipsePx(b, rootW, rootH);

  // Phase 1 -> bbox + near-only filter
  const bb1 = ellipseBBox(e1);
  const bb2 = ellipseBBox(e2);

  if (!bboxIntersects(bb1, bb2)) return false;
  if (!isNearEnough(e1, e2, nearPadding)) return false;

  // Phase 2 -> expensive overlap area
  const overlap = ellipseOverlapAreaPx2(e1, e2, stepsX, stepsY);
  if (overlap <= 0) return false;

  const a1 = ellipseAreaPx2(e1);
  const a2 = ellipseAreaPx2(e2);
  const denom = Math.max(1e-9, Math.min(a1, a2));

  const ratio = overlap / denom;
  return ratio >= overlapRatioLimit;
}

function overlapsAny2Phase(candidate, others, rootW, rootH, opts) {
  for (const o of others) {
    if (isOverlappingByArea2Phase(candidate, o, rootW, rootH, opts))
      return true;
  }
  return false;
}

/* -----------------------------
  Blob creation + placement
----------------------------- */
function createRandomBlob(id) {
  return {
    id,
    w: `${Math.round(rand(260, 560))}px`,
    h: `${Math.round(rand(200, 480))}px`,
    x: Number(rand(10, 90).toFixed(2)),
    y: Number(rand(15, 90).toFixed(2)),
    a: Number(rand(0.45, 0.85).toFixed(2)),
  };
}

/*
  Place a blob with 2-phase overlap rule.
  - tries many candidates
  - relax overlapRatioLimit slightly if packed (optional steps)
*/
function findNonOverlappingBlob(others, rootW, rootH) {
  const steps = [
    { overlapRatioLimit: 0.05, tries: 260 }, // stricter (less overlap allowed)
    { overlapRatioLimit: 0.06, tries: 260 },
    { overlapRatioLimit: 0.08, tries: 260 },
    { overlapRatioLimit: 0.1, tries: 260 }, // more permissive when crowded
  ];

  const shared = {
    nearPadding: 1.25, // Phase1 filter aggressiveness (bigger -> more Phase2 checks)
    stepsX: 110, // Phase2 accuracy/perf
    stepsY: 110,
  };

  for (const step of steps) {
    for (let i = 0; i < step.tries; i++) {
      const candidate = createRandomBlob(nextId++);
      const opts = { ...shared, overlapRatioLimit: step.overlapRatioLimit };

      if (!overlapsAny2Phase(candidate, others, rootW, rootH, opts)) {
        return candidate;
      }
    }
  }

  // Fallback -> always add (no hard fail)
  return createRandomBlob(nextId++);
}

function generateInitialBlobs() {
  const rect = rootEl.value?.getBoundingClientRect();
  const rootW = rect?.width || 1;
  const rootH = rect?.height || 1;

  const initial = [];
  while (initial.length < MIN) {
    const b = findNonOverlappingBlob(initial, rootW, rootH);
    initial.push(b);
  }

  blobs.value = initial;
}

function addMist() {
  const rect = rootEl.value?.getBoundingClientRect();
  const rootW = rect?.width || 1;
  const rootH = rect?.height || 1;

  const b = findNonOverlappingBlob(blobs.value, rootW, rootH);
  blobs.value.push(b);
}

function removeMist() {
  if (blobs.value.length <= MIN) return;
  blobs.value.pop();
}

onMounted(() => {
  generateInitialBlobs();
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
    rgba(110, 10, 10, calc(var(--a) * 0.9)),
    rgba(160, 30, 30, calc(var(--a) * 0.55)) 35%,
    rgba(190, 70, 70, calc(var(--a) * 0.25)) 60%,
    rgba(190, 70, 70, 0) 85%
  );
}

.controls {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 14px;

  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.btn {
  border: 1px solid rgba(0, 0, 0, 0.18);
  background: rgba(255, 255, 255, 0.85);
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.count {
  font-size: 13px;
  opacity: 0.8;
}
</style>
