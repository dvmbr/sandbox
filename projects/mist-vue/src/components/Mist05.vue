<template>
  <div class="mist" ref="rootEl">
    <!-- Base mist (CSS motion only) -->
    <div
      v-for="b in blobs"
      :key="b.id"
      class="blob blob--base"
      :style="toStyleVars(b)"
    />

    <!-- Dense mist (JS motion, front) -->
    <div
      v-for="b in denseBlobs"
      :key="b.id"
      class="blob blob--dense"
      :style="toStyleVars(b)"
    />

    <!-- Controls -->
    <div class="controls">
      <label class="label">
        <span class="labelText">Mist color</span>
        <input
          class="color"
          type="color"
          v-model="baseHex"
          @input="applyBaseColor"
        />
      </label>

      <div class="btnRow">
        <button class="btn" type="button" @click="addDenseMist">
          + Add mist
        </button>
        <button class="btn" type="button" @click="deleteDenseMist">
          - Delete mist
        </button>
        <button class="btn" type="button" @click="clearDenseMist">Clear</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";

/* --------------------------------
  Refs / State
--------------------------------- */
const rootEl = ref(null);
const blobs = ref([]); // base (CSS only)
const denseBlobs = ref([]); // dense (JS)
const baseHex = ref("#b02020");

let nextId = 1;

/* --------------------------------
  Render helpers
--------------------------------- */
function toStyleVars(b) {
  return {
    "--w": b.w,
    "--h": b.h,
    "--x": b.x,
    "--y": b.y,
    "--a": b.a,
    "--s1": b.s1,
    "--s2": b.s2,
    "--s3": b.s3,
    "--s4": b.s4,
    "--s5": b.s5,

    /* base-only CSS drift vars (ignored by dense) */
    "--dx": b.dx ?? 0,
    "--dy": b.dy ?? 0,
    "--dur": b.dur ?? 18,
    "--delay": b.delay ?? 0,
  };
}

/* --------------------------------
  Utils
--------------------------------- */
function rand(min, max) {
  return min + Math.random() * (max - min);
}
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
function px(n) {
  return `${Math.round(n)}px`;
}
function parsePx(pxStr) {
  return Number(String(pxStr).replace("px", "")) || 0;
}
function getRootSize(el) {
  const r = el?.getBoundingClientRect();
  return { w: r?.width || 1, h: r?.height || 1 };
}
function radiiPercent(wPx, hPx, rootW, rootH) {
  return {
    rx: (wPx / 2 / Math.max(1, rootW)) * 100,
    ry: (hPx / 2 / Math.max(1, rootH)) * 100,
  };
}
function ellipseOverlap(a, b, rootW, rootH, padding = 1) {
  const ra = radiiPercent(a.wPx, a.hPx, rootW, rootH);
  const rb = radiiPercent(b.wPx, b.hPx, rootW, rootH);

  const dx = a.x - b.x;
  const dy = a.y - b.y;

  const rxSum = (ra.rx + rb.rx) * padding;
  const rySum = (ra.ry + rb.ry) * padding;

  const nx = dx / Math.max(1e-6, rxSum);
  const ny = dy / Math.max(1e-6, rySum);

  return nx * nx + ny * ny < 1;
}
function overlapsAny(candidate, others, rootW, rootH, padding = 1) {
  for (const o of others) {
    const oW = parsePx(o.w);
    const oH = parsePx(o.h);
    if (
      ellipseOverlap(
        {
          x: candidate.x,
          y: candidate.y,
          wPx: candidate.wPx,
          hPx: candidate.hPx,
        },
        { x: o.x, y: o.y, wPx: oW, hPx: oH },
        rootW,
        rootH,
        padding
      )
    ) {
      return true;
    }
  }
  return false;
}

/* --------------------------------
  Color -> CSS vars
--------------------------------- */
function hexToRgb(hex) {
  const h = String(hex).replace("#", "").trim();
  if (h.length !== 6) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}
