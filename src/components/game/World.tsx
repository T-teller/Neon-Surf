import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars, Cloud } from '@react-three/drei';
import { useGameStore } from '../../store';
import { Group, Mesh, Vector3 } from 'three';
import confetti from 'canvas-confetti';

const LANE_WIDTH = 2.5;
const LANES = [-LANE_WIDTH, 0, LANE_WIDTH];

interface ObstacleData {
  id: number;
  lane: number;
  z: number;
  type: 'jump' | 'slide' | 'wall' | 'moving_side' | 'gate';
}

interface PowerUpData {
    id: number;
    lane: number;
    z: number;
    type: 'shield' | 'magnet' | 'speed_boost' | 'invincibility' | 'multiplier';
}

interface CoinData {
  id: number;
  lane: number;
  z: number;
}

export function World() {
  const speed = useGameStore((state) => state.speed);
  const isStarted = useGameStore((state) => state.isStarted);
  const isGameOver = useGameStore((state) => state.isGameOver);
  const isPaused = useGameStore((state) => state.isPaused);
  const score = useGameStore((state) => state.score);
  const coinsCollected = useGameStore((state) => state.coinsCollected);
  const addScore = useGameStore((state) => state.addScore);
  const collectCoin = useGameStore((state) => state.collectCoin);
  const endGame = useGameStore((state) => state.endGame);
  const increaseSpeed = useGameStore((state) => state.increaseSpeed);
  const activatePowerUp = useGameStore((state) => state.activatePowerUp);
  const activePowerUps = useGameStore((state) => state.activePowerUps);
  
  const laneIndex = useGameStore((state) => state.lane); // 0, 1, 2
  const isJumping = useGameStore((state) => state.isJumping);
  const isSliding = useGameStore((state) => state.isSliding);

  const [obstacles, setObstacles] = useState<ObstacleData[]>([]);
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUpData[]>([]);
  
  const obstaclesRef = useRef<ObstacleData[]>([]);
  const coinsRef = useRef<CoinData[]>([]);
  const powerUpsRef = useRef<PowerUpData[]>([]);
  const nextId = useRef(0);
  const spawnTimer = useRef(0);
  const powerUpTimer = useRef(0);

  // Clear nearby obstacles on revive
  useEffect(() => {
    if (isStarted && !isGameOver && !isPaused && !isReviveInitial.current) {
        // Find if we just revived
    }
  }, [isStarted, isGameOver, isPaused]);

  const isReviveInitial = useRef(true);
  useEffect(() => {
    if (isStarted) {
        if (!isReviveInitial.current) {
            // This is a revive
            obstaclesRef.current = obstaclesRef.current.filter(o => o.z > 20 || o.z < -5);
            setObstacles([...obstaclesRef.current]);
        }
        isReviveInitial.current = false;
    } else {
        isReviveInitial.current = true;
    }
  }, [isStarted]);

  // Speed lines particles
  const speedLines = useMemo(() => {
    return Array.from({ length: 40 }).map(() => ({
      pos: new Vector3(
        (Math.random() - 0.5) * 40,
        Math.random() * 20,
        Math.random() * 100
      ),
      speed: Math.random() * 0.5 + 0.5
    }));
  }, []);

  const linesRef = useRef<Group>(null);

  const lastScoreMilestone = useRef(0);
  useEffect(() => {
    if (score === 0) lastScoreMilestone.current = 0;
    if (score > lastScoreMilestone.current + 5000) {
        lastScoreMilestone.current = Math.floor(score / 5000) * 5000;
        activatePowerUp('multiplier', 15000); // 15s bonus for milestone
    }
  }, [score, activatePowerUp]);

  useFrame((state, delta) => {
    if (!isStarted || isGameOver || isPaused) return;

    increaseSpeed();
    
    // Speed boost effect
    let currentSpeed = speed;
    if (activePowerUps['speed_boost'] && activePowerUps['speed_boost'] > Date.now()) {
        currentSpeed *= 1.5;
    }

    // Animate speed lines
    if (linesRef.current) {
        linesRef.current.children.forEach((line, i) => {
            line.position.z -= currentSpeed * 200 * delta * speedLines[i].speed;
            if (line.position.z < -10) {
                line.position.z = 100;
            }
        });
    }

    // Spawn logic
    spawnTimer.current += delta;
    if (spawnTimer.current > 1.2 / (currentSpeed * 4)) {
      spawnTimer.current = 0;
      const spawnZ = 100;
      const spawnLane = Math.floor(Math.random() * 3);
      
      const rand = Math.random();
      let type: ObstacleData['type'] = 'wall';
      if (rand > 0.85) type = 'wall'; // Changed from moving_side to wall
      else if (rand > 0.75) type = 'gate';
      else if (rand > 0.5) type = 'jump';
      else if (rand > 0.35) type = 'slide';
      
      const newObs: ObstacleData = {
        id: nextId.current++,
        lane: spawnLane,
        z: spawnZ,
        type: type
      };
      
      obstaclesRef.current.push(newObs);
      setObstacles([...obstaclesRef.current]);

      if (Math.random() > 0.4) {
        const newCoin: CoinData = {
          id: nextId.current++,
          lane: (spawnLane + (Math.random() > 0.5 ? 1 : 2)) % 3,
          z: spawnZ
        };
        coinsRef.current.push(newCoin);
        setCoins([...coinsRef.current]);
      }

      // Spawn power-ups
      powerUpTimer.current += delta;
      if (powerUpTimer.current > 15 / (currentSpeed * 2)) {
          powerUpTimer.current = 0;
          const types: PowerUpData['type'][] = ['shield', 'magnet', 'speed_boost', 'invincibility', 'multiplier'];
          const type = types[Math.floor(Math.random() * types.length)];
          const newPowerUp: PowerUpData = {
              id: nextId.current++,
              lane: Math.floor(Math.random() * 3),
              z: 100,
              type: type
          };
          powerUpsRef.current.push(newPowerUp);
          setPowerUps([...powerUpsRef.current]);
      }
    }

    // Movement and Cleanup
    obstaclesRef.current.forEach(obs => {
      obs.z -= currentSpeed * 120 * delta;
    });
    coinsRef.current.forEach(coin => {
      coin.z -= currentSpeed * 120 * delta;
      
      // Magnet effect
      if (activePowerUps['magnet'] && activePowerUps['magnet'] > Date.now()) {
          const playerPosition = new Vector3(LANES[laneIndex], 1, 0);
          const coinPosition = new Vector3(LANES[coin.lane], 1, coin.z);
          const dist = playerPosition.distanceTo(coinPosition);
          if (dist < 15) {
              const dir = playerPosition.clone().sub(coinPosition).normalize();
              coin.z += dir.z * currentSpeed * 200 * delta;
              // We can't easily change laneIndex since it's an index, but we can interpolate X
              // For simplicity, let's just make them super close in Z and X
              if (coin.lane < laneIndex) coin.lane += 0.1;
              if (coin.lane > laneIndex) coin.lane -= 0.1;
          }
      }
    });

    powerUpsRef.current.forEach(pu => {
        pu.z -= currentSpeed * 120 * delta;
    });

    const offscreen = (item: any) => item.z < -10;
    if (obstaclesRef.current.some(offscreen)) {
      obstaclesRef.current = obstaclesRef.current.filter(o => !offscreen(o));
      setObstacles([...obstaclesRef.current]);
    }
    if (coinsRef.current.some(offscreen)) {
      coinsRef.current = coinsRef.current.filter(c => !offscreen(c));
      setCoins([...coinsRef.current]);
    }
    if (powerUpsRef.current.some(offscreen)) {
        powerUpsRef.current = powerUpsRef.current.filter(pu => !offscreen(pu));
        setPowerUps([...powerUpsRef.current]);
    }

    // Collision
    const t = state.clock.elapsedTime;
    obstaclesRef.current.forEach(obs => {
      let effectiveX = LANES[obs.lane];
      
      const playerX = LANES[laneIndex];
      
      if (Math.abs(obs.z - 0) < 1.3 && Math.abs(effectiveX - playerX) < 1.8) {
        let collision = false;
        
        if (obs.type === 'wall') collision = true;
        if (obs.type === 'jump' && !isJumping) collision = true;
        if (obs.type === 'slide' && !isSliding) collision = true;
        if (obs.type === 'gate') {
            const gateY = Math.sin(t * 5 + obs.id) * 1.5 + 1.5;
            // If gate is low, must jump
            if (gateY < 1.0 && !isJumping) collision = true;
            // If gate is middle, collide regardless? 
            if (gateY >= 1.0 && gateY <= 2.0) collision = true;
            // If gate is high, can run or slide
        }
        
        if (collision) endGame();
      }
    });

    coinsRef.current.forEach((coin, index) => {
      const playerX = LANES[laneIndex];
      // Slightly larger magnetic radius for actual pickup
      const pickupRadius = activePowerUps['magnet'] ? 2.5 : 1.5;
      if (Math.abs(LANES[Math.round(coin.lane)] - playerX) < pickupRadius && Math.abs(coin.z - 0) < 1.6) {
        collectCoin();
        coinsRef.current.splice(index, 1);
        setCoins([...coinsRef.current]);
        
        confetti({
          particleCount: 20,
          spread: 50,
          origin: { y: 0.8 },
          colors: ['#ffdd00', '#ff00ff', '#ffffff']
        });
      }
    });

    // Power-up Collision
    powerUpsRef.current.forEach((pu, index) => {
        const playerX = LANES[laneIndex];
        if (Math.abs(LANES[pu.lane] - playerX) < 1.5 && Math.abs(pu.z - 0) < 1.6) {
            activatePowerUp(pu.type, 10000); // 10 seconds
            powerUpsRef.current.splice(index, 1);
            setPowerUps([...powerUpsRef.current]);
            
            confetti({
                particleCount: 50,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#00ffff', '#ff00ff', '#ffffff']
            });
        }
    });

    addScore(Math.floor(delta * 150 * (activePowerUps['speed_boost'] ? 1.5 : 1)));
  });

  const isDay = coinsCollected >= 100;
  const skyColor = isDay ? "#a0d8ef" : "#1a1a2e";

  return (
    <group>
      {/* City Sky */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 40]}>
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial color={skyColor} />
      </mesh>

      {/* Road (Stylized) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 100]} receiveShadow>
        <planeGeometry args={[10, 400]} />
        <meshToonMaterial color={isDay ? "#4a4a4a" : "#1a1a2e"} />
      </mesh>

      {/* Road Markings (stylized chunky) */}
      <mesh position={[0, 0.01, 100]} rotation={[-Math.PI / 2, 0, 0]}>
         <planeGeometry args={[0.4, 400]} />
         <meshBasicMaterial color="#ffcc00" />
      </mesh>

      {/* Sidewalks */}
      {[-6.5, 6.5].map((x, i) => (
         <group key={i}>
            <mesh position={[x, 0.1, 100]} receiveShadow>
               <boxGeometry args={[3, 0.2, 400]} />
               <meshToonMaterial color="#888888" />
            </mesh>
            {/* Bystanders */}
            {[...Array(20)].map((_, j) => (
                <Bystander key={j} position={[x + (Math.random() - 0.5), 1, j * 20 - 50]} />
            ))}
         </group>
      ))}

      {/* Buildings */}
      {[-15, 15].map((x, i) => (
          <group key={i} position={[x, 0, 100]}>
              {[...Array(15)].map((_, j) => (
                  <Building key={j} position={[0, 0, j * 30 - 150]} />
              ))}
          </group>
      ))}

      {/* Speed Lines */}
      <group ref={linesRef}>
          {speedLines.map((line, i) => (
              <mesh key={i} position={line.pos}>
                  <boxGeometry args={[0.05, 0.05, 4]} />
                  <meshBasicMaterial color="white" transparent opacity={0.4} />
              </mesh>
          ))}
      </group>


      {obstacles.map(obs => (
        <ObstacleItem key={obs.id} data={obs} />
      ))}

      {coins.map(coin => (
        <group key={coin.id} position={[LANES[Math.round(coin.lane)], 1.2, coin.z]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 0.1, 16]} />
            <meshToonMaterial color="#ffcc00" />
          </mesh>
        </group>
      ))}

      {powerUps.map(pu => (
          <PowerUpItem key={pu.id} data={pu} />
      ))}

      {/* Some Clouds for that anime look */}
      <group position={[0, 10, -20]}>
        <Cloud opacity={isDay ? 0.5 : 0.2} speed={0.4} segments={20} color={isDay ? "white" : "#444"} />
        <Cloud position={[15, 5, -10]} opacity={isDay ? 0.5 : 0.2} speed={0.4} segments={20} color={isDay ? "white" : "#444"} />
        <Cloud position={[-15, 8, -30]} opacity={isDay ? 0.5 : 0.2} speed={0.4} segments={20} color={isDay ? "white" : "#444"} />
      </group>

      {!isDay && <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />}

      <Lights isDay={isDay} />
    </group>
  );
}

