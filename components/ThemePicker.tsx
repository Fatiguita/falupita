import React from 'react';
import { Palette } from 'lucide-react';
import { AppTheme } from '../types';

interface ThemePickerProps {
  currentTheme: AppTheme;
  setTheme: (theme: AppTheme) => void;
}

const PRESETS: { name: string; theme: AppTheme }[] = [
  {
    name: 'Ocean',
    theme: { primary: '#3b82f6', secondary: '#1e40af', accent: '#fbbf24', background: '#f3f4f6' }
  },
  {
    name: 'Forest',
    theme: { primary: '#10b981', secondary: '#064e3b', accent: '#f59e0b', background: '#ecfdf5' }
  },
  {
    name: 'Berry',
    theme: { primary: '#ec4899', secondary: '#831843', accent: '#34d399', background: '#fdf2f8' }
  },
  {
    name: 'Slate',
    theme: { primary: '#475569', secondary: '#0f172a', accent: '#22d3ee', background: '#f8fafc' }
  },
];

export const ThemePicker: React.FC<ThemePickerProps> = ({ currentTheme, setTheme }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full text-white shadow-lg transition-transform hover:scale-105"
        style={{ backgroundColor: currentTheme.primary }}
        title="Change Theme"
      >
        <Palette size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 p-2 overflow-hidden">
          <p className="text-xs font-semibold text-gray-500 mb-2 px-2 uppercase tracking-wide">Select Theme</p>
          <div className="space-y-1">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => {
                  setTheme(p.theme);
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 flex items-center gap-2 text-gray-700"
              >
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: p.theme.primary }} 
                />
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
