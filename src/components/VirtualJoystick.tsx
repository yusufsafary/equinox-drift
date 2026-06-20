import { useEffect, useRef, useState } from "react";

interface VirtualJoystickProps {
  onMove: (vector: { x: number; y: number }) => void;
  className?: string;
}

export function VirtualJoystick({ onMove, className = "" }: VirtualJoystickProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const maxRadius = 40;

  const handlePointerDown = (e: React.PointerEvent) => {
    setActive(true);
    updatePosition(e.clientX, e.clientY);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!active) return;
    updatePosition(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setActive(false);
    setPosition({ x: 0, y: 0 });
    onMove({ x: 0, y: 0 });
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const updatePosition = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;

    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > maxRadius) {
      dx = (dx / distance) * maxRadius;
      dy = (dy / distance) * maxRadius;
    }

    setPosition({ x: dx, y: dy });
    onMove({ x: dx / maxRadius, y: dy / maxRadius });
  };

  return (
    <div 
      className={`relative w-32 h-32 rounded-full border-2 border-primary/30 bg-black/40 backdrop-blur-sm touch-none flex items-center justify-center ${className}`}
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      data-testid="virtual-joystick"
    >
      <div 
        className="w-12 h-12 rounded-full bg-primary/60 border border-primary shadow-[0_0_15px_rgba(245,158,11,0.5)] transition-transform duration-75"
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      />
    </div>
  );
}
