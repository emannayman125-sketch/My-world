"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabaseClient";

const COLORS = ["#B46F4D", "#6256A8", "#F0EDE6", "#9086C0", "#D8C6AF"];

export default function BirthdayCelebration({ userId, name, year, strings }) {
  const tr = strings.dashboard.birthday;
  const canvasRef = useRef(null);
  const [visible, setVisible] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let width, height;
    let particles = [];
    let frame = 0;
    let animationId;

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function launchFirework() {
      const x = width * (0.2 + Math.random() * 0.6);
      const y = height * (0.15 + Math.random() * 0.35);
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const count = 50;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = 2 + Math.random() * 3.5;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color,
        });
      }
    }

    function loop() {
      ctx.fillStyle = "rgba(26, 28, 31, 0.18)";
      ctx.fillRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.035; // light gravity
        p.alpha -= 0.011;
        ctx.globalAlpha = Math.max(p.alpha, 0);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2);
        ctx.fill();
      });
      particles = particles.filter((p) => p.alpha > 0);
      ctx.globalAlpha = 1;

      frame++;
      if (frame % 50 === 0) launchFirework();

      animationId = requestAnimationFrame(loop);
    }

    launchFirework();
    loop();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  async function dismiss() {
    await supabase.from("profiles").update({ last_birthday_shown_year: year }).eq("id", userId);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-night flex items-center justify-center">
      <canvas ref={canvasRef} className="absolute inset-0" />

      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 120, damping: 12 }}
        className="relative text-center px-6"
      >
        <p className="font-display text-4xl sm:text-5xl text-moon mb-3">
          🎂 Happy Birthday, {name}! 🎉
        </p>
        <p className="text-moon-muted mb-8 text-lg">{tr.message}</p>
        <button
          onClick={dismiss}
          className="rounded-soft bg-lantern text-night px-6 py-3 font-medium hover:brightness-105 transition"
        >
          {tr.continue}
        </button>
      </motion.div>
    </div>
  );
}
