import { Link } from "wouter";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex flex-col items-center justify-center space-y-1.5 group ${className}`} data-testid="link-logo">
      <div className="relative transition-transform duration-500 group-hover:scale-105">
        <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]">
          <defs>
            <linearGradient id="eq-ring" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#14b8a6" />
            </linearGradient>
            <linearGradient id="eq-horse" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="60%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#14b8a6" />
            </linearGradient>
            <linearGradient id="eq-night" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e0a3c" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <radialGradient id="eq-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
            </radialGradient>
            <clipPath id="eq-clip-left">
              <rect x="0" y="0" width="50" height="100" />
            </clipPath>
            <clipPath id="eq-clip-right">
              <rect x="50" y="0" width="50" height="100" />
            </clipPath>
          </defs>

          {/* Glow backdrop */}
          <circle cx="50" cy="50" r="46" fill="url(#eq-glow)" />

          {/* Equinox ring — outer */}
          <circle cx="50" cy="50" r="44" stroke="url(#eq-ring)" strokeWidth="1.5" fill="none" opacity="0.6" />

          {/* Left half — night sky */}
          <path d="M50 6 A44 44 0 0 0 50 94 Z" fill="url(#eq-night)" clipPath="url(#eq-clip-left)" />

          {/* Right half — dawn glow */}
          <path d="M50 6 A44 44 0 0 1 50 94 Z" fill="#1a0533" clipPath="url(#eq-clip-right)" />

          {/* Moon in left half */}
          <circle cx="26" cy="32" r="7" fill="none" stroke="#c4b5fd" strokeWidth="1" opacity="0.5" />
          <circle cx="29" cy="30" r="7" fill="url(#eq-night)" />

          {/* Sun rays in right half */}
          {[0,45,90,135].map((a, i) => (
            <line key={i}
              x1={68 + Math.cos(a * Math.PI / 180) * 9}
              y1={28 + Math.sin(a * Math.PI / 180) * 9}
              x2={68 + Math.cos(a * Math.PI / 180) * 12}
              y2={28 + Math.sin(a * Math.PI / 180) * 12}
              stroke="#f59e0b" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"
            />
          ))}
          <circle cx="68" cy="28" r="5" fill="#f59e0b" opacity="0.5" />

          {/* Equinox horizon line */}
          <line x1="6" y1="50" x2="94" y2="50" stroke="url(#eq-ring)" strokeWidth="0.8" opacity="0.5" />

          {/* ── GALLOPING HORSE SILHOUETTE ── */}
          {/* Body */}
          <ellipse cx="50" cy="61" rx="19" ry="10" fill="url(#eq-horse)" transform="rotate(-5 50 61)" />

          {/* Hindquarters bulge */}
          <ellipse cx="36" cy="60" rx="10" ry="9" fill="url(#eq-horse)" />

          {/* Chest bulge */}
          <ellipse cx="63" cy="60" rx="9" ry="8" fill="url(#eq-horse)" />

          {/* Neck */}
          <path d="M62 54 C64 48 67 42 70 38 C68 35 65 35 63 36 C60 40 58 47 57 53 Z" fill="url(#eq-horse)" />

          {/* Head */}
          <ellipse cx="72" cy="35" rx="8" ry="5.5" fill="url(#eq-horse)" transform="rotate(20 72 35)" />

          {/* Snout */}
          <ellipse cx="79" cy="39" rx="5" ry="3.5" fill="url(#eq-horse)" transform="rotate(15 79 39)" />

          {/* Ear */}
          <path d="M68 30 C69 26 72 25 73 28 C71 29 69 30 68 30Z" fill="url(#eq-horse)" />

          {/* Eye */}
          <circle cx="75" cy="34" r="1.2" fill="#0f0f13" />

          {/* Mane */}
          <path d="M65 40 C62 37 60 39 61 43" stroke="#fbbf24" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M63 44 C60 41 58 43 59 47" stroke="#f59e0b" strokeWidth="1.8" fill="none" strokeLinecap="round" />

          {/* LEGS in gallop — front legs reach forward */}
          <path d="M63 67 C65 72 68 78 70 84 C71 87 68 88 67 85 C65 80 63 74 61 69 Z"
            fill="url(#eq-horse)" />
          <path d="M67 66 C71 71 75 77 77 83 C78 86 75 87 74 84 C72 79 69 74 66 68 Z"
            fill="url(#eq-horse)" />

          {/* LEGS — back legs push back */}
          <path d="M37 67 C34 73 31 79 29 84 C28 87 31 88 32 85 C34 80 37 74 39 68 Z"
            fill="url(#eq-horse)" />
          <path d="M42 68 C40 74 38 80 37 86 C36 89 39 90 40 87 C42 82 44 76 45 69 Z"
            fill="url(#eq-horse)" />

          {/* Tail — flowing back */}
          <path d="M30 57 C24 53 17 56 13 62 C16 60 13 65 11 70"
            stroke="url(#eq-horse)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M29 60 C22 58 16 62 13 68"
            stroke="#f59e0b" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />

          {/* Star particles */}
          <circle cx="20" cy="20" r="0.8" fill="#f59e0b" opacity="0.7" />
          <circle cx="80" cy="15" r="0.6" fill="#c4b5fd" opacity="0.7" />
          <circle cx="15" cy="68" r="0.5" fill="#14b8a6" opacity="0.6" />
          <circle cx="85" cy="72" r="0.7" fill="#f59e0b" opacity="0.5" />
        </svg>
      </div>

      <span className="font-cinzel text-lg sm:text-xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-amber-400 to-teal-400 whitespace-nowrap">
        EQUINOX DRIFT
      </span>
    </Link>
  );
}
