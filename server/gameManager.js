class GameManager {
  constructor() {
    this.rooms = new Map();
  }

  // Room management
  createRoom(roomCode, settings) {
    this.rooms.set(roomCode, {
      settings,
      players: [],
      host: null,
      game: null,
    });
  }

  getRoomSettings(roomCode) {
    const room = this.rooms.get(roomCode);
    return room?.settings;
  }

  setHost(roomCode, playerId) {
    const room = this.rooms.get(roomCode);
    if (room) {
      room.host = playerId;
    }
  }

  isHost(roomCode, playerId) {
    const room = this.rooms.get(roomCode);
    return room?.host === playerId;
  }

  // Player management
  addPlayer(roomCode, player) {
    let room = this.rooms.get(roomCode);
    if (!room) {
      this.createRoom(roomCode, {});
      room = this.rooms.get(roomCode);
    }
    room.players.push(player);
  }

  removePlayer(playerId) {
    for (const [roomCode, room] of this.rooms.entries()) {
      const playerIndex = room.players.findIndex(p => p.id === playerId);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        if (room.players.length === 0) {
          this.rooms.delete(roomCode);
        }
        return roomCode;
      }
    }
    return null;
  }

  getPlayers(roomCode) {
    const room = this.rooms.get(roomCode);
    return room?.players || [];
  }

  // Game logic
  initializeGame(roomCode, songs, settings) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    console.log(`🎮 Initializing game for room ${roomCode}`);
    console.log(`📝 Settings: ${settings.questionsPerRound} questions, ${settings.timePerQuestion}s per question`);
    console.log(`🎵 Songs available: ${songs.length}`);

    // Generate questions from songs
    const questions = songs.slice(0, settings.questionsPerRound).map((song, index) => {
      // Create wrong answers by mixing other songs
      const wrongAnswers = songs
        .filter((s, i) => i !== index)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(s => `${s.title} - ${s.artist}`);

      const correctAnswer = `${song.title} - ${song.artist}`;
      
      // Randomize answer positions
      const options = [...wrongAnswers, correctAnswer]
        .sort(() => Math.random() - 0.5);

      return {
        id: `q_${index}`,
        snippet: song.previewUrl,
        options,
        correctAnswer: options.indexOf(correctAnswer),
        artistImage: song.artwork,
        songData: song,
      };
    });

    room.game = {
      questions,
      currentQuestionIndex: -1,
      answers: new Map(),
      scores: new Map(room.players.map(p => [p.id, 0])),
    };
    
    console.log(`✅ Game initialized with ${questions.length} questions`);
  }

  getNextQuestion(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room?.game) {
      console.log('❌ No game found for room:', roomCode);
      return null;
    }

    room.game.currentQuestionIndex++;
    console.log(`🎯 getNextQuestion: index=${room.game.currentQuestionIndex}, total=${room.game.questions.length}`);
    
    if (room.game.currentQuestionIndex >= room.game.questions.length) {
      console.log('✅ All questions answered, returning null to end game');
      return null;
    }

    const question = room.game.questions[room.game.currentQuestionIndex];
    
    // Return question without songData (keep it server-side)
    return {
      id: question.id,
      snippet: question.snippet,
      options: question.options,
      artistImage: question.artistImage,
    };
  }

  getCurrentQuestionIndex(roomCode) {
    const room = this.rooms.get(roomCode);
    return room?.game?.currentQuestionIndex || 0;
  }

  getCorrectAnswer(roomCode, questionId) {
    const room = this.rooms.get(roomCode);
    if (!room?.game) return null;

    const question = room.game.questions.find(q => q.id === questionId);
    return question?.correctAnswer;
  }

  submitAnswer(roomCode, playerId, questionId, answer, timeElapsed) {
    const room = this.rooms.get(roomCode);
    if (!room?.game) return { correct: false, points: 0, rank: 0 };

    const question = room.game.questions.find(q => q.id === questionId);
    if (!question) return { correct: false, points: 0, rank: 0 };

    const isCorrect = answer === question.correctAnswer;
    
    // Store answer with precise timestamp
    if (!room.game.answers.has(questionId)) {
      room.game.answers.set(questionId, new Map());
    }
    
    const answerTime = Date.now();
    const answersForQuestion = room.game.answers.get(questionId);
    
    // Calculate points: 500 base + 200 bonus for first correct answer
    let points = 0;
    let rank = 0;
    
    if (isCorrect) {
      points = 500;
      
      // Check if this is the first correct answer
      const correctAnswers = Array.from(answersForQuestion.values())
        .filter(a => a.correct)
        .sort((a, b) => a.timestamp - b.timestamp);
      
      if (correctAnswers.length === 0) {
        // First correct answer - bonus!
        points += 200;
        rank = 1;
      } else {
        rank = correctAnswers.length + 1;
      }
      
      const currentScore = room.game.scores.get(playerId) || 0;
      room.game.scores.set(playerId, currentScore + points);
      
      // Update player score
      const player = room.players.find(p => p.id === playerId);
      if (player) {
        player.score = currentScore + points;
      }
    }
    
    answersForQuestion.set(playerId, {
      answer,
      correct: isCorrect,
      points,
      timestamp: answerTime,
      rank,
    });

    return { correct: isCorrect, points, rank };
  }

  getScores(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room?.game) return {};

    const scores = {};
    room.game.scores.forEach((score, playerId) => {
      scores[playerId] = score;
    });
    return scores;
  }

  getFinalScores(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return [];

    return room.players
      .map(player => ({
        id: player.id,
        name: player.name,
        score: player.score,
      }))
      .sort((a, b) => b.score - a.score);
  }

  getQuestionResults(roomCode, questionId) {
    const room = this.rooms.get(roomCode);
    if (!room?.game) return [];

    const answersForQuestion = room.game.answers.get(questionId);
    
    // Build results for ALL players in the room
    const results = [];
    
    room.players.forEach(player => {
      const answerData = answersForQuestion?.get(player.id);
      if (answerData) {
        results.push({
          playerId: player.id,
          playerName: player.name,
          points: answerData.points,
          correct: answerData.correct,
          rank: answerData.rank,
          timestamp: answerData.timestamp,
          totalScore: player.score,
        });
      } else {
        // Player didn't answer
        results.push({
          playerId: player.id,
          playerName: player.name,
          points: 0,
          correct: false,
          rank: 0,
          timestamp: Infinity,
          totalScore: player.score,
        });
      }
    });

    // Sort: correct first (by time), then wrong, then no answer
    return results.sort((a, b) => {
      if (a.correct && !b.correct) return -1;
      if (!a.correct && b.correct) return 1;
      if (a.correct && b.correct) return a.timestamp - b.timestamp;
      return 0;
    });
  }
}

module.exports = GameManager;
