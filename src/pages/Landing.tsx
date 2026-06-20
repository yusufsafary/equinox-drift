import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Link } from "wouter";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/Logo";

// ── Enhanced 3D Hero Background ──────────────────────────────────────────────
function HeroBackground() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0d0618, 0.018);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 8, 32);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    } catch {
      return;
    }
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    mountRef.current.appendChild(renderer.domElement);

    // Stars (deep background)
    const starGeo = new THREE.BufferGeometry();
    const starCount = 3000;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) {
      starPos[i] = (Math.random() - 0.5) * 300;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ size: 0.18, color: 0xffffff, transparent: true, opacity: 0.7 });
    scene.add(new THREE.Points(starGeo, starMat));

    // Amber/teal particle nebula
    const nebulaGeo = new THREE.BufferGeometry();
    const nCount = 1200;
    const nPos = new Float32Array(nCount * 3);
    const nCol = new Float32Array(nCount * 3);
    for (let i = 0; i < nCount; i++) {
      nPos[i * 3] = (Math.random() - 0.5) * 120;
      nPos[i * 3 + 1] = (Math.random() - 0.5) * 60;
      nPos[i * 3 + 2] = (Math.random() - 0.5) * 80;
      const t = Math.random();
      if (t < 0.4) { nCol[i*3]=0.49; nCol[i*3+1]=0.23; nCol[i*3+2]=0.93; }
      else if (t < 0.7) { nCol[i*3]=0.96; nCol[i*3+1]=0.62; nCol[i*3+2]=0.04; }
      else { nCol[i*3]=0.08; nCol[i*3+1]=0.72; nCol[i*3+2]=0.65; }
    }
    nebulaGeo.setAttribute("position", new THREE.BufferAttribute(nPos, 3));
    nebulaGeo.setAttribute("color", new THREE.BufferAttribute(nCol, 3));
    const nebulaMat = new THREE.PointsMaterial({ size: 0.28, vertexColors: true, transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending });
    scene.add(new THREE.Points(nebulaGeo, nebulaMat));

    // Waving terrain plane
    const planeGeo = new THREE.PlaneGeometry(200, 200, 60, 60);
    const planeMat = new THREE.MeshBasicMaterial({ color: 0x7c3aed, wireframe: true, transparent: true, opacity: 0.1 });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -10;
    scene.add(plane);

    // Second terrain — teal
    const planeGeo2 = new THREE.PlaneGeometry(200, 200, 40, 40);
    const planeMat2 = new THREE.MeshBasicMaterial({ color: 0x14b8a6, wireframe: true, transparent: true, opacity: 0.06 });
    const plane2 = new THREE.Mesh(planeGeo2, planeMat2);
    plane2.rotation.x = -Math.PI / 2;
    plane2.position.y = -14;
    scene.add(plane2);

    // Shooting stars
    const shootingStars: { mesh: THREE.Mesh; vel: THREE.Vector3; life: number; maxLife: number }[] = [];
    function spawnShootingStar() {
      const geo = new THREE.BoxGeometry(0.08, 0.08, 2.5);
      const mat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.9 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set((Math.random() - 0.5) * 80, 20 + Math.random() * 20, -20 + Math.random() * 10);
      const angle = Math.PI * 0.8 + (Math.random() - 0.5) * 0.4;
      const vel = new THREE.Vector3(Math.cos(angle) * 0.8, Math.sin(angle) * 0.4, -0.1);
      mesh.rotation.z = Math.atan2(vel.y, vel.x);
      scene.add(mesh);
      shootingStars.push({ mesh, vel, life: 0, maxLife: 60 + Math.random() * 40 });
    }
    let shootTimer = 0;

    const clock = new THREE.Clock();

    const animate = () => {
      requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const dt = clock.getDelta ? 0.016 : 0.016;

      // Waving terrain
      const pos = planeGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < pos.length; i += 3) {
        const x = pos[i]; const y = pos[i + 1];
        pos[i + 2] = Math.sin(x * 0.08 + elapsed * 0.6) * 1.5 + Math.cos(y * 0.07 + elapsed * 0.4) * 1.2;
      }
      planeGeo.attributes.position.needsUpdate = true;

      const pos2 = planeGeo2.attributes.position.array as Float32Array;
      for (let i = 0; i < pos2.length; i += 3) {
        const x = pos2[i]; const y = pos2[i + 1];
        pos2[i + 2] = Math.cos(x * 0.06 + elapsed * 0.5) * 1.8 + Math.sin(y * 0.05 + elapsed * 0.3) * 1.4;
      }
      planeGeo2.attributes.position.needsUpdate = true;

      // Nebula drift
      (nebulaMat as THREE.PointsMaterial).opacity = 0.55 + Math.sin(elapsed * 0.3) * 0.1;
      const nebulaArr = nebulaGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < nCount; i++) {
        nebulaArr[i * 3 + 1] += Math.sin(elapsed * 0.2 + i * 0.5) * 0.002;
      }
      nebulaGeo.attributes.position.needsUpdate = true;

      // Camera slow drift
      camera.position.x = Math.sin(elapsed * 0.1) * 3;
      camera.position.y = 8 + Math.cos(elapsed * 0.07) * 2;
      camera.lookAt(0, 0, 0);

      // Shooting stars
      shootTimer++;
      if (shootTimer > 180 + Math.random() * 120) {
        spawnShootingStar();
        shootTimer = 0;
      }
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        s.life++;
        s.mesh.position.add(s.vel);
        const fade = 1 - s.life / s.maxLife;
        (s.mesh.material as THREE.MeshBasicMaterial).opacity = fade * 0.9;
        if (s.life >= s.maxLife) {
          scene.remove(s.mesh);
          shootingStars.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 pointer-events-none -z-10" />;
}

