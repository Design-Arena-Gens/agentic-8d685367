'use client';

import { useEffect, useRef } from 'react';
import type { TrajectoryPoint } from '@/lib/trajectory';

interface HawkEyeViewProps {
  points: TrajectoryPoint[];
}

const PITCH_LENGTH = 22;
const PITCH_WIDTH = 3.05;

export function HawkEyeView({ points }: HawkEyeViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;

    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#020617');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const pitchX = width * 0.25;
    const pitchWidth = width * 0.5;
    const pitchHeight = height * 0.9;
    const pitchY = (height - pitchHeight) / 2;

    const pitchGradient = ctx.createLinearGradient(0, pitchY, 0, pitchY + pitchHeight);
    pitchGradient.addColorStop(0, '#14532d');
    pitchGradient.addColorStop(1, '#166534');

    ctx.fillStyle = pitchGradient;
    ctx.fillRect(pitchX, pitchY, pitchWidth, pitchHeight);

    ctx.strokeStyle = 'rgba(226, 232, 240, 0.45)';
    ctx.lineWidth = 2;
    ctx.strokeRect(pitchX, pitchY, pitchWidth, pitchHeight);

    ctx.strokeStyle = 'rgba(248, 250, 252, 0.5)';
    ctx.lineWidth = 1;

    for (let i = 1; i < 5; i += 1) {
      const y = pitchY + (pitchHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(pitchX, y);
      ctx.lineTo(pitchX + pitchWidth, y);
      ctx.stroke();
    }

    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(pitchX - 12, pitchY + pitchHeight - pitchHeight * 0.15, 12, pitchHeight * 0.15);
    ctx.fillRect(pitchX + pitchWidth, pitchY + pitchHeight - pitchHeight * 0.15, 12, pitchHeight * 0.15);

    ctx.fillStyle = '#cbd5f5';
    ctx.fillRect(pitchX + pitchWidth / 2 - 6, pitchY - 16, 12, 16);

    if (!points.length) return;

    const minY = Math.min(...points.map((p) => p.y));
    const maxY = Math.max(...points.map((p) => p.y));
    const minX = Math.min(...points.map((p) => p.x));
    const maxX = Math.max(...points.map((p) => p.x));

    const rangeY = maxY - minY || 1;
    const rangeX = maxX - minX || 1;

    const mapX = (val: number) =>
      pitchX + pitchWidth * (0.5 + ((val - (minX + rangeX / 2)) / rangeX) * (PITCH_WIDTH / PITCH_LENGTH));
    const mapY = (val: number) => pitchY + pitchHeight * ((val - minY) / rangeY);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    points.forEach((point, idx) => {
      const x = mapX(point.x);
      const y = mapY(point.y);
      if (idx === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    const lastPoint = points[points.length - 1];
    const lx = mapX(lastPoint.x);
    const ly = mapY(lastPoint.y);

    ctx.fillStyle = '#f87171';
    ctx.beginPath();
    ctx.arc(lx, ly, 8, 0, Math.PI * 2);
    ctx.fill();
  }, [points]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-2xl border border-slate-800 bg-slate-900/60"
      width={600}
      height={420}
    />
  );
}
