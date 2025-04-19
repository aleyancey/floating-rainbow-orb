import React from 'react';

const COLORS = [
  { name: 'Blue', value: 'neonBlue' },
  { name: 'Green', value: 'neonGreen' },
  { name: 'Purple', value: 'neonPurple' },
  { name: 'Yellow', value: 'neonYellow' },
  { name: 'Turquoise', value: 'neonTurquoise' },
];

interface TopColorSelectorProps {
  selectedColor: string;
  onSelect: (color: string) => void;
}

const TopColorSelector: React.FC<TopColorSelectorProps> = ({ selectedColor, onSelect }) => (
  <div className="fixed top-4 left-1/2 -translate-x-1/2 flex gap-6 z-20">
    {COLORS.map((color) => (
      <button
        key={color.value}
        className={`w-10 h-10 rounded-full border-4 transition-all ${selectedColor === color.value ? 'border-white scale-110' : 'border-white/30'} bg-[var(--${color.value})]`}
        style={{ background: `var(--tw-color-${color.value})`, boxShadow: selectedColor === color.value ? '0 0 12px 4px var(--tw-color-' + color.value + ')' : undefined }}
        onClick={() => onSelect(color.value)}
        aria-label={color.name}
      />
    ))}
  </div>
);

export default TopColorSelector;
