export interface Player {
  id: string
  name: string
  score: number
  avatar: string
  isHost?: boolean
}

export interface Question {
  id: string
  snippet: string
  options: string[]
  correctAnswer: number
  artistImage?: string
}

export interface GameState {
  phase: 'lobby' | 'countdown' | 'playing' | 'results' | 'final'
  currentQuestion: number
  question: Question | null
  timeLeft: number
  scores: { [playerId: string]: number }
}

export interface GameSettings {
  artists: string[]
  playlists: string[]
  questionsPerRound: number
  timePerQuestion: number
  snippetLength: number
  maxPlayers: number
}

export interface RoomData {
  code: string
  name: string
  host: string
  players: Player[]
  settings: GameSettings
  state: GameState
}

export interface Song {
  id: number
  title: string
  artist: string
  album: string
  previewUrl: string
  artwork: string
  releaseDate: string
  genre: string
}

export interface AnswerResult {
  correct: boolean
  points: number
  correctAnswer?: number
}

export interface LeaderboardEntry {
  rank: number
  player: Player
  score: number
  answered: number
  accuracy: number
}
