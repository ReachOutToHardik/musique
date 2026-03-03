'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import io, { Socket } from 'socket.io-client'
import AudioPlayer from '@/components/AudioPlayer'
import Countdown from '@/components/Countdown'
import SidebarLeaderboard from '@/components/SidebarLeaderboard'
import FinalLeaderboard from '@/components/FinalLeaderboard'
import PhaseStinger from '@/components/PhaseStinger'

interface Player {
  id: string
  name: string
  score: number
  avatar: string
}

interface Question {
  id: string
  snippet: string
  options: string[]
  correctAnswer: number
  artistImage?: string
}

interface FinalScore {
  id: string
  name: string
  score: number
}

interface GameState {
  phase: 'lobby' | 'countdown' | 'playing' | 'results' | 'loading' | 'final'
  currentQuestion: number
  question: Question | null
  timeLeft: number
  scores: { [playerId: string]: number } | FinalScore[]
  results?: Array<{
    playerId: string
    playerName: string
    points: number
    correct: boolean
    rank: number
    timestamp: number
    totalScore: number
  }>
}

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomCode = params.roomCode as string

  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [connectionError, setConnectionError] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [hasJoined, setHasJoined] = useState(false)
  const [isHost, setIsHost] = useState(false)
  const [players, setPlayers] = useState<Player[]>([])
  const [gameState, setGameState] = useState<GameState>({
    phase: 'lobby',
    currentQuestion: 0,
    question: null,
    timeLeft: 0,
    scores: {},
  })
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answerSubmitted, setAnswerSubmitted] = useState(false)
  const [answerFeedback, setAnswerFeedback] = useState<{ correct: boolean; points: number; rank: number } | null>(null)
  const [showHostSettings, setShowHostSettings] = useState(false)

  // Initialize socket connection — fetch URL at runtime so it works without build-time env vars
  useEffect(() => {
    let cancelled = false

    async function connect() {
      // Fetch socket URL from server-side API route (reads env at runtime)
      let socketUrl = 'http://localhost:3001'
      try {
        const res = await fetch('/api/config')
        const cfg = await res.json()
        if (cfg.socketUrl) socketUrl = cfg.socketUrl
      } catch {
        console.warn('[musique] Could not fetch config, using default socketUrl')
      }

      if (cancelled) return
      console.log('[musique] Connecting to socket server:', socketUrl)

      const newSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        withCredentials: false,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 20000,
      })

      newSocket.on('connect', () => {
        console.log('[musique] Socket connected! ID:', newSocket.id)
        setConnected(true)
        setConnectionError('')
      })

      newSocket.on('disconnect', (reason) => {
        console.log('[musique] Socket disconnected:', reason)
        setConnected(false)
      })

      newSocket.on('connect_error', (err) => {
        console.error('[musique] Connection error:', err.message)
        setConnected(false)
        setConnectionError(`Can't reach server — ${err.message}`)
      })

      setSocket(newSocket)
    }

    connect()

    // Check if user is host
    const roomData = localStorage.getItem(`room_${roomCode}`)
    if (roomData) {
      const data = JSON.parse(roomData)
      setIsHost(data.host)
    }

    return () => {
      cancelled = true
      // socket cleanup handled by the socket state
    }
  }, [roomCode])

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    socket.on('playerJoined', (player: Player) => {
      setPlayers((prev) => [...prev, player])
    })

    socket.on('playerLeft', (playerId: string) => {
      setPlayers((prev) => prev.filter((p) => p.id !== playerId))
    })

    socket.on('gameStateUpdate', (state: GameState) => {
      setGameState(state)
      
      // Sync scores from gameState into players state
      if (state.scores && !Array.isArray(state.scores)) {
        const scoreMap = state.scores as { [playerId: string]: number }
        setPlayers((prev) =>
          prev.map((player) => ({
            ...player,
            score: scoreMap[player.id] ?? player.score,
          }))
        )
      }
      
      if (state.phase === 'playing' && state.question) {
        setSelectedAnswer(null)
        setAnswerSubmitted(false)
        setAnswerFeedback(null)
      }
    })

    socket.on('answerResult', (result: { correct: boolean; points: number; rank: number }) => {
      setAnswerFeedback(result)
    })

    socket.on('playersList', (playersList: Player[]) => {
      setPlayers(playersList)
    })

    socket.on('scoresUpdate', (scores: { [playerId: string]: number }) => {
      setPlayers((prev) =>
        prev.map((player) => ({
          ...player,
          score: scores[player.id] ?? player.score,
        }))
      )
    })

    socket.on('timeUpdate', (timeLeft: number) => {
      setGameState((prev) => ({ ...prev, timeLeft }))
    })

    return () => {
      socket.off('playerJoined')
      socket.off('playerLeft')
      socket.off('gameStateUpdate')
      socket.off('playersList')
      socket.off('scoresUpdate')
      socket.off('timeUpdate')
      socket.off('answerResult')
    }
  }, [socket])

  const joinRoom = () => {
    if (socket && connected && playerName.trim()) {
      // Get room settings if host
      let settings = undefined
      if (isHost) {
        const roomData = localStorage.getItem(`room_${roomCode}`)
        if (roomData) {
          const data = JSON.parse(roomData)
          settings = data.settings
        }
      }

      console.log('[musique] Joining room:', roomCode, 'as', playerName.trim(), 'host:', isHost)
      socket.emit('joinRoom', {
        roomCode,
        playerName: playerName.trim(),
        isHost,
        settings,
      })
      setHasJoined(true)
    } else {
      console.warn('[musique] Cannot join — socket connected:', connected, 'socket exists:', !!socket)
    }
  }

  const startGame = () => {
    if (socket && isHost) {
      socket.emit('startGame', { roomCode })
    }
  }

  const submitAnswer = (answerIndex: number) => {
    if (socket && !answerSubmitted) {
      setSelectedAnswer(answerIndex)
      setAnswerSubmitted(true)
      socket.emit('submitAnswer', {
        roomCode,
        questionId: gameState.question?.id,
        answer: answerIndex,
        timeElapsed: gameState.timeLeft,
      })
    }
  }

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode)
  }

  // Lobby View
  if (!hasJoined) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass inner-glow rounded-2xl p-6 max-w-sm w-full"
        >
          <h1 className="text-2xl font-bold mb-5 text-center text-white">
            Join Room
          </h1>
          <div className="mb-5">
            <div className="text-center mb-3">
              <span className="text-xs text-space-400 uppercase tracking-wider">Room Code</span>
              <div className="text-3xl font-mono font-bold text-white mt-1 tracking-widest">
                {roomCode}
              </div>
            </div>
          </div>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            className="w-full bg-space-800/60 border border-space-600/50 rounded-xl px-5 py-3.5 mb-3 focus:outline-none focus:border-cosmic-purple/50 transition-all placeholder:text-space-500 text-sm"
            onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
            autoFocus
          />
          <motion.button
            onClick={joinRoom}
            disabled={!playerName.trim() || !connected}
            className="w-full bg-cosmic-purple/15 hover:bg-cosmic-purple/25 border border-cosmic-purple/30 hover:border-cosmic-purple/50 rounded-xl py-3.5 font-semibold text-base transition-all disabled:opacity-30 disabled:cursor-not-allowed text-white"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            {connected ? 'Join Game' : 'Connecting...'}
          </motion.button>

          {/* Connection Status */}
          <div className="mt-3 text-center">
            {!connected && !connectionError && (
              <div className="flex items-center justify-center gap-2 text-xs text-space-500">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-3 h-3 border border-space-500 border-t-cosmic-purple rounded-full"
                />
                Connecting to server...
              </div>
            )}
            {connected && (
              <div className="text-[11px] text-emerald-500/70 flex items-center justify-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Connected
              </div>
            )}
            {connectionError && (
              <div className="text-[11px] text-red-400/80">
                {connectionError}
              </div>
            )}
          </div>
        </motion.div>
      </main>
    )
  }

  // Lobby - Waiting for players
  if (gameState.phase === 'lobby') {
    return (
      <main className="min-h-screen p-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center mb-8"
          >
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Waiting Room</h1>
              <div className="flex items-center gap-3">
                <span className="text-sm text-space-400">Code:</span>
                <span className="text-lg font-mono text-white font-bold tracking-widest">{roomCode}</span>
                <button
                  onClick={copyRoomCode}
                  className="text-xs bg-white/[0.04] hover:bg-white/[0.08] border border-space-600/30 px-3 py-1.5 rounded-lg transition-all text-space-300"
                >
                  Copy
                </button>
              </div>
            </div>
            {isHost && (
              <button
                title="Settings"
                onClick={() => setShowHostSettings(!showHostSettings)}
                className="text-space-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
          </motion.div>

          {/* Players Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
            {players.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.08 }}
                className="glass inner-glow rounded-xl p-5 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-cosmic-purple/15 border border-cosmic-purple/25 mx-auto mb-2.5 flex items-center justify-center text-lg font-bold text-white">
                  {player.name[0].toUpperCase()}
                </div>
                <div className="font-medium text-sm text-space-200">{player.name}</div>
                {player.id === socket?.id && (
                  <div className="text-[10px] text-cosmic-purple mt-0.5 uppercase tracking-wider">you</div>
                )}
              </motion.div>
            ))}
            
            {/* Empty slots */}
            {Array.from({ length: Math.max(0, 4 - players.length) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="rounded-xl p-5 opacity-20 border border-dashed border-space-600/50 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-space-800/50 mx-auto mb-2.5"></div>
                <div className="text-space-600 text-sm">Waiting...</div>
              </div>
            ))}
          </div>

          {/* Start Game Button (Host Only) */}
          {isHost && (
            <motion.button
              onClick={startGame}
              disabled={players.length < 2}
              className="w-full bg-cosmic-purple/15 hover:bg-cosmic-purple/25 border border-cosmic-purple/30 hover:border-cosmic-purple/50 rounded-2xl p-5 font-semibold text-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed text-white"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              Start Game ({players.length} Players)
            </motion.button>
          )}

          {!isHost && (
            <div className="text-center text-space-500 text-sm">
              Waiting for host to start the game...
            </div>
          )}
        </div>
      </main>
    )
  }

  // Countdown Phase
  if (gameState.phase === 'countdown') {
    return (
      <>
        <Countdown count={gameState.timeLeft} />
        <main className="min-h-screen flex items-center justify-center p-6 relative z-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="text-lg text-space-400 mb-3">Loading songs...</div>
            <div className="flex gap-1.5 justify-center">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 bg-cosmic-purple rounded-full"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </motion.div>
        </main>
      </>
    )
  }

  // Loading Phase (between questions)
  if (gameState.phase === 'loading') {
    return (
      <main className="min-h-screen p-6 relative z-10">
        <PhaseStinger phase="loading" questionNumber={gameState.currentQuestion + 2} />
        <SidebarLeaderboard players={players} currentUserId={socket?.id} />
        <div className="max-w-3xl mx-auto flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass inner-glow rounded-2xl p-10 text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 mx-auto mb-5 rounded-full border border-cosmic-purple/30 flex items-center justify-center"
            >
              <svg className="w-7 h-7 text-cosmic-purple/70" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
            </motion.div>
            <div className="text-lg font-semibold text-white mb-1">Next Song</div>
            <div className="text-sm text-space-500">Get ready...</div>
          </motion.div>
        </div>
      </main>
    )
  }

  // Results Phase (after each question)
  if (gameState.phase === 'results') {
    const correctAnswer = gameState.question?.correctAnswer
    const results = gameState.results || []

    return (
      <main className="min-h-screen p-6 relative z-10">
        <PhaseStinger phase="results" questionNumber={gameState.currentQuestion + 1} />
        <SidebarLeaderboard players={players} currentUserId={socket?.id} />
        <div className="max-w-3xl mx-auto pt-4">
          {/* Question Number */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-3"
          >
            <span className="text-xs text-space-500 uppercase tracking-wider">Song {gameState.currentQuestion + 1} Results</span>
          </motion.div>

          {/* Correct Answer */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass inner-glow rounded-2xl p-5 mb-4 text-center"
          >
            <div className="text-sm font-medium mb-1.5 text-emerald-400/80">
              Correct Answer
            </div>
            {gameState.question && (
              <div className="text-lg font-semibold text-white">
                {gameState.question.options[correctAnswer!]}
              </div>
            )}
          </motion.div>

          {/* Every Player's Points This Round */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass inner-glow rounded-2xl p-5 mb-4"
          >
            <h3 className="text-xs font-semibold mb-3 text-space-300 uppercase tracking-wider">Round Points</h3>
            <div className="space-y-2">
              {results.map((result, index) => {
                const isCurrentUser = result.playerId === socket?.id
                const rankLabel = result.correct
                  ? (result.rank === 1 ? '1st' : result.rank === 2 ? '2nd' : result.rank === 3 ? '3rd' : `#${result.rank}`)
                  : ''
                const bgColor = result.correct
                  ? (result.rank === 1 ? 'bg-amber-500/[0.06] border border-amber-500/20' : 'bg-emerald-500/[0.06] border border-emerald-500/15')
                  : 'bg-red-500/[0.04] border border-red-500/10'

                return (
                  <motion.div
                    key={result.playerId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.06 }}
                    className={`flex items-center gap-3 p-3 rounded-xl ${bgColor} ${
                      isCurrentUser ? 'ring-1 ring-cosmic-purple/40' : ''
                    }`}
                  >
                    <div className="w-8 text-center flex-shrink-0">
                      {result.correct ? (
                        <span className="text-xs font-bold text-emerald-400/80">{rankLabel}</span>
                      ) : (
                        <span className="text-xs text-red-400/60">miss</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate text-space-200">
                        {result.playerName}
                        {isCurrentUser && <span className="text-cosmic-purple/70 ml-1.5 text-xs">(you)</span>}
                      </div>
                      <div className="text-[11px] text-space-500">
                        {result.correct
                          ? result.rank === 1
                            ? 'Fastest + Bonus'
                            : `Rank ${result.rank}`
                          : 'Wrong answer'}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-lg font-bold tabular-nums ${result.points > 0 ? 'text-white' : 'text-space-600'}`}>
                        {result.points > 0 ? `+${result.points}` : '0'}
                      </div>
                      <div className="text-[11px] text-space-500 tabular-nums">
                        Total {result.totalScore}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          {/* Mini Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass inner-glow rounded-2xl p-5"
          >
            <h3 className="text-xs font-semibold mb-3 text-space-300 uppercase tracking-wider">Standings</h3>
            <div className="space-y-1.5">
              {[...players]
                .sort((a, b) => b.score - a.score)
                .map((player, index) => (
                  <div
                    key={player.id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg ${
                      player.id === socket?.id ? 'bg-cosmic-purple/[0.08] border border-cosmic-purple/20' : 'bg-white/[0.02]'
                    }`}
                  >
                    <div className="w-6 text-center text-xs font-bold text-space-400">
                      {index + 1}
                    </div>
                    <div className="flex-1 font-medium text-sm text-space-200">
                      {player.name}
                      {player.id === socket?.id && <span className="text-cosmic-purple/60 ml-1.5 text-xs">(you)</span>}
                    </div>
                    <div className="text-sm font-bold text-white tabular-nums">{player.score}</div>
                  </div>
                ))}
            </div>
          </motion.div>
        </div>
      </main>
    )
  }

  // Game Playing View
  if (gameState.phase === 'playing' && gameState.question) {
    return (
      <main className="min-h-screen p-6 relative z-10">
        <PhaseStinger phase="playing" questionNumber={gameState.currentQuestion + 1} />
        <SidebarLeaderboard players={players} currentUserId={socket?.id} />
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-5">
            <div className="text-sm font-medium text-space-400">
              Song {gameState.currentQuestion + 1} / 10
            </div>
            <div className="text-2xl font-bold text-white tabular-nums">
              {gameState.timeLeft}s
            </div>
          </div>

          {/* Time Bar */}
          <div className="h-[3px] bg-space-800/60 rounded-full mb-6 overflow-hidden">
            <motion.div
              className="h-full bg-cosmic-purple/60"
              initial={{ width: '100%' }}
              animate={{ width: `${(gameState.timeLeft / 10) * 100}%` }}
              transition={{ duration: 1, ease: 'linear' }}
            />
          </div>

          {/* Audio Player */}
          {gameState.question?.snippet && (
            <AudioPlayer
              audioUrl={gameState.question.snippet}
              duration={30}
              autoPlay={true}
            />
          )}

          {/* Answer Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {gameState.question.options.map((option, index) => {
              const isSelected = selectedAnswer === index
              const isCorrect = gameState.question!.correctAnswer === index
              const showResult = answerSubmitted

              return (
                <motion.button
                  key={index}
                  onClick={() => !answerSubmitted && submitAnswer(index)}
                  disabled={answerSubmitted}
                  className={`glass rounded-xl p-5 text-left transition-all ${
                    isSelected && !showResult
                      ? 'bg-cosmic-purple/10 border border-cosmic-purple/40'
                      : showResult && isCorrect
                      ? 'bg-emerald-500/[0.08] border border-emerald-500/30'
                      : showResult && isSelected && !isCorrect
                      ? 'bg-red-500/[0.08] border border-red-500/25'
                      : 'border border-transparent hover:bg-white/[0.03]'
                  }`}
                  whileHover={{ scale: answerSubmitted ? 1 : 1.01 }}
                  whileTap={{ scale: answerSubmitted ? 1 : 0.99 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                      showResult && isCorrect
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : showResult && isSelected && !isCorrect
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-white/[0.04] text-space-400'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <div className="flex-1 font-medium text-sm text-space-200">{option}</div>
                  </div>
                </motion.button>
              )
            })}
          </div>

          {/* Instant Answer Feedback */}
          <AnimatePresence>
            {answerFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mt-5 glass inner-glow rounded-2xl p-5 text-center ${
                  answerFeedback.correct ? 'border border-emerald-500/25' : 'border border-red-500/20'
                }`}
              >
                <div className={`text-xl font-bold mb-0.5 ${answerFeedback.correct ? 'text-emerald-400' : 'text-red-400/80'}`}>
                  {answerFeedback.correct ? 'Correct' : 'Wrong'}
                </div>
                <div className="text-sm font-medium text-space-300">
                  {answerFeedback.points > 0 ? `+${answerFeedback.points} points` : 'No points'}
                  {answerFeedback.rank === 1 && (
                    <span className="ml-2 text-amber-400/80">Fastest</span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    )
  }

  // Final Leaderboard
  if (gameState.phase === 'final') {
    return (
      <>
        <PhaseStinger phase="final" />
        <FinalLeaderboard scores={gameState.scores as FinalScore[]} currentUserId={socket?.id} />
      </>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative z-10">
      <div className="text-center">
        <div className="flex gap-1.5 justify-center">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 bg-space-500 rounded-full"
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
        <div className="text-sm text-space-500 mt-3">Loading game...</div>
      </div>
    </main>
  )
}
