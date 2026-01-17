<template>
  <canvas ref="canvas" class="snow-layer" />
</template>

<script setup>
import { ref } from "vue";
import { useSnowAccumulation } from "@/composables/useSnowAccumulation";

const canvas = ref(null);

useSnowAccumulation(canvas, {
  fallSpeed: 0.7,
  accRate: 0.18,
});
</script>

<style scoped>
.snow-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
</style>
