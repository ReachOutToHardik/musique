'use client'

import { motion } from 'framer-motion'

interface Props {
  rank: number
  name: string
  score: number
  isCurrentUser?: boolean
}

export default function LeaderboardCard({ rank, name, score, isCurrentUser }: Props) {
  const getRankColor = () => {
    switch (rank) {
      case 1:
        return 'from-yellow-400 to-yellow-600'
      case 2:
        return 'from-gray-300 to-gray-500'
      case 3:
        return 'from-orange-400 to-orange-600'
      default:
        return 'from-cosmic-purple to-cosmic-cyan'
    }
  }

  const getRankEmoji = () => {
    switch (rank) {
      case 1:
        return '🥇'
      case 2:
        return '🥈'
      case 3:
        return '🥉'
      default:
        return '🎵'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.1 }}
      className={`glass rounded-xl p-4 flex items-center gap-4 ${
        isCurrentUser ? 'ring-2 ring-cosmic-cyan' : ''
      }`}
    >
      {/* Rank */}
      <div
        className={`w-12 h-12 rounded-full bg-gradient-to-r ${getRankColor()} flex items-center justify-center font-bold text-lg flex-shrink-0`}
      >
        {rank <= 3 ? getRankEmoji() : rank}
      </div>

      {/* Player Info */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold truncate">
          {name}
          {isCurrentUser && <span className="text-cosmic-cyan ml-2">(You)</span>}
        </div>
      </div>

      {/* Score */}
      <div className="text-right">
        <div className="text-2xl font-bold text-cosmic-cyan">{score.toLocaleString()}</div>
        <div className="text-xs text-space-400">points</div>
      </div>
    </motion.div>
  )
}
