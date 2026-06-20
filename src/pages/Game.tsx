import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import * as CANNON from "cannon-es";
import { GameHUD } from "@/components/GameHUD";
import { Link } from "wouter";
import { audioEngine } from "@/lib/audioEngine";

const SHARD_COUNT = 20;
const ePCount = 400;

function getBiomeIndex(x: number): number {
  if (x < -133) return 0;
  if (x < 133) return 1;
  return 2;
}
const BIOME_NAMES = ["Verdant Plains", "Crystal Void", "Ember Wastes"];

// ── Realistic Horse Builder ───────────────────────────────────────────────────
function buildHorse(scene: THREE.Scene): {
  root: THREE.Group;
  parts: {
    body: THREE.Mesh;
    neck: THREE.Mesh[];
    head: THREE.Mesh;
    snout: THREE.Mesh;
    earL: THREE.Mesh;
    earR: THREE.Mesh;
    eyeL: THREE.Mesh;
    eyeR: THREE.Mesh;
    mane: THREE.Mesh[];
    tail: THREE.Mesh[];
    legs: { upper: THREE.Mesh; lower: THREE.Mesh; hoof: THREE.Mesh }[];
    chest: THREE.Mesh;
    hindquarters: THREE.Mesh;
  };
} {
  const root = new THREE.Group();

  const coatMat = new THREE.MeshStandardMaterial({ color: 0x7b4a2d, roughness: 0.85, metalness: 0.05 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.9 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.3 });
  const hoofMat = new THREE.MeshStandardMaterial({ color: 0x1a0f00, roughness: 1 });
  const maneMat = new THREE.MeshStandardMaterial({ color: 0x1a0a00, roughness: 0.9 });

  const cast = (m: THREE.Mesh) => { m.castShadow = true; m.receiveShadow = true; return m; };

  const barrel = cast(new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.58, 2.4, 14, 1), coatMat));
  barrel.rotation.z = Math.PI / 2;
  barrel.position.set(0, 1.55, 0);
  root.add(barrel);

  const chest = cast(new THREE.Mesh(new THREE.SphereGeometry(0.65, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6), coatMat));
  chest.position.set(0, 1.45, 1.1);
  chest.rotation.x = Math.PI * 0.05;
  root.add(chest);

  const hindquarters = cast(new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.65), coatMat));
  hindquarters.position.set(0, 1.5, -1.05);
  hindquarters.rotation.x = -Math.PI * 0.08;
  root.add(hindquarters);

  const neckSegs: THREE.Mesh[] = [];
  const neckData = [
    { r1: 0.28, r2: 0.32, len: 0.55, px: 0, py: 1.95, pz: 1.0, rx: -0.55 },
    { r1: 0.24, r2: 0.28, len: 0.5, px: 0, py: 2.37, pz: 1.18, rx: -0.35 },
    { r1: 0.2, r2: 0.24, len: 0.45, px: 0, py: 2.72, pz: 1.3, rx: -0.15 },
  ];
  neckData.forEach(d => {
    const seg = cast(new THREE.Mesh(new THREE.CylinderGeometry(d.r1, d.r2, d.len, 10, 1), coatMat));
    seg.position.set(d.px, d.py, d.pz);
    seg.rotation.x = d.rx;
    root.add(seg);
    neckSegs.push(seg);
  });

  const head = cast(new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.5, 0.7), coatMat));
  head.position.set(0, 2.98, 1.4);
  root.add(head);

  const snout = cast(new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.3, 0.55), coatMat));
  snout.position.set(0, 2.84, 1.68);
  root.add(snout);

  [-0.09, 0.09].forEach(ox => {
    const nostril = new THREE.Mesh(new THREE.CircleGeometry(0.04, 8), darkMat);
    nostril.position.set(ox, 2.76, 1.95);
    nostril.rotation.x = -0.3;
    root.add(nostril);
  });

  const earGeo = new THREE.ConeGeometry(0.07, 0.22, 6);
  const earL = cast(new THREE.Mesh(earGeo, coatMat));
  earL.position.set(-0.15, 3.22, 1.3);
  earL.rotation.z = 0.2;
  root.add(earL);
  const earR = cast(new THREE.Mesh(earGeo, coatMat));
  earR.position.set(0.15, 3.22, 1.3);
  earR.rotation.z = -0.2;
  root.add(earR);

  const eyeGeo = new THREE.SphereGeometry(0.06, 8, 8);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.22, 3.02, 1.38);
  root.add(eyeL);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeR.position.set(0.22, 3.02, 1.38);
  root.add(eyeR);

  const mane: THREE.Mesh[] = [];
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    const maneGeo = new THREE.BoxGeometry(0.05, 0.35 - t * 0.1, 0.12);
    const maneMesh = new THREE.Mesh(maneGeo, maneMat);
    maneMesh.position.set(-0.32, 1.95 + t * 1.05, 0.98 + t * 0.38);
    maneMesh.rotation.z = 0.3;
    maneMesh.rotation.x = -0.3 + t * -0.2;
    root.add(maneMesh);
    mane.push(maneMesh);
  }

  const tail: THREE.Mesh[] = [];
  const tailRoot = new THREE.Group();
  tailRoot.position.set(0, 1.72, -1.42);
  root.add(tailRoot);
  for (let i = 0; i < 8; i++) {
    const spread = (i - 3.5) * 0.045;
    const tgeo = new THREE.BoxGeometry(0.06, 0.7 + Math.random() * 0.3, 0.07);
    const tmesh = new THREE.Mesh(tgeo, darkMat);
    tmesh.position.set(spread, -0.35, -0.02);
    tmesh.rotation.x = 0.4 + spread * 0.3;
    tmesh.rotation.z = spread * 0.5;
    tailRoot.add(tmesh);
    tail.push(tmesh);
  }

  const legDefs = [
    { x: -0.3, z: 0.85, front: true },
    { x: 0.3, z: 0.85, front: true },
    { x: -0.3, z: -0.8, front: false },
    { x: 0.3, z: -0.8, front: false },
  ];

  const legParts: { upper: THREE.Mesh; lower: THREE.Mesh; hoof: THREE.Mesh }[] = [];

  legDefs.forEach(def => {
    const legGroup = new THREE.Group();
    legGroup.position.set(def.x, 1.2, def.z);
    root.add(legGroup);

    const upper = cast(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.75, 8), coatMat));
    upper.position.y = -0.37;
    legGroup.add(upper);

    const lowerPivot = new THREE.Group();
    lowerPivot.position.y = -0.75;
    legGroup.add(lowerPivot);

    const lower = cast(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.7, 8), coatMat));
    lower.position.y = -0.35;
    lowerPivot.add(lower);

    const hoof = cast(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.14, 8), hoofMat));
    hoof.position.y = -0.75;
    lowerPivot.add(hoof);

    legParts.push({ upper: legGroup as unknown as THREE.Mesh, lower: lowerPivot as unknown as THREE.Mesh, hoof });
  });

  scene.add(root);

  return {
    root,
    parts: {
      body: barrel, neck: neckSegs, head, snout, earL, earR, eyeL, eyeR,
      mane, tail, legs: legParts, chest, hindquarters,
    },
  };
}

