import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import * as THREE from "three";

function BiomeDemoScene({ biome }: { biome: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const scene = new THREE.Scene();
    const colors = [0x3a6b1f, 0x050d1a, 0x1a0400];
    const fogColors = [0x6aab3a, 0x030c20, 0x3a1000];
    scene.background = new THREE.Color(colors[biome]);
    scene.fog = new THREE.Fog(fogColors[biome], 10, 40);
    const camera = new THREE.PerspectiveCamera(60, ref.current.clientWidth / ref.current.clientHeight || 1.5, 0.1, 100);
    camera.position.set(0, 3, 8);
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true }); } catch { return; }
    renderer.setSize(ref.current.clientWidth || 300, ref.current.clientHeight || 200);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    ref.current.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dl = new THREE.DirectionalLight([0xfff4cc, 0x2255ff, 0xff4400][biome], 2);
    dl.position.set(5, 8, 5); scene.add(dl);

    // Ground
    const gMat = new THREE.MeshStandardMaterial({ color: [0x3a6b1f, 0x050d1a, 0x5c1a0a][biome], roughness: 0.9 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), gMat);
    ground.rotation.x = -Math.PI / 2; scene.add(ground);

    // Biome-specific objects
    if (biome === 0) {
      // Trees
      for (let i = 0; i < 5; i++) {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 2, 6), new THREE.MeshStandardMaterial({ color: 0x5a3a1a }));
        trunk.position.set(-4 + i * 2, 1, -3 - Math.random() * 3);
        scene.add(trunk);
        const foliage = new THREE.Mesh(new THREE.SphereGeometry(0.8, 7, 5), new THREE.MeshStandardMaterial({ color: 0x245c14 }));
        foliage.position.set(trunk.position.x, 2.6, trunk.position.z);
        scene.add(foliage);
      }
    } else if (biome === 1) {
      // Crystal platforms
      for (let i = 0; i < 4; i++) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(3, 0.3, 3), new THREE.MeshStandardMaterial({ color: 0x0e4a5c, emissive: 0x0e4a5c, emissiveIntensity: 0.3, roughness: 0.1, metalness: 0.6 }));
        p.position.set(-3 + i * 2, 1 + Math.sin(i) * 0.8, -2 - i * 1.5);
        scene.add(p);
      }
      const spire = new THREE.Mesh(new THREE.ConeGeometry(0.3, 3, 5), new THREE.MeshStandardMaterial({ color: 0x0077aa, emissive: 0x0044aa, emissiveIntensity: 0.5, transparent: true, opacity: 0.8 }));
      spire.position.set(2, 1.5, -5); scene.add(spire);
    } else {
      // Volcano cones
      for (let i = 0; i < 4; i++) {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.6 + Math.random() * 0.5, 2 + Math.random(), 6), new THREE.MeshStandardMaterial({ color: 0x8b1a00, emissive: 0xff2200, emissiveIntensity: 0.15 }));
        cone.position.set(-4 + i * 2.5, 1, -3 - Math.random() * 2);
        scene.add(cone);
      }
    }

    // Shard
    const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.4, 0), new THREE.MeshStandardMaterial({ color: 0x14b8a6, emissive: 0x14b8a6, emissiveIntensity: 0.7 }));
    shard.position.set(0, 1.8, 0); scene.add(shard);
    scene.add(new THREE.PointLight(0x14b8a6, 1.5, 5));

    let raf: number;
    const clock = new THREE.Clock();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      shard.rotation.y = t * 1.5;
      shard.position.y = 1.8 + Math.sin(t * 2) * 0.2;
      camera.position.x = Math.sin(t * 0.3) * 2;
      camera.lookAt(0, 1.5, 0);
      renderer.render(scene, camera);
    };
    animate();
    return () => {
      cancelAnimationFrame(raf); renderer.dispose();
      if (ref.current && renderer.domElement.parentNode === ref.current) ref.current.removeChild(renderer.domElement);
    };
  }, [biome]);
  return <div ref={ref} className="w-full h-full" />;
}

