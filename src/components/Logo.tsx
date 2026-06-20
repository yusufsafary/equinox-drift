import { Link } from "wouter";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex flex-col items-center justify-center space-y-2 group ${className}`} data-testid="link-logo">
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 transition-transform duration-500 group-hover:scale-105">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">
          <defs>
            <linearGradient id="equinox-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#14b8a6" />
            </linearGradient>
            <linearGradient id="moon-gradient" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Crescent Sun/Moon */}
          <path d="M50 10 C27.9 10 10 27.9 10 50 C10 72.1 27.9 90 50 90 C72.1 90 90 72.1 90 50 C90 27.9 72.1 10 50 10 Z" fill="url(#moon-gradient)" />
          <path d="M50 10 C72.1 10 90 27.9 90 50 C90 72.1 72.1 90 50 90 C65 90 80 72.1 80 50 C80 27.9 65 10 50 10 Z" fill="#0f0f13" />
          
          {/* Horse Silhouette */}
          <path d="M40 35 C45 35 48 40 50 45 C52 50 55 52 60 50 C65 48 70 55 65 60 C62 63 58 65 55 70 C52 75 48 80 45 75 C42 70 45 65 40 60 C35 55 30 50 35 45 C38 42 35 38 40 35 Z" fill="url(#equinox-gradient)" />
        </svg>
      </div>
      <span className="font-cinzel text-xl sm:text-2xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-amber-400 to-teal-400">
        EQUINOX DRIFT
      </span>
    </Link>
  );
}