// ── Jockey Builder ────────────────────────────────────────────────────────────
function buildJockey(horseRoot: THREE.Group): THREE.Group {
  const jockeyGroup = new THREE.Group();
  horseRoot.add(jockeyGroup);
  jockeyGroup.position.set(0, 2.05, 0.05);

  const silkMat = new THREE.MeshStandardMaterial({ color: 0xe8003a, roughness: 0.7 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4956a, roughness: 0.8 });
  const helmetMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3, metalness: 0.4 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x1a0a00, roughness: 0.9 });

  const cast = (m: THREE.Mesh) => { m.castShadow = true; return m; };

  const torso = cast(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.55, 10), silkMat));
  torso.position.set(0, 0.25, 0);
  torso.rotation.x = 0.55;
  jockeyGroup.add(torso);

  const stripe = cast(new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.175, 0.1, 10), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 })));
  stripe.position.set(0, 0.28, 0);
  stripe.rotation.x = 0.55;
  jockeyGroup.add(stripe);

  const hips = cast(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.2, 10), pantsMat));
  hips.position.set(0, 0.0, 0);
  jockeyGroup.add(hips);

  [[-0.22, -0.12, 0.08], [0.22, -0.12, 0.08]].forEach(([ox, oy, oz], i) => {
    const thigh = cast(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.4, 8), pantsMat));
    thigh.position.set(ox, oy, oz);
    thigh.rotation.z = i === 0 ? 0.8 : -0.8;
    thigh.rotation.x = 0.5;
    jockeyGroup.add(thigh);

    const boot = cast(new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.09, 0.35, 8), bootMat));
    boot.position.set(ox * 1.05, oy - 0.3, oz + 0.12);
    boot.rotation.z = i === 0 ? 0.9 : -0.9;
    boot.rotation.x = 0.5;
    jockeyGroup.add(boot);
  });

  const neck = cast(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.22, 8), skinMat));
  neck.position.set(0, 0.54, 0.12);
  neck.rotation.x = 0.4;
  jockeyGroup.add(neck);

  const headJ = cast(new THREE.Mesh(new THREE.SphereGeometry(0.165, 10, 8), skinMat));
  headJ.position.set(0, 0.72, 0.22);
  headJ.scale.y = 1.05;
  jockeyGroup.add(headJ);

  const helmet = cast(new THREE.Mesh(new THREE.SphereGeometry(0.185, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), helmetMat));
  helmet.position.set(0, 0.73, 0.2);
  jockeyGroup.add(helmet);

  const peak = cast(new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 0.14), helmetMat));
  peak.position.set(0, 0.67, 0.33);
  jockeyGroup.add(peak);

  [[-0.16, 0.42, 0.28], [0.16, 0.42, 0.28]].forEach(([ox, oy, oz], i) => {
    const arm = cast(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.42, 8), silkMat));
    arm.position.set(ox, oy, oz);
    arm.rotation.z = i === 0 ? 0.25 : -0.25;
    arm.rotation.x = -0.7;
    jockeyGroup.add(arm);

    const hand = cast(new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 6), skinMat));
    hand.position.set(ox * 0.95, oy - 0.08, oz + 0.22);
    jockeyGroup.add(hand);
  });

  const reinMat = new THREE.LineBasicMaterial({ color: 0x3d1a00 });
  [[-0.14, 0.36, 0.48], [0.14, 0.36, 0.48]].forEach(([sx, sy, sz]) => {
    const points = [new THREE.Vector3(sx, sy, sz), new THREE.Vector3(sx * 0.6, 0.45, 0.85)];
    const reinGeo = new THREE.BufferGeometry().setFromPoints(points);
    jockeyGroup.add(new THREE.Line(reinGeo, reinMat));
  });

  return jockeyGroup;
}

