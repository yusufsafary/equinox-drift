import { motion } from "framer-motion";
import { Link } from "wouter";
import { Logo } from "@/components/Logo";

const lore = [
  {
    title: "The Equinox Event",
    body: "Once every thousand cycles, the Sun's momentum and the Moon's stillness collide at a single point in space-time — the Equinox. When the event fires, the membranes between realms dissolve, and three distinct biomes bleed into one continuous landscape.",
    color: "text-primary",
  },
  {
    title: "The Drift Rider",
    body: "You are the last Drift Rider — a being capable of attuning to the chaotic energy of the Equinox without being torn apart. Your steed is not merely a horse; it is a vessel woven from starlight, capable of crossing biome thresholds that would kill anything else.",
    color: "text-secondary",
  },
  {
    title: "The Drift Shards",
    body: "When the Equinox shattered the world barrier, twenty crystalline shards of pure Drift energy were scattered across the merged realms. Each one vibrates at the frequency of the Equinox itself. Collect them all, and you can repair the breach — or keep the worlds merged forever.",
    color: "text-accent",
  },
];

export default function About() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground overflow-x-hidden relative">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary rounded-full mix-blend-screen filter blur-[120px] opacity-15 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-secondary rounded-full mix-blend-screen filter blur-[100px] opacity-15 animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-accent rounded-full mix-blend-screen filter blur-[100px] opacity-10 animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <nav className="fixed top-0 w-full px-5 py-4 flex justify-between items-center z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <span className="font-cinzel text-xl font-bold tracking-widest text-primary">EQUINOX</span>
        </Link>
        <Link href="/" className="text-sm font-medium hover:text-primary transition-colors uppercase tracking-wider bg-white/5 px-4 py-2 rounded-full" data-testid="link-home">
          ← Return
        </Link>
      </nav>

      <main className="container mx-auto px-5 pt-28 pb-24 relative z-10 max-w-4xl space-y-16">

        {/* Logo hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="flex justify-center">
          <Logo />
        </motion.div>

        {/* Lore sections */}
        <div className="space-y-8">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-center text-3xl md:text-5xl font-cinzel font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary"
          >
            The Lore
          </motion.h1>

          {lore.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.15, duration: 0.7 }}
              className="bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 md:p-8 space-y-3"
            >
              <h2 className={`text-lg md:text-xl font-cinzel font-bold ${item.color}`}>{item.title}</h2>
              <p className="text-muted-foreground leading-relaxed font-serif italic text-base md:text-lg">
                "{item.body}"
              </p>
            </motion.div>
          ))}
        </div>

        {/* Credits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.7 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-8 bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 md:p-10"
        >
          <div>
            <h2 className="text-lg font-cinzel font-bold text-secondary mb-4">Development</h2>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-secondary" />Equinox Studios</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-secondary" />Design & Audio: Equinox Team</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-secondary" />Release: 2025</li>
            </ul>
          </div>
          <div>
            <h2 className="text-lg font-cinzel font-bold text-primary mb-4">Technology</h2>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary" />3D Engine: Three.js r184</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary" />Physics: cannon-es</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary" />UI: React 18 + Vite</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary" />Animations: Framer Motion</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary" />Audio: Web Audio API</li>
            </ul>
          </div>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/game">
            <button className="w-full sm:w-auto px-10 py-4 bg-primary text-primary-foreground font-cinzel font-bold text-xl rounded-full hover:bg-primary/90 hover:scale-105 transition-all shadow-[0_0_30px_rgba(245,158,11,0.3)] active:scale-95">
              ENTER THE RIFT
            </button>
          </Link>
          <Link href="/how-to-play">
            <button className="w-full sm:w-auto px-10 py-4 border border-secondary text-secondary font-cinzel font-bold text-xl rounded-full hover:bg-secondary/10 hover:scale-105 transition-all active:scale-95">
              RIDER'S MANUAL
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
}
