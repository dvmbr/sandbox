<template>
  <canvas ref="canvas" class="bg" />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const canvas = ref(null);
let ctx;
let w, h;
let rafId;

const DOT_COUNT = 80;
const SPEED_MIN = 0.2;
const SPEED_MAX = 0.8;

const dots = [];

function resize() {
  w = window.innerWidth;
  h = window.innerHeight;
  canvas.value.width = w * devicePixelRatio;
  canvas.value.height = h * devicePixelRatio;
  canvas.value.style.width = w + "px";
  canvas.value.style.height = h + "px";
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}

function createDot() {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    r: Math.random() * 1.5 + 0.5,
    v: Math.random() * (SPEED_MAX - SPEED_MIN) + SPEED_MIN,
  };
}

function init() {
  dots.length = 0;
  for (let i = 0; i < DOT_COUNT; i++) {
    dots.push(createDot());
  }
}

function loop() {
  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = "#fff";

  for (const d of dots) {
    d.y += d.v;

    if (d.y - d.r > h) {
      d.y = -d.r;
      d.x = Math.random() * w;
    }

    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fill();
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
  background: #000;
  z-index: -1;
}
</style>
