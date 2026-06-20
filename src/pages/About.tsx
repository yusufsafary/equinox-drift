import { motion } from "framer-motion";
import { Link } from "wouter";
import { Logo } from "@/components/Logo";

export default function About() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground overflow-hidden relative">
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full mix-blend-screen filter blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary rounded-full mix-blend-screen filter blur-[100px] animate-pulse delay-1000" />
      </div>

      <nav className="absolute top-0 w-full p-6 flex justify-between items-center z-10">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <span className="font-cinzel text-xl font-bold tracking-widest text-primary">
            EQUINOX
          </span>
        </Link>
        <Link href="/" className="text-sm font-medium hover:text-primary transition-colors uppercase tracking-wider" data-testid="link-home">
          Return to Hub
        </Link>
      </nav>

      <main className="container mx-auto px-6 pt-32 pb-24 relative z-10 flex flex-col items-center min-h-[100dvh] justify-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl w-full space-y-16"
        >
          <div className="flex justify-center mb-12">
            <Logo />
          </div>

          <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 1 }}
            className="space-y-6"
          >
            <h1 className="text-4xl md:text-5xl font-cinzel font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-8">
              The Lore
            </h1>
            <p className="text-lg md:text-xl leading-relaxed text-muted-foreground font-serif italic">
              "In the world of Equinox Drift, two forces govern all reality — the Sun's momentum and the Moon's stillness. When the Equinox breaks, realms bleed together, and only a rider attuned to the Drift can navigate the chaos."
            </p>
          </motion.section>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left bg-black/40 backdrop-blur-md p-8 md:p-12 rounded-2xl border border-white/5"
          >
            <div>
              <h2 className="text-2xl font-cinzel font-bold text-secondary mb-4">Development</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li>Developed by Team Equinox</li>
                <li>Design & Audio: Equinox Studios</li>
                <li>Release: 2025</li>
              </ul>
            </div>
            
            <div>
              <h2 className="text-2xl font-cinzel font-bold text-primary mb-4">Technology</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li>Engine: Three.js</li>
                <li>Physics: cannon-es</li>
                <li>Framework: React & Vite</li>
                <li>Animations: Framer Motion</li>
              </ul>
            </div>
          </motion.div>

        </motion.div>
      </main>
    </div>
  );
}
