import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Link } from "wouter";
import { motion, useScroll, useTransform } from "framer-motion";
import { Logo } from "@/components/Logo";

function HeroBackground() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x1a0f2e, 0.02);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;
    camera.position.y = 10;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      return;
    }
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // Particles
    const particlesGeo = new THREE.BufferGeometry();
    const particleCount = 2000;
    const posArray = new Float32Array(particleCount * 3);
    for(let i = 0; i < particleCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 100;
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.2,
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    const particlesMesh = new THREE.Points(particlesGeo, particleMat);
    scene.add(particlesMesh);

    // Terrain Plane
    const planeGeo = new THREE.PlaneGeometry(200, 200, 50, 50);
    const planeMat = new THREE.MeshBasicMaterial({ 
      color: 0x7c3aed,
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -10;
    scene.add(plane);

    const clock = new THREE.Clock();

    const animate = () => {
      requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      particlesMesh.rotation.y = elapsedTime * 0.05;
      
      const positions = planeGeo.attributes.position.array as Float32Array;
      for(let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i+1];
        positions[i+2] = Math.sin(x * 0.1 + elapsedTime) * 2 + Math.cos(y * 0.1 + elapsedTime) * 2;
      }
      planeGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 pointer-events-none -z-10" />;
}

export default function Landing() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground overflow-x-hidden">
      <HeroBackground />
      
      <nav className="fixed top-0 w-full p-6 flex justify-between items-center z-50 bg-background/50 backdrop-blur-sm border-b border-white/5">
        <Logo className="scale-75 origin-left" />
        <div className="flex gap-6 items-center">
          <Link href="/how-to-play" className="text-sm font-medium hover:text-primary transition-colors uppercase tracking-wider hidden sm:block">
            How to Play
          </Link>
          <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors uppercase tracking-wider hidden sm:block">
            Lore
          </Link>
          <Link href="/game">
            <button className="px-6 py-2 bg-primary/10 border border-primary text-primary font-cinzel font-bold text-sm rounded-full hover:bg-primary/20 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              PLAY
            </button>
          </Link>
        </div>
      </nav>

      <main className="relative">
        <section className="min-h-[100dvh] flex flex-col items-center justify-center pt-20 px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="flex flex-col items-center text-center space-y-8"
          >
            <Logo className="scale-125 md:scale-150 mb-8" />
            <h2 className="text-xl md:text-3xl font-serif italic text-muted-foreground max-w-2xl">
              Ride the Shifting Realms
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-6 mt-12 pt-8">
              <Link href="/game">
                <button className="px-12 py-4 bg-primary text-primary-foreground font-cinzel font-bold text-xl rounded-full hover:bg-primary/90 transition-all hover:scale-105 shadow-[0_0_30px_rgba(245,158,11,0.3)] w-full sm:w-auto" data-testid="btn-play-now">
                  ENTER THE RIFT
                </button>
              </Link>
              <Link href="/how-to-play">
                <button className="px-12 py-4 bg-black/50 backdrop-blur-md border border-secondary text-secondary font-cinzel font-bold text-xl rounded-full hover:bg-secondary/10 transition-all hover:scale-105 w-full sm:w-auto" data-testid="btn-how-to-play">
                  RIDER'S MANUAL
                </button>
              </Link>
            </div>
          </motion.div>
        </section>

        <section className="py-32 px-6 bg-gradient-to-b from-transparent to-black/80">
          <div className="container mx-auto max-w-5xl space-y-32">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="flex flex-col md:flex-row gap-12 items-center"
            >
              <div className="flex-1 space-y-6">
                <h3 className="text-4xl font-cinzel font-bold text-primary">Surreal Biomes</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Gallop through the Verdant Plains, leap across the shattered floating islands of the Crystal Void, and brave the heat of the Ember Wastes. No loading screens. Just infinite momentum.
                </p>
              </div>
              <div className="flex-1 w-full aspect-video bg-gradient-to-tr from-primary/20 to-transparent rounded-3xl border border-primary/20 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 border border-primary/30 rounded-full animate-ping" />
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="flex flex-col md:flex-row-reverse gap-12 items-center"
            >
              <div className="flex-1 space-y-6">
                <h3 className="text-4xl font-cinzel font-bold text-secondary">Drift Shards</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Seek out luminous anomalies scattered across the realms. Collecting them attunes your steed to the Equinox, unlocking the true nature of the Drift.
                </p>
              </div>
              <div className="flex-1 w-full aspect-video bg-gradient-to-tl from-secondary/20 to-transparent rounded-3xl border border-secondary/20 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rotate-45 border-2 border-secondary bg-secondary/20 animate-pulse shadow-[0_0_20px_rgba(20,184,166,0.5)]" />
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-white/5 bg-black text-center space-y-6">
        <div className="flex justify-center gap-8 text-sm text-muted-foreground uppercase tracking-widest">
          <span className="hover:text-primary cursor-pointer transition-colors">Privacy</span>
          <span className="hover:text-primary cursor-pointer transition-colors">Terms</span>
          <Link href="/about"><span className="hover:text-primary cursor-pointer transition-colors">Credits</span></Link>
        </div>
        <p className="text-xs text-muted-foreground/50">Built with Three.js & cannon-es</p>
      </footer>
    </div>
  );
}