// ── NPC Horse Builder ──────────────────────────────────────────────────────────
function buildNPCHorse(scene: THREE.Scene, x: number, z: number, color: number): THREE.Group {
  const root = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a0a00, roughness: 0.9 });

  const cast = (m: THREE.Mesh) => { m.castShadow = true; return m; };

  const barrel = cast(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.5, 2.0, 10, 1), mat));
  barrel.rotation.z = Math.PI / 2;
  barrel.position.set(0, 1.4, 0);
  root.add(barrel);

  const neck = cast(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 1.0, 8), mat));
  neck.position.set(0, 2.1, 0.9);
  neck.rotation.x = -0.45;
  root.add(neck);

  const head = cast(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.45, 0.65), mat));
  head.position.set(0, 2.75, 1.3);
  root.add(head);

  const tailRoot = new THREE.Group();
  tailRoot.position.set(0, 1.6, -1.1);
  root.add(tailRoot);
  for (let i = 0; i < 5; i++) {
    const spread = (i - 2) * 0.06;
    const tmesh = cast(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.06), darkMat));
    tmesh.position.set(spread, -0.3, -0.02);
    tmesh.rotation.x = 0.4;
    tailRoot.add(tmesh);
  }

  const legDefs = [
    { x: -0.25, z: 0.7 }, { x: 0.25, z: 0.7 },
    { x: -0.25, z: -0.65 }, { x: 0.25, z: -0.65 },
  ];
  const legGroups: THREE.Group[] = [];
  legDefs.forEach(def => {
    const lg = new THREE.Group();
    lg.position.set(def.x, 1.1, def.z);
    root.add(lg);
    const upper = cast(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.65, 6), mat));
    upper.position.y = -0.32;
    lg.add(upper);
    const lower = cast(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.6, 6), mat));
    lower.position.y = -0.9;
    lg.add(lower);
    legGroups.push(lg);
  });

  root.position.set(x, 0, z);
  scene.add(root);

  return root;
}

