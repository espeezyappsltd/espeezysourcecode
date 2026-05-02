import React, { useRef, useEffect } from 'react';

// Simple endless runner (dino) game placeholder
export default function OfflineGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Draw ground
    ctx.fillStyle = '#f4f4f4';
    ctx.fillRect(0, 0, 400, 150);
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 130, 400, 20);
    // Draw dino
    ctx.fillStyle = '#555';
    ctx.fillRect(30, 100, 30, 30);
    // Draw obstacle
    ctx.fillStyle = '#a00';
    ctx.fillRect(200, 110, 10, 20);
    // TODO: Add jump, collision, score, and animation
  }, []);

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Offline Mode</h2>
      <canvas ref={canvasRef} width={400} height={150} style={{ border: '1px solid #ccc' }} />
      <p>Press space to jump! (Demo only)</p>
    </div>
  );
}
