import { useRef, useCallback, useEffect } from 'react';
import type { StringState } from '../types';

const DECAY_TIME = 8; // seconds

const HARMONICS = [
  { multiple: 1, amplitude: 1.0 },
  { multiple: 2, amplitude: 0.8 },
  { multiple: 3, amplitude: 0.5 },
  { multiple: 4, amplitude: 0.3 },
  { multiple: 5, amplitude: 0.15 },
  { multiple: 6, amplitude: 0.1 },
];

interface AudioEngineProps {
  isPlaying: boolean;
  tempo: number;
  pluckDelay: number;
  masterVolume: number;
  echoLevel: number;
  stringStates: StringState[];
  frequencies: Record<string, number>;
  onPluckVisuals: (stringId: string) => void;
}

export const useAudioEngine = ({
  isPlaying,
  tempo,
  pluckDelay,
  masterVolume,
  echoLevel,
  stringStates,
  frequencies,
  onPluckVisuals,
}: AudioEngineProps) => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const preEffectGainRef = useRef<GainNode | null>(null);
  const delayNodeRef = useRef<DelayNode | null>(null);
  const feedbackGainRef = useRef<GainNode | null>(null);
  const sequenceTimeoutRef = useRef<number | null>(null);
  const currentStringIndexRef = useRef<number>(0);

  const initAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const masterGain = context.createGain();
      masterGain.connect(context.destination);

      const preEffectGain = context.createGain();
      
      const delayNode = context.createDelay(5.0);
      delayNode.delayTime.value = 0.4;
      const feedbackGain = context.createGain();
      feedbackGain.gain.value = 0;

      preEffectGain.connect(masterGain); 
      preEffectGain.connect(delayNode);
      delayNode.connect(feedbackGain);
      feedbackGain.connect(delayNode);
      delayNode.connect(masterGain);

      audioCtxRef.current = context;
      masterGainRef.current = masterGain;
      preEffectGainRef.current = preEffectGain;
      delayNodeRef.current = delayNode;
      feedbackGainRef.current = feedbackGain;
    }
  }, []);

  const pluck = useCallback((stringId: string) => {
    initAudioContext();
    const audioCtx = audioCtxRef.current;
    const preEffectGain = preEffectGainRef.current;
    if (!audioCtx || !preEffectGain) return;

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const freq = frequencies[stringId];
    const stringState = stringStates.find(s => s.id === stringId);
    if (!freq || !stringState) return;
    
    onPluckVisuals(stringId);

    const stringVolume = stringState.volume;
    const now = audioCtx.currentTime;

    const stringEnvelope = audioCtx.createGain();
    stringEnvelope.gain.setValueAtTime(0, now);
    stringEnvelope.connect(preEffectGain);

    const attackTime = 0.01;
    const peakVolume = stringVolume * 0.5;

    stringEnvelope.gain.linearRampToValueAtTime(peakVolume, now + attackTime);
    stringEnvelope.gain.exponentialRampToValueAtTime(0.0001, now + DECAY_TIME);

    HARMONICS.forEach(harmonic => {
      const osc = audioCtx.createOscillator();
      const harmGain = audioCtx.createGain();

      osc.frequency.setValueAtTime(freq * harmonic.multiple, now);
      harmGain.gain.setValueAtTime(harmonic.amplitude, now);
      
      osc.connect(harmGain);
      harmGain.connect(stringEnvelope);
      osc.start(now);
      osc.stop(now + DECAY_TIME);
    });
  }, [initAudioContext, frequencies, stringStates, onPluckVisuals]);
  
  const manualPluck = useCallback((stringId: string) => {
    pluck(stringId);
  }, [pluck]);

  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.setTargetAtTime(masterVolume, masterGainRef.current.context.currentTime, 0.01);
    }
  }, [masterVolume]);

  useEffect(() => {
    if (feedbackGainRef.current) {
        // The echoLevel prop is 0-1. We map it to a safe feedback range (e.g., 0-0.7)
        // to prevent runaway feedback or echoes that are as loud as the source,
        // which can be perceived as a "second note".
        const feedbackGainValue = echoLevel * 0.7;
        feedbackGainRef.current.gain.setTargetAtTime(feedbackGainValue, feedbackGainRef.current.context.currentTime, 0.01);
    }
  }, [echoLevel]);

  useEffect(() => {
    const clearExistingTimeout = () => {
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
        sequenceTimeoutRef.current = null;
      }
    };

    const scheduleNextPluck = () => {
      const stringToPlay = stringStates[currentStringIndexRef.current];
      pluck(stringToPlay.id);

      currentStringIndexRef.current = (currentStringIndexRef.current + 1) % stringStates.length;

      const cycleLength = stringStates.length;
      const cycleDurationMs = (60 / tempo) * 1000;
      const sumOfShortDelays = pluckDelay * (cycleLength - 1);

      let mainDelay = cycleDurationMs - sumOfShortDelays;
      if (mainDelay < 1) { 
        mainDelay = pluckDelay;
      }

      const delayForNextPluck = currentStringIndexRef.current === 0 
                                ? mainDelay
                                : pluckDelay;

      sequenceTimeoutRef.current = window.setTimeout(scheduleNextPluck, delayForNextPluck);
    };

    clearExistingTimeout();

    if (isPlaying) {
      scheduleNextPluck();
    } else {
        currentStringIndexRef.current = 0;
    }

    return clearExistingTimeout;
  }, [isPlaying, tempo, pluckDelay, pluck, stringStates]);

  return { manualPluck };
};
