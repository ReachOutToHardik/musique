'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface Props {
  audioUrl: string
  duration?: number
  onEnded?: () => void
  autoPlay?: boolean
}

export default function AudioPlayer({ audioUrl, duration = 15, onEnded, autoPlay = true }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    // Reset states
    setHasError(false)
    setIsPlaying(false)
    setCurrentTime(0)

    // Load and play immediately
    audio.load()
    
    // Auto-play with retry
    const attemptPlay = () => {
      const playPromise = audio.play()
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true)
            console.log('🎵 Audio playing')
          })
          .catch((error) => {
            console.warn('Autoplay failed, retrying...', error)
            // Retry after short delay
            setTimeout(attemptPlay, 100)
          })
      }
    }
    
    attemptPlay()

    // Event listeners
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      onEnded?.()
    }

    const handleError = (e: Event) => {
      console.error('Audio error:', e)
      setHasError(true)
      setIsPlaying(false)
    }

    const handleCanPlay = () => {
      setHasError(false)
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)
    audio.addEventListener('canplay', handleCanPlay)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.pause()
    }
  }, [audioUrl, autoPlay, onEnded])

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass inner-glow rounded-2xl p-6 mb-6"
    >
      <audio ref={audioRef} src={audioUrl} preload="auto" className="hidden" />

      <div className="flex items-center gap-5">
        {/* Spinning Disc */}
        <motion.div
          className="relative w-20 h-20 flex-shrink-0"
          animate={{ rotate: isPlaying ? 360 : 0 }}
          transition={{ duration: 3, repeat: isPlaying ? Infinity : 0, ease: 'linear' }}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cosmic-purple/60 via-cosmic-pink/40 to-cosmic-cyan/60" />
          <div className="absolute inset-[6px] rounded-full bg-space-900 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-space-700 border border-space-600" />
          </div>
        </motion.div>

        {/* Info + Progress */}
        <div className="flex-1 min-w-0">
          <div className="text-sm mb-3">
            {hasError ? (
              <span className="text-red-400/80">Failed to load audio</span>
            ) : isPlaying ? (
              <span className="text-cosmic-purple">Now Playing</span>
            ) : (
              <span className="text-space-400">Loading...</span>
            )}
          </div>
          <div className="h-1.5 bg-space-800 rounded-full overflow-hidden mb-2">
            <motion.div
              className="h-full bg-gradient-to-r from-cosmic-purple to-cosmic-cyan rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <div className="flex justify-between text-xs text-space-500">
            <span>{Math.floor(currentTime)}s</span>
            <span>{duration}s</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
