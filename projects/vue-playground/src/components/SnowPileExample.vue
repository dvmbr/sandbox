<template>
  <div class="card">
    <h3>Winter Card</h3>
    <div class="pile">
      <SnowPile />
      haha
    </div>
  </div>
</template>

<script setup>
import SnowPile from "@/components/SnowPile.vue";
</script>

<style scoped>
.card {
  background: #111;
  padding: 40px;
  border-radius: 12px;
  color: white;
}

.pile {
  position: relative;
}
</style>
