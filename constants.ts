
import type { Note, Octave, StringConfig } from './types';

export const ALL_NOTES: Note[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const OCTAVES: Octave[] = [2, 3, 4];

export const DEFAULT_KEY: Note = 'C';
export const DEFAULT_OCTAVE: Octave = 3;
export const DEFAULT_TEMPO = 80;
export const MIN_TEMPO = 20;
export const MAX_TEMPO = 200;
export const DEFAULT_MASTER_VOLUME = 0.5;
export const DEFAULT_STRING_VOLUME = 0.8;

export const STRINGS_CONFIG: StringConfig[] = [
  { id: 'pa', name: 'Pa (5th)' },
  { id: 'sa1', name: 'Sa (8ve)' },
  { id: 'sa2', name: 'Sa (8ve)' },
  { id: 'sa', name: 'Sa (Root)' },
];
