import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore, SHOP_ITEMS } from '../../store';
import { Trophy, Play, RotateCcw, Rocket, ShoppingBag, Coins, Check, Lock, Volume2, VolumeX, Pause, Shield, Magnet, Zap, Star, TrendingUp } from 'lucide-react';

import * as Tone from 'tone';

export function Overlay() {
  const isStarted = useGameStore((state) => state.isStarted);
  const isGameOver = useGameStore((state) => state.isGameOver);
  const score = useGameStore((state) => state.score);
  const coinsCollected = useGameStore((state) => state.coinsCollected);
  const highScore = useGameStore((state) => state.highScore);
  const totalCoins = useGameStore((state) => state.totalCoins);
  const unlockedSkins = useGameStore((state) => state.unlockedSkins);
  const selectedSkinId = useGameStore((state) => state.selectedSkinId);
  const isMuted = useGameStore((state) => state.isMuted);
  const isPaused = useGameStore((state) => state.isPaused);
  const activePowerUps = useGameStore((state) => state.activePowerUps);
  const togglePause = useGameStore((state) => state.togglePause);
  const startGame = useGameStore((state) => state.startGame);
  const revive = useGameStore((state) => state.revive);
  const canRevive = useGameStore((state) => state.canRevive);
  const buySkin = useGameStore((state) => state.buySkin);
  const selectSkin = useGameStore((state) => state.selectSkin);
  const toggleMute = useGameStore((state) => state.toggleMute);
  const resetGame = useGameStore((state) => state.resetGame);

  const [showShop, setShowShop] = useState(false);

  const handleStart = async () => {
    await Tone.start();
    startGame();
  };

  const handleToggleMute = async () => {
    await Tone.start();
    toggleMute();
  };

  return (
    <div className="fixed inset-0 pointer-events-none select-none font-sans text-white overflow-hidden">
      {/* HUD */}
      {isStarted && !isGameOver && (
        <>
          <div className="absolute top-8 left-8 flex flex-col gap-0 drop-shadow-[0_4px_0_rgba(0,0,0,0.5)]">
            <div className="text-xl font-black italic text-yellow-400 uppercase tracking-tighter">Coins</div>
            <div className="text-6xl font-black italic tracking-tighter -mt-2">{coinsCollected}</div>
          </div>

          <div className="absolute top-32 left-8 flex flex-col gap-3 pointer-events-none">
            {Object.entries(activePowerUps).map(([type, expiry]) => {
                const timeLeft = Math.max(0, expiry - Date.now());
                if (timeLeft <= 0) return null;
                
                const icons: { [key: string]: any } = {
                    shield: <Shield className="w-5 h-5 text-blue-400" />,
                    magnet: <Magnet className="w-5 h-5 text-yellow-400" />,
                    speed_boost: <Zap className="w-5 h-5 text-orange-400" />,
                    invincibility: <Star className="w-5 h-5 text-purple-400" />,
                    multiplier: <TrendingUp className="w-5 h-5 text-green-400" />,
                };

                const names: { [key: string]: string } = {
                    shield: 'Shielded',
                    magnet: 'Magnet',
                    speed_boost: 'Adrenaline',
                    invincibility: 'Immortal',
                    multiplier: 'X2 Coins',
                };

                return (
                    <motion.div 
                        key={type}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 border-l-4 border-white/30 skew-x-[-12deg]"
                    >
                        <div className="skew-x-[12deg]">{icons[type]}</div>
                        <div className="flex flex-col skew-x-[12deg]">
                            <span className="text-[10px] font-black uppercase text-white/50 leading-none mb-1">{names[type]}</span>
                            <div className="h-1 w-20 bg-white/10 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-white"
                                    initial={{ width: "100%" }}
                                    animate={{ width: "0%" }}
                                    transition={{ duration: timeLeft / 1000, ease: "linear" }}
                                />
                            </div>
                        </div>
                    </motion.div>
                );
            })}
          </div>
          
          <button 
            onClick={handleToggleMute}
            className="absolute top-8 right-8 pointer-events-auto p-3 bg-black/40 hover:bg-black transition-colors rounded-full border border-white/20 active:scale-90"
          >
            {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </button>

          <button 
            onClick={togglePause}
            className="absolute top-24 right-8 pointer-events-auto p-3 bg-black/40 hover:bg-black transition-colors rounded-full border border-white/20 active:scale-90"
          >
            <Pause className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Start Screen */}
      <AnimatePresence>
        {!isStarted && !isGameOver && !showShop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-sky-400/20 backdrop-blur-[2px] pointer-events-auto"
          >
            {/* Background speed lines */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <div 
                        key={i} 
                        className="absolute bg-white h-[2px]" 
                        style={{ 
                            width: Math.random() * 200 + 100 + 'px', 
                            top: Math.random() * 100 + '%', 
                            left: Math.random() * 100 + '%',
                            transform: 'skewX(-45deg)'
                        }} 
                    />
                ))}
            </div>

            <motion.div
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: -2 }}
              className="relative"
            >
                <h1 className="text-9xl font-black italic tracking-tighter text-white drop-shadow-[8px_8px_0_rgba(255,0,255,0.8)] leading-tight">
                    SURF<br/>DASH!!
                </h1>
                <div className="absolute -top-4 -right-4 bg-yellow-400 text-black px-4 py-1 font-black italic -rotate-12 transform scale-125">NEW!!</div>
            </motion.div>
            
            <p className="text-white uppercase tracking-[0.3em] mt-8 mb-12 text-lg font-black italic drop-shadow-md">Infinite Anime Runner</p>

            <button 
                onClick={handleToggleMute}
                className="absolute top-8 right-8 pointer-events-auto p-4 bg-white text-black hover:bg-magenta-500 hover:text-white transition-all shadow-[4px_4px_0_rgba(0,0,0,0.3)] active:scale-95"
            >
                {isMuted ? <VolumeX className="w-8 h-8" /> : <Volume2 className="w-8 h-8" />}
            </button>
            
            <div className="flex flex-col gap-4 w-full max-w-xs px-4">
              <button
                onClick={handleStart}
                className="group relative flex items-center justify-center px-16 py-6 bg-white text-black font-black uppercase italic tracking-widest -skew-x-12 hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-[8px_8px_0_rgba(0,0,0,0.3)]"
              >
                <Play className="w-8 h-8 mr-3 fill-current" />
                Go!! Go!!
              </button>

              <button
                onClick={() => setShowShop(true)}
                className="group relative flex items-center justify-center px-12 py-4 bg-yellow-400 text-black font-black uppercase italic tracking-widest -skew-x-12 hover:bg-white transition-all cursor-pointer shadow-[6px_6px_0_rgba(0,0,0,0.3)]"
              >
                <ShoppingBag className="w-6 h-6 mr-3" />
                Character Shop
              </button>
            </div>

            <div className="mt-12 flex gap-4 items-center bg-black/60 px-6 py-2 rounded-full border border-white/20">
               <Coins className="w-5 h-5 text-yellow-400" />
               <span className="font-black italic text-xl tracking-tight">{totalCoins} <span className="text-xs uppercase ml-1 opacity-50">Saved</span></span>
            </div>

            <div className="mt-12 flex gap-8 text-xs font-black uppercase tracking-widest opacity-70">
              <div className="bg-black/50 p-2 px-6 rounded-full border border-white/10">A / D · Lane</div>
              <div className="bg-black/50 p-2 px-6 rounded-full border border-white/10">W · Jump</div>
              <div className="bg-black/50 p-2 px-6 rounded-full border border-white/10">S · Slide</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shop View */}
      <AnimatePresence>
        {showShop && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 bg-white pointer-events-auto p-8 overflow-y-auto"
          >
            <div className="max-w-4xl mx-auto flex flex-col h-full">
               <div className="flex justify-between items-end mb-12">
                  <div>
                    <h2 className="text-black text-6xl font-black italic tracking-tighter leading-none">CHARACTER SHOP</h2>
                    <p className="text-black/40 font-black uppercase tracking-widest mt-2">Drip out your runner with coins</p>
                  </div>
                  <button 
                    onClick={() => setShowShop(false)}
                    className="bg-black text-white px-8 py-4 font-black italic -skew-x-6 hover:bg-magenta-600 transition-colors cursor-pointer"
                  >
                    BACK
                  </button>
               </div>

               <div className="bg-yellow-400 p-6 -skew-x-6 mb-12 flex justify-between items-center shadow-[8px_8px_0_rgba(0,0,0,0.1)]">
                  <span className="text-black font-black uppercase italic tracking-widest text-lg">Your Balance</span>
                  <div className="flex items-center gap-3">
                    <Coins className="w-8 h-8 text-black" />
                    <span className="text-black text-5xl font-black italic">{totalCoins}</span>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                  {SHOP_ITEMS.map((skin) => {
                    const isUnlocked = unlockedSkins.includes(skin.id);
                    const isSelected = selectedSkinId === skin.id;
                    const canAfford = totalCoins >= skin.price;

                    return (
                      <div 
                        key={skin.id}
                        className={`p-6 border-4 -skew-x-2 transition-all ${isSelected ? 'border-magenta-500 bg-magenta-50' : 'border-black bg-gray-50'}`}
                      >
                         <div className="flex justify-between items-start mb-6">
                            <div>
                              <h3 className="text-black text-2xl font-black italic uppercase tracking-tighter">{skin.name}</h3>
                              <div className="flex gap-2 mt-2">
                                 <div className="w-6 h-6 rounded-sm border border-black/10" style={{ backgroundColor: skin.outfitColor }}></div>
                                 {skin.accessoryColor && (
                                   <div className="w-6 h-6 rounded-sm border border-black/10" style={{ backgroundColor: skin.accessoryColor }}></div>
                                 )}
                              </div>
                            </div>
                            {!isUnlocked && (
                              <div className="flex items-center gap-2 text-black font-black italic">
                                <Coins className="w-5 h-5 text-yellow-500" />
                                <span className="text-xl">{skin.price}</span>
                              </div>
                            )}
                         </div>

                         {isSelected ? (
                           <div className="w-full bg-magenta-500 text-white font-black py-4 flex items-center justify-center gap-2 uppercase italic tracking-widest">
                             <Check className="w-5 h-5" /> Active
                           </div>
                         ) : isUnlocked ? (
                           <button 
                             onClick={() => selectSkin(skin.id)}
                             className="w-full bg-black text-white font-black py-4 uppercase italic tracking-widest hover:bg-magenta-600 transition-colors cursor-pointer"
                           >
                             Select
                           </button>
                         ) : (
                           <button 
                             onClick={() => buySkin(skin.id)}
                             disabled={!canAfford}
                             className={`w-full font-black py-4 uppercase italic tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 
                               ${canAfford ? 'bg-yellow-400 text-black hover:bg-black hover:text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'}`}
                           >
                             {canAfford ? 'Unlock' : <><Lock className="w-4 h-4" /> Not Enough Coins</>}
                           </button>
                         )}
                      </div>
                    );
                  })}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Screen */}
      <AnimatePresence>
        {isGameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/40 pointer-events-auto"
          >
            <motion.div 
               initial={{ y: 100, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="bg-white p-12 -skew-x-6 shadow-[16px_16px_0_rgba(0,0,0,0.5)] flex flex-col items-center"
            >
                <div className="text-black text-7xl font-black italic mb-2 tracking-tighter">FINISH!!</div>
                
                <div className="flex gap-16 items-center my-8 text-black">
                   <div className="text-center">
                      <div className="text-sm font-black uppercase tracking-widest opacity-40 mb-1">Coins</div>
                      <div className="text-6xl font-black italic">{coinsCollected}</div>
                   </div>
                   <div className="text-center">
                      <div className="text-sm font-black uppercase tracking-widest opacity-40 mb-1">Total</div>
                      <div className="text-6xl font-black italic text-magenta-600">{totalCoins}</div>
                   </div>
                </div>

                <div className="flex gap-4">
                  {canRevive && (
                    <button
                      onClick={revive}
                      className="flex items-center gap-3 px-12 py-5 bg-cyan-400 text-black font-black uppercase italic tracking-widest hover:bg-white transition-all cursor-pointer shadow-[8px_8px_0_rgba(0,0,0,0.2)]"
                    >
                      <Rocket className="w-6 h-6 animate-pulse" />
                      Save Me!!
                    </button>
                  )}
                  
                  <div className="flex flex-col gap-4">
                    <button
                      onClick={handleStart}
                      className="flex items-center gap-3 px-12 py-5 bg-black text-white font-black uppercase italic tracking-widest hover:bg-magenta-600 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-6 h-6" />
                      {canRevive ? "Restart" : "New Run"}
                    </button>

                    <button
                      onClick={resetGame}
                      className="flex items-center justify-center gap-3 px-12 py-4 bg-gray-200 text-black font-black uppercase italic tracking-widest hover:bg-white transition-all cursor-pointer shadow-[4px_4px_0_rgba(0,0,0,0.1)]"
                    >
                      Menu
                    </button>
                  </div>
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pause Menu */}
      <AnimatePresence>
        {isPaused && !isGameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 pointer-events-auto backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white p-12 -skew-x-2 shadow-[20px_20px_0_rgba(255,0,255,0.4)] flex flex-col items-center max-w-sm w-full"
            >
              <h2 className="text-black text-6xl font-black italic tracking-tighter mb-8 leading-none">PAUSED</h2>
              
              <div className="flex flex-col gap-4 w-full">
                <button
                  onClick={togglePause}
                  className="flex items-center justify-center gap-3 px-12 py-5 bg-black text-white font-black uppercase italic tracking-widest hover:bg-magenta-600 transition-colors cursor-pointer text-xl"
                >
                  <Play className="w-6 h-6 fill-current" />
                  Continue
                </button>
                
                <button
                  onClick={resetGame}
                  className="flex items-center justify-center gap-3 px-12 py-4 bg-gray-100 text-black font-black uppercase italic tracking-widest hover:bg-gray-200 transition-all cursor-pointer shadow-[6px_6px_0_rgba(0,0,0,0.1)]"
                >
                  Quit to Menu
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