function PowerUpItem({ data }: { data: PowerUpData }) {
    const meshRef = useRef<Group>(null);
    const color = data.type === 'shield' ? '#3498db' : (data.type === 'magnet' ? '#f1c40f' : (data.type === 'speed_boost' ? '#e67e22' : (data.type === 'multiplier' ? '#27ae60' : '#9b59b6')));
    
    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.position.z = data.z;
            meshRef.current.rotation.y = state.clock.elapsedTime * 2;
            meshRef.current.position.y = 1.2 + Math.sin(state.clock.elapsedTime * 4) * 0.2;
        }
    });

    return (
        <group ref={meshRef} position={[LANES[data.lane], 1.2, data.z]}>
            <mesh castShadow>
                <octahedronGeometry args={[0.5]} />
                <meshToonMaterial color={color} emissive={color} emissiveIntensity={0.5} />
            </mesh>
            <mesh scale={[1.2, 1.2, 1.2]}>
                <octahedronGeometry args={[0.5]} />
                <meshToonMaterial color="white" transparent opacity={0.2} wireframe />
            </mesh>
        </group>
    );
}

function ObstacleItem({ data }: { data: ObstacleData }) {
  const meshRef = useRef<Group>(null);
  const isWall = data.type === 'wall';
  const isGate = data.type === 'gate';
  
  const color = isWall ? '#3498db' : (data.type === 'jump' ? '#e67e22' : (data.type === 'slide' ? '#2ecc71' : '#e74c3c'));
  const height = data.type === 'jump' ? 1.6 : (data.type === 'slide' ? 1.2 : (isGate ? 0.3 : 1.5));
  const yBase = data.type === 'slide' ? 2.8 : height / 2;

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.z = data.z;
      
      if (isGate) {
          meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 5 + data.id) * 1.5 + 1.5;
      }
    }
  });

  return (
    <group ref={meshRef} position={[LANES[data.lane], yBase, data.z]}>
      <mesh castShadow>
        <boxGeometry args={[2.2, height, 0.8]} />
        <meshToonMaterial color={color} />
        
        {isWall && (
            <>
                <mesh position={[0, 0.4, 1.8]}>
                    <boxGeometry args={[1.8, 0.6, 0.1]} />
                    <meshBasicMaterial color="#ccf2ff" />
                </mesh>
                <mesh position={[0.7, -0.2, 2.01]}>
                    <boxGeometry args={[0.4, 0.3, 0.1]} />
                    <meshBasicMaterial color="yellow" />
                </mesh>
                <mesh position={[-0.7, -0.2, 2.01]}>
                    <boxGeometry args={[0.4, 0.3, 0.1]} />
                    <meshBasicMaterial color="yellow" />
                </mesh>
            </>
        )}
        
        {isGate && (
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[3, 0.1, 0.1]} />
                <meshBasicMaterial color="red" />
            </mesh>
        )}
      </mesh>
    </group>
  );
}