// ── Animated stat counter ─────────────────────────────────────────────────────
function StatCounter({ value, label, suffix = "" }: { value: number; label: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const step = value / 60;
        const timer = setInterval(() => {
          start += step;
          if (start >= value) { setCount(value); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 20);
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-5xl font-cinzel font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-teal-400">
        {count}{suffix}
      </div>
      <div className="text-sm text-muted-foreground uppercase tracking-widest mt-2">{label}</div>
    </div>
  );
}

// ── Feature mini-scene (inline 3D) ────────────────────────────────────────────
function FeatureMiniScene({ color, shape }: { color: number; shape: "crystal" | "horse" | "ember" }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.set(0, 0, 4);
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); } catch { return; }
    renderer.setSize(ref.current.clientWidth || 200, ref.current.clientHeight || 200);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    ref.current.appendChild(renderer.domElement);
    const light = new THREE.PointLight(color, 2, 20); light.position.set(3, 3, 3); scene.add(light);
    scene.add(new THREE.AmbientLight(0x333333));
    const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.3, roughness: 0.3, metalness: 0.5 });
    let mesh: THREE.Mesh;
    if (shape === "crystal") mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.9, 0), mat);
    else if (shape === "ember") mesh = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.8, 6), mat);
    else mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 1), mat);
    scene.add(mesh);
    const particles = new THREE.BufferGeometry();
    const pPos = new Float32Array(60 * 3);
    for (let i = 0; i < 60; i++) { pPos[i*3]=(Math.random()-0.5)*4; pPos[i*3+1]=(Math.random()-0.5)*4; pPos[i*3+2]=(Math.random()-0.5)*4; }
    particles.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    scene.add(new THREE.Points(particles, new THREE.PointsMaterial({ color, size: 0.06, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending })));
    let raf: number;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      mesh.rotation.y += 0.015; mesh.rotation.x += 0.008;
      renderer.render(scene, camera);
    };
    animate();
    return () => { cancelAnimationFrame(raf); renderer.dispose(); if (ref.current && renderer.domElement.parentNode === ref.current) ref.current.removeChild(renderer.domElement); };
  }, [color, shape]);
  return <div ref={ref} className="w-full aspect-square" />;
}

