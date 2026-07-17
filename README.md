# 🎧 Spotify Web Player Clone

A fully functional front-end clone of the Spotify Web Player, built with vanilla **HTML, CSS, and JavaScript** — no frameworks, no build tools. Open it and it just works.

![Made with HTML](https://img.shields.io/badge/HTML-5-orange) ![Made with CSS](https://img.shields.io/badge/CSS-3-blue) ![Made with JS](https://img.shields.io/badge/JavaScript-Vanilla-yellow)

## Features

- **Real audio playback** — play, pause, next, and previous, with a synced progress bar you can drag to seek
- **Shuffle & repeat** modes
- **Volume control** with a mute toggle and low/medium/high icon states
- **Live search** — filters tracks across every section as you type, with a "no results" state
- **Like songs** — heart any track to save it, and it instantly appears in a "Liked Songs" list in the sidebar
- **Now-playing bar** — always shows the current track's cover, title, and artist
- **Keyboard shortcuts** — `Space` to play/pause, `Shift + →` / `Shift + ←` to skip tracks
- **Responsive layout** — adapts down to mobile screens
- **Create playlist** call-to-action with a small interactive state change

## Getting started

1. Clone or download this folder.
2. Open `index.html` directly in your browser — no server or build step required.
3. To use your own music instead of the demo streaming tracks, drop your `.mp3` files into a `songs/` folder and update the `src` field for each track in `script.js` (near the top, in the `tracks` array).

## Project structure

```
├── index.html      # Markup
├── style.css       # Styling (dark theme, responsive)
├── script.js       # Playback, search, likes, and player logic
└── assets/         # Icons and cover art
```

## Notes for further development

- Liked songs are currently kept in memory for the session. If you deploy this (e.g. GitHub Pages), you can swap the `likedSongs` array in `script.js` for `localStorage` so likes persist across visits.
- The demo tracks stream from a public sample-audio host so playback works immediately — swap in your own files for a real library.
- Built on top of an original Spotify clone layout, extended with working playback, search, likes, and a11y-friendly controls.

## License

Free to use for personal portfolios and learning.