function mix(a, b, t) {
  return Math.round(a + (b - a) * t);
}
function buildStopsFromBase(hex) {
  const { r, g, b } = hexToRgb(hex);
  const toWhite = (t) => ({
    r: mix(r, 255, t),
    g: mix(g, 255, t),
    b: mix(b, 255, t),
  });

  const c1 = toWhite(0.0);
  const c2 = toWhite(0.1);
  const c3 = toWhite(0.2);
  const c4 = toWhite(0.32);
  const c5 = toWhite(0.45);

  return {
    c1: `${c1.r}, ${c1.g}, ${c1.b}`,
    c2: `${c2.r}, ${c2.g}, ${c2.b}`,
    c3: `${c3.r}, ${c3.g}, ${c3.b}`,
    c4: `${c4.r}, ${c4.g}, ${c4.b}`,
    c5: `${c5.r}, ${c5.g}, ${c5.b}`,
  };
}
function applyBaseColor() {
  const root = rootEl.value;
  if (!root) return;

  const stops = buildStopsFromBase(baseHex.value);
  root.style.setProperty("--c1", stops.c1);
  root.style.setProperty("--c2", stops.c2);
  root.style.setProperty("--c3", stops.c3);
  root.style.setProperty("--c4", stops.c4);
  root.style.setProperty("--c5", stops.c5);
}

/* --------------------------------
  Stops
--------------------------------- */
function createBaseStops() {
  return {
    s1: Math.round(rand(0, 2)),
    s2: Math.round(rand(8, 14)),
    s3: Math.round(rand(55, 75)),
    s4: Math.round(rand(86, 95)),
    s5: 100,
  };
}
function createDenseStops() {
  return {
    s1: Math.round(rand(0, 1)),
    s2: Math.round(rand(5, 10)),
    s3: Math.round(rand(35, 55)),
    s4: Math.round(rand(70, 85)),
    s5: 100,
  };
}

/* --------------------------------
  Base mist generator (static placement)
  - avoids overlap
  - allows edges
  - BUT motion is CSS only (dx/dy/dur/delay)
--------------------------------- */
const BASE_EDGE_ALLOW = 0.22;

function minCenterDist(p, others) {
  if (others.length === 0) return Infinity;
  let best = Infinity;
  for (const o of others) {
    const dx = p.x - o.x;
    const dy = p.y - o.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < best) best = d;
  }
  return best;
}
function randEdgeBiased() {
  const t = Math.random();
  if (t < 0.25) return rand(-5, 15);
  if (t > 0.75) return rand(85, 105);
  return rand(0, 100);
}
function findEmptySpot(others, samples = 200) {
  let best = { x: rand(0, 100), y: rand(0, 100) };
  let bestScore = minCenterDist(best, others);

  for (let i = 0; i < samples; i++) {
    const p = { x: randEdgeBiased(), y: randEdgeBiased() };
    const score = minCenterDist(p, others);
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return best;
}

function buildBaseBlobDraft(shrink = 1) {
  const wPx = Math.round(rand(320, 560) * shrink);
  const hPx = Math.round(rand(240, 480) * shrink);

  return {
    id: nextId++,
    wPx,
    hPx,
    w: px(wPx),
    h: px(hPx),
    a: Number(rand(0.45, 0.85).toFixed(2)),
    x: 50,
    y: 50,

    /* CSS drift -> very gentle */
    dx: Number(rand(-18, 18).toFixed(2)),
    dy: Number(rand(-12, 12).toFixed(2)),
    dur: Number(rand(16, 28).toFixed(2)),
    delay: Number(rand(-18, 0).toFixed(2)),

    ...createBaseStops(),
  };
}

function placeBaseBlobSmart(others, rootW, rootH) {
  const padding = 0.8;
  const spotTries = 10;
  const shrinkSteps = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.32, 0.25];
  const jitterRange = 10;
  const jitterTries = 40;

  for (let sTry = 0; sTry < spotTries; sTry++) {
    const spot = findEmptySpot(others, 220);

    for (const shrink of shrinkSteps) {
      const draft = buildBaseBlobDraft(shrink);
      const { rx, ry } = radiiPercent(draft.wPx, draft.hPx, rootW, rootH);

      const minX = -rx * (1 - BASE_EDGE_ALLOW);
      const maxX = 100 + rx * (1 - BASE_EDGE_ALLOW);
      const minY = -ry * (1 - BASE_EDGE_ALLOW);
      const maxY = 100 + ry * (1 - BASE_EDGE_ALLOW);

      for (let k = 0; k < jitterTries; k++) {
        const x = clamp(spot.x + rand(-jitterRange, jitterRange), minX, maxX);
        const y = clamp(spot.y + rand(-jitterRange, jitterRange), minY, maxY);

        const candidate = {
          ...draft,
          x: Number(x.toFixed(2)),
          y: Number(y.toFixed(2)),
        };
        if (!overlapsAny(candidate, others, rootW, rootH, padding))
          return candidate;
      }
    }
  }
  return null;
}

