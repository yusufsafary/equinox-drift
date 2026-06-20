import { useEffect, useRef } from "react";
import { VirtualJoystick } from "./VirtualJoystick";

interface GameHUDProps {
  shards: number;
  totalShards: number;
  biomeName: string;
  stamina: number;
  speed: number;
  horsePos: { x: number; z: number };
  onMove: (vector: { x: number; y: number }) => void;
  onAction: (action: "SPRINT_START" | "SPRINT_END" | "JUMP" | "REAR" | "CAM") => void;
}

// ── Minimap ───────────────────────────────────────────────────────────────────
function Minimap({ horsePos, biomeName }: { horsePos: { x: number; z: number }; biomeName: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const W = c.width; const H = c.height;
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 6);
    ctx.fill();

    // World bounds: x from ~-400 to +400, z from ~-400 to +400
    const mapX = (wx: number) => ((wx + 400) / 800) * W;
    const mapZ = (wz: number) => ((wz + 400) / 800) * H;

    // Biome zones (x-axis divides them)
    // Verdant: x < -133, Crystal: -133 to 133, Ember: x > 133
    const v1 = mapX(-400); const v2 = mapX(-133);
    const c1 = mapX(-133); const c2 = mapX(133);
    const e1 = mapX(133); const e2 = mapX(400);

    ctx.fillStyle = "rgba(34,197,94,0.15)";
    ctx.fillRect(v1, 0, v2 - v1, H);
    ctx.fillStyle = "rgba(6,182,212,0.15)";
    ctx.fillRect(c1, 0, c2 - c1, H);
    ctx.fillStyle = "rgba(249,115,22,0.15)";
    ctx.fillRect(e1, 0, e2 - e1, H);

    // Biome dividers
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(v2, 0); ctx.lineTo(v2, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(e1, 0); ctx.lineTo(e1, H); ctx.stroke();

    // Horse dot
    const hx = mapX(horsePos.x);
    const hz = mapZ(horsePos.z);

    // Glow
    const grd = ctx.createRadialGradient(hx, hz, 0, hx, hz, 6);
    grd.addColorStop(0, "rgba(245,158,11,0.8)");
    grd.addColorStop(1, "rgba(245,158,11,0)");
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(hx, hz, 6, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = "#f59e0b";
    ctx.beginPath(); ctx.arc(hx, hz, 2.5, 0, Math.PI * 2); ctx.fill();

    // Border
    ctx.strokeStyle = "rgba(245,158,11,0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(0, 0, W, H, 6); ctx.stroke();
  }, [horsePos.x, horsePos.z]);

  return (
    <div className="relative">
      <canvas ref={canvasRef} width={96} height={96} className="rounded-md" />
      <div className="absolute bottom-1 left-0 right-0 text-center text-[7px] text-white/30 font-cinzel uppercase tracking-wider pointer-events-none">
        MAP
      </div>
    </div>
  );
}

