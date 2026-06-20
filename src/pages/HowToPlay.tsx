import { motion } from "framer-motion";
import { Link } from "wouter";

export default function HowToPlay() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground overflow-x-hidden relative">
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-accent rounded-full mix-blend-screen filter blur-[120px]" />
      </div>

      <nav className="fixed top-0 w-full p-6 flex justify-between items-center z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <span className="font-cinzel text-xl font-bold tracking-widest text-primary">
            EQUINOX
          </span>
        </Link>
        <Link href="/" className="text-sm font-medium hover:text-primary transition-colors uppercase tracking-wider bg-white/5 px-4 py-2 rounded-full" data-testid="link-home">
          Close Guide
        </Link>
      </nav>

      <main className="container mx-auto px-6 pt-32 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto space-y-16"
        >
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-cinzel font-bold text-primary">
              Rider's Manual
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Master the controls and bend reality to your will. The Drift awaits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-card-border p-8 rounded-2xl relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full transition-transform group-hover:scale-110" />
              <h3 className="text-2xl font-cinzel font-bold mb-6 text-foreground">Controls</h3>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full border border-primary/50 flex items-center justify-center bg-primary/10">
                    <div className="w-4 h-4 rounded-full bg-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-primary">Virtual Joystick</h4>
                    <p className="text-sm text-muted-foreground">Steer and control movement momentum</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full border border-primary/50 flex items-center justify-center bg-primary/10 text-primary font-bold text-xs">
                    SPRINT
                  </div>
                  <div>
                    <h4 className="font-bold text-primary">Gallop</h4>
                    <p className="text-sm text-muted-foreground">Hold to sprint. Consumes stamina.</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full border border-secondary/50 flex items-center justify-center bg-secondary/10 text-secondary font-bold text-xs">
                    JUMP
                  </div>
                  <div>
                    <h4 className="font-bold text-secondary">Leap</h4>
                    <p className="text-sm text-muted-foreground">Tap to jump over obstacles and gaps.</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full border border-accent/50 flex items-center justify-center bg-accent/10 text-accent font-bold text-xs">
                    REAR
                  </div>
                  <div>
                    <h4 className="font-bold text-accent">Rear Up</h4>
                    <p className="text-sm text-muted-foreground">A majestic display of power.</p>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-white/5 text-sm text-muted-foreground">
                  <p>Desktop: <kbd className="bg-white/10 px-2 py-1 rounded">WASD</kbd> to move, <kbd className="bg-white/10 px-2 py-1 rounded">Space</kbd> to jump, <kbd className="bg-white/10 px-2 py-1 rounded">Shift</kbd> to sprint.</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-8"
            >
              <div className="bg-card border border-card-border p-8 rounded-2xl">
                <h3 className="text-2xl font-cinzel font-bold mb-4 text-secondary">The Biomes</h3>
                <p className="text-muted-foreground mb-4">
                  Ride seamlessly between distinct realms. Watch for glowing portal rings marking the threshold between realities.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500" /> Verdant Plains</li>
                  <li className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-cyan-500" /> Crystal Void</li>
                  <li className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500" /> Ember Wastes</li>
                </ul>
              </div>

              <div className="bg-card border border-card-border p-8 rounded-2xl">
                <h3 className="text-2xl font-cinzel font-bold mb-4 text-accent">Drift Shards</h3>
                <p className="text-muted-foreground">
                  Luminous geometric anomalies scattered across the realms. Collect all 20 to synchronize with the Equinox.
                </p>
              </div>
            </motion.div>
          </div>

          <div className="flex justify-center pt-8">
            <Link href="/game">
              <button className="px-12 py-4 bg-primary text-primary-foreground font-cinzel font-bold text-xl rounded-full hover:bg-primary/90 transition-all hover:scale-105 shadow-[0_0_30px_rgba(245,158,11,0.3)]" data-testid="btn-play-now">
                ENTER THE RIFT
              </button>
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
