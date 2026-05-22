import { create } from 'zustand';

export interface ShopItem {
  id: string;
  name: string;
  price: number;
  type: 'cowboy' | 'man' | 'model' | 'farmer' | 'fat_woman' | 'rookie';
  outfitColor: string;
  accessoryColor?: string;
}

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'default', name: 'Rookie', price: 0, type: 'rookie', outfitColor: '#ffffff' },
  { id: 'cowboy', name: 'Wild West', price: 1500, type: 'cowboy', outfitColor: '#8b4513', accessoryColor: '#5d3b1a' },
  { id: 'man', name: 'Urban Gent', price: 1000, type: 'man', outfitColor: '#3498db' },
  { id: 'model', name: 'Catwalk', price: 2000, type: 'model', outfitColor: '#e91e63' },
  { id: 'farmer', name: 'Old McDonald', price: 1200, type: 'farmer', outfitColor: '#27ae60', accessoryColor: '#f1c40f' },
  { id: 'fat_woman', name: 'Big Mama', price: 2500, type: 'fat_woman', outfitColor: '#9b59b6' },
];

interface GameState {
  score: number;
  highScore: number;
  totalCoins: number;
  coinsCollected: number;
  unlockedSkins: string[];
  selectedSkinId: string;
  isGameOver: boolean;
  isStarted: boolean;
  isPaused: boolean;
  isMuted: boolean;
  activePowerUps: { [key: string]: number }; // type -> expiration time (ms)
  lane: number; // -1, 0, 1
  isJumping: boolean;
  isSliding: boolean;
  speed: number;
  canRevive: boolean;
  startGame: () => void;
  endGame: () => void;
  revive: () => void;
  resetGame: () => void;
  addScore: (points: number) => void;
  collectCoin: () => void;
  moveLeft: () => void;
  moveRight: () => void;
  jump: () => void;
  slide: () => void;
  setJumping: (val: boolean) => void;
  setSliding: (val: boolean) => void;
  increaseSpeed: () => void;
  buySkin: (skinId: string) => void;
  selectSkin: (skinId: string) => void;
  toggleMute: () => void;
  togglePause: () => void;
  activatePowerUp: (type: string, duration: number) => void;
}

export const useGameStore = create<GameState>((set) => ({
  score: 0,
  highScore: Number(localStorage.getItem('highScore')) || 0,
  totalCoins: Number(localStorage.getItem('totalCoins')) || 0,
  coinsCollected: 0,
  unlockedSkins: JSON.parse(localStorage.getItem('unlockedSkins') || '["default"]'),
  selectedSkinId: localStorage.getItem('selectedSkinId') || 'default',
  isGameOver: false,
  isStarted: false,
  isPaused: false,
  isMuted: localStorage.getItem('isMuted') === 'true',
  activePowerUps: {},
  lane: 1, // 0: left, 1: center, 2: right
  isJumping: false,
  isSliding: false,
  speed: 0.2,
  canRevive: true,

  startGame: () => set({ isStarted: true, isGameOver: false, isPaused: false, score: 0, coinsCollected: 0, speed: 0.2, lane: 1, canRevive: true, activePowerUps: {} }),
  endGame: () => set((state) => {
    // Check for shield or invincibility
    const now = Date.now();
    const hasShield = state.activePowerUps['shield'] && state.activePowerUps['shield'] > now;
    const hasInvincibility = state.activePowerUps['invincibility'] && state.activePowerUps['invincibility'] > now;

    if (hasInvincibility) return {}; // No game over

    if (hasShield) {
        const newPowerUps = { ...state.activePowerUps };
        delete newPowerUps['shield'];
        return { activePowerUps: newPowerUps };
    }

    const newHighScore = Math.max(state.score, state.highScore);
    const newCoins = state.totalCoins + state.coinsCollected;
    localStorage.setItem('highScore', String(newHighScore));
    localStorage.setItem('totalCoins', String(newCoins));
    return { 
      isGameOver: true, 
      isStarted: false, 
      isPaused: false,
      highScore: newHighScore,
      totalCoins: newCoins,
      activePowerUps: {}
    };
  }),
  revive: () => set({ isGameOver: false, isStarted: true, isPaused: false, canRevive: false, activePowerUps: {} }),
  resetGame: () => set({ isGameOver: false, isStarted: false, isPaused: false, score: 0, coinsCollected: 0, lane: 1, speed: 0.2, canRevive: true, activePowerUps: {} }),
  addScore: (points) => set((state) => {
    const hasMultiplier = state.activePowerUps['multiplier'] && state.activePowerUps['multiplier'] > Date.now();
    const multiplier = hasMultiplier ? 2 : 1;
    return { score: state.score + (points * multiplier) };
  }),
  
  collectCoin: () => set((state) => {
    const hasMultiplier = state.activePowerUps['multiplier'] && state.activePowerUps['multiplier'] > Date.now();
    const multiplier = hasMultiplier ? 2 : 1;
    return { coinsCollected: state.coinsCollected + multiplier };
  }),
  
  buySkin: (skinId) => set((state) => {
    const skin = SHOP_ITEMS.find(s => s.id === skinId);
    if (skin && state.totalCoins >= skin.price && !state.unlockedSkins.includes(skinId)) {
      const newCoins = state.totalCoins - skin.price;
      const newUnlocked = [...state.unlockedSkins, skinId];
      localStorage.setItem('totalCoins', String(newCoins));
      localStorage.setItem('unlockedSkins', JSON.stringify(newUnlocked));
      return { totalCoins: newCoins, unlockedSkins: newUnlocked };
    }
    return state;
  }),
  selectSkin: (skinId) => set(() => {
    localStorage.setItem('selectedSkinId', skinId);
    return { selectedSkinId: skinId };
  }),
  
  toggleMute: () => set((state) => {
    const newMuted = !state.isMuted;
    localStorage.setItem('isMuted', String(newMuted));
    return { isMuted: newMuted };
  }),
  
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  
  activatePowerUp: (type, duration) => set((state) => ({
    activePowerUps: {
        ...state.activePowerUps,
        [type]: Date.now() + duration
    }
  })),
  
  moveLeft: () => set((state) => ({ 
    lane: Math.max(0, state.lane - 1) 
  })),
  moveRight: () => set((state) => ({ 
    lane: Math.min(2, state.lane + 1) 
  })),
  
  jump: () => set({ isJumping: true }),
  slide: () => set({ isSliding: true }),
  
  setJumping: (val) => set({ isJumping: val }),
  setSliding: (val) => set({ isSliding: val }),
  
  increaseSpeed: () => set((state) => ({ 
    speed: Math.min(0.8, state.speed + 0.00005) 
  })),
}));
