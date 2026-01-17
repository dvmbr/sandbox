<template>
  <div class="wrap">
    <svg ref="svgEl" class="mark" viewBox="0 0 220 140" aria-hidden="true">
      <!-- Left 1 -> D spine -->
      <path ref="spineEl" class="stroke" d="M70 25 L70 115" />

      <!-- Right 1 -> stays, stretches, shifts (does NOT disappear) -->
      <path ref="rightEl" class="stroke" d="M130 25 L130 115" />

      <!-- D bowl -> drawn in (this is what makes it look like the right "1" bent) -->
      <path
        ref="bowlEl"
        class="stroke bowl"
        d="M70 25 C165 25, 165 115, 70 115"
      />
    </svg>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from "vue";
import gsap from "gsap";

const svgEl = ref(null);
const spineEl = ref(null);
const rightEl = ref(null);
const bowlEl = ref(null);

let tl;

function prepStrokeDraw(pathEl) {
  const len = pathEl.getTotalLength();
  pathEl.style.strokeDasharray = `${len}`;
  pathEl.style.strokeDashoffset = `${len}`;
  return len;
}

onMounted(() => {
  const bowlLen = prepStrokeDraw(bowlEl.value);

  // initial states
  gsap.set([spineEl.value, rightEl.value, bowlEl.value], {
    transformOrigin: "50% 50%",
  });

  gsap.set(bowlEl.value, { opacity: 0 }); // curve hidden initially

  // Right "1" starts clearly visible
  gsap.set(rightEl.value, {
    x: 0,
    y: 0,
    scaleY: 1,
    scaleX: 1,
    opacity: 1,
  });

  tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  tl
    /* Phase 1 -> tiny settle (optional) */
    .to(svgEl.value, { duration: 0.08, scale: 1.01 }, 0)
    .to(svgEl.value, { duration: 0.12, scale: 1 }, 0.08)

    /* Phase 2 -> right "1" stretches a bit and shifts left to "attach" */
    .to(
      rightEl.value,
      {
        duration: 0.45,
        x: -55, // move toward spine (70 vs 130 -> 60px gap)
        scaleY: 1.14, // stretch (feels like it is preparing to bend)
        ease: "power2.out",
      },
      0.05
    )

    /* Phase 3 -> start drawing the bowl while right line “compresses” */
    .to(
      bowlEl.value,
      {
        duration: 0.1,
        opacity: 1,
      },
      0.32
    )
    .to(
      bowlEl.value,
      {
        duration: 0.65,
        strokeDashoffset: 0, // draw curve
        ease: "power2.out",
      },
      0.34
    )
    .to(
      rightEl.value,
      {
        duration: 0.65,
        // keep it visible but weaker -> looks like it "became" the curve, not vanished
        opacity: 0.22,
        scaleX: 0.92,
        ease: "power2.out",
      },
      0.34
    )

    /* Phase 4 -> final micro polish */
    .to(
      [spineEl.value, bowlEl.value],
      {
        duration: 0.18,
        // small snap makes it feel intentional
        scaleX: 1.01,
        scaleY: 1.01,
        yoyo: true,
        repeat: 1,
        ease: "power1.inOut",
      },
      0.92
    );

  // If you want it to replay on click
  // svgEl.value.addEventListener("click", () => tl.restart());
});

onBeforeUnmount(() => {
  if (tl) tl.kill();
});
</script>

<style scoped>
.wrap {
  display: grid;
  place-items: center;
  width: 100%;
  height: 200px;
  background: #000;
}

.mark {
  width: 220px;
  height: auto;
}

.stroke {
  fill: none;
  stroke: #fff;
  stroke-width: 16;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.bowl {
  /* dash is set via JS */
}
</style>