export default function HowToPlay() {
  const controls = [
    { icon: "🕹️", title: "Virtual Joystick", desc: "Drag to steer your steed in any direction", color: "primary", badge: "MOBILE" },
    { icon: "⚡", title: "Sprint / Gallop", desc: "Hold SPRINT or Shift to gallop — consumes stamina rapidly", color: "primary", badge: "SHIFT" },
    { icon: "🔼", title: "Jump / Leap", desc: "Tap JUMP or Space to clear gaps and obstacles", color: "secondary", badge: "SPACE" },
    { icon: "🐴", title: "Rear Up", desc: "Trigger a majestic display of power at any time", color: "accent", badge: "R" },
    { icon: "📷", title: "Camera Cycle", desc: "Switch between follow, first-person, and cinematic orbit", color: "muted-foreground", badge: "C" },
    { icon: "🔇", title: "Mute / Unmute", desc: "Toggle procedural audio and ambient soundscapes", color: "muted-foreground", badge: "M" },
  ];

  return (
    <div className="min-h-[100dvh] bg-background text-foreground overflow-x-hidden relative">
      <div className="absolute inset-0 pointer-events-none opacity-15">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-accent rounded-full mix-blend-screen filter blur-[120px]" />
        <div className="absolute top-3/4 right-0 w-80 h-80 bg-secondary rounded-full mix-blend-screen filter blur-[100px]" />
      </div>

      <nav className="fixed top-0 w-full px-5 py-4 flex justify-between items-center z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <span className="font-cinzel text-xl font-bold tracking-widest text-primary">EQUINOX</span>
        </Link>
        <Link href="/" className="text-sm font-medium hover:text-primary transition-colors uppercase tracking-wider bg-white/5 px-4 py-2 rounded-full" data-testid="link-home">
          ← Back
        </Link>
      </nav>

      <main className="container mx-auto px-5 pt-28 pb-24 max-w-5xl space-y-16">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-cinzel font-bold text-primary">Rider's Manual</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Master every control. Conquer every biome. Collect all 20 Drift Shards.
          </p>
        </motion.div>

        {/* Controls grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {controls.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              className="bg-card border border-card-border rounded-2xl p-5 flex gap-4 items-start hover:border-primary/20 transition-colors group"
            >
              <div className="text-2xl shrink-0 mt-0.5">{c.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="font-cinzel font-bold text-foreground text-sm">{c.title}</h4>
                  <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-mono text-muted-foreground shrink-0">{c.badge}</kbd>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Biome previews */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-6"
        >
          <h2 className="text-2xl md:text-3xl font-cinzel font-bold text-center text-secondary">The Three Realms</h2>
          <p className="text-muted-foreground text-center max-w-xl mx-auto">
            Gallop westward for Verdant Plains, stay central for Crystal Void, or ride east into the Ember Wastes. Purple portal rings mark each threshold.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { name: "Verdant Plains", desc: "Lush hills, trees & fences", color: "text-green-400 border-green-500/30", biome: 0 },
              { name: "Crystal Void", desc: "Floating platforms, glowing spires", color: "text-cyan-400 border-cyan-500/30", biome: 1 },
              { name: "Ember Wastes", desc: "Volcanic terrain, ember rain", color: "text-orange-400 border-orange-500/30", biome: 2 },
            ].map((b, i) => (
              <motion.div
                key={b.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className={`rounded-2xl border overflow-hidden ${b.color}`}
              >
                <div className="h-40 overflow-hidden">
                  <BiomeDemoScene biome={b.biome} />
                </div>
                <div className="p-4 bg-card">
                  <h3 className="font-cinzel font-bold text-sm mb-1">{b.name}</h3>
                  <p className="text-xs text-muted-foreground">{b.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Drift Shards info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-card border border-card-border rounded-2xl p-6 md:p-8 space-y-4"
        >
          <div className="flex items-center gap-3">
            <span className="inline-block w-5 h-5 rotate-45 bg-teal-400/30 border border-teal-400 shadow-[0_0_10px_#14b8a6]" />
            <h3 className="text-xl md:text-2xl font-cinzel font-bold text-teal-400">Drift Shards</h3>
          </div>
          <p className="text-muted-foreground">
            Twenty luminous octahedral Drift Shards float and spin across all three biomes. Approach within 3.5 units to collect — the chime confirms your find. Collect all 20 to achieve full Equinox attunement.
          </p>
          <div className="flex gap-1.5 flex-wrap">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="w-5 h-5 rotate-45 bg-teal-500/20 border border-teal-500/40" />
            ))}
          </div>
        </motion.div>

        <div className="flex justify-center">
          <Link href="/game">
            <button className="px-10 py-4 bg-primary text-primary-foreground font-cinzel font-bold text-xl rounded-full hover:bg-primary/90 hover:scale-105 transition-all shadow-[0_0_30px_rgba(245,158,11,0.3)] active:scale-95" data-testid="btn-play-now">
              ENTER THE RIFT
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
}
