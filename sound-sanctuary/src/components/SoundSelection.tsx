import React from 'react';

const SOUNDS = [
  { name: 'Rain', key: 'rain' },
  { name: 'Tibetan Bowl', key: 'bowl' },
  { name: 'Forest Stream', key: 'stream' },
  { name: 'Coastal Ocean', key: 'ocean' },
  { name: 'Ambient', key: 'ambient' },
];

interface SoundSelectionProps {
  onSelect: (sound: string) => void;
}

const SoundSelection: React.FC<SoundSelectionProps> = ({ onSelect }) => (
  <div className="flex flex-col items-start gap-4 animate-fade-in-left">
    {SOUNDS.map((sound, idx) => (
      <button
        key={sound.key}
        className="flex items-center group transition-transform hover:scale-105"
        onClick={() => onSelect(sound.key)}
      >
        <span className="w-12 h-12 rounded-full bg-white/10 border border-white mr-4 flex items-center justify-center text-lg text-white group-hover:bg-white/20 transition">
          {idx + 1}
        </span>
        <span className="text-xl font-medium">{sound.name}</span>
      </button>
    ))}
  </div>
);

export default SoundSelection;
