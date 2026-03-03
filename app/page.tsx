'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [roomCode, setRoomCode] = useState('')

  const createRoom = () => {
    router.push('/create-room')
  }

  const joinRoom = () => {
    if (roomCode.trim()) {
      router.push(`/room/${roomCode}`)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-lg w-full"
      >
        {/* Logo and Title */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          {/* Subtle accent glow behind title */}
          <div className="relative inline-block">
            <div className="absolute inset-0 blur-3xl opacity-20 bg-gradient-to-r from-cosmic-purple via-cosmic-pink to-cosmic-cyan rounded-full scale-150" />
            <h1 className="relative text-6xl font-bold tracking-tight mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-space-200">
              musique
            </h1>
          </div>
          <p className="text-sm text-space-300 tracking-[0.3em] uppercase">Real-time music trivia</p>
        </motion.div>

        {/* Main Actions */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          {/* Create Room */}
          <motion.button
            onClick={createRoom}
            className="w-full glass inner-glow rounded-2xl p-6 hover:bg-white/[0.04] transition-all duration-300 group text-left"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-1 text-white group-hover:text-cosmic-purple transition-colors">
                  Create Room
                </h2>
                <p className="text-sm text-space-300">Host a private game with custom settings</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-cosmic-purple/10 flex items-center justify-center group-hover:bg-cosmic-purple/20 transition-colors">
                <svg
                  className="w-5 h-5 text-cosmic-purple"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
          </motion.button>

          {/* Join Room */}
          <div className="glass inner-glow rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-1 text-white">Join Room</h2>
            <p className="text-sm text-space-300 mb-4">Enter a room code to join friends</p>
            <div className="flex gap-3">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="ROOM CODE"
                className="flex-1 bg-space-800/60 border border-space-600/50 rounded-xl px-5 py-3.5 text-base font-mono uppercase tracking-wider focus:outline-none focus:border-cosmic-purple/50 focus:bg-space-800/80 transition-all placeholder:text-space-500"
                maxLength={6}
                onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
              />
              <motion.button
                onClick={joinRoom}
                disabled={!roomCode.trim()}
                className="px-6 py-3.5 bg-cosmic-purple/15 hover:bg-cosmic-purple/25 border border-cosmic-purple/20 hover:border-cosmic-purple/40 rounded-xl font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed text-cosmic-purple"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Join
              </motion.button>
            </div>
          </div>

          {/* Quick Play */}
          <motion.button
            className="w-full glass inner-glow rounded-2xl p-5 hover:bg-white/[0.04] transition-all duration-300 group text-left"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-space-200 group-hover:text-cosmic-cyan transition-colors">
                  Quick Play
                </h3>
                <p className="text-xs text-space-400">Join a random public game (comming soon)</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-cosmic-cyan/10 flex items-center justify-center group-hover:bg-cosmic-cyan/20 transition-colors">
                <svg
                  className="w-4 h-4 text-cosmic-cyan"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </motion.button>
        </motion.div>

        {/* Footer Credits */}
        <motion.div
          className="mt-14"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
        >
          <div className="h-px bg-gradient-to-r from-transparent via-space-700/40 to-transparent mb-6" />
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {[
                { name: 'Hardik Joshi', role: 'Main Idea & Backend' },
              { name: 'Abhay Singh', role: 'UI / UX Design' },
              { name: 'Dev ', role: 'API Integration' },
              { name: 'Moulik Sharma', role: 'Logic & Game Design' },
            ].map((person, i) => (
              <motion.div
                key={person.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75 + i * 0.07 }}
                className="flex items-center gap-2.5"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cosmic-purple/30 to-cosmic-pink/20 border border-space-600/40 flex items-center justify-center text-[10px] font-bold text-space-300 flex-shrink-0">
                  {person.name[0]}
                </div>
                <div>
                  <div className="text-xs font-medium text-space-300">{person.name}</div>
                  <div className="text-[10px] text-space-600">{person.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-[10px] text-space-700 mt-6">
            © 2026 musique — built with love and caffeine
          </p>
        </motion.div>
      </motion.div>
    </main>
  )
}