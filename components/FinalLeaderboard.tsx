'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface FinalScore {
  id: string
  name: string
  score: number
}

interface Props {
  scores: FinalScore[]
  currentUserId?: string
}

export default function FinalLeaderboard({ scores, currentUserId }: Props) {
  const router = useRouter()
  
  if (!scores || !Array.isArray(scores) || scores.length === 0) {
    return (
      <main className="min-h-screen p-8 relative z-10 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🎵</div>
          <div className="text-lg text-space-400">Loading final scores...</div>
        </div>
      </main>
    )
  }

  const sortedScores = [...scores].sort((a, b) => b.score - a.score)
  const winner = sortedScores[0]
  const currentUserRank = sortedScores.findIndex(s => s.id === currentUserId) + 1

  return (
    <main className="min-h-screen p-6 relative z-10 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        {/* Winner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="text-center mb-10"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="text-6xl mb-4"
          >
            🏆
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-2">
            {winner.name} Wins
          </h1>
          <p className="text-lg text-cosmic-purple font-medium">{winner.score.toLocaleString()} points</p>
        </motion.div>

        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass inner-glow rounded-2xl p-6 mb-6"
        >
          <h2 className="text-sm font-semibold mb-5 text-space-300 uppercase tracking-wider">Final Standings</h2>
          <div className="space-y-2">
            {sortedScores.map((score, index) => {
              const isCurrentUser = score.id === currentUserId
              const isWinner = index === 0
              const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''
              const barWidth = winner.score > 0 ? (score.score / winner.score) * 100 : 0

              return (
                <motion.div
                  key={score.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.08 }}
                  className={`relative overflow-hidden rounded-xl p-4 ${
                    isCurrentUser ? 'bg-cosmic-purple/10 border border-cosmic-purple/20' : 'bg-white/[0.02]'
                  }`}
                >
                  {/* Score bar background */}
                  <div
                    className={`absolute inset-y-0 left-0 ${
                      index === 0 ? 'bg-cosmic-purple/8' : index === 1 ? 'bg-cosmic-cyan/6' : 'bg-white/[0.02]'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                  
                  <div className="relative flex items-center gap-4">
                    <div className="w-8 text-center text-lg flex-shrink-0">
                      {rankEmoji || <span className="text-sm text-space-500">{index + 1}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white truncate">
                        {score.name}
                        {isCurrentUser && <span className="text-cosmic-purple/70 ml-2 text-sm">you</span>}
                      </div>
                      {isWinner && (
                        <div className="text-xs text-cosmic-purple/60 mt-0.5">Champion</div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xl font-bold text-white tabular-nums">{score.score.toLocaleString()}</div>
                      <div className="text-[10px] text-space-500 uppercase">points</div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Your Rank */}
        {currentUserRank > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="glass inner-glow rounded-xl p-4 mb-6 text-center"
          >
            <div className="text-xs text-space-400 mb-1 uppercase tracking-wider">Your Rank</div>
            <div className="text-2xl font-bold text-white">
              #{currentUserRank} <span className="text-sm text-space-500 font-normal">of {sortedScores.length}</span>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex gap-3 justify-center"
        >
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-cosmic-purple/15 hover:bg-cosmic-purple/25 border border-cosmic-purple/20 hover:border-cosmic-purple/40 rounded-xl font-medium transition-all text-sm"
          >
            Back to Home
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/10 rounded-xl font-medium transition-all text-sm text-space-200"
          >
            Play Again
          </button>
        </motion.div>
      </div>
    </main>
  )
}
