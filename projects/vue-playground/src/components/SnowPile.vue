<template>
  <div class="box">
    <canvas ref="c" class="snow" />
    <div class="content">Your content</div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useSnowPile } from "@/composables/useSnowPile";

const c = ref(null);

useSnowPile(c, {
  growRate: 0.05,
  maxHeight: 34,
  baseThickness: 10,
  clearRadius: 54,
  clearBand: 36,
});
</script>

<style scoped>
.box {
  position: relative;
  height: 320px;
  border-radius: 16px;
  background: #111;
  overflow: hidden;
}

.snow {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: auto;
}

.content {
  position: relative;
  z-index: 1;
  color: white;
  padding: 24px;
}
</style>
