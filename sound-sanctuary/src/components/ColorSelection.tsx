import React from 'react';

const COLORS = [
  { name: 'Blue', value: 'neonBlue' },
  { name: 'Green', value: 'neonGreen' },
  { name: 'Purple', value: 'neonPurple' },
  { name: 'Yellow', value: 'neonYellow' },
  { name: 'Turquoise', value: 'neonTurquoise' },
];

interface ColorSelectionProps {
  onSelect: (color: string) => void;
}

const ColorSelection: React.FC<ColorSelectionProps> = ({ onSelect }) => (
  <div className="flex gap-8 animate-fade-in">
    {COLORS.map((color) => (
      <button
        key={color.value}
        className={`w-14 h-14 rounded-full shadow-neon bg-${color.value} border-4 border-white/30 hover:scale-110 transition-all`}
        style={{ boxShadow: `0 0 12px 4px var(--tw-color-${color.value})` }}
        onClick={() => onSelect(color.value)}
        aria-label={color.name}
      />
    ))}
  </div>
);

export default ColorSelection;
