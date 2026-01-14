<template>
  <div class="mist"></div>
</template>

<script setup></script>

<style scoped>
.mist {
  width: 100%;
  height: 60vh;
  background-color: #000;

  /* 큰 덩어리 여러 개 -> 부분마다 농도 다르게 */
  background-image: radial-gradient(
      260px 180px at 18% 30%,
      rgba(160, 30, 30, 0.22),
      rgba(160, 30, 30, 0) 70%
    ),
    radial-gradient(
      320px 240px at 62% 40%,
      rgba(160, 30, 30, 0.18),
      rgba(160, 30, 30, 0) 72%
    ),
    radial-gradient(
      240px 220px at 78% 70%,
      rgba(160, 30, 30, 0.16),
      rgba(160, 30, 30, 0) 68%
    ),
    radial-gradient(
      360px 260px at 40% 78%,
      rgba(160, 30, 30, 0.14),
      rgba(160, 30, 30, 0) 75%
    ),
    radial-gradient(
      280px 200px at 30% 55%,
      rgba(160, 30, 30, 0.12),
      rgba(160, 30, 30, 0) 70%
    );

  /* 선명한 원형 경계 없애기 */
  filter: blur(10px);
  opacity: 0.95;

  /* 흰 배경에서도 보이게 */
  mix-blend-mode: multiply;
}
</style>
