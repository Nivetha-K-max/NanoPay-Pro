import { motion } from "framer-motion";

export function ParticleGrid() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Cybernetic grid overlay */}
      <div className="cyber-grid absolute inset-0 opacity-40" />

      {/* Radial vignette mask */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--bg-base)_80%)]" />

      {/* Floating neural node connection paths */}
      <svg className="absolute inset-0 h-full w-full opacity-25" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="gridGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gridGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Dynamic mesh connection vectors */}
        <line x1="10%" y1="20%" x2="35%" y2="45%" stroke="url(#gridGrad1)" strokeWidth="1.5" strokeDasharray="4 4" />
        <line x1="35%" y1="45%" x2="65%" y2="35%" stroke="url(#gridGrad1)" strokeWidth="1.5" />
        <line x1="65%" y1="35%" x2="88%" y2="60%" stroke="url(#gridGrad2)" strokeWidth="1.5" strokeDasharray="6 6" />
        <line x1="35%" y1="45%" x2="50%" y2="80%" stroke="url(#gridGrad2)" strokeWidth="1.5" />
      </svg>

      {/* Animated ambient light blooms */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.15, 0.3, 0.15],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute left-[-10%] top-[-10%] h-[600px] w-[600px] rounded-full bg-cyan-600/20 blur-[150px]"
      />

      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.12, 0.25, 0.12],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute right-[-5%] top-[30%] h-[700px] w-[700px] rounded-full bg-purple-600/20 blur-[160px]"
      />

      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
        className="absolute bottom-[-10%] left-[25%] h-[550px] w-[550px] rounded-full bg-emerald-600/15 blur-[140px]"
      />
    </div>
  );
}
