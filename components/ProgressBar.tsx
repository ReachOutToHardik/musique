'use client'

import { motion } from 'framer-motion'

interface Props {
  timeLeft: number
  maxTime: number
}

export default function ProgressBar({ timeLeft, maxTime }: Props) {
  const percentage = (timeLeft / maxTime) * 100

  const getColor = () => {
    if (percentage > 60) return 'from-green-400 to-green-600'
    if (percentage > 30) return 'from-yellow-400 to-yellow-600'
    return 'from-red-400 to-red-600'
  }

  return (
    <div className="w-full h-3 bg-space-800 rounded-full overflow-hidden">
      <motion.div
        className={`h-full bg-gradient-to-r ${getColor()}`}
        initial={{ width: '100%' }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.3, ease: 'linear' }}
      />
    </div>
  )
}
