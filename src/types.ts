export interface GameState {
  score: number;
  isGameOver: boolean;
  isStarted: boolean;
  lane: number; // -1, 0, 1
  isJumping: boolean;
  isSliding: boolean;
  speed: number;
}

export const LANES = [-2, 0, 2];
export const INITIAL_SPEED = 0.2;
export const MAX_SPEED = 0.5;
export const SPEED_INCREMENT = 0.0001;