export function GameHUD({ shards, totalShards, biomeName, stamina, speed, horsePos, onMove, onAction }: GameHUDProps) {
  const biomeColor = biomeName === "Verdant Plains"
    ? "text-green-400 border-green-500/40"
    : biomeName === "Crystal Void"
    ? "text-cyan-400 border-cyan-500/40"
    : "text-orange-400 border-orange-500/40";

  const staminaColor = stamina > 0.5 ? "from-primary to-accent"
    : stamina > 0.2 ? "from-yellow-500 to-primary"
    : "from-red-500 to-orange-500";

  const shardFrac = shards / totalShards;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-50">

      {/* ── Top HUD ── */}
      <div className="absolute top-0 left-0 right-0 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-1 flex justify-between items-start gap-2">
        {/* Shards pill */}
        <div className="bg-black/65 backdrop-blur-md border border-primary/30 rounded-xl px-3 py-1.5 pointer-events-auto shadow-lg shadow-black/50 min-w-[90px]">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rotate-45 bg-teal-400 shadow-[0_0_6px_#14b8a6]" />
            <span className="font-cinzel text-teal-400 font-bold text-xs tracking-wider">
              {shards}/{totalShards}
            </span>
          </div>
          {/* Shard progress bar */}
          <div className="mt-1 h-0.5 bg-white/10 rounded-full overflow-hidden w-full">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${shardFrac * 100}%` }}
            />
          </div>
        </div>

        {/* Biome name */}
        <div className={`bg-black/65 backdrop-blur-md border rounded-xl px-3 py-1.5 pointer-events-auto shadow-lg shadow-black/50 ${biomeColor}`}>
          <span className={`font-cinzel font-bold text-xs tracking-wider uppercase ${biomeColor.split(" ")[0]}`}>
            {biomeName}
          </span>
        </div>

        {/* Speed */}
        <div className="bg-black/65 backdrop-blur-md border border-white/10 rounded-xl px-3 py-1.5 pointer-events-auto shadow-lg shadow-black/50 min-w-[64px] text-right">
          <div className="text-xs text-white/30 font-mono uppercase tracking-wider">km/h</div>
          <div className="font-cinzel font-bold text-white/80 text-sm leading-none mt-0.5">
            {Math.round(speed)}
          </div>
        </div>
      </div>

      {/* ── Stamina bar ── */}
      <div className="absolute top-[52px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5 pointer-events-none">
        <div className="w-44 h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/10">
          <div
            className={`h-full bg-gradient-to-r ${staminaColor} transition-all duration-100 ease-linear shadow-[0_0_6px_rgba(245,158,11,0.7)]`}
            style={{ width: `${stamina * 100}%` }}
          />
        </div>
        <span className="text-[9px] text-white/25 font-cinzel tracking-widest uppercase">Stamina</span>
      </div>

      {/* ── Bottom Left: Joystick + minimap ── */}
      <div className="absolute bottom-0 left-0 pb-[max(1.5rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pointer-events-auto flex flex-col gap-3">
        <Minimap horsePos={horsePos} biomeName={biomeName} />
        <VirtualJoystick onMove={onMove} />
      </div>

      {/* ── Bottom Right: Action buttons ── */}
      <div className="absolute bottom-0 right-0 pb-[max(1.5rem,env(safe-area-inset-bottom))] pr-[max(1rem,env(safe-area-inset-right))] pointer-events-auto">
        <div className="flex flex-col items-end gap-3">
          {/* Top row */}
          <div className="flex gap-3">
            <button
              className="w-12 h-12 rounded-full bg-black/65 backdrop-blur-md border-2 border-white/20 text-white/60 font-cinzel font-bold text-[10px] shadow-lg active:scale-90 active:bg-white/10 transition-all touch-none"
              onPointerDown={() => onAction("CAM")}
              data-testid="btn-cam"
            >
              CAM
            </button>
            <button
              className="w-12 h-12 rounded-full bg-black/65 backdrop-blur-md border-2 border-accent/50 text-accent font-cinzel font-bold text-[10px] shadow-[0_0_10px_rgba(124,58,237,0.25)] active:scale-90 active:bg-accent/20 transition-all touch-none"
              onPointerDown={() => onAction("REAR")}
              data-testid="btn-rear"
            >
              REAR
            </button>
          </div>
          {/* Bottom row */}
          <div className="flex gap-3 items-end">
            <button
              className="w-14 h-14 rounded-full bg-black/65 backdrop-blur-md border-2 border-secondary/50 text-secondary font-cinzel font-bold text-xs shadow-[0_0_14px_rgba(20,184,166,0.3)] active:scale-90 active:bg-secondary/20 transition-all touch-none"
              onPointerDown={() => onAction("JUMP")}
              data-testid="btn-jump"
            >
              JUMP
            </button>
            <button
              className="w-20 h-20 rounded-full bg-primary/15 backdrop-blur-md border-2 border-primary text-primary font-cinzel font-bold text-sm shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-90 active:bg-primary/35 transition-all touch-none"
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
    </div>
  );
}
