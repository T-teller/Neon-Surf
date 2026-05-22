/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Player } from './components/game/Player';
import { World } from './components/game/World';
import { Overlay } from './components/ui/Overlay';
import { MusicPlayer } from './components/audio/MusicPlayer';
import { useGameStore } from './store';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

export default function App() {
  const moveLeft = useGameStore((state) => state.moveLeft);
  const moveRight = useGameStore((state) => state.moveRight);
  const jump = useGameStore((state) => state.jump);
  const slide = useGameStore((state) => state.slide);
  const isStarted = useGameStore((state) => state.isStarted);
  const isPaused = useGameStore((state) => state.isPaused);
  const isGameOver = useGameStore((state) => state.isGameOver);

  const togglePause = useGameStore((state) => state.togglePause);

  const gameStateRef = useRef({ isStarted, isGameOver, isPaused });
  useEffect(() => {
    gameStateRef.current = { isStarted, isGameOver, isPaused };
  }, [isStarted, isGameOver, isPaused]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const { isStarted, isGameOver, isPaused } = gameStateRef.current;
    if (e.key === 'Escape' && isStarted && !isGameOver) {
      togglePause();
      return;
    }

    if (!isStarted || isGameOver || isPaused) return;
    
    switch (e.key.toLowerCase()) {
      case 'a':
      case 'arrowleft':
        moveLeft();
        break;
      case 'd':
      case 'arrowright':
        moveRight();
        break;
      case 'w':
      case 'arrowup':
      case ' ':
        jump();
        break;
      case 's':
      case 'arrowdown':
        slide();
        break;
    }
  }, [moveLeft, moveRight, jump, slide, togglePause]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Touch Swipe Logic
  const startX = useRef(0);
  const startY = useRef(0);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const { isStarted, isGameOver, isPaused } = gameStateRef.current;
      if (!isStarted || isGameOver || isPaused) return;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = endX - startX.current;
      const diffY = endY - startY.current;

      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > 30) {
          if (diffX > 0) moveLeft();
          else moveRight();
        }
      } else {
        if (Math.abs(diffY) > 30) {
          if (diffY < 0) jump();
          else slide();
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [moveLeft, moveRight, jump, slide]);

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 4, -8]} fov={60} />
        {/* Adjusted camera to follow or stay fixed */}
        <OrbitControls 
          enablePan={false} 
          enableRotate={false} 
          enableZoom={false}
          target={[0, 1, 5]}
        />
        
        <World />
        <Player />
      </Canvas>

      <Overlay />
      <MusicPlayer />

      <style>{`
        body { margin: 0; padding: 0; user-select: none; -webkit-tap-highlight-color: transparent; }
        canvas { display: block; }
      `}</style>
    </div>
  );
}
