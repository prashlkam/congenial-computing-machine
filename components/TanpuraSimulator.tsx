import React, { useState, useCallback, useMemo } from 'react';
import type { Note, Octave, StringState } from '../types';
import {
  ALL_NOTES,
  OCTAVES,
  DEFAULT_KEY,
  DEFAULT_OCTAVE,
  DEFAULT_TEMPO,
  MIN_TEMPO,
  MAX_TEMPO,
  DEFAULT_MASTER_VOLUME,
  DEFAULT_STRING_VOLUME,
  STRINGS_CONFIG,
} from '../constants';
import { getTanpuraFrequencies } from '../utils/frequency';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { useAuth } from '../auth/useAuth';

// --- Reusable UI Components ---

const PlayIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const StopIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 6h12v12H6z" />
  </svg>
);

interface SelectorButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}
const SelectorButton: React.FC<SelectorButtonProps> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-amber-500 ${
      isActive
        ? 'bg-amber-600 text-white shadow-md'
        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
    }`}
  >
    {label}
  </button>
);

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
const Slider: React.FC<SliderProps> = ({ label, value, min, max, step = 1, unit = '', onChange }) => (
  <div className="w-full">
    <label className="flex justify-between items-center text-sm font-medium text-gray-300 mb-1">
      <span>{label}</span>
      <span className="text-amber-400 font-bold">{value}{unit}</span>
    </label>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={onChange}
      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg accent-amber-500"
    />
  </div>
);

interface StringControlProps {
  name: string;
  volume: number;
  onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPluck: () => void;
  pluckVisual: number;
}
const StringControl: React.FC<StringControlProps> = ({ name, volume, onVolumeChange, onPluck, pluckVisual }) => {
    return (
        <div className="flex items-center space-x-4 bg-gray-800 p-3 rounded-lg">
            <div className="w-1/4">
                <button onClick={onPluck} className="w-full bg-amber-700 hover:bg-amber-600 text-white font-bold py-2 px-2 rounded-md transition-colors duration-200">
                    Pluck
                </button>
            </div>
            <div className="w-2/4 flex flex-col justify-center">
                <span className="text-sm font-medium text-gray-300 mb-1">{name}</span>
                <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-500 to-amber-300 h-2.5 rounded-full transition-all duration-100 ease-linear" style={{ width: `${pluckVisual}%` }}></div>
                </div>
            </div>
            <div className="w-1/4">
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={onVolumeChange}
                    className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    title="String Volume"
                />
            </div>
        </div>
    );
};

const TanpuraSimulator: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedKey, setSelectedKey] = useState<Note>(DEFAULT_KEY);
  const [selectedOctave, setSelectedOctave] = useState<Octave>(DEFAULT_OCTAVE);
  const [tempo, setTempo] = useState<number>(DEFAULT_TEMPO);
  const [pluckDelay, setPluckDelay] = useState<number>(250);
  const [masterVolume, setMasterVolume] = useState<number>(DEFAULT_MASTER_VOLUME);
  const [echoLevel, setEchoLevel] = useState<number>(0);
  const [stringStates, setStringStates] = useState<StringState[]>(
    STRINGS_CONFIG.map(s => ({ ...s, volume: DEFAULT_STRING_VOLUME }))
  );
  const [pluckVisuals, setPluckVisuals] = useState<Record<string, number>>({});
  const [isAboutVisible, setIsAboutVisible] = useState<boolean>(false);
  
  const { logout } = useAuth();
  const frequencies = useMemo(() => getTanpuraFrequencies(selectedKey, selectedOctave), [selectedKey, selectedOctave]);

  const onPluckVisuals = useCallback((stringId: string) => {
      setPluckVisuals(prev => ({ ...prev, [stringId]: 100 }));
      setTimeout(() => {
          setPluckVisuals(prev => ({ ...prev, [stringId]: 0 }));
      }, 100);
  }, []);

  const { manualPluck } = useAudioEngine({ 
    isPlaying, 
    tempo, 
    pluckDelay, 
    masterVolume, 
    echoLevel: echoLevel / 100, 
    stringStates, 
    frequencies, 
    onPluckVisuals 
  });

  const handleStringVolumeChange = (id: string, newVolume: number) => {
    setStringStates(prevStates =>
      prevStates.map(s => (s.id === id ? { ...s, volume: newVolume } : s))
    );
  };
  
  const togglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md mx-auto bg-gray-800 shadow-2xl rounded-2xl p-6 space-y-6">
        
        <header className="text-center relative">
          <h1 className="text-3xl font-bold text-amber-400">Tanpura Simulator</h1>
          <p className="text-gray-400 mt-1">Create your ambient drone</p>
          <button
            onClick={logout}
            className="absolute top-0 right-0 text-sm text-gray-500 hover:text-amber-400 transition-colors"
            title="Logout"
          >
            Logout
          </button>
        </header>

        <div className="flex justify-center">
            <button
                onClick={togglePlay}
                className="w-20 h-20 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-lg hover:bg-amber-500 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-amber-500/50 transform hover:scale-105"
                aria-label={isPlaying ? 'Stop' : 'Play'}
            >
                {isPlaying ? <StopIcon className="w-10 h-10" /> : <PlayIcon className="w-10 h-10" />}
            </button>
        </div>

        <div className="space-y-4">
            <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Key</h3>
                <div className="grid grid-cols-6 gap-2">
                    {ALL_NOTES.map(note => (
                        <SelectorButton key={note} label={note} isActive={selectedKey === note} onClick={() => setSelectedKey(note)} />
                    ))}
                </div>
            </div>
             <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Base Octave</h3>
                <div className="flex space-x-2">
                    {OCTAVES.map(octave => (
                        <SelectorButton key={octave} label={String(octave)} isActive={selectedOctave === octave} onClick={() => setSelectedOctave(octave)} />
                    ))}
                </div>
            </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-gray-700">
            <Slider label="Pluck Delay" value={pluckDelay} min={5} max={500} onChange={(e) => setPluckDelay(Number(e.target.value))} unit=" ms" />
            <Slider label="Tempo" value={tempo} min={MIN_TEMPO} max={MAX_TEMPO} onChange={(e) => setTempo(Number(e.target.value))} unit=" CPM" />
            <Slider label="Master Volume" value={Math.round(masterVolume * 100)} min={0} max={100} onChange={(e) => setMasterVolume(Number(e.target.value) / 100)} />
            <Slider label="Echo" value={echoLevel} min={0} max={100} onChange={(e) => setEchoLevel(Number(e.target.value))} />
        </div>

        <div className="space-y-3 pt-4 border-t border-gray-700">
          <h3 className="text-lg font-semibold text-gray-300 text-center">Strings</h3>
          {stringStates.map(s => (
            <StringControl
              key={s.id}
              name={s.name}
              volume={s.volume}
              onVolumeChange={(e) => handleStringVolumeChange(s.id, Number(e.target.value))}
              onPluck={() => manualPluck(s.id)}
              pluckVisual={pluckVisuals[s.id] || 0}
            />
          ))}
        </div>
        
        <footer className="text-center pt-4">
            <button onClick={() => setIsAboutVisible(true)} className="text-sm text-gray-500 hover:text-amber-400 transition-colors">
                About / Help
            </button>
        </footer>

      </div>

      {isAboutVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={() => setIsAboutVisible(false)}>
            <div className="bg-gray-800 rounded-lg p-8 max-w-lg w-full m-4 shadow-xl text-gray-300 space-y-4" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-amber-400">About Tanpura Simulator</h2>
                <p>The Tanpura is an Indian stringed instrument that provides a continuous harmonic drone to support a musician or singer. It creates a rich, meditative sound perfect for practice and performance.</p>
                <h3 className="text-xl font-semibold text-amber-500 pt-2">How to Use:</h3>
                <ul className="list-disc list-inside space-y-1">
                    <li><strong className="font-semibold">Play/Stop:</strong> Start or stop the automatic plucking sequence.</li>
                    <li><strong className="font-semibold">Key & Octave:</strong> Set the root note (Sa) of the drone.</li>
                    <li><strong className="font-semibold">Pluck Delay:</strong> Controls the time between the second, third, and fourth strings in a cycle.</li>
                    <li><strong className="font-semibold">Tempo:</strong> Control the speed of the overall 4-string plucking cycle (Cycles Per Minute).</li>
                    <li><strong className="font-semibold">Volume & Echo:</strong> Adjust master volume, individual string volumes, and add a delay effect.</li>
                    <li><strong className="font-semibold">Pluck:</strong> Manually pluck any string at any time.</li>
                </ul>
                <div className="text-center pt-4">
                    <button onClick={() => setIsAboutVisible(false)} className="bg-amber-600 text-white font-bold py-2 px-6 rounded-md hover:bg-amber-500 transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default TanpuraSimulator;
