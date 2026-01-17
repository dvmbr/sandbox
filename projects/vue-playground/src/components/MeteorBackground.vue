<template>
  <canvas ref="canvas" class="bg" />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const canvas = ref(null);
let ctx, w, h, rafId;

const dpr = window.devicePixelRatio || 1;

// config
const METEOR_INTERVAL = 900; // ms
const METEOR_BURST_MIN = 2;
const METEOR_BURST_MAX = 5;
const FADE_RATE = 0.012;

const meteors = [];
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

function createMeteor() {
  const angle = Math.PI * (0.25 + Math.random() * 0.12); // diagonal
  const speed = Math.random() * 6 + 8;

  return {
    x: Math.random() * w * 0.6,
    y: -80,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 1,
    length: Math.random() * 140 + 100,
  };
}

function spawnBurst() {
  const count =
    Math.floor(Math.random() * (METEOR_BURST_MAX - METEOR_BURST_MIN + 1)) +
    METEOR_BURST_MIN;

  for (let i = 0; i < count; i++) {
    meteors.push(createMeteor());
  }
}

function drawMeteor(m) {
  const tailX = m.x - m.vx * m.length * 0.06;
  const tailY = m.y - m.vy * m.length * 0.06;

  const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
  grad.addColorStop(0, `rgba(255,255,255,${m.life})`);
  grad.addColorStop(1, "rgba(255,255,255,0)");

  ctx.strokeStyle = grad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(m.x, m.y);
  ctx.lineTo(tailX, tailY);
  ctx.stroke();
}

function loop(ts) {
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(0, 0, w, h);

  if (ts - lastSpawn > METEOR_INTERVAL) {
    spawnBurst(); // 👈 한 번에 여러 개
    lastSpawn = ts;
  }

  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i];

    m.x += m.vx;
    m.y += m.vy;
    m.life -= FADE_RATE;

    drawMeteor(m);

    if (m.life <= 0 || m.x > w + 200 || m.y > h + 200) {
      meteors.splice(i, 1);
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
