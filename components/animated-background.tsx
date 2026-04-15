"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  size: number;
}

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let particles: Particle[] = [];
    const mouse = { x: -1000, y: -1000 };
    let dpr = 1;
    let width = 0;
    let height = 0;

    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles();
    };

    const initParticles = () => {
      const area = width * height;
      const count = Math.min(100, Math.max(40, Math.floor(area / 15000)));
      particles = [];
      for (let i = 0; i < count; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        particles.push({
          x,
          y,
          baseX: x,
          baseY: y,
          vx: 0,
          vy: 0,
          size: Math.random() * 1.2 + 0.8,
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const isDark = () => document.documentElement.classList.contains("dark");

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const dark = isDark();
      const dotColor = dark ? "255,255,255" : "0,0,0";
      const mouseRadius = 160;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Antigravity: push away from mouse
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouseRadius && dist > 0) {
          const force = (mouseRadius - dist) / mouseRadius;
          const angle = Math.atan2(dy, dx);
          const push = force * 3.5;
          p.vx += Math.cos(angle) * push;
          p.vy += Math.sin(angle) * push;
        }

        // Spring back to base position
        const homeX = p.baseX - p.x;
        const homeY = p.baseY - p.y;
        p.vx += homeX * 0.015;
        p.vy += homeY * 0.015;

        // Friction
        p.vx *= 0.92;
        p.vy *= 0.92;

        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Draw particle with glow near mouse
        const opacity = dist < mouseRadius ? 0.5 + (1 - dist / mouseRadius) * 0.45 : 0.35;
        const radius = dist < mouseRadius ? p.size * (1 + (1 - dist / mouseRadius) * 0.6) : p.size;

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${dotColor},${opacity})`;
        ctx.fill();

        // Connect nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx2 = p.x - p2.x;
          const dy2 = p.y - p2.y;
          const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          const connectDist = 130;
          if (dist2 < connectDist) {
            const lineAlpha = (1 - dist2 / connectDist) * 0.12;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${dotColor},${lineAlpha})`;
            ctx.lineWidth = 1;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 -z-10"
    />
  );
}
