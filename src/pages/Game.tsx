import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import * as CANNON from "cannon-es";
import { GameHUD } from "@/components/GameHUD";
import { Link } from "wouter";
import { audioEngine } from "@/lib/audioEngine";

const SHARD_COUNT = 20;

// Biome X-axis boundaries (each biome is a 400-unit wide strip)
// Biome 0: Verdant Plains  x < -133
// Biome 1: Crystal Void   -133 < x < 133
// Biome 2: Ember Wastes    x > 133
function getBiomeIndex(x: number): number {
  if (x < -133) return 0;
  if (x < 133) return 1;
  return 2;
}

const BIOME_NAMES = ["Verdant Plains", "Crystal Void", "Ember Wastes"];

export default function Game() {
  const mountRef = useRef<HTMLDivElement>(null);

  const [shards, setShards] = useState(0);
  const [stamina, setStamina] = useState(1);
  const [biomeName, setBiomeName] = useState("Verdant Plains");
  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioStarted, setAudioStarted] = useState(false);

  const inputRef = useRef({
    joystick: { x: 0, y: 0 },
    keys: { forward: false, backward: false, left: false, right: false },
    sprint: false,
    jump: false,
    rear: false,
    cameraMode: 0,
  });

  const handleJoystick = useCallback((vector: { x: number; y: number }) => {
    inputRef.current.joystick = vector;
  }, []);

  const handleAction = useCallback((action: string) => {
    if (action === "SPRINT_START") inputRef.current.sprint = true;
    if (action === "SPRINT_END") inputRef.current.sprint = false;
    if (action === "JUMP") inputRef.current.jump = true;
    if (action === "REAR") inputRef.current.rear = true;
    if (action === "CAM") {
      inputRef.current.cameraMode = (inputRef.current.cameraMode + 1) % 3;
    }
  }, []);

  // Init audio on first user gesture
  const startAudio = useCallback(() => {
    if (audioStarted) return;
    audioEngine.init();
    audioEngine.setBiome(0);
    setAudioStarted(true);
  }, [audioStarted]);

  const handleMuteToggle = useCallback(() => {
    if (!audioStarted) { startAudio(); return; }
    const muted = audioEngine.toggleMute();
    setIsMuted(muted);
  }, [audioStarted, startAudio]);

  useEffect(() => {
    if (!mountRef.current) return;

    // SCENE SETUP
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a0f2e);
    scene.fog = new THREE.FogExp2(0x1a0f2e, 0.015);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch {
      return;
    }
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    // LIGHTING
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffaa55, 1);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 100;
    dirLight.shadow.camera.bottom = -100;
    dirLight.shadow.camera.left = -100;
    dirLight.shadow.camera.right = 100;
    scene.add(dirLight);

    // PHYSICS
    const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -20, 0) });
    world.broadphase = new CANNON.SAPBroadphase(world);

    const physicsMaterial = new CANNON.Material("standard");
    world.addContactMaterial(
      new CANNON.ContactMaterial(physicsMaterial, physicsMaterial, { friction: 0.1, restitution: 0.1 })
    );

    // HORSE
    const horseGroup = new THREE.Group();
    const horseMat = new THREE.MeshStandardMaterial({ color: 0xc48b4f, roughness: 0.8 });

    const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 2.5), horseMat);
    bodyMesh.position.y = 1.5;
    bodyMesh.castShadow = true;
    horseGroup.add(bodyMesh);

    const neckMesh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 0.6), horseMat);
    neckMesh.position.set(0, 2.2, 1.2);
    neckMesh.rotation.x = Math.PI / 6;
    neckMesh.castShadow = true;
    horseGroup.add(neckMesh);

    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 1), horseMat);
    headMesh.position.set(0, 2.6, 1.6);
    headMesh.castShadow = true;
    horseGroup.add(headMesh);

    const legGeo = new THREE.BoxGeometry(0.3, 1.5, 0.3);
    const legs: THREE.Mesh[] = [];
    [[-0.4, 0.75, 1], [0.4, 0.75, 1], [-0.4, 0.75, -1], [0.4, 0.75, -1]].forEach(pos => {
      const leg = new THREE.Mesh(legGeo, horseMat);
      leg.position.set(pos[0], pos[1], pos[2]);
      leg.castShadow = true;
      horseGroup.add(leg);
      legs.push(leg);
    });

    // Tail
    const tailMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.15), horseMat);
    tailMesh.position.set(0, 1.8, -1.35);
    tailMesh.rotation.x = Math.PI / 6;
    horseGroup.add(tailMesh);

    scene.add(horseGroup);

    // Horse Physics
    const horseBody = new CANNON.Body({
      mass: 500,
      material: physicsMaterial,
      position: new CANNON.Vec3(0, 5, 0),
      linearDamping: 0.8,
      angularDamping: 0.99,
      fixedRotation: true,
    });
    horseBody.addShape(new CANNON.Box(new CANNON.Vec3(0.5, 1, 1.25)), new CANNON.Vec3(0, 1.5, 0));
    world.addBody(horseBody);

    // GROUND
    const groundBody = new CANNON.Body({ mass: 0, material: physicsMaterial });
    groundBody.addShape(new CANNON.Plane());
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.addBody(groundBody);

    // Terrain
    const plainsGeo = new THREE.PlaneGeometry(800, 800, 64, 64);
    const posAttr = plainsGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      posAttr.setZ(i, Math.sin(x * 0.05) * 2 + Math.cos(y * 0.05) * 2);
    }
    plainsGeo.computeVertexNormals();
    const plainsMesh = new THREE.Mesh(plainsGeo, new THREE.MeshStandardMaterial({ color: 0x2d4c1e, roughness: 0.9 }));
    plainsMesh.rotation.x = -Math.PI / 2;
    plainsMesh.receiveShadow = true;
    scene.add(plainsMesh);

    // Crystal Void — floating platforms
    for (let i = 0; i < 18; i++) {
      const pw = 6 + Math.random() * 10;
      const pd = 6 + Math.random() * 10;
      const px = -100 + Math.random() * 200;
      const py = 2 + Math.random() * 18;
      const pz = -150 + Math.random() * 300;
      const pmesh = new THREE.Mesh(
        new THREE.BoxGeometry(pw, 0.5, pd),
        new THREE.MeshStandardMaterial({ color: 0x0e4a5c, emissive: 0x0e4a5c, emissiveIntensity: 0.2, roughness: 0.3 })
      );
      pmesh.position.set(px, py, pz);
      pmesh.castShadow = true; pmesh.receiveShadow = true;
      scene.add(pmesh);

      const platBody = new CANNON.Body({ mass: 0, material: physicsMaterial });
      platBody.addShape(new CANNON.Box(new CANNON.Vec3(pw / 2, 0.25, pd / 2)));
      platBody.position.set(px, py, pz);
      world.addBody(platBody);
    }

    // Ember Wastes — cracked emissive terrain tints
    const emberGeo = new THREE.PlaneGeometry(400, 800, 32, 32);
    const emberAttr = emberGeo.attributes.position;
    for (let i = 0; i < emberAttr.count; i++) {
      emberAttr.setZ(i, (Math.random() - 0.5) * 1.5);
    }
    emberGeo.computeVertexNormals();
    const emberMesh = new THREE.Mesh(emberGeo, new THREE.MeshStandardMaterial({ color: 0x5c1a0a, roughness: 1 }));
    emberMesh.rotation.x = -Math.PI / 2;
    emberMesh.position.x = 267; // biome 2 center
    emberMesh.receiveShadow = true;
    scene.add(emberMesh);

    // Ember particles
    const emberPGeo = new THREE.BufferGeometry();
    const ePCount = 400;
    const ePos = new Float32Array(ePCount * 3);
    for (let i = 0; i < ePCount; i++) {
      ePos[i * 3] = 133 + Math.random() * 267;
      ePos[i * 3 + 1] = Math.random() * 15;
      ePos[i * 3 + 2] = -400 + Math.random() * 800;
    }
    emberPGeo.setAttribute("position", new THREE.BufferAttribute(ePos, 3));
    const emberParticles = new THREE.Points(emberPGeo, new THREE.PointsMaterial({ color: 0xff4500, size: 0.3, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending }));
    scene.add(emberParticles);

    // Portals
    const portalMat = new THREE.MeshStandardMaterial({ color: 0x7c3aed, emissive: 0x7c3aed, emissiveIntensity: 0.5, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
    const portalGeo = new THREE.TorusGeometry(4, 0.4, 8, 32);
    const portal1 = new THREE.Mesh(portalGeo, portalMat.clone());
    portal1.position.set(-133, 5, 0);
    portal1.rotation.y = Math.PI / 2;
    scene.add(portal1);
    const portal2 = new THREE.Mesh(portalGeo, portalMat.clone());
    portal2.position.set(133, 5, 0);
    portal2.rotation.y = Math.PI / 2;
    scene.add(portal2);

    // Drift Shards
    const shardsArray: { mesh: THREE.Mesh; active: boolean; yBase: number; index: number }[] = [];
    const shardGeo = new THREE.OctahedronGeometry(0.8);
    const shardMat = new THREE.MeshStandardMaterial({ color: 0x14b8a6, emissive: 0x14b8a6, emissiveIntensity: 0.5 });
    for (let i = 0; i < SHARD_COUNT; i++) {
      const shard = new THREE.Mesh(shardGeo, shardMat);
      const angle = Math.random() * Math.PI * 2;
      const radius = 20 + Math.random() * 150;
      shard.position.set(Math.cos(angle) * radius, 2 + Math.random() * 5, Math.sin(angle) * radius);
      scene.add(shard);
      shardsArray.push({ mesh: shard, active: true, yBase: shard.position.y, index: i });
    }

    // KEYBOARD INPUT
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW": case "ArrowUp": inputRef.current.keys.forward = true; break;
        case "KeyS": case "ArrowDown": inputRef.current.keys.backward = true; break;
        case "KeyA": case "ArrowLeft": inputRef.current.keys.left = true; break;
        case "KeyD": case "ArrowRight": inputRef.current.keys.right = true; break;
        case "Space": inputRef.current.jump = true; e.preventDefault(); break;
        case "ShiftLeft": case "ShiftRight": inputRef.current.sprint = true; break;
        case "KeyC": inputRef.current.cameraMode = (inputRef.current.cameraMode + 1) % 3; break;
        case "KeyR": inputRef.current.rear = true; break;
        case "KeyM": audioEngine.toggleMute(); setIsMuted(m => !m); break;
      }
      startAudio();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW": case "ArrowUp": inputRef.current.keys.forward = false; break;
        case "KeyS": case "ArrowDown": inputRef.current.keys.backward = false; break;
        case "KeyA": case "ArrowLeft": inputRef.current.keys.left = false; break;
        case "KeyD": case "ArrowRight": inputRef.current.keys.right = false; break;
        case "ShiftLeft": case "ShiftRight": inputRef.current.sprint = false; break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // GAME LOOP STATE
    const clock = new THREE.Clock();
    let localStamina = 1;
    let localShards = 0;
    let rearTimer = 0;
    let horseYaw = 0;
    let lastBiome = -1;
    let wasAirborne = false;
    let prevVelY = 0;
    let audioReady = false;

    const checkAudio = () => {
      if (!audioReady) {
        try {
          if ((audioEngine as any).ctx) audioReady = true;
        } catch {}
      }
      return audioReady;
    };

    const animate = () => {
      requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.1);
      const time = clock.getElapsedTime();
      const input = inputRef.current;

      // ── Input & Physics ──
      let isMoving = false;

      if (rearTimer > 0) {
        rearTimer -= dt;
      } else if (input.rear) {
        rearTimer = 1.0;
        input.rear = false;
        if (checkAudio()) audioEngine.playRear();
      } else {
        let turnInput = -input.joystick.x;
        if (input.keys.left) turnInput = 1;
        if (input.keys.right) turnInput = -1;
        horseYaw += turnInput * 2.5 * dt;

        let moveInput = -input.joystick.y;
        if (input.keys.forward) moveInput = 1;
        if (input.keys.backward) moveInput = -1;

        if (Math.abs(moveInput) > 0.1) {
          isMoving = true;
          let speed = 15;
          if (input.sprint && localStamina > 0) {
            speed = 30;
            localStamina -= dt * 0.5;
          } else {
            localStamina += dt * 0.2;
          }
          const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), horseYaw);
          horseBody.applyForce(
            new CANNON.Vec3(forward.x * speed * moveInput * 100, 0, forward.z * speed * moveInput * 100),
            horseBody.position
          );
        } else {
          localStamina += dt * 0.4;
        }
      }

      localStamina = Math.max(0, Math.min(1, localStamina));

      const isOnGround = Math.abs(horseBody.velocity.y) < 0.5;

      if (input.jump && isOnGround) {
        horseBody.applyImpulse(new CANNON.Vec3(0, 3000, 0), horseBody.position);
        input.jump = false;
        if (checkAudio()) audioEngine.playJump();
      } else {
        input.jump = false;
      }

      // Land detection
      const isAirborne = Math.abs(horseBody.velocity.y) > 2;
      if (wasAirborne && !isAirborne && prevVelY < -3) {
        if (checkAudio()) audioEngine.playLand(Math.abs(prevVelY));
      }
      wasAirborne = isAirborne;
      prevVelY = horseBody.velocity.y;

      world.step(1 / 60, dt, 3);

      // ── Sync Graphics ──
      horseGroup.position.copy(horseBody.position as unknown as THREE.Vector3);
      horseGroup.rotation.y = horseYaw;

      // ── Horse Animation ──
      if (rearTimer > 0) {
        bodyMesh.rotation.x = -Math.PI / 4;
        neckMesh.rotation.x = Math.PI / 4;
        legs[0].rotation.x = -Math.PI / 3;
        legs[1].rotation.x = -Math.PI / 3;
      } else {
        bodyMesh.rotation.x = 0;
        neckMesh.rotation.x = Math.PI / 6;
        if (isMoving) {
          const sf = input.sprint && localStamina > 0 ? 15 : 8;
          legs[0].rotation.x = Math.sin(time * sf) * 0.5;
          legs[1].rotation.x = Math.sin(time * sf + Math.PI) * 0.5;
          legs[2].rotation.x = Math.sin(time * sf + Math.PI) * 0.5;
          legs[3].rotation.x = Math.sin(time * sf) * 0.5;
          tailMesh.rotation.x = Math.PI / 6 + Math.sin(time * sf * 0.5) * 0.2;
        } else {
          legs.forEach(l => (l.rotation.x = 0));
          tailMesh.rotation.x = Math.PI / 6 + Math.sin(time * 1.5) * 0.08;
        }
      }

      // ── Gallop Audio ──
      if (checkAudio() && isOnGround) {
        audioEngine.updateGallop(isMoving, input.sprint && localStamina > 0);
      } else if (!isOnGround && checkAudio()) {
        audioEngine.updateGallop(false, false);
      }

      // ── Shard Logic ──
      shardsArray.forEach(shardObj => {
        if (!shardObj.active) return;
        shardObj.mesh.rotation.y += dt;
        shardObj.mesh.position.y = shardObj.yBase + Math.sin(time * 2) * 0.5;

        if (shardObj.mesh.position.distanceTo(horseGroup.position) < 3) {
          shardObj.active = false;
          shardObj.mesh.visible = false;
          localShards++;
          if (checkAudio()) audioEngine.playShardCollect(shardObj.index);
        }
      });

      // ── Biome Detection ──
      const biomeIdx = getBiomeIndex(horseGroup.position.x);
      if (biomeIdx !== lastBiome) {
        lastBiome = biomeIdx;
        setBiomeName(BIOME_NAMES[biomeIdx]);

        // Biome fog & light
        const biomeColors = [0x1a3a1a, 0x050d1a, 0x2a0800];
        scene.fog = new THREE.FogExp2(biomeColors[biomeIdx], 0.015);
        scene.background = new THREE.Color(biomeColors[biomeIdx]);

        const lightColors = [0xffaa55, 0x33aaff, 0xff4400];
        dirLight.color.set(lightColors[biomeIdx]);

        if (checkAudio()) audioEngine.setBiome(biomeIdx);
      }

      // ── Portal glow ──
      const portalGlow = Math.sin(time * 2) * 0.3 + 0.5;
      (portal1.material as THREE.MeshStandardMaterial).emissiveIntensity = portalGlow;
      (portal2.material as THREE.MeshStandardMaterial).emissiveIntensity = portalGlow;

      // ── Ember particles drift ──
      const ePositions = emberPGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < ePCount; i++) {
        ePositions[i * 3 + 1] += dt * (0.5 + Math.sin(time + i) * 0.3);
        if (ePositions[i * 3 + 1] > 18) ePositions[i * 3 + 1] = 0;
      }
      emberPGeo.attributes.position.needsUpdate = true;

      // ── State Sync ──
      if (Math.random() < 0.1) {
        setStamina(localStamina);
        if (localShards !== shards) setShards(localShards);
      }

      renderer.render(scene, camera);
    };

    animate();
    setIsReady(true);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("resize", handleResize);
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
      renderer.dispose();
      audioEngine.destroy();
    };
  }, []);

  return (
    <div
      className="relative w-full h-[100dvh] bg-black overflow-hidden select-none"
      onPointerDown={startAudio}
    >
      <div ref={mountRef} className="absolute inset-0" />

      {!isReady && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background">
          <div className="text-primary font-cinzel text-2xl animate-pulse">Loading Realm...</div>
        </div>
      )}

      {/* Top-right controls */}
      <div className="absolute top-4 right-4 z-[60] flex gap-2 items-center">
        <button
          onClick={handleMuteToggle}
          data-testid="btn-mute"
          className="bg-black/50 backdrop-blur-md border border-white/10 text-white/70 px-3 py-2 rounded-full text-xs font-cinzel hover:bg-white/10 transition-colors"
          title="Toggle sound (M)"
        >
          {isMuted ? "SOUND OFF" : "SOUND ON"}
        </button>
        <Link href="/">
          <button
            data-testid="btn-exit"
            className="bg-black/50 backdrop-blur-md border border-white/10 text-white/50 px-4 py-2 rounded-full text-xs font-cinzel hover:bg-white/10 transition-colors"
          >
            EXIT TO HUB
          </button>
        </Link>
      </div>

      {/* Keyboard hint (desktop only) */}
      {isReady && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[55] hidden md:flex gap-3 text-[10px] text-white/30 font-mono pointer-events-none">
          <span>WASD — move</span>
          <span>SHIFT — sprint</span>
          <span>SPACE — jump</span>
          <span>R — rear up</span>
          <span>C — camera</span>
          <span>M — mute</span>
        </div>
      )}

      <GameHUD
        shards={shards}
        totalShards={SHARD_COUNT}
        biomeName={biomeName}
        stamina={stamina}
        onMove={handleJoystick}
        onAction={handleAction}
      />
    </div>
  );
}
