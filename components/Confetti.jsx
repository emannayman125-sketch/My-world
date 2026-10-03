"use client";

import { useEffect, useRef } from "react";

const COLORS = ["#D6870F", "#7C6FA6", "#F3EFE6", "#A79BCB", "#F2AE33"];

export default function Confetti({ onDone }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    const particles = Array.from({ length: 140 }, () => ({
      x: width / 2 + (Math.random() - 0.5) * 120,
      y: height * 0.35,
      vx: (Math.random() - 0.5) * 9,
      vy: -Math.random() * 8 - 3,
      size: 4 + Math.random() * 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * Math.PI,
      rotSpeed: (Math.random() - 0.5) * 0.3,
      life: 1,
    }));

    let animationId;
    function loop() {
      ctx.clearRect(0, 0, width, height);
      let alive = false;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22;
        p.rotation += p.rotSpeed;
        p.life -= 0.008;
        if (p.life > 0) alive = true;

        ctx.save();
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });

      if (alive) {
        animationId = requestAnimationFrame(loop);
      } else {
        onDone?.();
      }
    }
    loop();

    return () => cancelAnimationFrame(animationId);
  }, [onDone]);

  return <canvas ref={canvasRef} className="fixed inset-0 z-[90] pointer-events-none" />;
}
