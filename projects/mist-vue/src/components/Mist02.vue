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
        '--dx': b.dx,
        '--dy': b.dy,
      }"
    ></div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";

const rootEl = ref(null);

const blobs = ref([
  /* id, size, base position, intensity, per-blob drift seed */
  { id: 1, w: "320px", h: "240px", x: 18, y: 30, a: 0.9, dx: 0, dy: 0 },
  { id: 2, w: "420px", h: "320px", x: 62, y: 40, a: 0.75, dx: 0, dy: 0 },
  { id: 3, w: "320px", h: "300px", x: 78, y: 70, a: 0.65, dx: 0, dy: 0 },
  { id: 4, w: "520px", h: "420px", x: 40, y: 78, a: 0.55, dx: 0, dy: 0 },
  { id: 5, w: "420px", h: "320px", x: 30, y: 55, a: 0.5, dx: 0, dy: 0 },
]);

let raf = 0;

/* Random-walk helper */
function stepWalk(v, step, min, max) {
  v += (Math.random() - 0.5) * step;
  if (v < min) v = min;
  if (v > max) v = max;
  return v;
}

onMounted(() => {
  /* Each blob has its own drift state */
  const drift = blobs.value.map((b, i) => ({
    /* current offset in percentage points */
    dx: 0,
    dy: 0,
    /* each blob slightly different speed */
    step: 0.08 + i * 0.02,
    /* max drift distance from base */
    limit: 3.5 + i * 0.6,
  }));

  function loop() {
    for (let i = 0; i < blobs.value.length; i++) {
      const d = drift[i];
      d.dx = stepWalk(d.dx, d.step, -d.limit, d.limit);
      d.dy = stepWalk(d.dy, d.step, -d.limit, d.limit);

      blobs.value[i].dx = d.dx.toFixed(2);
      blobs.value[i].dy = d.dy.toFixed(2);
    }

    raf = requestAnimationFrame(loop);
  }

  loop();
});

onBeforeUnmount(() => {
  cancelAnimationFrame(raf);
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

/* Each blob is separated and moves with CSS vars updated by JS */
.blob {
  position: absolute;

  /* base position + per-blob drift offsets */
  left: calc(var(--x) * 1%);
  top: calc(var(--y) * 1%);
  transform: translate(
    calc(-50% + var(--dx) * 1%),
    calc(-50% + var(--dy) * 1%)
  );

  width: var(--w);
  height: var(--h);
  border-radius: 999px;

  /* Make it visible and deep */
  filter: blur(22px) contrast(120%);
  opacity: 1;
  mix-blend-mode: normal;

  background: radial-gradient(
    closest-side,
    rgba(110, 10, 10, calc(var(--a) * 0.9)),
    rgba(160, 30, 30, calc(var(--a) * 0.55)) 35%,
    rgba(190, 70, 70, calc(var(--a) * 0.25)) 60%,
    rgba(190, 70, 70, 0) 85%
  );
}
</style>
