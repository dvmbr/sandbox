<template>
  <canvas ref="canvas" class="bg" />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const canvas = ref(null);
let ctx, w, h, rafId;

const dpr = window.devicePixelRatio || 1;

// config -> 함박눈 + 희미한 눈 결정
const SNOW_COUNT = 120;
const WIND = 0.25;

const snows = [];

function resize() {
  w = window.innerWidth;
  h = window.innerHeight;

  canvas.value.width = w * dpr;
  canvas.value.height = h * dpr;
  canvas.value.style.width = w + "px";
  canvas.value.style.height = h + "px";

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function createSnow() {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    r: Math.random() * 4 + 3,
    vy: Math.random() * 0.4 + 0.2,
    sway: Math.random() * Math.PI * 2,
    swaySpeed: Math.random() * 0.008 + 0.003,
    opacity: Math.random() * 0.4 + 0.4,
    rot: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.005,
  };
}

function init() {
  snows.length = 0;
  for (let i = 0; i < SNOW_COUNT; i++) {
    snows.push(createSnow());
  }
}

function drawSnow(s) {
  /*
   * Body -> soft fluffy snow
   */
  const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
  grad.addColorStop(0, `rgba(255,255,255,${s.opacity})`);
  grad.addColorStop(1, "rgba(255,255,255,0)");

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
  ctx.fill();

  /*
   * Crystal -> faint snowflake lines
   */
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.rot);
  ctx.strokeStyle = `rgba(255,255,255,${s.opacity * 0.35})`;
  ctx.lineWidth = 0.6;

  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    ctx.moveTo(0, 0);
    ctx.lineTo(0, s.r * 1.4);
    ctx.rotate(Math.PI / 3);
  }
  ctx.stroke();
  ctx.restore();
}

function loop() {
  ctx.clearRect(0, 0, w, h);

  for (const s of snows) {
    s.sway += s.swaySpeed;
    s.rot += s.rotSpeed;

    s.x += Math.sin(s.sway) * WIND;
    s.y += s.vy;

    if (s.y > h + 30) {
      s.y = -30;
      s.x = Math.random() * w;
    }

    drawSnow(s);
  }

  rafId = requestAnimationFrame(loop);
}

onMounted(() => {
  ctx = canvas.value.getContext("2d");
  resize();
  init();
  window.addEventListener("resize", resize);
  loop();
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
