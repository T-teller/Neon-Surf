import React, { useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { useGameStore } from '../../store';

export function MusicPlayer() {
  const isStarted = useGameStore((state) => state.isStarted);
  const isGameOver = useGameStore((state) => state.isGameOver);
  const isMuted = useGameStore((state) => state.isMuted);
  const speed = useGameStore((state) => state.speed);

  const isPaused = useGameStore((state) => state.isPaused);
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const bassRef = useRef<Tone.MonoSynth | null>(null);
  const drumRef = useRef<Tone.MembraneSynth | null>(null);
  const windRef = useRef<Tone.Noise | null>(null);
  const droneRef = useRef<Tone.Oscillator | null>(null);
  const loopRef = useRef<Tone.Loop | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    // Initialize synths and effects
    const limiter = new Tone.Limiter(-6).toDestination();
    const delay = new Tone.FeedbackDelay("8n", 0.5).connect(limiter);
    
    synthRef.current = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.1, decay: 0.3, sustain: 0.4, release: 2 }
    }).connect(delay);

    bassRef.current = new Tone.MonoSynth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.2, decay: 0.4, sustain: 0.8, release: 1 }
    }).toDestination();

    drumRef.current = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 4,
        oscillator: { type: 'sine' }
    }).toDestination();

    // Ambient Wind (Pink Noise with LFO-modulated Filter)
    const windFilter = new Tone.AutoFilter({
        frequency: "4n",
        baseFrequency: 200,
        octaves: 1.5,
        type: "sine",
        filter: { 
            type: "lowpass",
            rolloff: -12,
            Q: 0.5
        }
    }).connect(limiter).start();
    
    windRef.current = new Tone.Noise("pink").connect(windFilter);
    windRef.current.volume.value = -Infinity; // Start silent

    // Low City/Drone Hum
    droneRef.current = new Tone.Oscillator({
        frequency: "A1",
        type: "sine",
        volume: -Infinity
    }).connect(limiter);

    // Create a smooth piano-like loop
    loopRef.current = new Tone.Loop((time) => {
        // Soft kick on 1 and 3
        if (Tone.Transport.position.toString().split(':')[1] === '0' || Tone.Transport.position.toString().split(':')[1] === '2') {
             drumRef.current?.triggerAttackRelease("C1", "8n", time, 0.4);
        }
        
        // Smooth Bass
        bassRef.current?.triggerAttackRelease("F1", "2n", time, 0.3);
        
        // Piano stabs
        const chords = [
            ["F3", "A3", "C4"],
            ["G3", "B3", "D4"],
            ["A3", "C4", "E4"],
            ["E3", "G3", "B3"]
        ];
        const measure = Math.floor(parseInt(Tone.Transport.position.toString().split(':')[0]) % 4);
        synthRef.current?.triggerAttackRelease(chords[measure], "2n", time, 0.5);
    }, "1n");

    initialized.current = true;

    return () => {
      Tone.Transport.stop();
      loopRef.current?.dispose();
      synthRef.current?.dispose();
      bassRef.current?.dispose();
      drumRef.current?.dispose();
      windRef.current?.dispose();
      droneRef.current?.dispose();
    };
  }, []);

  // Control playback based on game state
  useEffect(() => {
    if (!isMuted) {
        Tone.start();
        
        // Ambient Drone stays on if not muted, even in menus
        droneRef.current?.start();
        droneRef.current?.volume.rampTo(-35, 2);

        if (isStarted && !isGameOver && !isPaused) {
            Tone.Transport.start();
            loopRef.current?.start(0);
            
            // Start Wind
            windRef.current?.start();
            windRef.current?.volume.rampTo(-24, 1);
        } else {
            Tone.Transport.pause();
            loopRef.current?.stop();
            
            // Fade out wind
            windRef.current?.volume.rampTo(-Infinity, 1);
        }
    } else {
        Tone.Transport.pause();
        loopRef.current?.stop();
        if (windRef.current) windRef.current.volume.value = -Infinity;
        if (droneRef.current) droneRef.current.volume.value = -Infinity;
    }
  }, [isStarted, isGameOver, isMuted, isPaused]);

  // Adjust BPM and Wind intensity based on speed
  useEffect(() => {
    // Speed range: 0.2 - 0.8
    const targetBpm = 120 + (speed * 100); 
    Tone.Transport.bpm.rampTo(targetBpm, 0.5);

    // Wind gets louder/higher at speed
    if (windRef.current && !isMuted && isStarted && !isGameOver && !isPaused) {
        const windTarget = -24 + (speed * 15); // -15 to -9 ish
        windRef.current.volume.rampTo(windTarget, 0.5);
    }
  }, [speed, isMuted, isStarted, isGameOver, isPaused]);

  return null;
}
