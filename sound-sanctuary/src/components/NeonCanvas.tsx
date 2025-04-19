import React, { useRef, useEffect, useState } from 'react';

interface Point {
  x: number;
  y: number;
  t: number;
}

interface NeonCanvasProps {
  color: string;
  sound: string | null;
}

const COLOR_MAP: Record<string, string> = {
  neonBlue: '#00eaff',
  neonGreen: '#39ff14',
  neonPurple: '#a259ff',
  neonYellow: '#fff700',
  neonTurquoise: '#1fffd7',
};

interface Stroke {
  points: Point[];
  color: string;
  startTime: number;
  duration: number;
  fadeProgress: number;
}

interface NeonCanvasProps {
  color: string;
  sound: string | null;
  penWidth: number;
}

const NeonCanvas: React.FC<NeonCanvasProps> = ({ color, sound, penWidth }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);

  // Drawing handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    setCurrentStroke([{ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, t: Date.now() }]);
    setIsDrawing(true);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    setCurrentStroke((prev) => [...prev, { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, t: Date.now() }]);
  };
  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStroke.length > 1) {
      // Duration: 1s per 100px of line length, min 2s, max 10s
      let len = 0;
      for (let i = 1; i < currentStroke.length; i++) {
        const dx = currentStroke[i].x - currentStroke[i - 1].x;
        const dy = currentStroke[i].y - currentStroke[i - 1].y;
        len += Math.sqrt(dx * dx + dy * dy);
      }
      const dur = Math.max(2, Math.min(10, Math.floor(len / 100)));
      // Add new stroke
      setStrokes((prev) => [
        ...prev.slice(-2), // keep only last 2 so new makes 3 max
        {
          points: currentStroke,
          color,
          startTime: Date.now(),
          duration: dur,
          fadeProgress: 0,
        },
      ]);
      playLayeredSound(color, dur);
    }
    setCurrentStroke([]);
  };


  // Animate line fade for all strokes
  useEffect(() => {
    if (strokes.length === 0) return;
    let running = true;
    const animate = () => {
      setStrokes((prevStrokes) =>
        prevStrokes
          .map((stroke) => {
            const elapsed = (Date.now() - stroke.startTime) / 1000;
            const fadeProgress = Math.min(1, elapsed / stroke.duration);
            return { ...stroke, fadeProgress };
          })
          .filter((stroke) => stroke.fadeProgress < 1)
      );
      if (running && strokes.length > 0) {
        requestAnimationFrame(animate);
      }
    };
    animate();
    return () => {
      running = false;
    };
  }, [strokes.length]);

  // Draw all neon lines
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw finished strokes
    // Swarm of organically moving glowing specks effect
    const now = Date.now();
    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      const neon = COLOR_MAP[stroke.color] || '#fff';
      const N = stroke.points.length;
      const fadedIdx = Math.floor(N * stroke.fadeProgress);
      for (let i = fadedIdx; i < N; i++) {
        const pt = stroke.points[i];
        // Organic movement: oscillate based on time, index, and path
        const t = now / 400 + i * 0.2;
        const jitterMag = 2 + Math.sin(t) * 2 + Math.cos(i + t) * 1.5;
        const angle = Math.sin(i * 0.3 + t) * Math.PI * 2;
        const x = pt.x + Math.cos(angle) * jitterMag;
        const y = pt.y + Math.sin(angle) * jitterMag;
        ctx.save();
        ctx.globalAlpha = 1 - stroke.fadeProgress * ((i - fadedIdx) / (N - fadedIdx));
        ctx.shadowColor = neon;
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(x, y, penWidth, 0, 2 * Math.PI);
        ctx.fillStyle = neon;
        ctx.fill();
        ctx.restore();
      }
    });
    // Draw current stroke in progress
    if (isDrawing && currentStroke.length > 1) {
      const neon = COLOR_MAP[color] || '#fff';
      ctx.save();
      ctx.shadowColor = neon;
      ctx.shadowBlur = 16;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = 8;
      ctx.strokeStyle = neon;
      ctx.beginPath();
      ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
      for (let i = 1; i < currentStroke.length; i++) {
        ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }
  }, [strokes, isDrawing, currentStroke, color]);

  // Responsive canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // --- Audio Layering Logic ---
  // Use up to 3 concurrent sounds
  const audioLayers = useRef<{audio: HTMLAudioElement, timeout: NodeJS.Timeout}[]>([]);

  function playLayeredSound(color: string, dur: number) {
    // Map color to sound file
    const colorSoundMap: Record<string, string> = {
      neonBlue: '/sounds/gentle-rain.wav', // gentle rain
      neonGreen: '/sounds/gentle-creek.wav', // creek in rain forest
      neonPurple: '/sounds/creek-test.wav', // creek test
      neonYellow: '/sounds/rain-on-leaves.wav', // rain on leaves
      neonTurquoise: '/sounds/1982_gentle-rain-on-leaves-with-soft-wind-and-suburban-ambience.wav', // suburban ambience
    };

    const soundUrl = colorSoundMap[color] || '/sounds/gentle-rain.wav';

    const audio = new window.Audio(soundUrl);
    audio.volume = 0.7;
    audio.currentTime = 0;
    audio.play();
    // Stop audio after dur seconds
    const timeout = setTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
    }, dur * 1000);
    audioLayers.current.push({audio, timeout});
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioLayers.current.forEach(({audio, timeout}) => {
        audio.pause();
        clearTimeout(timeout);
      });
      audioLayers.current = [];
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-10 touch-none cursor-crosshair"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ background: 'rgba(0,0,0,0.96)' }}
    />
  );
};

export default NeonCanvas;
