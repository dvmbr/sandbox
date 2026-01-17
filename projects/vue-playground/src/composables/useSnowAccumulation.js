import { onMounted, onUnmounted } from "vue";

export function useSnowAccumulation(canvasRef, options = {}) {
  let ctx, w, h, rafId;

  const dpr = window.devicePixelRatio || 1;
  const FALL_SPEED = options.fallSpeed ?? 0.6;
  const ACC_RATE = options.accRate ?? 0.15;

  const flakes = [];
  const pile = [];

  function resize() {
    w = canvasRef.value.clientWidth;
    h = canvasRef.value.clientHeight;

    canvasRef.value.width = w * dpr;
    canvasRef.value.height = h * dpr;
    canvasRef.value.style.width = w + "px";
    canvasRef.value.style.height = h + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function createFlake() {
    return {
      x: Math.random() * w,
      y: -10,
      r: Math.random() * 2 + 1.5,
    };
  }

  function loop() {
    ctx.clearRect(0, 0, w, h);

    // falling snow
    if (Math.random() < 0.4) {
      flakes.push(createFlake());
    }

    for (let i = flakes.length - 1; i >= 0; i--) {
      const f = flakes[i];
      f.y += FALL_SPEED;

      if (f.y >= h - (pile[Math.floor(f.x)] || 0)) {
        pile[Math.floor(f.x)] = (pile[Math.floor(f.x)] || 0) + ACC_RATE * f.r;
        flakes.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fill();
    }

    // draw pile
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    for (let x = 0; x < w; x++) {
      if (pile[x]) {
        ctx.fillRect(x, h - pile[x], 1, pile[x]);
      }
    }

    rafId = requestAnimationFrame(loop);
  }

  onMounted(() => {
    ctx = canvasRef.value.getContext("2d");
    resize();
    window.addEventListener("resize", resize);
    rafId = requestAnimationFrame(loop);
  });

  onUnmounted(() => {
    window.removeEventListener("resize", resize);
    cancelAnimationFrame(rafId);
  });
}
