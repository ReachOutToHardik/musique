'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface PhaseStingerProps {
  phase: 'lobby' | 'countdown' | 'playing' | 'results' | 'loading' | 'final'
  questionNumber?: number
}

const phaseConfig = {
  playing: {
    label: 'Song',
    sublabel: (n: number) => `Round ${n}`,
    color: 'from-cosmic-purple/80 to-space-950/95',
    accent: 'bg-cosmic-purple',
    textColor: 'text-white',
  },
  results: {
    label: 'Results',
    sublabel: () => 'See how you did',
    color: 'from-space-900/95 to-space-950/98',
    accent: 'bg-emerald-500',
    textColor: 'text-white',
  },
  loading: {
    label: 'Get Ready',
    sublabel: () => 'Next song coming up',
    color: 'from-space-950/98 to-space-900/95',
    accent: 'bg-cosmic-cyan',
    textColor: 'text-white',
  },
  final: {
    label: 'Game Over',
    sublabel: () => 'Final standings',
    color: 'from-space-950/98 to-space-900/95',
    accent: 'bg-amber-400',
    textColor: 'text-white',
  },
  countdown: {
    label: 'Starting',
    sublabel: () => 'Get your ears ready',
    color: 'from-cosmic-purple/70 to-space-950/95',
    accent: 'bg-cosmic-pink',
    textColor: 'text-white',
  },
  lobby: {
    label: 'Lobby',
    sublabel: () => 'Waiting for players',
    color: 'from-space-950/95 to-space-900/90',
    accent: 'bg-space-500',
    textColor: 'text-white',
  },
}

const STINGER_PHASES: Array<PhaseStingerProps['phase']> = [
  'playing', 'results', 'loading', 'final',
]

export default function PhaseStinger({ phase, questionNumber = 1 }: PhaseStingerProps) {
  const [visible, setVisible] = useState(false)
  const [currentPhase, setCurrentPhase] = useState(phase)
  const [prevPhase, setPrevPhase] = useState(phase)

  useEffect(() => {
    if (phase !== prevPhase) {
      // Only stinger for meaningful transitions
      if (STINGER_PHASES.includes(phase)) {
        setCurrentPhase(phase)
        setVisible(true)
        const t = setTimeout(() => setVisible(false), 1600)
        return () => clearTimeout(t)
      }
      setPrevPhase(phase)
    }
  }, [phase, prevPhase])

  useEffect(() => {
    if (!visible) setPrevPhase(phase)
  }, [visible, phase])

  const config = phaseConfig[currentPhase]

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={currentPhase + questionNumber}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden pointer-events-none"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, delay: 1.1 }}
        >
          {/* Dark backdrop */}
          <motion.div
            className="absolute inset-0 bg-space-950"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.92 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />

          {/* Left bar sweep */}
          <motion.div
            className={`absolute left-0 top-0 h-full w-1 ${config.accent}`}
            initial={{ scaleY: 0, originY: 0 }}
            animate={{ scaleY: 1 }}
            exit={{ scaleY: 0, originY: 1 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* Right bar sweep */}
          <motion.div
            className={`absolute right-0 top-0 h-full w-1 ${config.accent}`}
            initial={{ scaleY: 0, originY: 1 }}
            animate={{ scaleY: 1 }}
            exit={{ scaleY: 0, originY: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* Content */}
          <div className="relative text-center">
            {/* Accent line */}
            <motion.div
              className={`h-px w-16 mx-auto mb-5 ${config.accent}`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.25, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            />

            <motion.div
              initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
              transition={{ delay: 0.2, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="text-[11px] font-semibold tracking-[0.35em] uppercase text-space-400 mb-2">
                {config.sublabel(questionNumber)}
              </div>
              <h2 className="text-5xl font-bold text-white tracking-tight">
                {config.label}
                {currentPhase === 'playing' && (
                  <span className="text-cosmic-purple ml-3">#{questionNumber}</span>
                )}
              </h2>
            </motion.div>

            {/* Bottom line */}
            <motion.div
              className={`h-px w-16 mx-auto mt-5 ${config.accent}`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.3, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
