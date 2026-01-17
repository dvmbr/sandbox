<template>
  <canvas ref="canvas" class="bg" />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const canvas = ref(null);
let ctx, w, h, rafId;

const dpr = window.devicePixelRatio || 1;

// config
const FOG_INTERVAL = 700; // ms
const FOG_BURST_MIN = 2;
const FOG_BURST_MAX = 5;
const FADE_RATE = 0.008;
const EXPAND_RATE = 0.15;

const fogs = [];
let lastSpawn = 0;

function resize() {
  w = window.innerWidth;
  h = window.innerHeight;

  canvas.value.width = w * dpr;
  canvas.value.height = h * dpr;
  canvas.value.style.width = w + "px";
  canvas.value.style.height = h + "px";

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function createFog() {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    r: Math.random() * 20 + 10,
    vr: Math.random() * EXPAND_RATE + 0.05,
    life: 1,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
  };
}

function spawnFogBurst() {
  const count =
    Math.floor(Math.random() * (FOG_BURST_MAX - FOG_BURST_MIN + 1)) +
    FOG_BURST_MIN;

  for (let i = 0; i < count; i++) {
    fogs.push(createFog());
  }
}

function drawFog(f) {
  const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
  grad.addColorStop(0, `rgba(255,255,255,${f.life * 0.18})`);
  grad.addColorStop(1, "rgba(255,255,255,0)");

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
  ctx.fill();
}

function loop(ts) {
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(0, 0, w, h);

  if (ts - lastSpawn > FOG_INTERVAL) {
    spawnFogBurst();
    lastSpawn = ts;
  }

  for (let i = fogs.length - 1; i >= 0; i--) {
    const f = fogs[i];

    f.x += f.vx;
    f.y += f.vy;
    f.r += f.vr;
    f.life -= FADE_RATE;

    drawFog(f);

    if (f.life <= 0) {
      fogs.splice(i, 1);
    }
  }

  rafId = requestAnimationFrame(loop);
}

onMounted(() => {
  ctx = canvas.value.getContext("2d");
  resize();
  window.addEventListener("resize", resize);
  rafId = requestAnimationFrame(loop);
});

onUnmounted(() => {
  window.removeEventListener("resize", resize);
  cancelAnimationFrame(rafId);
});
</script>

<style scoped>
.bg {
  background: black;
  z-index: -1;
}
</style>