function Building({ position }: { position: [number, number, number] }) {
    const coinsCollected = useGameStore((state) => state.coinsCollected);
    const isDay = coinsCollected >= 100;
    
    const height = useMemo(() => Math.random() * 15 + 15, []);
    const color = useMemo(() => {
        const colors = ['#3498db', '#9b59b6', '#2ecc71', '#e67e22', '#f1c40f'];
        return colors[Math.floor(Math.random() * colors.length)];
    }, []);

    return (
        <mesh position={[position[0], height/2, position[2]]}>
            <boxGeometry args={[8, height, 8]} />
            <meshToonMaterial color={color} />
            {/* Chunky Cartoon Windows */}
            {[...Array(5)].map((_, i) => (
                <mesh key={i} position={[position[0] > 0 ? -4.01 : 4.01, (i * 3) + 2 - height/2, 0]}>
                    <boxGeometry args={[0.2, 1.2, 3]} />
                    <meshBasicMaterial color={isDay ? "#ffffff" : "#ffffaa"} transparent opacity={isDay ? 0.8 : 1} />
                </mesh>
            ))}
            {/* Flat Roof Detail */}
            <mesh position={[0, height/2 + 0.1, 0]}>
                <boxGeometry args={[8.5, 0.2, 8.5]} />
                <meshToonMaterial color="#333" />
            </mesh>
        </mesh>
    );
}

function Bystander({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            <mesh position={[0, 0.4, 0]}>
                <boxGeometry args={[0.4, 0.8, 0.2]} />
                <meshToonMaterial color="#34495e" />
            </mesh>
            <mesh position={[0, 1, 0]}>
                <boxGeometry args={[0.3, 0.3, 0.3]} />
                <meshToonMaterial color="#ffe0bd" />
            </mesh>
        </group>
    );
}

function Lights({ isDay }: { isDay: boolean }) {
  return (
    <>
      <ambientLight intensity={isDay ? 1.2 : 0.4} />
      <directionalLight position={[20, 40, 10]} intensity={isDay ? 2 : 0.5} castShadow />
      <fog attach="fog" args={[isDay ? '#a0d8ef' : '#1a1a2e', 50, 200]} />
    </>
  );
}



