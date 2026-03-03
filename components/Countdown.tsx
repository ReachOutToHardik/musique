'use client'

import { motion } from 'framer-motion'

interface Props {
  count: number
}

export default function Countdown({ count }: Props) {
  if (count <= 0) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-md">
      <motion.div
        key={count}
        initial={{ scale: 0, opacity: 0, rotate: -180 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        exit={{ scale: 0, opacity: 0, rotate: 180 }}
        transition={{ 
          type: 'spring',
          stiffness: 200,
          damping: 20 
        }}
        className="relative"
      >
        {/* Outer glow */}
        <motion.div
          className="absolute inset-0 rounded-full bg-cosmic-purple/20 blur-3xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        />
        
        {/* Main countdown circle */}
        <div className="relative w-48 h-48 rounded-full p-[1px] bg-gradient-to-br from-cosmic-purple/50 via-transparent to-cosmic-cyan/30">
          <div className="w-full h-full rounded-full bg-space-950 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="text-8xl font-bold text-white"
            >
              {count}
            </motion.div>
          </div>
        </div>

        {/* Subtle particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-cosmic-purple/60"
            style={{ top: '50%', left: '50%' }}
            animate={{
              x: Math.cos((i / 6) * Math.PI * 2) * 120,
              y: Math.sin((i / 6) * Math.PI * 2) * 120,
              opacity: [0, 0.6, 0],
              scale: [0, 1, 0],
            }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-32 text-lg font-medium text-space-300 tracking-wide"
      >
        Get Ready
      </motion.div>
    </div>
  )
}
