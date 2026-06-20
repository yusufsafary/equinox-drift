import { VirtualJoystick } from "./VirtualJoystick";

interface GameHUDProps {
  shards: number;
  totalShards: number;
  biomeName: string;
  stamina: number;
  onMove: (vector: { x: number; y: number }) => void;
  onAction: (action: "SPRINT_START" | "SPRINT_END" | "JUMP" | "REAR" | "CAM") => void;
}

export function GameHUD({ shards, totalShards, biomeName, stamina, onMove, onAction }: GameHUDProps) {
  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-50">
      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-[max(1rem,env(safe-area-inset-top))] flex justify-between items-start">
        <div className="bg-black/60 backdrop-blur-md border border-primary/30 rounded-full px-4 py-2 pointer-events-auto shadow-lg shadow-black/50">
          <span className="font-cinzel text-primary font-bold tracking-wider">
            SHARDS: {shards}/{totalShards}
          </span>
        </div>
        
        <div className="bg-black/60 backdrop-blur-md border border-secondary/30 rounded-full px-6 py-2 pointer-events-auto shadow-lg shadow-black/50">
          <span className="font-cinzel text-secondary font-bold tracking-widest uppercase">
            {biomeName}
          </span>
        </div>
      </div>

      {/* Stamina Bar */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-48 h-1.5 bg-black/60 rounded-full overflow-hidden border border-primary/20 backdrop-blur-md">
        <div 
          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(245,158,11,0.8)]"
          style={{ width: `${stamina * 100}%` }}
        />
      </div>

      {/* Controls Bottom Left */}
      <div className="absolute bottom-8 left-8 pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pointer-events-auto">
        <VirtualJoystick onMove={onMove} />
      </div>

      {/* Controls Bottom Right */}
      <div className="absolute bottom-8 right-8 pb-[env(safe-area-inset-bottom)] pr-[env(safe-area-inset-right)] pointer-events-auto flex flex-col gap-4">
        <div className="flex gap-4">
          <button 
            className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-md border-2 border-primary/50 text-primary font-cinzel font-bold text-xs shadow-[0_0_10px_rgba(245,158,11,0.2)] active:scale-95 active:bg-primary/20 transition-all"
            onPointerDown={() => onAction("CAM")}
            data-testid="btn-cam"
          >
            CAM
          </button>
          <button 
            className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-md border-2 border-accent/50 text-accent font-cinzel font-bold text-xs shadow-[0_0_10px_rgba(124,58,237,0.2)] active:scale-95 active:bg-accent/20 transition-all"
            onPointerDown={() => onAction("REAR")}
            data-testid="btn-rear"
          >
            REAR
          </button>
        </div>
        <div className="flex gap-4 ml-8">
          <button 
            className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md border-2 border-secondary/50 text-secondary font-cinzel font-bold text-sm shadow-[0_0_15px_rgba(20,184,166,0.3)] active:scale-95 active:bg-secondary/20 transition-all"
            onPointerDown={() => onAction("JUMP")}
            data-testid="btn-jump"
          >
            JUMP
          </button>
          <button 
            className="w-20 h-20 rounded-full bg-primary/10 backdrop-blur-md border-2 border-primary text-primary font-cinzel font-bold text-sm shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-95 active:bg-primary/30 transition-all"
            onPointerDown={() => onAction("SPRINT_START")}
            onPointerUp={() => onAction("SPRINT_END")}
            onPointerLeave={() => onAction("SPRINT_END")}
            onPointerCancel={() => onAction("SPRINT_END")}
            data-testid="btn-sprint"
          >
            SPRINT
          </button>
        </div>
      </div>
    </div>
  );
}
