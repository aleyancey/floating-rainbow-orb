import React, { useEffect, useState } from 'react';

interface SessionTimerProps {
  active: boolean;
  duration: number; // seconds
  onEnd: () => void;
}

const SessionTimer: React.FC<SessionTimerProps> = ({ active, duration, onEnd }) => {
  const [remaining, setRemaining] = useState(duration);

  useEffect(() => {
    if (!active) return;
    setRemaining(duration);
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [active, duration, onEnd]);

  if (!active) return null;
  const min = Math.floor(remaining / 60);
  const sec = remaining % 60;
  return (
    <div className="fixed top-4 right-8 text-lg bg-black/80 px-4 py-2 rounded-full border border-white/10">
      {min}:{sec.toString().padStart(2, '0')}
    </div>
  );
};

export default SessionTimer;