// ── Environment Builder ───────────────────────────────────────────────────────
function buildEnvironment(scene: THREE.Scene) {
  const grassMat = new THREE.MeshStandardMaterial({ color: 0x3a6b1f, roughness: 0.95 });
  const dirtMat = new THREE.MeshStandardMaterial({ color: 0x8b6340, roughness: 1 });
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x888880, roughness: 0.9, metalness: 0.05 });
  const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 1 });
  const treeTopMat = new THREE.MeshStandardMaterial({ color: 0x245c14, roughness: 0.9 });
  const fenceMat = new THREE.MeshStandardMaterial({ color: 0xc4a267, roughness: 0.95 });
  const crystalMat = new THREE.MeshStandardMaterial({ color: 0x0e4a5c, emissive: 0x0e4a5c, emissiveIntensity: 0.25, roughness: 0.2, metalness: 0.3 });
  const emberMat = new THREE.MeshStandardMaterial({ color: 0x5c1a0a, roughness: 1 });

  const plainsGeo = new THREE.PlaneGeometry(500, 800, 80, 120);
  const pa = plainsGeo.attributes.position;
  for (let i = 0; i < pa.count; i++) {
    const x = pa.getX(i) - 267;
    const y = pa.getY(i);
    const h = Math.sin(x * 0.03) * 1.8 + Math.cos(y * 0.025) * 1.5 + Math.sin(x * 0.08 + y * 0.06) * 0.8 + (Math.random() - 0.5) * 0.25;
    pa.setZ(i, h);
  }
  plainsGeo.computeVertexNormals();
  const plains = new THREE.Mesh(plainsGeo, grassMat);
  plains.rotation.x = -Math.PI / 2;
  plains.position.set(-267, 0, 0);
  plains.receiveShadow = true;
  scene.add(plains);

  const pathGeo = new THREE.PlaneGeometry(8, 600, 4, 60);
  const pathMesh = new THREE.Mesh(pathGeo, dirtMat);
  pathMesh.rotation.x = -Math.PI / 2;
  pathMesh.position.set(-267, 0.02, 0);
  pathMesh.receiveShadow = true;
  scene.add(pathMesh);

  const rng = (a: number, b: number) => a + Math.random() * (b - a);
  for (let i = 0; i < 40; i++) {
    const tx = -470 + Math.random() * 370;
    if (Math.abs(tx - (-267)) < 10) continue;
    const tz = -350 + Math.random() * 700;
    const th = rng(2.5, 5);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, th, 7), treeTrunkMat);
    trunk.position.set(tx, th / 2, tz);
    trunk.castShadow = true;
    scene.add(trunk);
    const layers = 2 + Math.floor(Math.random() * 2);
    for (let l = 0; l < layers; l++) {
      const fr = rng(1.1, 1.9) * (1 - l * 0.25);
      const foliage = new THREE.Mesh(new THREE.SphereGeometry(fr, 8, 6), treeTopMat);
      foliage.position.set(tx + rng(-0.2, 0.2), th + fr * 0.5 + l * 0.8, tz + rng(-0.2, 0.2));
      foliage.castShadow = true;
      scene.add(foliage);
    }
  }

  for (let i = 0; i < 20; i++) {
    const rx = -470 + Math.random() * 370;
    const rz = -350 + Math.random() * 700;
    const rs = rng(0.3, 1.1);
    const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(rs, 1), rockMat);
    rock.position.set(rx, rs * 0.5, rz);
    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    rock.castShadow = true;
    scene.add(rock);
  }

  for (let i = 0; i < 60; i++) {
    const fz = -290 + i * 10;
    [-272, -261].forEach(fx => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 6), fenceMat);
      post.position.set(fx, 0.7, fz);
      post.castShadow = true;
      scene.add(post);
    });
    if (i % 3 === 0) {
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 11.2, 5), fenceMat);
      rail.rotation.z = Math.PI / 2;
      rail.position.set(-266.5, 1.0, fz + 5);
      scene.add(rail);
      const rail2 = rail.clone();
      rail2.position.set(-266.5, 0.55, fz + 5);
      scene.add(rail2);
    }
  }

  const crystalGeo = new THREE.PlaneGeometry(300, 800, 30, 80);
  const ca = crystalGeo.attributes.position;
  for (let i = 0; i < ca.count; i++) ca.setZ(i, (Math.random() - 0.5) * 0.3);
  crystalGeo.computeVertexNormals();
  const crystalFloor = new THREE.Mesh(crystalGeo, new THREE.MeshStandardMaterial({ color: 0x050d1a, roughness: 0.2, metalness: 0.5 }));
  crystalFloor.rotation.x = -Math.PI / 2;
  crystalFloor.position.y = -0.02;
  crystalFloor.receiveShadow = true;
  scene.add(crystalFloor);

  for (let i = 0; i < 22; i++) {
    const pw = rng(5, 14); const pd = rng(5, 14);
    const px = rng(-120, 120); const py = rng(1.5, 22); const pz = rng(-350, 350);
    const p = new THREE.Mesh(new THREE.BoxGeometry(pw, 0.6, pd), crystalMat);
    p.position.set(px, py, pz);
    p.castShadow = true; p.receiveShadow = true;
    scene.add(p);
    const edge = new THREE.Mesh(new THREE.BoxGeometry(pw + 0.1, 0.05, pd + 0.1),
      new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.8, transparent: true, opacity: 0.5 }));
    edge.position.set(px, py + 0.33, pz);
    scene.add(edge);
  }

  for (let i = 0; i < 14; i++) {
    const sx = rng(-140, 140); const sz = rng(-380, 380); const sh = rng(3, 12);
    const spire = new THREE.Mesh(new THREE.ConeGeometry(rng(0.3, 0.9), sh, 5),
      new THREE.MeshStandardMaterial({ color: 0x0077aa, emissive: 0x0044aa, emissiveIntensity: 0.4, roughness: 0.1, metalness: 0.6, transparent: true, opacity: 0.85 }));
    spire.position.set(sx, sh / 2, sz);
    spire.rotation.y = Math.random() * Math.PI;
    spire.castShadow = true;
    scene.add(spire);
  }

  const emberGeo = new THREE.PlaneGeometry(400, 800, 60, 100);
  const ea = emberGeo.attributes.position;
  for (let i = 0; i < ea.count; i++) {
    const x = ea.getX(i); const y = ea.getY(i);
    ea.setZ(i, Math.sin(x * 0.06) * 1.2 + Math.cos(y * 0.04) * 1.0 + (Math.random() - 0.5) * 0.5);
  }
  emberGeo.computeVertexNormals();
  const ember = new THREE.Mesh(emberGeo, emberMat);
  ember.rotation.x = -Math.PI / 2;
  ember.position.set(267, 0, 0);
  ember.receiveShadow = true;
  scene.add(ember);

  for (let i = 0; i < 25; i++) {
    const rx = 135 + Math.random() * 260; const rz = -380 + Math.random() * 760; const rs = rng(0.4, 2.2);
    const eruption = new THREE.Mesh(new THREE.ConeGeometry(rs, rs * 2.5, 7),
      new THREE.MeshStandardMaterial({ color: 0x8b1a00, emissive: 0xff2200, emissiveIntensity: 0.2, roughness: 1 }));
    eruption.position.set(rx, rs * 1.2, rz);
    eruption.castShadow = true;
    scene.add(eruption);
  }

  const portalMat = new THREE.MeshStandardMaterial({ color: 0x7c3aed, emissive: 0x7c3aed, emissiveIntensity: 0.6, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
  const portalGeo = new THREE.TorusGeometry(5, 0.5, 10, 36);

  const portal1 = new THREE.Mesh(portalGeo, portalMat.clone());
  portal1.position.set(-133, 6, 0);
  portal1.rotation.y = Math.PI / 2;
  scene.add(portal1);

  const portal2 = new THREE.Mesh(portalGeo, portalMat.clone());
  portal2.position.set(133, 6, 0);
  portal2.rotation.y = Math.PI / 2;
  scene.add(portal2);

  const ePGeo = new THREE.BufferGeometry();
  const ePos = new Float32Array(ePCount * 3);
  const eVel = new Float32Array(ePCount);
  for (let i = 0; i < ePCount; i++) {
    ePos[i * 3] = 133 + Math.random() * 267;
    ePos[i * 3 + 1] = Math.random() * 15;
    ePos[i * 3 + 2] = -400 + Math.random() * 800;
    eVel[i] = 0.4 + Math.random() * 0.8;
  }
  ePGeo.setAttribute("position", new THREE.BufferAttribute(ePos, 3));
  const emberParticles = new THREE.Points(ePGeo, new THREE.PointsMaterial({ color: 0xff5500, size: 0.35, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending }));
  scene.add(emberParticles);

  return { portal1, portal2, emberParticles, ePGeo, eVel };
}

// ── Drift Shards ──────────────────────────────────────────────────────────────
function buildShards(scene: THREE.Scene, count: number) {
  const shards: { mesh: THREE.Mesh; active: boolean; yBase: number; index: number }[] = [];
  const geo = new THREE.OctahedronGeometry(0.9, 0);
  const mat = new THREE.MeshStandardMaterial({ color: 0x14b8a6, emissive: 0x14b8a6, emissiveIntensity: 0.6 });
  const glow = new THREE.PointLight(0x14b8a6, 0.8, 6);

  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(geo, mat);
    const angle = Math.random() * Math.PI * 2;
    const radius = 18 + Math.random() * 160;
    mesh.position.set(Math.cos(angle) * radius, 2.5 + Math.random() * 5, Math.sin(angle) * radius);
    if (i < 8) {
      const sl = glow.clone();
      sl.position.copy(mesh.position);
      scene.add(sl);
    }
    scene.add(mesh);
    shards.push({ mesh, active: true, yBase: mesh.position.y, index: i });
  }
  return shards;
}

