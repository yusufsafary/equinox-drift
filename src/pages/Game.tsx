import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import * as CANNON from "cannon-es";
import { GameHUD } from "@/components/GameHUD";
import { Link } from "wouter";

const SHARD_COUNT = 20;

export default function Game() {
  const mountRef = useRef<HTMLDivElement>(null);
  
  // Game State
  const [shards, setShards] = useState(0);
  const [stamina, setStamina] = useState(1);
  const [biomeName, setBiomeName] = useState("Verdant Plains");
  const [isReady, setIsReady] = useState(false);

  // Input Refs
  const inputRef = useRef({
    joystick: { x: 0, y: 0 },
    keys: { forward: false, backward: false, left: false, right: false },
    sprint: false,
    jump: false,
    rear: false,
    cameraMode: 0 // 0=Chase, 1=FP, 2=Cinematic
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
    const world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -20, 0)
    });
    world.broadphase = new CANNON.SAPBroadphase(world);

    const physicsMaterial = new CANNON.Material("standard");
    const physicsContactMaterial = new CANNON.ContactMaterial(
      physicsMaterial, physicsMaterial, { friction: 0.1, restitution: 0.1 }
    );
    world.addContactMaterial(physicsContactMaterial);

    // HORSE
    const horseGroup = new THREE.Group();
    
    const horseMat = new THREE.MeshStandardMaterial({ color: 0xc48b4f, roughness: 0.8 });
    
    // Body
    const bodyGeo = new THREE.BoxGeometry(1, 1, 2.5);
    const bodyMesh = new THREE.Mesh(bodyGeo, horseMat);
    bodyMesh.position.y = 1.5;
    bodyMesh.castShadow = true;
    horseGroup.add(bodyMesh);

    // Head/Neck
    const neckGeo = new THREE.BoxGeometry(0.6, 1.2, 0.6);
    const neckMesh = new THREE.Mesh(neckGeo, horseMat);
    neckMesh.position.set(0, 2.2, 1.2);
    neckMesh.rotation.x = Math.PI / 6;
    neckMesh.castShadow = true;
    horseGroup.add(neckMesh);

    const headGeo = new THREE.BoxGeometry(0.5, 0.5, 1);
    const headMesh = new THREE.Mesh(headGeo, horseMat);
    headMesh.position.set(0, 2.6, 1.6);
    headMesh.castShadow = true;
    horseGroup.add(headMesh);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.3, 1.5, 0.3);
    const legs: THREE.Mesh[] = [];
    const legPositions = [
      [-0.4, 0.75, 1], [0.4, 0.75, 1], [-0.4, 0.75, -1], [0.4, 0.75, -1]
    ];
    
    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeo, horseMat);
      leg.position.set(pos[0], pos[1], pos[2]);
      leg.castShadow = true;
      horseGroup.add(leg);
      legs.push(leg);
    });

    scene.add(horseGroup);

    // Horse Physics Body
    const horseShape = new CANNON.Box(new CANNON.Vec3(0.5, 1, 1.25));
    const horseBody = new CANNON.Body({
      mass: 500,
      material: physicsMaterial,
      position: new CANNON.Vec3(0, 5, 0),
      linearDamping: 0.8,
      angularDamping: 0.99,
      fixedRotation: true
    });
    horseBody.addShape(horseShape, new CANNON.Vec3(0, 1.5, 0));
    world.addBody(horseBody);

    // TERRAIN & BIOMES
    // We create a big plane for ground
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0, material: physicsMaterial });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.addBody(groundBody);

    const plainsGeo = new THREE.PlaneGeometry(800, 800, 64, 64);
    const posAttribute = plainsGeo.attributes.position;
    for (let i = 0; i < posAttribute.count; i++) {
      const x = posAttribute.getX(i);
      const y = posAttribute.getY(i);
      const z = Math.sin(x * 0.05) * 2 + Math.cos(y * 0.05) * 2;
      posAttribute.setZ(i, z);
    }
    plainsGeo.computeVertexNormals();

    const plainsMat = new THREE.MeshStandardMaterial({ color: 0x2d4c1e, roughness: 0.9 });
    const plainsMesh = new THREE.Mesh(plainsGeo, plainsMat);
    plainsMesh.rotation.x = -Math.PI / 2;
    plainsMesh.receiveShadow = true;
    scene.add(plainsMesh);

    // Shards
    const shardsArray: { mesh: THREE.Mesh, active: boolean, yBase: number }[] = [];
    const shardGeo = new THREE.OctahedronGeometry(0.8);
    const shardMat = new THREE.MeshStandardMaterial({ color: 0x14b8a6, emissive: 0x14b8a6, emissiveIntensity: 0.5 });
    
    for (let i = 0; i < SHARD_COUNT; i++) {
      const shard = new THREE.Mesh(shardGeo, shardMat);
      const angle = Math.random() * Math.PI * 2;
      const radius = 20 + Math.random() * 150;
      shard.position.set(Math.cos(angle) * radius, 2 + Math.random() * 5, Math.sin(angle) * radius);
      scene.add(shard);
      shardsArray.push({ mesh: shard, active: true, yBase: shard.position.y });
    }

    // Input Events Desktop
    const handleKeyDown = (e: KeyboardEvent) => {
      switch(e.code) {
        case 'KeyW': case 'ArrowUp': inputRef.current.keys.forward = true; break;
        case 'KeyS': case 'ArrowDown': inputRef.current.keys.backward = true; break;
        case 'KeyA': case 'ArrowLeft': inputRef.current.keys.left = true; break;
        case 'KeyD': case 'ArrowRight': inputRef.current.keys.right = true; break;
        case 'Space': inputRef.current.jump = true; break;
        case 'ShiftLeft': case 'ShiftRight': inputRef.current.sprint = true; break;
        case 'KeyC': inputRef.current.cameraMode = (inputRef.current.cameraMode + 1) % 3; break;
        case 'KeyR': inputRef.current.rear = true; break;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      switch(e.code) {
        case 'KeyW': case 'ArrowUp': inputRef.current.keys.forward = false; break;
        case 'KeyS': case 'ArrowDown': inputRef.current.keys.backward = false; break;
        case 'KeyA': case 'ArrowLeft': inputRef.current.keys.left = false; break;
        case 'KeyD': case 'ArrowRight': inputRef.current.keys.right = false; break;
        case 'ShiftLeft': case 'ShiftRight': inputRef.current.sprint = false; break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // GAME LOOP
    const clock = new THREE.Clock();
    let localStamina = 1;
    let localShards = 0;
    let rearTimer = 0;
    let horseYaw = 0;

    const animate = () => {
      requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.1);
      const time = clock.getElapsedTime();

      const input = inputRef.current;

      // Handle Input & Physics
      let isMoving = false;
      
      if (rearTimer > 0) {
        rearTimer -= dt;
      } else if (input.rear) {
        rearTimer = 1.0; // 1 second rear animation
        input.rear = false;
      } else {
        // Turning
        let turnInput = -input.joystick.x;
        if (input.keys.left) turnInput = 1;
        if (input.keys.right) turnInput = -1;
        
        horseYaw += turnInput * 2.5 * dt;

        // Forward
        let moveInput = -input.joystick.y;
        if (input.keys.forward) moveInput = 1;
        if (input.keys.backward) moveInput = -1;

        if (Math.abs(moveInput) > 0.1) {
          isMoving = true;
          let speed = 15;
          if (input.sprint && localStamina > 0) {
            speed = 30;
            localStamina -= dt * 0.5; // drain
          } else {
            localStamina += dt * 0.2; // recover
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

      if (input.jump && Math.abs(horseBody.velocity.y) < 0.1) {
        horseBody.applyImpulse(new CANNON.Vec3(0, 3000, 0), horseBody.position);
        input.jump = false;
      } else {
        input.jump = false;
      }

      world.step(1/60, dt, 3);

      // Sync Graphics
      horseGroup.position.copy(horseBody.position as unknown as THREE.Vector3);
      horseGroup.rotation.y = horseYaw;

      // Animate Horse
      if (rearTimer > 0) {
        bodyMesh.rotation.x = -Math.PI / 4;
        neckMesh.rotation.x = Math.PI / 4;
        legs[0].rotation.x = -Math.PI / 3;
        legs[1].rotation.x = -Math.PI / 3;
      } else {
        bodyMesh.rotation.x = 0;
        neckMesh.rotation.x = Math.PI / 6;
        if (isMoving) {
          const speedFactor = input.sprint && localStamina > 0 ? 15 : 8;
          legs[0].rotation.x = Math.sin(time * speedFactor) * 0.5;
          legs[1].rotation.x = Math.sin(time * speedFactor + Math.PI) * 0.5;
          legs[2].rotation.x = Math.sin(time * speedFactor + Math.PI) * 0.5;
          legs[3].rotation.x = Math.sin(time * speedFactor) * 0.5;
        } else {
          legs.forEach(l => l.rotation.x = 0);
        }
      }

      // Shard Logic
      shardsArray.forEach(shardObj => {
        if (!shardObj.active) return;
        shardObj.mesh.rotation.y += dt;
        shardObj.mesh.position.y = shardObj.yBase + Math.sin(time * 2) * 0.5;

        if (shardObj.mesh.position.distanceTo(horseGroup.position) < 3) {
          shardObj.active = false;
          shardObj.mesh.visible = false;
          localShards++;
        }
      });

      // Camera
      const targetCamPos = new THREE.Vector3();
      if (input.cameraMode === 0) { // Chase
        targetCamPos.set(0, 4, -8);
        targetCamPos.applyAxisAngle(new THREE.Vector3(0, 1, 0), horseYaw);
        targetCamPos.add(horseGroup.position);
        camera.position.lerp(targetCamPos, 0.1);
        camera.lookAt(horseGroup.position.clone().add(new THREE.Vector3(0, 2, 0)));
      } else if (input.cameraMode === 1) { // First Person
        camera.position.copy(horseGroup.position).add(new THREE.Vector3(0, 3.5, 0));
        const lookDir = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), horseYaw);
        camera.lookAt(camera.position.clone().add(lookDir));
      } else { // Cinematic
        targetCamPos.set(Math.cos(time * 0.5) * 15, 8, Math.sin(time * 0.5) * 15);
        targetCamPos.add(horseGroup.position);
        camera.position.lerp(targetCamPos, 0.05);
        camera.lookAt(horseGroup.position);
      }

      // Update State periodically
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
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[100dvh] bg-black overflow-hidden select-none">
      <div ref={mountRef} className="absolute inset-0" />
      
      {!isReady && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background">
          <div className="text-primary font-cinzel text-2xl animate-pulse">Loading Realm...</div>
        </div>
      )}

      <div className="absolute top-4 right-4 z-[60]">
        <Link href="/">
          <button className="bg-black/50 backdrop-blur-md border border-white/10 text-white/50 px-4 py-2 rounded-full text-xs font-cinzel hover:bg-white/10 transition-colors">
            EXIT TO HUB
          </button>
        </Link>
      </div>

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
