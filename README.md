# musique

multiplayer music trivia game. listen to song snippets, guess the track, compete with friends in real time.

## setup

```bash
npm install
```

run both servers:

```bash
# terminal 1 - backend
npm run server

# terminal 2 - frontend
npm run dev
```

open `http://localhost:3000`

## how it works

- create a room, pick artists/playlists, share the code
- everyone joins, host starts the game
- 30s song preview plays, pick from 4 choices
- 500 pts for correct + 200 bonus if you're first
- 10 rounds, highest score wins

## stack

- next.js 14 + typescript (frontend)
- express + socket.io (backend)
- itunes search api (songs)
- tailwind + framer motion (ui)

