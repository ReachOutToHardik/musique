'use client'

import { useEffect, useRef } from 'react'

export default function StarsBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    interface Star {
      x: number
      y: number
      radius: number
      opacity: number
      speed: number
      color: string
    }

    const stars: Star[] = []
    const starColors = [
      'rgba(139, 92, 246,',   // purple
      'rgba(6, 182, 212,',    // cyan
      'rgba(236, 73, 153,',   // pink
      'rgba(255, 255, 255,',  // white
      'rgba(255, 255, 255,',  // white (higher probability)
      'rgba(255, 255, 255,',  // white
    ]

    // Fewer stars, dimmer, for a cleaner look
    for (let i = 0; i < 120; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.2,
        opacity: Math.random() * 0.5 + 0.1,
        speed: Math.random() * 0.3 + 0.1,
        color: starColors[Math.floor(Math.random() * starColors.length)],
      })
    }

    let animationFrameId: number

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      stars.forEach((star) => {
        star.opacity += star.speed * (Math.random() > 0.5 ? 1 : -1) * 0.008
        star.opacity = Math.max(0.05, Math.min(0.6, star.opacity))

        ctx.beginPath()
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        ctx.fillStyle = `${star.color} ${star.opacity})`
        ctx.fill()
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
      style={{ opacity: 0.4 }}
    />
  )
}