export default function Landing() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground overflow-x-hidden">
      <HeroBackground />

      {/* ── Nav ── */}
      <nav className="fixed top-0 w-full px-5 py-4 flex justify-between items-center z-50 bg-background/60 backdrop-blur-md border-b border-white/5">
        <Logo className="scale-[0.7] origin-left" />

        {/* Desktop nav */}
        <div className="hidden sm:flex gap-6 items-center">
          <Link href="/how-to-play" className="text-sm font-medium hover:text-primary transition-colors uppercase tracking-wider">
            How to Play
          </Link>
          <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors uppercase tracking-wider">
            Lore
          </Link>
          <Link href="/game">
            <button className="px-5 py-2 bg-primary/10 border border-primary text-primary font-cinzel font-bold text-sm rounded-full hover:bg-primary/25 hover:shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all">
              PLAY NOW
            </button>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle menu"
        >
          <span className={`block w-6 h-0.5 bg-primary transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block w-6 h-0.5 bg-primary transition-all ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block w-6 h-0.5 bg-primary transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-[68px] inset-x-0 z-40 bg-background/95 backdrop-blur-lg border-b border-white/10 flex flex-col p-6 gap-5"
          >
            <Link href="/how-to-play" className="text-lg font-cinzel font-bold text-primary uppercase tracking-wider" onClick={() => setMenuOpen(false)}>
              How to Play
            </Link>
            <Link href="/about" className="text-lg font-cinzel font-bold text-secondary uppercase tracking-wider" onClick={() => setMenuOpen(false)}>
              Lore
            </Link>
            <Link href="/game" onClick={() => setMenuOpen(false)}>
              <button className="w-full py-3 bg-primary text-primary-foreground font-cinzel font-bold text-lg rounded-full shadow-[0_0_25px_rgba(245,158,11,0.3)]">
                ENTER THE RIFT
              </button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative">

        {/* ── Hero section ── */}
        <section className="min-h-[100dvh] flex flex-col items-center justify-center pt-20 px-5">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.15 }}
            className="flex flex-col items-center text-center space-y-6 max-w-2xl"
          >
            <Logo className="scale-110 sm:scale-125 md:scale-150 mb-4" />

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="text-base sm:text-xl md:text-2xl font-serif italic text-muted-foreground"
            >
              Ride the Shifting Realms. Command the Drift.
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="text-sm text-muted-foreground/60 max-w-md leading-relaxed"
            >
              A surreal mobile-first 3D horse-riding adventure through three impossible biomes — built entirely with Three.js and cannon-es physics.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              className="flex flex-col sm:flex-row gap-4 mt-6 w-full sm:w-auto"
            >
              <Link href="/game" className="w-full sm:w-auto">
                <button
                  className="w-full px-10 py-4 bg-primary text-primary-foreground font-cinzel font-bold text-lg sm:text-xl rounded-full hover:bg-primary/90 transition-all hover:scale-105 shadow-[0_0_35px_rgba(245,158,11,0.35)] active:scale-95"
                  data-testid="btn-play-now"
                >
                  ENTER THE RIFT
                </button>
              </Link>
              <Link href="/how-to-play" className="w-full sm:w-auto">
                <button
                  className="w-full px-10 py-4 bg-black/50 backdrop-blur-md border border-secondary text-secondary font-cinzel font-bold text-lg sm:text-xl rounded-full hover:bg-secondary/10 transition-all hover:scale-105 active:scale-95"
                  data-testid="btn-how-to-play"
                >
                  RIDER'S MANUAL
                </button>
              </Link>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="flex flex-col items-center gap-2 mt-12"
            >
              <span className="text-xs text-muted-foreground/40 uppercase tracking-widest">Scroll to Explore</span>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-0.5 h-8 bg-gradient-to-b from-primary/60 to-transparent rounded-full"
              />
            </motion.div>
          </motion.div>
        </section>

        {/* ── Stats section ── */}
        <section className="py-20 px-5">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="container mx-auto max-w-4xl"
          >
            <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-3xl p-8 md:p-12 grid grid-cols-2 md:grid-cols-4 gap-8">
              <StatCounter value={3} label="Biomes" />
              <StatCounter value={20} label="Drift Shards" />
              <StatCounter value={3} label="Camera Modes" />
              <StatCounter value={360} label="Degrees of Freedom" suffix="°" />
            </div>
          </motion.div>
        </section>

        {/* ── Feature sections ── */}
        <section className="py-20 px-5 bg-gradient-to-b from-transparent to-black/60">
          <div className="container mx-auto max-w-5xl space-y-24 md:space-y-32">

            {/* Verdant Plains */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8 }}
              className="flex flex-col md:flex-row gap-8 md:gap-12 items-center"
            >
              <div className="flex-1 space-y-5 order-2 md:order-1">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
                  <span className="text-xs text-muted-foreground uppercase tracking-widest font-cinzel">Biome 1</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-cinzel font-bold text-green-400">Verdant Plains</h3>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  Gallop across lush rolling hills beneath an open sky. Dodge rocks, weave through fence-lined dirt paths, and leap over terrain dips. The wind carries the scent of possibility.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground/70">
                  <li className="flex items-center gap-2"><span className="text-green-400">✦</span> 40 procedural trees and rocks</li>
                  <li className="flex items-center gap-2"><span className="text-green-400">✦</span> Dirt path with wooden fence rails</li>
                  <li className="flex items-center gap-2"><span className="text-green-400">✦</span> Dynamic ambient audio — warm C major drone</li>
                </ul>
              </div>
              <div className="flex-1 w-full order-1 md:order-2 max-w-xs md:max-w-none mx-auto">
                <div className="aspect-square rounded-3xl border border-green-500/20 bg-gradient-to-tr from-green-950/50 to-transparent overflow-hidden shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                  <FeatureMiniScene color={0x22c55e} shape="horse" />
                </div>
              </div>
            </motion.div>

            {/* Crystal Void */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8 }}
              className="flex flex-col md:flex-row-reverse gap-8 md:gap-12 items-center"
            >
              <div className="flex-1 space-y-5">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                  <span className="text-xs text-muted-foreground uppercase tracking-widest font-cinzel">Biome 2</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-cinzel font-bold text-cyan-400">Crystal Void</h3>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  Leap across floating crystal platforms suspended in a dark abyss. Glowing spires pierce the void, casting electric light across your path. Miss a platform and fall into the infinite.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground/70">
                  <li className="flex items-center gap-2"><span className="text-cyan-400">✦</span> 22 floating physics platforms</li>
                  <li className="flex items-center gap-2"><span className="text-cyan-400">✦</span> 14 glowing crystal spires</li>
                  <li className="flex items-center gap-2"><span className="text-cyan-400">✦</span> Eerie Bb minor ambient soundscape</li>
                </ul>
              </div>
              <div className="flex-1 w-full max-w-xs md:max-w-none mx-auto">
                <div className="aspect-square rounded-3xl border border-cyan-500/20 bg-gradient-to-tl from-cyan-950/50 to-transparent overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                  <FeatureMiniScene color={0x06b6d4} shape="crystal" />
                </div>
              </div>
            </motion.div>

            {/* Ember Wastes */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8 }}
              className="flex flex-col md:flex-row gap-8 md:gap-12 items-center"
            >
              <div className="flex-1 space-y-5 order-2 md:order-1">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]" />
                  <span className="text-xs text-muted-foreground uppercase tracking-widest font-cinzel">Biome 3</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-cinzel font-bold text-orange-400">Ember Wastes</h3>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  A scorched hellscape where volcanic spires erupt and ember particles rain from a blood-red sky. Your steed's hooves thunder against scorched earth as the heat distorts everything ahead.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground/70">
                  <li className="flex items-center gap-2"><span className="text-orange-400">✦</span> 400 live ember particles</li>
                  <li className="flex items-center gap-2"><span className="text-orange-400">✦</span> 25 volcanic formations</li>
                  <li className="flex items-center gap-2"><span className="text-orange-400">✦</span> Low sawtooth rumble audio</li>
                </ul>
              </div>
              <div className="flex-1 w-full order-1 md:order-2 max-w-xs md:max-w-none mx-auto">
                <div className="aspect-square rounded-3xl border border-orange-500/20 bg-gradient-to-tr from-orange-950/50 to-transparent overflow-hidden shadow-[0_0_30px_rgba(249,115,22,0.1)]">
                  <FeatureMiniScene color={0xf97316} shape="ember" />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Drift Shards & Portal CTA ── */}
        <section className="py-24 px-5 bg-black/60">
          <div className="container mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center space-y-8"
            >
              <div className="inline-block">
                <div className="w-16 h-16 mx-auto mb-6 relative">
                  <div className="absolute inset-0 bg-teal-500/20 rounded-full animate-ping" />
                  <div className="relative w-full h-full flex items-center justify-center">
                    <svg viewBox="0 0 40 40" className="w-12 h-12">
                      <polygon points="20,2 26,14 40,16 30,26 32,40 20,34 8,40 10,26 0,16 14,14" fill="none" stroke="#14b8a6" strokeWidth="1.5" />
                      <polygon points="20,8 24,16 32,18 26,24 28,32 20,28 12,32 14,24 8,18 16,16" fill="#14b8a6" opacity="0.3" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-3xl md:text-5xl font-cinzel font-bold text-teal-400 mb-4">Collect the Drift Shards</h2>
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Twenty luminous Drift Shards are scattered across all three realms. Each one pulses with the energy of the Equinox. Find them all to attune your steed and unlock the truth of the Drift.
              </p>

              <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                    className="w-6 h-6 rotate-45 bg-teal-500/20 border border-teal-500/50 shadow-[0_0_8px_rgba(20,184,166,0.4)]"
                  />
                ))}
              </div>

              <Link href="/game">
                <button className="mt-6 px-12 py-4 bg-gradient-to-r from-violet-600 to-teal-500 text-white font-cinzel font-bold text-xl rounded-full hover:scale-105 transition-all shadow-[0_0_40px_rgba(124,58,237,0.35)] active:scale-95">
                  BEGIN THE HUNT
                </button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ── Mobile + Controls feature ── */}
        <section className="py-20 px-5">
          <div className="container mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              <div className="bg-card border border-card-border rounded-2xl p-8 space-y-4 hover:border-primary/30 transition-colors">
                <div className="text-3xl">📱</div>
                <h3 className="text-xl font-cinzel font-bold text-primary">Mobile First</h3>
                <p className="text-muted-foreground">Virtual joystick for movement, responsive action buttons for Jump, Sprint, Rear, and Camera. Built for touch — no controller needed.</p>
              </div>
              <div className="bg-card border border-card-border rounded-2xl p-8 space-y-4 hover:border-secondary/30 transition-colors">
                <div className="text-3xl">🎮</div>
                <h3 className="text-xl font-cinzel font-bold text-secondary">Desktop Controls</h3>
                <p className="text-muted-foreground">
                  <kbd className="bg-white/10 px-2 py-0.5 rounded text-xs">WASD</kbd> to gallop, 
                  <kbd className="bg-white/10 px-2 py-0.5 rounded text-xs mx-1">Space</kbd> to jump, 
                  <kbd className="bg-white/10 px-2 py-0.5 rounded text-xs">Shift</kbd> to sprint.
                  Three camera modes with <kbd className="bg-white/10 px-2 py-0.5 rounded text-xs ml-1">C</kbd>.
                </p>
              </div>
              <div className="bg-card border border-card-border rounded-2xl p-8 space-y-4 hover:border-accent/30 transition-colors">
                <div className="text-3xl">🔊</div>
                <h3 className="text-xl font-cinzel font-bold text-accent">Procedural Audio</h3>
                <p className="text-muted-foreground">Every biome has a unique procedurally synthesized ambient soundtrack. Hoofbeats, jump swooshes, shard chimes — all generated in real-time via Web Audio API.</p>
              </div>
              <div className="bg-card border border-card-border rounded-2xl p-8 space-y-4 hover:border-green-500/30 transition-colors">
                <div className="text-3xl">⚡</div>
                <h3 className="text-xl font-cinzel font-bold text-green-400">Physics Engine</h3>
                <p className="text-muted-foreground">Real collision detection and gravity with cannon-es. Jump, land with impact, gallop and sprint with stamina management. Your steed obeys the laws of physics.</p>
              </div>
            </motion.div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="py-12 border-t border-white/5 bg-black/80 text-center space-y-6">
        <Logo className="scale-75 mx-auto" />
        <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground uppercase tracking-widest">
          <Link href="/how-to-play"><span className="hover:text-primary cursor-pointer transition-colors">Rider's Manual</span></Link>
          <Link href="/about"><span className="hover:text-primary cursor-pointer transition-colors">Lore & Credits</span></Link>
          <Link href="/game"><span className="hover:text-primary cursor-pointer transition-colors">Play Now</span></Link>
        </div>
        <p className="text-xs text-muted-foreground/40">Built with Three.js · cannon-es · React · Framer Motion</p>
      </footer>
    </div>
  );
}
