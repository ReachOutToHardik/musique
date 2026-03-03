const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const appleMusicService = require('./services/appleMusicService');
const GameManager = require('./gameManager');

const app = express();

// Trust proxy (Render uses reverse proxy)
app.set('trust proxy', 1);

// CORS - allow all origins for Socket.io compatibility
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: false,
}));

// Handle preflight for all routes
app.options('*', cors({ origin: '*' }));

app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'musique-server' });
});
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  // Allow both transports
  transports: ['websocket', 'polling'],
  allowEIO3: true,
});

const gameManager = new GameManager();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join room
  socket.on('joinRoom', async ({ roomCode, playerName, isHost, settings }) => {
    try {
      socket.join(roomCode);
      
      const player = {
        id: socket.id,
        name: playerName,
        score: 0,
        avatar: playerName[0].toUpperCase(),
      };

      gameManager.addPlayer(roomCode, player);
      
      if (isHost) {
        gameManager.setHost(roomCode, socket.id);
        // Store room settings if provided
        if (settings) {
          console.log(`⚙️ Storing room settings for ${roomCode}:`, settings);
          const room = gameManager.rooms.get(roomCode);
          if (room) {
            room.settings = settings;
          }
        }
      }

      // Notify others
      socket.to(roomCode).emit('playerJoined', player);
      
      // Send current players list to new player
      const players = gameManager.getPlayers(roomCode);
      socket.emit('playersList', players);
      
      console.log(`✅ ${playerName} joined room ${roomCode} (Host: ${isHost})`);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Start game
  socket.on('startGame', async ({ roomCode }) => {
    try {
      console.log(`🎮 Starting game in room ${roomCode}`);
      const isHost = gameManager.isHost(roomCode, socket.id);
      if (!isHost) {
        socket.emit('error', { message: 'Only host can start the game' });
        return;
      }

      // Get room settings from client or use defaults
      const settings = gameManager.getRoomSettings(roomCode) || {
        questionsPerRound: 10,
        timePerQuestion: 10,
        snippetLength: 15,
      };

      console.log('⚙️ Game settings:', settings);

      // Fetch songs from Apple Music API
      console.log('🎵 Fetching songs from Apple Music API...');
      const songs = await appleMusicService.getSongs(settings);
      
      if (songs.length === 0) {
        console.error('❌ No songs available!');
        socket.emit('error', { message: 'Failed to load songs' });
        return;
      }

      console.log(`✅ Loaded ${songs.length} songs`);
      
      gameManager.initializeGame(roomCode, songs, settings);

      // Start countdown
      console.log('⏰ Starting countdown and preloading songs...');
      
      // Preload first few questions during countdown
      const preloadCount = Math.min(3, songs.length);
      console.log(`📦 Preloading ${preloadCount} songs during countdown`);
      
      io.to(roomCode).emit('gameStateUpdate', {
        phase: 'countdown',
        currentQuestion: 0,
        question: null,
        timeLeft: 3,
        scores: {},
      });

      // Countdown 3, 2, 1...
      let countdown = 3;
      const countdownInterval = setInterval(() => {
        countdown--;
        if (countdown === 0) {
          clearInterval(countdownInterval);
          console.log('🎯 Countdown complete, starting first question');
          startQuestion(roomCode);
        } else {
          io.to(roomCode).emit('gameStateUpdate', {
            phase: 'countdown',
            currentQuestion: 0,
            question: null,
            timeLeft: countdown,
            scores: {},
          });
        }
      }, 1000);

    } catch (error) {
      console.error('Error starting game:', error);
      socket.emit('error', { message: 'Failed to start game' });
    }
  });

  // Submit answer
  socket.on('submitAnswer', ({ roomCode, questionId, answer, timeElapsed }) => {
    try {
      const result = gameManager.submitAnswer(roomCode, socket.id, questionId, answer, timeElapsed);
      
      // Send feedback to player
      socket.emit('answerResult', result);
      
      // Update scores for all players
      const scores = gameManager.getScores(roomCode);
      io.to(roomCode).emit('scoresUpdate', scores);
      
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Find and remove player from all rooms
    const roomCode = gameManager.removePlayer(socket.id);
    if (roomCode) {
      io.to(roomCode).emit('playerLeft', socket.id);
      
      // If host left, assign new host
      const players = gameManager.getPlayers(roomCode);
      if (players.length > 0) {
        gameManager.setHost(roomCode, players[0].id);
        io.to(roomCode).emit('newHost', players[0].id);
      }
    }
  });
});

// Helper function to start a question
function startQuestion(roomCode) {
  const question = gameManager.getNextQuestion(roomCode);
  const questionIndex = gameManager.getCurrentQuestionIndex(roomCode);
  const settings = gameManager.getRoomSettings(roomCode);
  const totalQuestions = settings?.questionsPerRound || 10;
  
  console.log(`📊 Question progress: ${questionIndex + 1}/${totalQuestions}`);
  
  if (!question) {
    // Game over
    console.log('🏁 Game over! Showing final scores');
    const finalScores = gameManager.getFinalScores(roomCode);
    console.log('🏆 Final scores:', JSON.stringify(finalScores));
    io.to(roomCode).emit('gameStateUpdate', {
      phase: 'final',
      currentQuestion: 0,
      question: null,
      timeLeft: 0,
      scores: finalScores,
    });
    return;
  }

  const timePerQuestion = settings?.timePerQuestion || 15;

  console.log(`🎵 Question ${questionIndex + 1}:`, {
    id: question.id,
    snippet: question.snippet,
    hasSnippet: !!question.snippet,
    options: question.options.length,
  });

  io.to(roomCode).emit('gameStateUpdate', {
    phase: 'playing',
    currentQuestion: questionIndex,
    question,
    timeLeft: timePerQuestion,
    scores: gameManager.getScores(roomCode),
  });

  // Start timer with millisecond precision
  const startTime = Date.now();
  const endTime = startTime + (timePerQuestion * 1000);
  
  const questionTimer = setInterval(() => {
    const now = Date.now();
    const timeLeftMs = Math.max(0, endTime - now);
    const timeLeft = Math.ceil(timeLeftMs / 1000);
    
    if (timeLeftMs <= 0) {
      clearInterval(questionTimer);
      
      // Show results phase
      console.log(`⏰ Time's up for question ${questionIndex + 1}`);
      const correctAnswer = gameManager.getCorrectAnswer(roomCode, question.id);
      const questionResults = gameManager.getQuestionResults(roomCode, question.id);
      
      io.to(roomCode).emit('gameStateUpdate', {
        phase: 'results',
        currentQuestion: questionIndex,
        question: {
          ...question,
          correctAnswer,
        },
        timeLeft: 0,
        scores: gameManager.getScores(roomCode),
        results: questionResults,
      });

      // Wait 3 seconds to show results, then 2 seconds loading delay
      setTimeout(() => {
        // Show loading state
        io.to(roomCode).emit('gameStateUpdate', {
          phase: 'loading',
          currentQuestion: questionIndex + 1,
          question: null,
          timeLeft: 0,
          scores: gameManager.getScores(roomCode),
        });
        
        // Wait 2 seconds for preloading next song
        setTimeout(() => {
          startQuestion(roomCode);
        }, 2000);
      }, 3000);
    } else {
      io.to(roomCode).emit('timeUpdate', timeLeft);
    }
  }, 100); // Update every 100ms for precision
}

// REST API endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/search/artists', async (req, res) => {
  try {
    const { query } = req.query;
    const results = await appleMusicService.searchArtists(query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/playlists', async (req, res) => {
  try {
    const playlists = await appleMusicService.getPlaylists();
    res.json(playlists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🎵 Musique server running on port ${PORT}`);
});

module.exports = { app, server, io };