function calculateTargetBySize(rootW, rootH) {
  const cell = 160;
  return Math.round((rootW / cell) * (rootH / cell));
}

function generateInitialMist() {
  const { w: rootW, h: rootH } = getRootSize(rootEl.value);

  const target = calculateTargetBySize(rootW, rootH);
  const init = [];
  let guard = 0;

  while (init.length < target && guard < target * 6) {
    const b = placeBaseBlobSmart(init, rootW, rootH);
    if (b) init.push(b);
    guard++;
  }

  blobs.value = init;
}

/* --------------------------------
  Dense mist generator (front)
  - ignores base mist overlap
  - avoids overlap among dense only (best effort)
  - allows edges
--------------------------------- */
function buildDenseDraft(rootW, rootH) {
  const wPx = Math.round(rand(220, 420));
  const hPx = Math.round(rand(160, 340));

  const { rx, ry } = radiiPercent(wPx, hPx, rootW, rootH);
  const edge = 0.15;

  return {
    id: nextId++,
    wPx,
    hPx,
    w: px(wPx),
    h: px(hPx),
    a: Number(rand(0.78, 1.0).toFixed(2)),
    minX: -rx * edge,
    maxX: 100 + rx * edge,
    minY: -ry * edge,
    maxY: 100 + ry * edge,
    x: 50,
    y: 50,
    ...createDenseStops(),
  };
}

function placeDenseBlobSmart(others, rootW, rootH) {
  const padding = 1.08;
  const tries = 160;

  let best = null;
  let bestScore = -1;

  function scorePoint(x, y, arr) {
    if (arr.length === 0) return Infinity;
    let m = Infinity;
    for (const o of arr) {
      const dx = x - o.x;
      const dy = y - o.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < m) m = d;
    }
    return m;
  }

  for (let i = 0; i < tries; i++) {
    const draft = buildDenseDraft(rootW, rootH);
    const x = clamp(rand(-10, 110), draft.minX, draft.maxX);
    const y = clamp(rand(-10, 110), draft.minY, draft.maxY);

    const candidate = {
      ...draft,
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
    };

    if (!overlapsAny(candidate, others, rootW, rootH, padding))
      return candidate;

    const score = scorePoint(candidate.x, candidate.y, others);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return best;
}

/* Dense controls + cap */
const DENSE_BATCH = 6;
const MAX_DENSE = 24;

function addDenseMist() {
  const { w: rootW, h: rootH } = getRootSize(rootEl.value);
  const next = [...denseBlobs.value];

  for (let i = 0; i < DENSE_BATCH; i++) {
    const b = placeDenseBlobSmart(next, rootW, rootH);
    if (b) next.push(b);
  }

  // cap -> remove oldest
  const overflow = Math.max(0, next.length - MAX_DENSE);
  if (overflow > 0) next.splice(0, overflow);

  denseBlobs.value = next;
  cleanupMotionForRemovedDense();
}

function deleteDenseMist() {
  denseBlobs.value = denseBlobs.value.slice(
    0,
    Math.max(0, denseBlobs.value.length - DENSE_BATCH)
  );
  cleanupMotionForRemovedDense();
}

function clearDenseMist() {
  denseBlobs.value = [];
  cleanupMotionForRemovedDense();
}

/* --------------------------------
  JS motion for DENSE only (30fps)
  - slow random walk direction change
  - mouse push (repel)
  - stop when hidden / out of viewport
--------------------------------- */
const motion = new Map(); // dense id -> state
const mouse = { px: 50, py: 50, inside: false };

let rafId = 0;
let lastTs = 0;
let lastStepMs = 0;

let removeMouseHandlers = null;
let io = null;
let inView = true;

function ensureDenseMotionState(blob) {
  if (motion.has(blob.id)) return motion.get(blob.id);

  const speedBase = rand(0.65, 1.15);
  const turnRate = rand(0.45, 0.85);
  const angle = rand(0, Math.PI * 2);

  const st = {
    vx: Math.cos(angle) * speedBase,
    vy: Math.sin(angle) * speedBase,
    tx: Math.cos(angle),
    ty: Math.sin(angle),
    turnRate,
    seed: rand(0, 1000),
  };

  motion.set(blob.id, st);
  return st;
}

