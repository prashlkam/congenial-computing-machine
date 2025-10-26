
export type Note = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';
export type Octave = 2 | 3 | 4;

export interface StringConfig {
  id: 'pa' | 'sa1' | 'sa2' | 'sa';
  name: string;
}

export interface StringState extends StringConfig {
  volume: number;
}
