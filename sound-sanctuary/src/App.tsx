import React, { useState } from 'react';
import SoundSelection from './components/SoundSelection';
import NeonCanvas from './components/NeonCanvas';
import SessionTimer from './components/SessionTimer';
import BackgroundSound from './components/BackgroundSound';
import TopColorSelector from './components/TopColorSelector';
import VolumeSlider from './components/VolumeSlider';

export type Phase = 'sound-select' | 'draw' | 'session-end';

const COLORS = [
  { name: 'Blue', value: 'neonBlue' },
  { name: 'Green', value: 'neonGreen' },
  { name: 'Purple', value: 'neonPurple' },
  { name: 'Yellow', value: 'neonYellow' },
  { name: 'Turquoise', value: 'neonTurquoise' },
];

const App: React.FC = () => {
  const [phase, setPhase] = useState<Phase>('sound-select');
  const [selectedSound, setSelectedSound] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('neonBlue');
  const [sessionActive, setSessionActive] = useState<boolean>(false);
  const [showSoundMenu, setShowSoundMenu] = useState<boolean>(true);
  const [bgVolume, setBgVolume] = useState<number>(0.5);

  // Show menu if user moves mouse/finger to left edge
  React.useEffect(() => {
    if (phase !== 'draw') return;
    const handleMove = (e: MouseEvent | TouchEvent) => {
      let x = 0;
      if ('touches' in e && e.touches.length > 0) x = e.touches[0].clientX;
      else if ('clientX' in e) x = e.clientX;
      if (x < 30) setShowSoundMenu(true);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchstart', handleMove);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchstart', handleMove);
    };
  }, [phase]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white relative">
      <BackgroundSound sound={selectedSound} playing={!!selectedSound && phase !== 'sound-select'} volume={bgVolume} />
      <h1 className="text-4xl font-bold mb-8">Sound Sanctuary</h1>
      <SessionTimer active={sessionActive} duration={7 * 60} onEnd={() => setPhase('session-end')} />
      {/* Sound menu at left edge, slides out after selection, returns on edge hover */}
      {phase === 'sound-select' || (phase === 'draw' && showSoundMenu) ? (
        <div
          className={`fixed top-1/2 left-0 -translate-y-1/2 z-30 transition-transform duration-500 ${phase === 'sound-select' || showSoundMenu ? 'translate-x-0' : '-translate-x-full'}`}
          onMouseLeave={() => phase === 'draw' && setShowSoundMenu(false)}
        >
          <SoundSelection
            onSelect={(sound) => {
              setSelectedSound(sound);
              setPhase('draw');
              setShowSoundMenu(false);
              setSessionActive(true);
            }}
          />
        </div>
      ) : null}
      {/* Top color selector always available during draw phase */}
      {phase === 'draw' && (
        <TopColorSelector
          selectedColor={selectedColor}
          onSelect={setSelectedColor}
        />
      )}
      {/* Volume slider for background sound */}
      {phase === 'draw' && (
        <div className="fixed top-4 right-8 z-40 bg-black/80 px-4 py-2 rounded-full border border-white/10 flex items-center">
          <VolumeSlider value={bgVolume} onChange={setBgVolume} label="Pen Width / BG Volume" />
        </div>
      )}
      {/* Neon canvas always available during draw phase */}
      {phase === 'draw' && selectedColor && (
        <NeonCanvas color={selectedColor} sound={selectedSound} penWidth={6 + bgVolume * 12} />
      )}
      {phase === 'session-end' && (
        <div className="text-2xl mt-6">Session Complete. Thank you for visiting Sound Sanctuary.</div>
      )}
    </div>
  );
};

export default App;
