'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import AudioPlayer from '@/components/AudioPlayer'
import StarsBackground from '@/components/StarsBackground'

export default function TestAudio() {
  const [testSongs, setTestSongs] = useState<any[]>([])
  const [currentSong, setCurrentSong] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchTestSongs = async () => {
    setLoading(true)
    setError('')
    
    try {
      // Fetch some popular songs from iTunes API
      const response = await fetch(
        'https://itunes.apple.com/search?term=taylor+swift&media=music&entity=song&limit=10'
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch songs')
      }
      
      const data = await response.json()
      const songs = data.results.filter((song: any) => song.previewUrl)
      
      console.log('Fetched songs:', songs)
      setTestSongs(songs)
      
      if (songs.length > 0) {
        setCurrentSong(songs[0])
      } else {
        setError('No songs with previews found')
      }
    } catch (err) {
      console.error('Error fetching songs:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTestSongs()
  }, [])

  return (
    <main className="min-h-screen p-8 relative z-10">
      <StarsBackground />
      
      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-5xl font-bold glow-text mb-4">Audio Test Page</h1>
          <p className="text-space-300">Test the audio player with real songs from iTunes API</p>
        </motion.div>

        {loading && (
          <div className="text-center py-12">
            <div className="text-2xl mb-4">🎵</div>
            <p className="text-space-400">Loading songs...</p>
          </div>
        )}

        {error && (
          <div className="glass rounded-xl p-6 mb-6 bg-red-500/20 border border-red-500">
            <p className="text-red-400">Error: {error}</p>
          </div>
        )}

        {currentSong && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <div className="glass rounded-xl p-6 mb-6">
              <h2 className="text-2xl font-bold mb-2">{currentSong.trackName}</h2>
              <p className="text-space-400 mb-1">by {currentSong.artistName}</p>
              <p className="text-sm text-space-500">Album: {currentSong.collectionName}</p>
              
              {currentSong.artworkUrl100 && (
                <img
                  src={currentSong.artworkUrl100.replace('100x100', '300x300')}
                  alt={currentSong.trackName}
                  className="w-48 h-48 rounded-xl mt-4 mx-auto"
                />
              )}
            </div>

            <AudioPlayer
              audioUrl={currentSong.previewUrl}
              duration={30}
              autoPlay={false}
            />

            <div className="glass rounded-xl p-4 mt-4">
              <p className="text-sm text-space-400 mb-2">Preview URL:</p>
              <code className="text-xs text-cosmic-cyan break-all">
                {currentSong.previewUrl}
              </code>
            </div>
          </motion.div>
        )}

        {testSongs.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-xl p-6"
          >
            <h3 className="text-xl font-bold mb-4">Available Songs ({testSongs.length})</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testSongs.map((song, index) => (
                <button
                  key={song.trackId}
                  onClick={() => setCurrentSong(song)}
                  className={`w-full text-left p-4 rounded-lg transition-colors ${
                    currentSong?.trackId === song.trackId
                      ? 'bg-cosmic-cyan/30 border border-cosmic-cyan'
                      : 'bg-space-800/30 hover:bg-space-700/30'
                  }`}
                >
                  <div className="font-semibold">{song.trackName}</div>
                  <div className="text-sm text-space-400">{song.artistName}</div>
                  {song.previewUrl ? (
                    <div className="text-xs text-green-400 mt-1">✓ Preview available</div>
                  ) : (
                    <div className="text-xs text-red-400 mt-1">✗ No preview</div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 text-center"
        >
          <button
            onClick={fetchTestSongs}
            className="px-6 py-3 bg-cosmic-purple/20 hover:bg-cosmic-purple/30 rounded-xl transition-colors"
          >
            🔄 Reload Songs
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8"
        >
          <a
            href="/"
            className="text-cosmic-cyan hover:text-cosmic-blue transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </a>
        </motion.div>
      </div>
    </main>
  )
}
