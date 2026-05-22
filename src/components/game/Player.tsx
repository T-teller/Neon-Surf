import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Group, Color } from 'three';
import { useGameStore, SHOP_ITEMS } from '../../store';

const LANE_WIDTH = 2.5;
const LANES = [-LANE_WIDTH, 0, LANE_WIDTH];

export function Player() {
  const groupRef = useRef<Group>(null);
  const headRef = useRef<Mesh>(null);
  const leftArmRef = useRef<Mesh>(null);
  const rightArmRef = useRef<Mesh>(null);
  const leftLegRef = useRef<Mesh>(null);
  const rightLegRef = useRef<Mesh>(null);

  const lane = useGameStore((state) => state.lane);
  const isJumping = useGameStore((state) => state.isJumping);
  const isSliding = useGameStore((state) => state.isSliding);
  const setJumping = useGameStore((state) => state.setJumping);
  const setSliding = useGameStore((state) => state.setSliding);
  const speed = useGameStore((state) => state.speed);
  const isStarted = useGameStore((state) => state.isStarted);
  const isGameOver = useGameStore((state) => state.isGameOver);
  const activePowerUps = useGameStore((state) => state.activePowerUps);

  const selectedSkinId = useGameStore((state) => state.selectedSkinId);
  const selectedSkin = useMemo(() => 
    SHOP_ITEMS.find(s => s.id === selectedSkinId) || SHOP_ITEMS[0],
    [selectedSkinId]
  );

  const isPaused = useGameStore((state) => state.isPaused);
  const [y, setY] = useState(0);
  const jumpTime = useRef(0);
  const slideTime = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current || isPaused) return;

    // Target X position based on lane
    const targetX = LANES[lane];
    groupRef.current.position.x += (targetX - groupRef.current.position.x) * 0.25;

    // Jump logic
    if (isJumping) {
      jumpTime.current += delta * 4;
      const jumpY = Math.sin(jumpTime.current * Math.PI) * 2.8;
      if (jumpTime.current >= 1) {
        setJumping(false);
        jumpTime.current = 0;
        setY(0);
      } else {
        setY(jumpY);
      }
    }

    // Slide logic
    if (isSliding) {
      slideTime.current += delta * 3;
      if (slideTime.current >= 1) {
        setSliding(false);
        slideTime.current = 0;
      }
    }

    // Animation state
    const t = state.clock.elapsedTime;
    const runCycle = t * 25 * speed;
    const isRunning = isStarted && !isGameOver && !isJumping && !isSliding;

    // Smooth limbs
    if (leftArmRef.current && rightArmRef.current && leftLegRef.current && rightLegRef.current) {
        if (isRunning) {
            // High speed "Naruto" run - arms back, aggressive leaning
            leftArmRef.current.rotation.x = 1.2 + Math.sin(runCycle) * 0.2;
            rightArmRef.current.rotation.x = 1.2 - Math.sin(runCycle) * 0.2;
            
            leftLegRef.current.rotation.x = Math.sin(runCycle) * 1.2;
            rightLegRef.current.rotation.x = -Math.sin(runCycle) * 1.2;
 
            // Forward lean
            groupRef.current.rotation.x = 0.3;
        } else if (isJumping) {
            // Jump pose: Arms wide/up, legs tucked or trailing
            leftArmRef.current.rotation.x = -0.5 - jumpTime.current * 2;
            rightArmRef.current.rotation.x = -0.5 - jumpTime.current * 2;
            leftLegRef.current.rotation.x = -0.5 + jumpTime.current;
            rightLegRef.current.rotation.x = -0.5 + jumpTime.current;
            
            groupRef.current.rotation.x = -0.2;
        } else if (isSliding) {
            // Slide pose: Low profile, arms tucked
            leftArmRef.current.rotation.x = -1.5;
            rightArmRef.current.rotation.x = -1.5;
            leftLegRef.current.rotation.x = 1.5;
            rightLegRef.current.rotation.x = 1.5;
            
            groupRef.current.rotation.x = 0.5;
        } else {
            // Idle
            leftArmRef.current.rotation.x = Math.sin(t * 2) * 0.1;
            rightArmRef.current.rotation.x = Math.sin(t * 2) * 0.1;
            leftLegRef.current.rotation.x = 0;
            rightLegRef.current.rotation.x = 0;
            groupRef.current.rotation.x = 0;
        }

        // Apply shared vertical animations (jump/bounce)
        const bounce = isRunning ? Math.abs(Math.sin(runCycle)) * 0.15 : 0;
        groupRef.current.position.y = y + bounce;
    }

    // Slide transformation (Keep scale logic but limb posing handled above)
    if (isSliding) {
      groupRef.current.scale.y = 0.5;
    } else {
      groupRef.current.scale.y = 1;
    }

    // Animation tilt
    const xVel = (targetX - groupRef.current.position.x);
    groupRef.current.rotation.z = -xVel * 0.4;
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 4) * 0.05;
  });

  const skinColor = "#ffe0bd";
  const outfitColor = selectedSkin.outfitColor;
  const accessoryColor = selectedSkin.accessoryColor || "#333333";
  const shoeColor = "#333333";

  const isFatWoman = selectedSkin.type === 'fat_woman';
  const isCowboy = selectedSkin.type === 'cowboy';
  const isFarmer = selectedSkin.type === 'farmer';
  const isModel = selectedSkin.type === 'model';

  return (
    <group ref={groupRef} position={[0, 0, 0]} rotation={[0, 0, 0]}>
      {/* Torso */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[isFatWoman ? 1.4 : 0.7, 0.8, isFatWoman ? 0.6 : 0.3]} />
        <meshToonMaterial color={outfitColor} />
      </mesh>

      {/* Head Group */}
      <group position={[0, 1.85, 0]}>
        <mesh ref={headRef} castShadow>
          <boxGeometry args={[0.5, 0.55, 0.5]} />
          <meshToonMaterial color={skinColor} />
          
          {/* Cartoon Eyes */}
          <mesh position={[0.12, 0.05, 0.26]}>
            <boxGeometry args={[0.12, 0.18, 0.01]} />
            <meshToonMaterial color="black" />
            <mesh position={[0.02, 0.04, 0.01]}>
              <boxGeometry args={[0.03, 0.03, 0.01]} />
              <meshBasicMaterial color="white" />
            </mesh>
          </mesh>
          <mesh position={[-0.12, 0.05, 0.26]}>
            <boxGeometry args={[0.12, 0.18, 0.01]} />
            <meshToonMaterial color="black" />
            <mesh position={[0.02, 0.04, 0.01]}>
              <boxGeometry args={[0.03, 0.03, 0.01]} />
              <meshBasicMaterial color="white" />
            </mesh>
          </mesh>
          
          {/* Character Details */}
          {isFarmer && (
            <group position={[0, 0.1, 0]}>
              <mesh position={[0, 0.15, 0]}>
                <cylinderGeometry args={[0.4, 0.6, 0.1, 32]} />
                <meshToonMaterial color={accessoryColor} />
              </mesh>
              <mesh position={[0, 0.3, 0]}>
                <cylinderGeometry args={[0.3, 0.3, 0.3, 32]} />
                <meshToonMaterial color={accessoryColor} />
              </mesh>
            </group>
          )}
          
          {isCowboy && (
            <group position={[0, 0.25, 0]} rotation={[0, 0, 0]}>
              <mesh scale={[1.4, 0.1, 1.4]}>
                <boxGeometry args={[0.8, 0.5, 0.8]} />
                <meshToonMaterial color={accessoryColor} />
              </mesh>
              <mesh position={[0, 0.2, 0]}>
                <boxGeometry args={[0.4, 0.4, 0.4]} />
                <meshToonMaterial color={accessoryColor} />
              </mesh>
            </group>
          )}

          {isModel && (
            <group position={[0, 0.3, 0]}>
              <mesh scale={[1.1, 1, 1.1]}>
                <boxGeometry args={[0.5, 0.1, 0.5]} />
                <meshToonMaterial color="#000000" />
              </mesh>
            </group>
          )}
        </mesh>

        {/* Character Hair/Hats */}
        {!isCowboy && !isFarmer && (
           <group position={[0, 0.3, 0]}>
             <mesh position={[0, 0, 0]}>
               <boxGeometry args={[0.6, 0.2, 0.6]} />
               <meshToonMaterial color={isModel ? "#ff00ff" : "#553311"} />
             </mesh>
             {/* Spikes for cartoon look */}
             {[-0.2, 0, 0.2].map((x, i) => (
               <mesh key={i} position={[x, 0.2, 0.1]} rotation={[Math.PI / 4, 0, 0]}>
                 <coneGeometry args={[0.15, 0.4, 4]} />
                 <meshToonMaterial color={isModel ? "#ff00ff" : "#553311"} />
               </mesh>
             ))}
           </group>
        )}
      </group>

      {/* Arms */}
      <group position={[isFatWoman ? -0.8 : -0.45, 1.5, 0]}>
        <mesh ref={leftArmRef} position={[0, -0.3, 0]} castShadow>
          <boxGeometry args={[0.2, 0.7, 0.2]} />
          <meshToonMaterial color={outfitColor} />
          <mesh position={[0, -0.4, 0]}>
            <boxGeometry args={[0.2, 0.2, 0.2]} />
            <meshToonMaterial color={skinColor} />
          </mesh>
        </mesh>
      </group>

      <group position={[isFatWoman ? 0.8 : 0.45, 1.5, 0]}>
        <mesh ref={rightArmRef} position={[0, -0.3, 0]} castShadow>
          <boxGeometry args={[0.2, 0.7, 0.2]} />
          <meshToonMaterial color={outfitColor} />
          <mesh position={[0, -0.4, 0]}>
            <boxGeometry args={[0.2, 0.2, 0.2]} />
            <meshToonMaterial color={skinColor} />
          </mesh>
        </mesh>
      </group>

      {/* Legs */}
      <group position={[-0.2, 0.8, 0]}>
        <mesh ref={leftLegRef} position={[0, -0.4, 0]} castShadow>
          <boxGeometry args={[isFatWoman ? 0.4 : 0.28, 0.8, isFatWoman ? 0.4 : 0.28]} />
          <meshToonMaterial color={isFarmer ? "#34495e" : outfitColor} />
          <mesh position={[0, -0.45, 0]}>
            <boxGeometry args={[isFatWoman ? 0.5 : 0.3, 0.15, 0.4]} />
            <meshToonMaterial color={shoeColor} />
          </mesh>
        </mesh>
      </group>

      <group position={[0.2, 0.8, 0]}>
        <mesh ref={rightLegRef} position={[0, -0.4, 0]} castShadow>
          <boxGeometry args={[isFatWoman ? 0.4 : 0.28, 0.8, isFatWoman ? 0.4 : 0.28]} />
          <meshToonMaterial color={isFarmer ? "#34495e" : outfitColor} />
          <mesh position={[0, -0.45, 0]}>
            <boxGeometry args={[isFatWoman ? 0.5 : 0.3, 0.15, 0.4]} />
            <meshToonMaterial color={shoeColor} />
          </mesh>
        </mesh>
      </group>
      
      {/* Power Up Effects */}
      {activePowerUps['shield'] && activePowerUps['shield'] > Date.now() && (
          <mesh position={[0, 1.2, 0]}>
              <sphereGeometry args={[1.5, 16, 16]} />
              <meshBasicMaterial color="#3498db" transparent opacity={0.2} wireframe />
          </mesh>
      )}

      {activePowerUps['invincibility'] && activePowerUps['invincibility'] > Date.now() && (
          <mesh position={[0, 1.2, 0]}>
              <sphereGeometry args={[1.7, 16, 16]} />
              <meshBasicMaterial color="#9b59b6" transparent opacity={0.1} />
          </mesh>
      )}
    </group>
  );
}

