import { onMounted, onUnmounted } from "vue";

export function useSnowPile(canvasRef, options = {}) {
  let ctx, w, h, rafId;

  const dpr = window.devicePixelRatio || 1;

  // pile config
  const GROW_RATE = options.growRate ?? 0.05;
  const MAX_HEIGHT = options.maxHeight ?? 36;
  const BASE_THICKNESS = options.baseThickness ?? 10;

  // mouse melt config
  const MELT_RADIUS = options.meltRadius ?? 56; // px
  const MELT_STRENGTH = options.meltStrength ?? 0.08; // per frame
  const MELT_FALLOFF = options.meltFalloff ?? 2.6; // softer edge
  const MELT_BAND = options.meltBand ?? 80; // allow melt area

  // smoothing config
  const SMOOTH_PASSES = options.smoothPasses ?? 2;

  // state
  let pile = [];
  let target = [];
  let tmp = [];

  let pointerX = null;
  let pointerY = null;
  let pointerInside = false;

  function resize() {
    if (!canvasRef.value) return;

    w = canvasRef.value.clientWidth;
    h = canvasRef.value.clientHeight;

    canvasRef.value.width = w * dpr;
    canvasRef.value.height = h * dpr;
    canvasRef.value.style.width = w + "px";
    canvasRef.value.style.height = h + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const n = Math.max(1, Math.floor(w));
    if (pile.length !== n) {
      pile = new Array(n).fill(0);
      target = new Array(n).fill(0);
      tmp = new Array(n).fill(0);
    }
  }

  function smooth() {
    const n = pile.length;
    for (let p = 0; p < SMOOTH_PASSES; p++) {
      tmp[0] = pile[0];
      tmp[n - 1] = pile[n - 1];

      for (let i = 1; i < n - 1; i++) {
        tmp[i] = (pile[i - 1] + pile[i] * 2 + pile[i + 1]) / 4;
      }

      for (let i = 0; i < n; i++) pile[i] = tmp[i];
    }
  }

  function grow() {
    const add = (Math.random() * 0.4 + 0.8) * GROW_RATE;
    for (let i = 0; i < target.length; i++) {
      target[i] = Math.min(MAX_HEIGHT, target[i] + add);
    }
  }

  function melt() {
    if (!pointerInside || pointerX == null || pointerY == null) return;

    const xi = Math.max(0, Math.min(target.length - 1, Math.floor(pointerX)));
    const surfaceY = h - (BASE_THICKNESS + pile[xi]);
    if (Math.abs(pointerY - surfaceY) > MELT_BAND) return;

    const left = Math.max(0, Math.floor(pointerX - MELT_RADIUS));
    const right = Math.min(
      target.length - 1,
      Math.ceil(pointerX + MELT_RADIUS)
    );

    for (let x = left; x <= right; x++) {
      const dx = x - pointerX;
      const t = Math.min(1, Math.abs(dx) / MELT_RADIUS);
      const falloff = Math.pow(1 - t, MELT_FALLOFF); // 0..1
      target[x] = Math.max(0, target[x] - MELT_STRENGTH * falloff * MAX_HEIGHT);
    }
  }

  function relaxToTarget() {
    // ease actual pile to target to avoid sharp “instant cut”
    const EASE = options.ease ?? 0.18;
    for (let i = 0; i < pile.length; i++) {
      pile[i] += (target[i] - pile[i]) * EASE;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.beginPath();
    ctx.moveTo(0, h);

    for (let x = 0; x < pile.length; x++) {
      const y = h - (BASE_THICKNESS + pile[x]);
      ctx.lineTo(x, y);
    }

    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < pile.length; x++) {
      const y = h - (BASE_THICKNESS + pile[x]);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  function loop() {
    grow();
    melt();
    relaxToTarget();
    smooth();
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function setPointerFromClient(clientX, clientY) {
    const rect = canvasRef.value.getBoundingClientRect();
    pointerX = clientX - rect.left;
    pointerY = clientY - rect.top;
    pointerInside =
      pointerX >= 0 && pointerY >= 0 && pointerX <= w && pointerY <= h;
  }

  const onMove = (e) => setPointerFromClient(e.clientX, e.clientY);
  const onLeave = () => {
    pointerInside = false;
    pointerX = null;
    pointerY = null;
  };
  const onTouchMove = (e) => {
    const t = e.touches?.[0];
    if (!t) return;
    setPointerFromClient(t.clientX, t.clientY);
  };

  onMounted(() => {
    ctx = canvasRef.value.getContext("2d");
    resize();

    window.addEventListener("resize", resize);

    canvasRef.value.addEventListener("mousemove", onMove, { passive: true });
    canvasRef.value.addEventListener("mouseleave", onLeave, { passive: true });
    canvasRef.value.addEventListener("touchmove", onTouchMove, {
      passive: true,
    });
    canvasRef.value.addEventListener("touchend", onLeave, { passive: true });

    rafId = requestAnimationFrame(loop);
  });

  onUnmounted(() => {
    window.removeEventListener("resize", resize);

    canvasRef.value?.removeEventListener("mousemove", onMove);
    canvasRef.value?.removeEventListener("mouseleave", onLeave);
    canvasRef.value?.removeEventListener("touchmove", onTouchMove);
    canvasRef.value?.removeEventListener("touchend", onLeave);

    cancelAnimationFrame(rafId);
  });
}