function cleanupMotionForRemovedDense() {
  const alive = new Set(denseBlobs.value.map((b) => b.id));
  for (const id of motion.keys()) {
    if (!alive.has(id)) motion.delete(id);
  }
}

function setupMouseHandlers() {
  const el = rootEl.value;
  if (!el) return null;

  const onMove = (e) => {
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;

    mouse.px = (x / Math.max(1, r.width)) * 100;
    mouse.py = (y / Math.max(1, r.height)) * 100;
    mouse.inside = true;
  };

  const onLeave = () => {
    mouse.inside = false;
  };

  el.addEventListener("pointermove", onMove, { passive: true });
  el.addEventListener("pointerleave", onLeave, { passive: true });

  return () => {
    el.removeEventListener("pointermove", onMove);
    el.removeEventListener("pointerleave", onLeave);
  };
}

function setupInViewObserver() {
  const el = rootEl.value;
  if (!el) return null;

  io = new IntersectionObserver(
    ([entry]) => {
      inView = !!entry?.isIntersecting;
      if (inView) startDenseMotion();
      else stopDenseMotion();
    },
    { threshold: 0.05 }
  );

  io.observe(el);

  return () => {
    if (io) io.disconnect();
    io = null;
  };
}

function stepDense(blob, st, dt, rootW, rootH) {
  // dt in seconds

  // 1) random-walk target direction (slowly changes)
  st.seed += dt * 0.35;

  const n1 = Math.sin(st.seed * 1.7) + Math.sin(st.seed * 0.7 + 1.2);
  const n2 = Math.sin(st.seed * 1.3 + 2.4) + Math.sin(st.seed * 0.9 + 0.4);

  const nx = clamp(n1 * 0.5, -1, 1);
  const ny = clamp(n2 * 0.5, -1, 1);

  const tr = st.turnRate * dt;
  st.tx = st.tx + (nx - st.tx) * tr;
  st.ty = st.ty + (ny - st.ty) * tr;

  // 2) follow target direction gently
  const follow = 1.1;
  st.vx += st.tx * follow * dt;
  st.vy += st.ty * follow * dt;

  // 3) mouse push (dense only)
  if (mouse.inside) {
    const dx = blob.x - mouse.px;
    const dy = blob.y - mouse.py;
    const d2 = dx * dx + dy * dy;

    const radius = 22; // % units
    const r2 = radius * radius;

    if (d2 < r2) {
      const d = Math.sqrt(Math.max(1e-6, d2));
      const ux = dx / d;
      const uy = dy / d;

      const t = 1 - d / radius; // 0..1
      const push = 28 * t;

      st.vx += ux * push * dt;
      st.vy += uy * push * dt;
    }
  }

  // 4) damping + clamp speed
  const damping = 0.86;
  st.vx *= Math.pow(damping, dt * 60);
  st.vy *= Math.pow(damping, dt * 60);

  const maxSpeed = 8.0;
  const sp = Math.sqrt(st.vx * st.vx + st.vy * st.vy);
  if (sp > maxSpeed) {
    const k = maxSpeed / sp;
    st.vx *= k;
    st.vy *= k;
  }

  // 5) integrate position
  blob.x += st.vx * dt;
  blob.y += st.vy * dt;

  // 6) soft bounds (allow edges)
  const wPx = blob.wPx ?? parsePx(blob.w);
  const hPx = blob.hPx ?? parsePx(blob.h);

  const { rx, ry } = radiiPercent(wPx, hPx, rootW, rootH);
  const edge = 0.15;

  const minX = -rx * (1 - edge);
  const maxX = 100 + rx * (1 - edge);
  const minY = -ry * (1 - edge);
  const maxY = 100 + ry * (1 - edge);

  const bounce = 0.55;
  if (blob.x < minX) {
    blob.x = minX;
    st.vx = Math.abs(st.vx) * bounce;
  } else if (blob.x > maxX) {
    blob.x = maxX;
    st.vx = -Math.abs(st.vx) * bounce;
  }

  if (blob.y < minY) {
    blob.y = minY;
    st.vy = Math.abs(st.vy) * bounce;
  } else if (blob.y > maxY) {
    blob.y = maxY;
    st.vy = -Math.abs(st.vy) * bounce;
  }
}