// ── Sprint Trail Builder ──────────────────────────────────────────────────────
function buildSprintTrail(scene: THREE.Scene): {
  points: THREE.Points;
  geo: THREE.BufferGeometry;
  positions: Float32Array;
  alphas: Float32Array;
  capacity: number;
  head: number;
} {
  const capacity = 80;
  const positions = new Float32Array(capacity * 3);
  const alphas = new Float32Array(capacity);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("alpha", new THREE.BufferAttribute(alphas, 1));

  const mat = new THREE.PointsMaterial({
    color: 0xf59e0b,
    size: 0.35,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);
  return { points, geo, positions, alphas, capacity, head: 0 };
}

// ── Gallop Animation ──────────────────────────────────────────────────────────
function animateHorseGallop(
  parts: ReturnType<typeof buildHorse>["parts"],
  time: number,
  speed: number,
  isMoving: boolean,
  rearTimer: number,
  tailRoot: THREE.Group
) {
  if (rearTimer > 0) {
    parts.body.parent!.rotation.x = -0.45 * Math.min(rearTimer, 0.4) / 0.4;
    parts.neck[0].rotation.x = -0.55 + 0.3 * Math.min(rearTimer, 0.4) / 0.4;
    parts.legs[0].upper.rotation.x = -1.1;
    parts.legs[1].upper.rotation.x = -1.1;
    parts.legs[2].upper.rotation.x = 0.3;
    parts.legs[3].upper.rotation.x = 0.3;
    return;
  }

  if (parts.body.parent) parts.body.parent.rotation.x = 0;

  if (isMoving) {
    const f = speed;
    const phA = Math.sin(time * f);
    const phB = Math.sin(time * f + Math.PI);
    const phAS2 = Math.sin(time * f * 2);

    (parts.legs[0].upper as unknown as THREE.Group).rotation.x = phA * 0.55;
    (parts.legs[1].upper as unknown as THREE.Group).rotation.x = phB * 0.55;
    (parts.legs[2].upper as unknown as THREE.Group).rotation.x = phB * 0.5;
    (parts.legs[3].upper as unknown as THREE.Group).rotation.x = phA * 0.5;

    (parts.legs[0].lower as unknown as THREE.Group).rotation.x = Math.max(0, phAS2) * 0.6;
    (parts.legs[1].lower as unknown as THREE.Group).rotation.x = Math.max(0, -phAS2) * 0.6;
    (parts.legs[2].lower as unknown as THREE.Group).rotation.x = Math.max(0, -phAS2) * 0.55;
    (parts.legs[3].lower as unknown as THREE.Group).rotation.x = Math.max(0, phAS2) * 0.55;

    parts.body.position.y = 1.55 + Math.abs(Math.sin(time * f * 2)) * 0.08;
    parts.head.rotation.x = Math.sin(time * f * 0.5) * 0.07;
    parts.neck.forEach((seg, i) => {
      seg.rotation.x = [-0.55, -0.35, -0.15][i] + Math.sin(time * f * 0.5 + i * 0.3) * 0.04;
    });
    tailRoot.rotation.x = 0.35 + Math.sin(time * f * 0.7) * 0.2;
    tailRoot.rotation.z = Math.sin(time * f * 0.8) * 0.12;
    parts.mane.forEach((m, i) => {
      m.rotation.z = 0.3 + Math.sin(time * f * 0.6 + i * 0.4) * 0.12;
    });
  } else {
    const breath = Math.sin(time * 1.2) * 0.025;
    parts.body.position.y = 1.55 + breath;
    parts.chest.position.y = 1.45 + breath * 0.5;
    parts.hindquarters.position.y = 1.5 + breath * 0.3;
    parts.head.rotation.x = Math.sin(time * 0.8) * 0.04;
    tailRoot.rotation.x = 0.3 + Math.sin(time * 1.0) * 0.1;
    parts.neck.forEach((seg, i) => { seg.rotation.x = [-0.55, -0.35, -0.15][i]; });
    parts.legs.forEach(l => {
      (l.upper as unknown as THREE.Group).rotation.x = 0;
      (l.lower as unknown as THREE.Group).rotation.x = 0;
    });
  }
}

// ── Jockey Animation ──────────────────────────────────────────────────────────
function animateJockey(jockey: THREE.Group, time: number, speed: number, isMoving: boolean) {
  if (isMoving) {
    jockey.rotation.x = -0.05 + Math.sin(time * speed * 0.5) * 0.06;
    jockey.position.y = 2.05 + Math.abs(Math.sin(time * speed * 2)) * 0.04;
  } else {
    jockey.rotation.x = 0;
    jockey.position.y = 2.05 + Math.sin(time * 1.2) * 0.02;
  }
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Game() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [shards, setShards] = useState(0);
  const [stamina, setStamina] = useState(1);
  const [biomeName, setBiomeName] = useState("Verdant Plains");
  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioStarted, setAudioStarted] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [horsePos, setHorsePos] = useState({ x: -267, z: 0 });
  const [shardFlash, setShardFlash] = useState(false);
  const [allCollected, setAllCollected] = useState(false);

  const inputRef = useRef({
    joystick: { x: 0, y: 0 },
    keys: { forward: false, backward: false, left: false, right: false },
    sprint: false,
    jump: false,
    rear: false,
    cameraMode: 0,
  });

  const handleJoystick = useCallback((v: { x: number; y: number }) => { inputRef.current.joystick = v; }, []);
  const handleAction = useCallback((action: string) => {
    if (action === "SPRINT_START") inputRef.current.sprint = true;
    if (action === "SPRINT_END") inputRef.current.sprint = false;
    if (action === "JUMP") inputRef.current.jump = true;
    if (action === "REAR") inputRef.current.rear = true;
    if (action === "CAM") inputRef.current.cameraMode = (inputRef.current.cameraMode + 1) % 3;
  }, []);

  const startAudio = useCallback(() => {
    if (audioStarted) return;
    audioEngine.init();
    audioEngine.setBiome(0);
    setAudioStarted(true);
  }, [audioStarted]);

  const handleMuteToggle = useCallback(() => {
    if (!audioStarted) { startAudio(); return; }
    setIsMuted(audioEngine.toggleMute());
  }, [audioStarted, startAudio]);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0xb5d8a0, 80, 350);

    const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 800);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch {
      return;
    }
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mountRef.current.appendChild(renderer.domElement);

    const sky = new THREE.AmbientLight(0x90b0e0, 0.6);
    scene.add(sky);

    const sun = new THREE.DirectionalLight(0xfff4cc, 1.8);
    sun.position.set(80, 150, 60);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.top = 120;
    sun.shadow.camera.bottom = -120;
    sun.shadow.camera.left = -120;
    sun.shadow.camera.right = 120;
    sun.shadow.bias = -0.001;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0x8ab4f8, 0.4);
    fill.position.set(-50, 30, -80);
    scene.add(fill);

    const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -18, 0) });
    world.broadphase = new CANNON.SAPBroadphase(world);
    const mat = new CANNON.Material("std");
    world.addContactMaterial(new CANNON.ContactMaterial(mat, mat, { friction: 0.4, restitution: 0.05 }));

    const groundBody = new CANNON.Body({ mass: 0, material: mat });
    groundBody.addShape(new CANNON.Plane());
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.addBody(groundBody);

    const horseBody = new CANNON.Body({
      mass: 500,
      material: mat,
      position: new CANNON.Vec3(-267, 4, 0),
      linearDamping: 0.75,
      angularDamping: 0.99,
      fixedRotation: true,
    });
    horseBody.addShape(new CANNON.Box(new CANNON.Vec3(0.5, 1.0, 1.3)), new CANNON.Vec3(0, 1.2, 0));
    world.addBody(horseBody);

    const { root: horseRoot, parts: horseParts } = buildHorse(scene);
    const jockeyGroup = buildJockey(horseRoot);
    const tailRoot = horseRoot.children.find(c => c instanceof THREE.Group && c !== jockeyGroup) as THREE.Group;
    const env = buildEnvironment(scene);
    const shardsArray = buildShards(scene, SHARD_COUNT);

    // ── Sprint trail ──
    const trail = buildSprintTrail(scene);
    let trailTimer = 0;

    // ── NPC Horses ──
    const npcColors = [0x4a2010, 0x1a1a1a, 0xc49a50];
    const npcPositions = [
      { x: -320, z: 40 }, { x: -250, z: -60 }, { x: -380, z: -20 },
    ];
    const npcHorses = npcPositions.map((p, i) =>
      buildNPCHorse(scene, p.x, p.z, npcColors[i])
    );
    const npcYaws = [0.3, 1.8, 4.2];

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
      if (!audioReady && (audioEngine as any).ctx) audioReady = true;
      return audioReady;
    };

    const biomeScenes = [
      { bg: 0x87ceeb, fog: [0xb5d8a0, 80, 350] as [number, number, number], sunColor: 0xfff4cc, skyColor: 0x90b0e0 },
      { bg: 0x020818, fog: [0x030c20, 60, 280] as [number, number, number], sunColor: 0x2255ff, skyColor: 0x0a1a40 },
      { bg: 0x1a0400, fog: [0x3a1000, 50, 220] as [number, number, number], sunColor: 0xff4400, skyColor: 0x301000 },
    ];

    let frameCount = 0;

    const animate = () => {
      requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const time = clock.getElapsedTime();
      const input = inputRef.current;
      frameCount++;

      let isMoving = false;

      if (rearTimer > 0) {
        rearTimer -= dt;
      } else if (input.rear) {
        rearTimer = 1.2;
        input.rear = false;
        if (checkAudio()) audioEngine.playRear();
      } else {
        let turnInput = -input.joystick.x;
        if (input.keys.left) turnInput = 1;
        if (input.keys.right) turnInput = -1;
        horseYaw += turnInput * 2.2 * dt;

        let moveInput = -input.joystick.y;
        if (input.keys.forward) moveInput = 1;
        if (input.keys.backward) moveInput = -1;

        if (Math.abs(moveInput) > 0.08) {
          isMoving = true;
          let speedVal = 18;
          if (input.sprint && localStamina > 0) {
            speedVal = 34;
            localStamina -= dt * 0.45;
          } else {
            localStamina += dt * 0.2;
          }
          const fwd = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), horseYaw);
          horseBody.applyForce(
            new CANNON.Vec3(fwd.x * speedVal * moveInput * 110, 0, fwd.z * speedVal * moveInput * 110),
            horseBody.position
          );
        } else {
          localStamina += dt * 0.35;
        }
      }
      localStamina = Math.max(0, Math.min(1, localStamina));

      const velY = horseBody.velocity.y;
      const onGround = Math.abs(velY) < 1.2;

      if (input.jump && onGround) {
        horseBody.applyImpulse(new CANNON.Vec3(0, 3200, 0), horseBody.position);
        input.jump = false;
        if (checkAudio()) audioEngine.playJump();
      } else {
        input.jump = false;
      }

      if (wasAirborne && onGround && prevVelY < -4) {
        if (checkAudio()) audioEngine.playLand(Math.abs(prevVelY));
      }
      wasAirborne = !onGround;
      prevVelY = velY;

      world.step(1 / 60, dt, 3);

      horseRoot.position.set(horseBody.position.x, horseBody.position.y - 1.15, horseBody.position.z);
      horseRoot.rotation.y = horseYaw;

      const gSpeed = input.sprint && localStamina > 0 ? 14 : 9;
      animateHorseGallop(horseParts, time, gSpeed, isMoving, rearTimer, tailRoot);
      animateJockey(jockeyGroup, time, gSpeed, isMoving);

      if (checkAudio() && onGround) {
        audioEngine.updateGallop(isMoving, input.sprint && localStamina > 0);
      } else if (checkAudio() && !onGround) {
        audioEngine.updateGallop(false, false);
      }

      // ── Sprint trail particles ──
      const isSprinting = input.sprint && localStamina > 0 && isMoving;
      if (isSprinting) {
        trailTimer += dt;
        if (trailTimer > 0.04) {
          trailTimer = 0;
          const idx = trail.head % trail.capacity;
          trail.positions[idx * 3] = horseRoot.position.x + (Math.random() - 0.5) * 0.8;
          trail.positions[idx * 3 + 1] = horseRoot.position.y + 0.5 + Math.random() * 0.8;
          trail.positions[idx * 3 + 2] = horseRoot.position.z + (Math.random() - 0.5) * 0.8;
          trail.alphas[idx] = 1.0;
          trail.head++;
        }
      }
      // Fade trail
      for (let i = 0; i < trail.capacity; i++) {
        if (trail.alphas[i] > 0) trail.alphas[i] = Math.max(0, trail.alphas[i] - dt * 1.5);
      }
      trail.geo.attributes.position.needsUpdate = true;

      // ── Shards ──
      shardsArray.forEach(s => {
        if (!s.active) return;
        s.mesh.rotation.y += dt * 1.2;
        s.mesh.rotation.x += dt * 0.4;
        s.mesh.position.y = s.yBase + Math.sin(time * 2 + s.index) * 0.45;
        if (s.mesh.position.distanceTo(horseRoot.position) < 3.5) {
          s.active = false;
          s.mesh.visible = false;
          localShards++;
          if (checkAudio()) audioEngine.playShardCollect(s.index);
          setShardFlash(true);
          setTimeout(() => setShardFlash(false), 400);
          if (localShards >= SHARD_COUNT) setAllCollected(true);
        }
      });

      // ── NPC Horses wander ──
      npcHorses.forEach((npc, i) => {
        npcYaws[i] += Math.sin(time * 0.3 + i * 2.1) * 0.008;
        const fwd = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), npcYaws[i]);
        npc.position.x += fwd.x * 0.04;
        npc.position.z += fwd.z * 0.04;
        npc.rotation.y = npcYaws[i];
        // Clamp to Verdant Plains
        npc.position.x = Math.max(-450, Math.min(-160, npc.position.x));
        npc.position.z = Math.max(-300, Math.min(300, npc.position.z));
        // Simple leg animation
        npc.children.slice(4).forEach((legGroup, li) => {
          if (legGroup instanceof THREE.Group) {
            legGroup.rotation.x = Math.sin(time * 8 + li * Math.PI / 2) * 0.4;
          }
        });
      });

      // ── Biome ──
      const biomeIdx = getBiomeIndex(horseRoot.position.x);
      if (biomeIdx !== lastBiome) {
        lastBiome = biomeIdx;
        setBiomeName(BIOME_NAMES[biomeIdx]);
        const bs = biomeScenes[biomeIdx];
        scene.background = new THREE.Color(bs.bg);
        (scene.fog as THREE.Fog).color.set(bs.fog[0]);
        (scene.fog as THREE.Fog).near = bs.fog[1];
        (scene.fog as THREE.Fog).far = bs.fog[2];
        sun.color.set(bs.sunColor);
        sky.color.set(bs.skyColor);
        if (checkAudio()) audioEngine.setBiome(biomeIdx);
      }

      // ── Portal pulse ──
      const pg = 0.4 + Math.sin(time * 2.5) * 0.35;
      (env.portal1.material as THREE.MeshStandardMaterial).emissiveIntensity = pg;
      (env.portal2.material as THREE.MeshStandardMaterial).emissiveIntensity = pg;

      // ── Ember particles ──
      const ep = env.ePGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < ePCount; i++) {
        ep[i * 3 + 1] += dt * env.eVel[i];
        if (ep[i * 3 + 1] > 18) ep[i * 3 + 1] = 0;
      }
      env.ePGeo.attributes.position.needsUpdate = true;

      // ── Camera ──
      const camTarget = new THREE.Vector3();
      if (input.cameraMode === 0) {
        const offset = new THREE.Vector3(0, 4.5, -9);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), horseYaw);
        camTarget.copy(horseRoot.position).add(offset);
        camera.position.lerp(camTarget, 0.1);
        camera.lookAt(horseRoot.position.clone().add(new THREE.Vector3(0, 2.2, 0)));
      } else if (input.cameraMode === 1) {
        camera.position.copy(horseRoot.position).add(new THREE.Vector3(0, 3.8, 0));
        const ld = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), horseYaw);
        camera.lookAt(camera.position.clone().add(ld.multiplyScalar(10)));
      } else {
        camTarget.set(Math.cos(time * 0.3) * 18, 9, Math.sin(time * 0.3) * 18);
        camTarget.add(horseRoot.position);
        camera.position.lerp(camTarget, 0.04);
        camera.lookAt(horseRoot.position.clone().add(new THREE.Vector3(0, 2, 0)));
      }

      // ── State sync (every ~6 frames) ──
      if (frameCount % 6 === 0) {
        setStamina(localStamina);
        if (localShards !== shards) setShards(localShards);
        const vel3 = new THREE.Vector3(horseBody.velocity.x, 0, horseBody.velocity.z);
        setSpeed(Math.round(vel3.length() * 3.6));
        setHorsePos({ x: horseRoot.position.x, z: horseRoot.position.z });
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
    <div className="relative w-full h-[100dvh] bg-black overflow-hidden select-none" onPointerDown={startAudio}>
      <div ref={mountRef} className="absolute inset-0" />

      {/* Loading screen */}
      {!isReady && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <div className="text-primary font-cinzel text-xl tracking-widest animate-pulse">Loading Realm...</div>
          </div>
        </div>
      )}

      {/* Shard collect flash */}
      {shardFlash && (
        <div className="absolute inset-0 z-[70] pointer-events-none bg-teal-400/20 animate-pulse" />
      )}

      {/* Victory screen */}
      {allCollected && (
        <div className="absolute inset-0 z-[80] flex items-center justify-center pointer-events-none">
          <div className="bg-black/80 backdrop-blur-lg border border-primary/50 rounded-3xl p-8 text-center space-y-4 mx-4">
            <div className="text-5xl">✦</div>
            <h2 className="text-3xl font-cinzel font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal-400">
              DRIFT ATTUNED
            </h2>
            <p className="text-muted-foreground">All 20 Shards collected. You have bent the Equinox.</p>
          </div>
        </div>
      )}

      {/* Top-right controls */}
      <div className="absolute top-4 right-4 z-[60] flex gap-2">
        <button onClick={handleMuteToggle} data-testid="btn-mute"
          className="bg-black/50 backdrop-blur-md border border-white/10 text-white/70 px-3 py-2 rounded-full text-xs font-cinzel hover:bg-white/10 transition-colors">
          {isMuted ? "🔇 OFF" : "🔊 ON"}
        </button>
        <Link href="/">
          <button data-testid="btn-exit"
            className="bg-black/50 backdrop-blur-md border border-white/10 text-white/50 px-4 py-2 rounded-full text-xs font-cinzel hover:bg-white/10 transition-colors">
            EXIT
          </button>
        </Link>
      </div>

      {/* Desktop key hints */}
      {isReady && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[55] hidden md:flex gap-3 text-[10px] text-white/25 font-mono pointer-events-none">
          <span>WASD — move</span>
          <span>SHIFT — sprint</span>
          <span>SPACE — jump</span>
          <span>R — rear</span>
          <span>C — camera</span>
          <span>M — mute</span>
        </div>
      )}

      <GameHUD
        shards={shards}
        totalShards={SHARD_COUNT}
        biomeName={biomeName}
        stamina={stamina}
        speed={speed}
        horsePos={horsePos}
        onMove={handleJoystick}
        onAction={handleAction}
      />
    </div>
  );
}
