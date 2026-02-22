import { useEffect, useRef } from 'react';

// Orange brand palette — warm creams through vibrant orange
const ORANGE_PALETTE = [
  '#FFF7ED', // orange-50
  '#FFEDD5', // orange-100
  '#FED7AA', // orange-200
  '#FDBA74', // orange-300
  '#FB923C', // orange-400 (visible pop)
  '#FFF3E0', // warm cream
  '#FFE0B2', // deeper warm
  '#FFCCBC', // soft coral
  '#FFF8F1', // near-white warm
];

const BLEND_MODES = ['overlay', 'soft-light', 'color-dodge', 'screen', 'lighter'];

function drawBlob(ctx, { x, y, size, color, rotation, alpha, blend }) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = blend;
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();

  for (let i = 0; i < 2 * Math.PI; i += Math.PI / 5) {
    const r = size * (0.8 + 0.2 * Math.sin(i * 3 + Math.random()));
    ctx.lineTo(Math.cos(i) * r, Math.sin(i) * r);
  }

  ctx.closePath();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = size * 0.2;
  ctx.fill();
  ctx.restore();
}

export default function ArtisticBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    const draw = () => {
      // ① Fill warm cream base — makes canvas self-contained regardless of body color
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#FFF8F1';
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      // ② Draw 15 organic orange blobs on top
      for (let i = 0; i < 15; i++) {
        drawBlob(ctx, {
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          size: 250 + Math.random() * 300,
          color: ORANGE_PALETTE[Math.floor(Math.random() * ORANGE_PALETTE.length)],
          rotation: Math.random() * Math.PI * 2,
          alpha: 0.35 + Math.random() * 0.2,
          blend: BLEND_MODES[Math.floor(Math.random() * BLEND_MODES.length)],
        });
      }
    };

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      draw();
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        display: 'block',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,           /* above body background, below card (z-index:1) */
        pointerEvents: 'none',
        userSelect: 'none',
        /* NO mixBlendMode — canvas paints its own base fill */
      }}
    />
  );
}
