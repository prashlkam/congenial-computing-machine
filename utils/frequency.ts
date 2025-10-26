
import type { Note } from '../types';
import { ALL_NOTES } from '../constants';

const A4_FREQ = 440;

export const getNoteFrequency = (note: Note, octave: number): number => {
  const a4Index = ALL_NOTES.indexOf('A');
  const noteIndex = ALL_NOTES.indexOf(note);
  const semitonesFromA4 = (noteIndex - a4Index) + (octave - 4) * 12;
  return A4_FREQ * Math.pow(2, semitonesFromA4 / 12);
};

export const getTanpuraFrequencies = (key: Note, octave: number): Record<string, number> => {
  const rootFreq = getNoteFrequency(key, octave);
  const rootIndex = ALL_NOTES.indexOf(key);

  const paIndex = (rootIndex + 7) % 12;
  const paNote = ALL_NOTES[paIndex];
  const paOctave = rootIndex + 7 >= 12 ? octave : octave - 1;
  const paFreq = getNoteFrequency(paNote, paOctave);

  return {
    pa: paFreq,
    sa1: rootFreq * 2,
    sa2: rootFreq * 2,
    sa: rootFreq,
  };
};
