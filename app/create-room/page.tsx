'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { nanoid } from 'nanoid'

interface GameSettings {
  artists: string[]
  playlists: string[]
  questionsPerRound: number
  timePerQuestion: number
  snippetLength: number
  maxPlayers: number
}

interface iTunesArtist {
  artistName: string
  artistId: number
  primaryGenreName?: string
}

export default function CreateRoom() {
  const router = useRouter()
  const [roomName, setRoomName] = useState('')
  const [settings, setSettings] = useState<GameSettings>({
    artists: [],
    playlists: ['Top 100'],
    questionsPerRound: 10,
    timePerQuestion: 15,
    snippetLength: 20,
    maxPlayers: 10,
  })
  const [artistInput, setArtistInput] = useState('')
  const [searchResults, setSearchResults] = useState<iTunesArtist[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  // Pre-added popular artists organized by category
  const preAddedArtists = {
    'Global Hits': [
      'Taylor Swift', 'Drake', 'The Weeknd', 'Ariana Grande', 'Ed Sheeran',
      'Billie Eilish', 'Post Malone', 'Dua Lipa', 'Bad Bunny', 'Harry Styles',
      'Olivia Rodrigo', 'Travis Scott', 'SZA', 'BTS', 'Beyoncé', 'Rihanna',
      'Justin Bieber', 'Kendrick Lamar', 'Bruno Mars', 'Adele',
    ],
    'Bollywood & Indian': [
      'Arijit Singh', 'Pritam', 'A.R. Rahman', 'Shreya Ghoshal', 'Neha Kakkar',
      'Atif Aslam', 'Badshah', 'Honey Singh', 'Jubin Nautiyal', 'B Praak',
      'Vishal Mishra', 'Darshan Raval', 'King', 'AP Dhillon', 'Diljit Dosanjh',
      'Guru Randhawa', 'Armaan Malik', 'Anirudh Ravichander', 'Sid Sriram', 'Nucleya',
    ],
    'K-Pop & Asian': [
      'BTS', 'BLACKPINK', 'Stray Kids', 'TWICE', 'NewJeans',
      'aespa', 'SEVENTEEN', 'IVE', 'LE SSERAFIM', 'ENHYPEN',
    ],
  }

  const playlists = [
    // Global
    'Top 100', 'Top 50 - Global', 'Viral Hits', 'Classic Hits',
    // Decades
    '80s Hits', '90s Hits', '2000s Hits',
    // Genres
    'Rock Classics', 'Hip Hop', 'Pop', 'R&B', 'EDM',
    // Indian
    'Bollywood Hits', 'Bollywood 90s', 'Bollywood Romantic', 'Punjabi Hits',
    'Tamil Hits', 'Telugu Hits', 'Hindi Indie', 'Desi Hip Hop',
  ]

  // Search iTunes API for artists
  const searchArtists = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    setIsSearching(true)
    try {
      const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=musicArtist&limit=8`
      )
      const data = await res.json()
      const artists: iTunesArtist[] = data.results?.map((r: any) => ({
        artistName: r.artistName,
        artistId: r.artistId,
        primaryGenreName: r.primaryGenreName,
      })) || []
      setSearchResults(artists)
      setShowSearchResults(artists.length > 0)
    } catch {
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Debounced search on input change
  const handleArtistInputChange = (value: string) => {
    setArtistInput(value)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => searchArtists(value), 400)
  }

  const addArtist = (artist: string) => {
    if (artist && !settings.artists.includes(artist)) {
      setSettings({ ...settings, artists: [...settings.artists, artist] })
      setArtistInput('')
      setSearchResults([])
      setShowSearchResults(false)
    }
  }

  const removeArtist = (artist: string) => {
    setSettings({
      ...settings,
      artists: settings.artists.filter((a) => a !== artist),
    })
  }

  const togglePreAddedArtist = (artist: string) => {
    if (settings.artists.includes(artist)) {
      removeArtist(artist)
    } else {
      addArtist(artist)
    }
  }

  const togglePlaylist = (playlist: string) => {
    if (settings.playlists.includes(playlist)) {
      setSettings({
        ...settings,
        playlists: settings.playlists.filter((p) => p !== playlist),
      })
    } else {
      setSettings({
        ...settings,
        playlists: [...settings.playlists, playlist],
      })
    }
  }

  const createRoom = () => {
    const roomCode = nanoid(6).toUpperCase()
    localStorage.setItem(
      `room_${roomCode}`,
      JSON.stringify({ name: roomName, settings, host: true })
    )
    router.push(`/room/${roomCode}`)
  }

  return (
    <main className="min-h-screen p-6 relative z-10">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => router.push('/')}
            className="text-space-400 hover:text-white transition-colors mb-6 flex items-center gap-1.5 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-white">
            Create Room
          </h1>
          <p className="text-sm text-space-400 mt-1">Set up your game</p>
        </motion.div>

        {/* Room Name */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass inner-glow rounded-2xl p-5 mb-4"
        >
          <label className="block text-xs font-semibold mb-2 text-space-300 uppercase tracking-wider">Room Name</label>
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Epic Music Battle"
            className="w-full bg-space-800/60 border border-space-600/50 rounded-xl px-5 py-3 focus:outline-none focus:border-cosmic-purple/50 focus:bg-space-800/80 transition-all placeholder:text-space-500 text-sm"
          />
        </motion.div>

        {/* Artist Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass inner-glow rounded-2xl p-5 mb-4"
        >
          <label className="block text-xs font-semibold mb-1 text-space-300 uppercase tracking-wider">Artists</label>
          <p className="text-xs text-space-500 mb-3">Tap to select or search for any artist</p>

          {/* Selected Artists */}
          <AnimatePresence>
            {settings.artists.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-1.5 mb-4"
              >
                {settings.artists.map((artist) => (
                  <motion.div
                    key={artist}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="bg-cosmic-purple/15 border border-cosmic-purple/30 rounded-full px-3 py-1.5 flex items-center gap-1.5 text-xs"
                  >
                    <span className="text-white">{artist}</span>
                    <button
                      onClick={() => removeArtist(artist)}
                      aria-label={`Remove ${artist}`}
                      className="hover:text-red-400 transition-colors text-space-400"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Search Input */}
          <div className="relative mb-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={artistInput}
                  onChange={(e) => handleArtistInputChange(e.target.value)}
                  onFocus={() => { if (searchResults.length > 0) setShowSearchResults(true) }}
                  placeholder="Search any artist..."
                  className="w-full bg-space-800/60 border border-space-600/50 rounded-xl px-5 py-3 pr-10 focus:outline-none focus:border-cosmic-purple/50 transition-all placeholder:text-space-500 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && artistInput.trim()) {
                      addArtist(artistInput.trim())
                    }
                  }}
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-space-500 border-t-cosmic-purple rounded-full"
                    />
                  </div>
                )}
              </div>
            </div>
            
            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-space-800 border border-space-600/50 rounded-xl overflow-hidden max-h-52 overflow-y-auto z-20">
                {searchResults.map((result) => (
                  <button
                    key={result.artistId}
                    onClick={() => addArtist(result.artistName)}
                    className="w-full text-left px-5 py-2.5 hover:bg-cosmic-purple/10 transition-colors text-sm flex items-center justify-between"
                  >
                    <span className="text-space-200">{result.artistName}</span>
                    {result.primaryGenreName && (
                      <span className="text-[11px] text-space-500">{result.primaryGenreName}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pre-added Artist Chips by Category */}
          {Object.entries(preAddedArtists).map(([category, artists]) => (
            <div key={category} className="mb-3 last:mb-0">
              <div className="text-[11px] text-space-500 uppercase tracking-wider mb-2">{category}</div>
              <div className="flex flex-wrap gap-1.5">
                {artists.map((artist) => {
                  const isSelected = settings.artists.includes(artist)
                  return (
                    <button
                      key={artist}
                      onClick={() => togglePreAddedArtist(artist)}
                      className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                        isSelected
                          ? 'bg-cosmic-purple/20 border border-cosmic-purple/40 text-white'
                          : 'bg-white/[0.03] border border-space-600/30 text-space-400 hover:text-space-200 hover:border-space-500/50'
                      }`}
                    >
                      {isSelected && (
                        <span className="mr-1">✓</span>
                      )}
                      {artist}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Playlist Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass inner-glow rounded-2xl p-5 mb-4"
        >
          <label className="block text-xs font-semibold mb-1 text-space-300 uppercase tracking-wider">Playlists</label>
          <p className="text-xs text-space-500 mb-3">Merge multiple playlists for variety</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {playlists.map((playlist) => (
              <motion.button
                key={playlist}
                onClick={() => togglePlaylist(playlist)}
                className={`p-3 rounded-xl border text-sm transition-all ${
                  settings.playlists.includes(playlist)
                    ? 'bg-cosmic-purple/10 border-cosmic-purple/30 text-white'
                    : 'bg-white/[0.02] border-space-600/30 text-space-300 hover:border-space-500/50 hover:text-space-200'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {playlist}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Game Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass inner-glow rounded-2xl p-5 mb-6"
        >
          <label className="block text-xs font-semibold mb-4 text-space-300 uppercase tracking-wider">Settings</label>
          
          <div className="space-y-5">
            <div>
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-space-300">Questions Per Round</span>
                <span className="text-white font-medium tabular-nums">{settings.questionsPerRound}</span>
              </div>
              <input
                type="range"
                min="5"
                max="20"
                aria-label="Questions per round"
                value={settings.questionsPerRound}
                onChange={(e) =>
                  setSettings({ ...settings, questionsPerRound: parseInt(e.target.value) })
                }
                className="w-full accent-cosmic-purple h-1"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-space-300">Time Per Question</span>
                <span className="text-white font-medium tabular-nums">{settings.timePerQuestion}s</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                aria-label="Time per question"
                value={settings.timePerQuestion}
                onChange={(e) =>
                  setSettings({ ...settings, timePerQuestion: parseInt(e.target.value) })
                }
                className="w-full accent-cosmic-purple h-1"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-space-300">Snippet Length</span>
                <span className="text-white font-medium tabular-nums">{settings.snippetLength}s</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                aria-label="Snippet length"
                value={settings.snippetLength}
                onChange={(e) =>
                  setSettings({ ...settings, snippetLength: parseInt(e.target.value) })
                }
                className="w-full accent-cosmic-purple h-1"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-space-300">Max Players</span>
                <span className="text-white font-medium tabular-nums">{settings.maxPlayers}</span>
              </div>
              <input
                type="range"
                min="2"
                max="20"
                aria-label="Max players"
                value={settings.maxPlayers}
                onChange={(e) =>
                  setSettings({ ...settings, maxPlayers: parseInt(e.target.value) })
                }
                className="w-full accent-cosmic-purple h-1"
              />
            </div>
          </div>
        </motion.div>

        {/* Create Button */}
        <motion.button
          onClick={createRoom}
          disabled={!roomName.trim()}
          className="w-full bg-cosmic-purple/15 hover:bg-cosmic-purple/25 border border-cosmic-purple/30 hover:border-cosmic-purple/50 rounded-2xl p-5 font-semibold text-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed text-white"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Create Room
        </motion.button>
      </div>
    </main>
  )
}
