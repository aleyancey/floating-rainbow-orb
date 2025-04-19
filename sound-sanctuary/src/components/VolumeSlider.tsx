import React from 'react';

interface VolumeSliderProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
}

const VolumeSlider: React.FC<VolumeSliderProps> = ({ value, onChange, label }) => (
  <div className="flex items-center gap-2">
    {label && <span className="mr-2 text-sm">{label}</span>}
    <input
      type="range"
      min={0}
      max={1}
      step={0.01}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-32 accent-blue-400"
      aria-label={label || 'Volume'}
    />
    <span className="text-xs w-8 text-right">{Math.round(value*100)}</span>
  </div>
);

export default VolumeSlider;
