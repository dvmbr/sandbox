<template>
  <div class="cursor-follower" ref="el" />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const el = ref(null);

let tx = 0,
  ty = 0,
  cx = 0,
  cy = 0;

let rafId = null;

const SPEED = 0.04; // follow speed (0 ~ 1)
const OFFSET = 24; // px

const onMove = (e) => {
  tx = e.clientX;
  ty = e.clientY;
};

const loop = () => {
  cx += (tx - cx) * SPEED;
  cy += (ty - cy) * SPEED;

  el.value.style.transform = `translate(${cx + OFFSET}px, ${
    cy + OFFSET
  }px) translate(-50%, -50%)`;
  rafId = requestAnimationFrame(loop);
};

onMounted(() => {
  window.addEventListener("mousemove", onMove);
  loop();
});

onUnmounted(() => {
  window.removeEventListener("mousemove", onMove);
  cancelAnimationFrame(rafId);
});
</script>

<style scoped>
.cursor-follower {
  position: fixed;
  top: 0;
  left: 0;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(255, 80, 80, 0.9);
  pointer-events: none;
  filter: blur(2px);
  z-index: 9999;
}
</style>