/* 30fps limiter */
const TARGET_FRAME_MS = 1000 / 30;

function tickDense(ts) {
  // stop conditions
  if (document.hidden || !inView) {
    stopDenseMotion();
    return;
  }

  if (!lastTs) lastTs = ts;

  // 30fps cap
  if (ts - lastStepMs < TARGET_FRAME_MS) {
    rafId = requestAnimationFrame(tickDense);
    return;
  }

  const el = rootEl.value;
  if (!el) return;

  lastStepMs = ts;

  const { w: rootW, h: rootH } = getRootSize(el);
  const dt = clamp((ts - lastTs) / 1000, 0, 0.05);
  lastTs = ts;

  // update dense only
  for (const b of denseBlobs.value) {
    const st = ensureDenseMotionState(b);
    stepDense(b, st, dt, rootW, rootH);
  }

  cleanupMotionForRemovedDense();
  rafId = requestAnimationFrame(tickDense);
}

function startDenseMotion() {
  if (rafId) return;
  lastTs = 0;
  lastStepMs = 0;
  rafId = requestAnimationFrame(tickDense);
}

function stopDenseMotion() {
  if (!rafId) return;
  cancelAnimationFrame(rafId);
  rafId = 0;
  lastTs = 0;
  lastStepMs = 0;
}

/* tab visibility -> stop/start */
function onVisibilityChange() {
  if (document.hidden) stopDenseMotion();
  else if (inView) startDenseMotion();
}

/* --------------------------------
  Mount
--------------------------------- */
let cleanupInView = null;

onMounted(() => {
  generateInitialMist();
  applyBaseColor();

  removeMouseHandlers = setupMouseHandlers();
  cleanupInView = setupInViewObserver();

  document.addEventListener("visibilitychange", onVisibilityChange);

  // start only dense motion
  startDenseMotion();
});

onBeforeUnmount(() => {
  stopDenseMotion();

  if (removeMouseHandlers) removeMouseHandlers();
  if (cleanupInView) cleanupInView();

  document.removeEventListener("visibilitychange", onVisibilityChange);

  motion.clear();
});
</script>

<style scoped>
.mist {
  width: 100%;
  height: 60vh;
  background: #333;
  overflow: hidden;
  position: relative;

  /* fallback */
  --c1: 176, 32, 32;
  --c2: 186, 52, 52;
  --c3: 200, 84, 84;
  --c4: 216, 130, 130;
  --c5: 232, 170, 170;
}

.blob {
  position: absolute;
  left: calc(var(--x) * 1%);
  top: calc(var(--y) * 1%);

  /* base drift uses this transform only */
  transform: translate(-50%, -50%);
  width: var(--w);
  height: var(--h);
  border-radius: 999px;

  filter: blur(34px) contrast(110%);
  mix-blend-mode: normal;

  background: radial-gradient(
    closest-side,
    rgba(var(--c1), calc(var(--a) * 0.45)) calc(var(--s1) * 1%),
    rgba(var(--c2), calc(var(--a) * 0.28)) calc(var(--s2) * 1%),
    rgba(var(--c3), calc(var(--a) * 0.18)) calc(var(--s3) * 1%),
    rgba(var(--c4), calc(var(--a) * 0.15)) calc(var(--s4) * 1%),
    rgba(var(--c5), calc(var(--a) * 0.1)) calc(var(--s5) * 1%)
  );
}

/* Base mist -> CSS only motion (very light) */
.blob--base {
  animation: baseFloat var(--dur) ease-in-out var(--delay) infinite alternate;
  will-change: transform;
}

/* Dense mist -> JS motion only, keep animation off */
.blob--dense {
  z-index: 10;
  filter: blur(22px) contrast(125%);
}

/* gentle base drift */
@keyframes baseFloat {
  from {
    transform: translate(-50%, -50%) translate(0px, 0px);
  }
  to {
    transform: translate(-50%, -50%)
      translate(calc(var(--dx) * 1px), calc(var(--dy) * 1px));
  }
}

.controls {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;

  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

.label {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  background: rgba(255, 255, 255, 0.85);
}

.labelText {
  font-size: 13px;
}

.color {
  width: 34px;
  height: 26px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.btnRow {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  background: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  font-size: 13px;
}
</style>
