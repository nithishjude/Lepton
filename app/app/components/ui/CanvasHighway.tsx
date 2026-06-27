'use client';
import React, { useEffect, useRef } from 'react';

export default function CanvasHighway() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.clientWidth);
    let height = (canvas.height = canvas.clientHeight);

    // 3D Scene parameters
    const fov = 350;
    const roadWidth = 180;
    const islandWidth = 40;
    const camY = -70; // Position camera above road
    const maxZ = 600;
    const speed = 7;

    // Light colors
    const leftColors = ['#D856BF', '#6750A2', '#C247AC'];
    const rightColors = ['#03B3C3', '#0E5EA5', '#324555'];

    // Particles/Streaks
    interface Streak {
      x: number;
      y: number;
      z: number;
      color: string;
      length: number;
      width: number;
      speed: number;
    }

    const streaks: Streak[] = [];
    const numStreaks = 45;

    // Initialize light streaks
    for (let i = 0; i < numStreaks; i++) {
      const isLeft = Math.random() > 0.5;
      const laneX = isLeft
        ? -roadWidth / 2 - islandWidth / 2 - Math.random() * 60
        : roadWidth / 2 + islandWidth / 2 + Math.random() * 60;

      streaks.push({
        x: laneX,
        y: 0, // Flat on road level
        z: Math.random() * maxZ,
        color: isLeft
          ? leftColors[Math.floor(Math.random() * leftColors.length)]
          : rightColors[Math.floor(Math.random() * rightColors.length)],
        length: 40 + Math.random() * 60,
        width: 1.5 + Math.random() * 2,
        speed: speed * (0.85 + Math.random() * 0.3),
      });
    }

    // Side sticks
    interface Stick {
      x: number;
      y: number;
      z: number;
      color: string;
      height: number;
    }
    const sticks: Stick[] = [];
    const numSticks = 16;
    for (let i = 0; i < numSticks; i++) {
      const isLeft = i % 2 === 0;
      sticks.push({
        x: isLeft ? -roadWidth - 30 : roadWidth + 30,
        y: -15, // Raised up
        z: (i / numSticks) * maxZ,
        color: '#03B3C3',
        height: 25,
      });
    }

    // Resize handler
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.clientWidth;
      height = canvas.height = canvas.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Render loop
    const render = () => {
      // Clear with background color matching page style
      ctx.fillStyle = '#080810';
      ctx.fillRect(0, 0, width, height);

      // Center vanishing point
      const cx = width / 2;
      const cy = height / 2;

      // Draw horizon line
      const gradHorizon = ctx.createLinearGradient(0, cy, width, cy);
      gradHorizon.addColorStop(0, 'rgba(153,69,255,0)');
      gradHorizon.addColorStop(0.3, 'rgba(153,69,255,0.2)');
      gradHorizon.addColorStop(0.5, 'rgba(0,194,255,0.3)');
      gradHorizon.addColorStop(0.7, 'rgba(153,69,255,0.2)');
      gradHorizon.addColorStop(1, 'rgba(153,69,255,0)');
      ctx.fillStyle = gradHorizon;
      ctx.fillRect(0, cy - 1, width, 3);

      // Draw road receder guidelines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const roadEdges = [-roadWidth, -islandWidth / 2, islandWidth / 2, roadWidth];
      roadEdges.forEach((rx) => {
        ctx.beginPath();
        // Far point projection
        const farScale = fov / maxZ;
        const fx = cx + rx * farScale;
        const fy = cy + camY * farScale;
        // Near point projection
        const nearScale = fov / 10;
        const nx = cx + rx * nearScale;
        const ny = cy + camY * nearScale;
        
        ctx.moveTo(fx, fy);
        ctx.lineTo(nx, ny);
        ctx.stroke();
      });

      // Sort and draw side sticks based on Z depth
      sticks.forEach((stick) => {
        // Move closer
        stick.z -= speed;
        if (stick.z <= 0) stick.z = maxZ;

        // Projection
        const scale = fov / stick.z;
        const sx = cx + stick.x * scale;
        const sy = cy + (stick.y - camY) * scale;
        const stickH = stick.height * scale;

        if (stick.z > 5) {
          ctx.strokeStyle = stick.color;
          ctx.lineWidth = Math.max(0.5, 1.5 * scale);
          ctx.shadowBlur = 8;
          ctx.shadowColor = stick.color;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx, sy - stickH);
          ctx.stroke();
        }
      });
      ctx.shadowBlur = 0; // Reset shadow

      // Draw light streaks
      streaks.forEach((streak) => {
        // Move closer
        streak.z -= streak.speed;
        if (streak.z <= 0) {
          streak.z = maxZ;
        }

        // Project start of streak
        const scaleStart = fov / streak.z;
        const xStart = cx + streak.x * scaleStart;
        const yStart = cy + (streak.y - camY) * scaleStart;

        // Project end of streak (trail)
        const zEnd = streak.z + streak.length;
        const scaleEnd = fov / zEnd;
        const xEnd = cx + streak.x * scaleEnd;
        const yEnd = cy + (streak.y - camY) * scaleEnd;

        // Only draw if within bounds and in front of camera
        if (streak.z > 5) {
          // Draw with glowing shadow
          ctx.strokeStyle = streak.color;
          ctx.lineWidth = Math.max(1, streak.width * scaleStart);
          ctx.shadowBlur = 10;
          ctx.shadowColor = streak.color;

          ctx.beginPath();
          ctx.moveTo(xStart, yStart);
          ctx.lineTo(xEnd, yEnd);
          ctx.stroke();
        }
      });
      ctx.shadowBlur = 0; // Reset shadow

      // Ambient left/right background flares
      const leftGlow = ctx.createRadialGradient(width * 0.25, height * 0.7, 0, width * 0.25, height * 0.7, width * 0.25);
      leftGlow.addColorStop(0, 'rgba(216, 86, 191, 0.04)');
      leftGlow.addColorStop(1, 'rgba(8, 8, 16, 0)');
      ctx.fillStyle = leftGlow;
      ctx.fillRect(0, 0, width, height);

      const rightGlow = ctx.createRadialGradient(width * 0.75, height * 0.7, 0, width * 0.75, height * 0.7, width * 0.25);
      rightGlow.addColorStop(0, 'rgba(3, 179, 195, 0.03)');
      rightGlow.addColorStop(1, 'rgba(8, 8, 16, 0)');
      ctx.fillStyle = rightGlow;
      ctx.fillRect(0, 0, width, height);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  );
}
