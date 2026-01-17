<template>
  <span class="word" :style="wordStyle">
    <span
      v-for="(char, i) in chars"
      :key="i"
      class="slot"
      :style="{ '--delay': `${i * delayMs}ms` }"
    >
      <span class="track" :style="trackStyle(char)">
        <span v-for="(c, k) in dialChars(char)" :key="k" class="cell">
          {{ c }}
        </span>
      </span>
    </span>
  </span>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  text: { type: String, default: "" },
  delayMs: { type: Number, default: 120 },
  durationMs: { type: Number, default: 420 },
  turns: { type: Number, default: 2 },
  charH: { type: Number, default: 64 },
});

const chars = computed(() => props.text.split(""));

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const alphaIndex = (c) => {
  const up = (c || "").toUpperCase();
  const idx = alphabet.indexOf(up);
  return idx < 0 ? 0 : idx;
};

function dialChars(target) {
  const idx = alphaIndex(target);
  const head = [];
  for (let t = 0; t < props.turns; t += 1) head.push(...alphabet);
  const tail = alphabet.slice(0, idx + 1);
  return [...head, ...tail];
}

function movePx(target) {
  const idx = alphaIndex(target);
  const steps = props.turns * alphabet.length + idx;
  return steps * props.charH;
}

const wordStyle = computed(() => ({
  "--dur": `${props.durationMs}ms`,
  "--h": `${props.charH}px`,
}));

function trackStyle(target) {
  return { "--move": `${movePx(target)}px` };
}
</script>

<style scoped>
.word {
  display: inline-flex;
  font-size: 64px;
}

/* 슬롯: 처음엔 안 보임 -> delay 후 나타남 */
.slot {
  position: relative;
  width: 1.15em;
  height: var(--h);
  overflow: hidden;
  display: inline-block;
  text-align: center;

  opacity: 0;
  transform: translateX(-0.18em);

  animation: appear 1ms steps(1, end) forwards;
  animation-delay: var(--delay);
}

/* 트랙: slot이 나타나는 순간부터 롤 시작 */
.track {
  display: block;
  will-change: transform;
  transform: translateY(0);

  animation: roll var(--dur) cubic-bezier(0.12, 0.85, 0.18, 1) forwards;
  animation-delay: var(--delay);
}

.cell {
  height: var(--h);
  line-height: var(--h);
  display: flex;
  align-items: center;
  justify-content: center;

  font-weight: 700;
  letter-spacing: -0.01em;
}

@keyframes appear {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes roll {
  to {
    transform: translateY(calc(var(--move) * -1));
  }
}
</style>
