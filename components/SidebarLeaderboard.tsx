'use client'

import { motion } from 'framer-motion'

interface Player {
  id: string
  name: string
  score: number
}

interface Props {
  players: Player[]
  currentUserId?: string
}

export default function SidebarLeaderboard({ players, currentUserId }: Props) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed right-4 top-4 w-56 glass inner-glow rounded-xl p-3 z-30"
    >
      <h3 className="text-xs font-semibold mb-2.5 text-space-300 uppercase tracking-wider flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5 text-cosmic-purple" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
        </svg>
        Leaderboard
      </h3>
      
      <div className="space-y-1 max-h-80 overflow-y-auto">
        {sortedPlayers.map((player, index) => {
          const isCurrentUser = player.id === currentUserId
          const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''
          
          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-lg ${
                isCurrentUser ? 'bg-cosmic-purple/10 border border-cosmic-purple/20' : 'bg-white/[0.02]'
              }`}
            >
              <div className="w-5 text-center text-xs font-medium text-space-400">
                {rankEmoji || `${index + 1}`}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate text-space-200">
                  {player.name}
                  {isCurrentUser && <span className="text-cosmic-purple/70 ml-1">you</span>}
                </div>
              </div>
              <div className="text-xs font-semibold text-space-100 tabular-nums">
                {player.score}
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
