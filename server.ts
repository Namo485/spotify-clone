import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize the modern @google/genai client lazy-loaded
let aiClient: GoogleGenAI | null = null;
function getGenAI() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required for real-time metadata and search features.");
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

const app = express();
const PORT = 3000;

app.use(express.json());

// Stable, high-quality SoundHelix MP3 links
const AUDIO_SOURCES = [
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3"
];

// Beautiful Unsplash Music & Art covers
const COVER_IMAGES = [
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80", // Dj deck
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80", // Concert lights
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80", // Mic
  "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=500&q=80", // Instrument
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&q=80", // Stage
  "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=500&q=80", // Psychedelic neon
  "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=500&q=80", // Retro cassette
  "https://images.unsplash.com/photo-1487180142328-0c4e37023af5?w=500&q=80", // Vinyl record
  "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&q=80", // Abstract colors
  "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=500&q=80"  // Jazz sax
];

// Default featured tracks if Gemini is offline/unconfigured
const DEFAULT_TRACKS = [
  {
    id: "default_1",
    title: "Midnight Drive",
    artist: "Neon Horizon",
    album: "Synthwave Odyssey",
    img: COVER_IMAGES[0],
    src: AUDIO_SOURCES[0],
    duration: 372
  },
  {
    id: "default_2",
    title: "Golden Hour Vibes",
    artist: "Summer Sunset",
    album: "Lo-Fi Paradise",
    img: COVER_IMAGES[1],
    src: AUDIO_SOURCES[1],
    duration: 412
  },
  {
    id: "default_3",
    title: "Acoustic Whispers",
    artist: "Emma & The Guitar",
    album: "Unplugged Sessions",
    img: COVER_IMAGES[2],
    src: AUDIO_SOURCES[2],
    duration: 298
  },
  {
    id: "default_4",
    title: "Techno Beats 2026",
    artist: "Cyber Club",
    album: "Futuristic Pulsar",
    img: COVER_IMAGES[3],
    src: AUDIO_SOURCES[3],
    duration: 335
  },
  {
    id: "default_5",
    title: "Chill Cafe",
    artist: "Morning Brew",
    album: "Jazz Lounge Selection",
    img: COVER_IMAGES[4],
    src: AUDIO_SOURCES[4],
    duration: 380
  },
  {
    id: "default_6",
    title: "Epic Cinematic Orchestral",
    artist: "Symphony of Stars",
    album: "Cosmic Journey",
    img: COVER_IMAGES[5],
    src: AUDIO_SOURCES[5],
    duration: 420
  }
];

// Endpoint to fetch default/homepage tracks
app.get("/api/featured", (req, res) => {
  res.json(DEFAULT_TRACKS);
});

// Endpoint to search tracks using Gemini AI
app.get("/api/search", async (req, res) => {
  const query = req.query.q;
  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Query parameter 'q' is required." });
  }

  try {
    const ai = getGenAI();
    const prompt = `You are a real-time music search engine and recommendation system.
Search the web/database for songs, tracks, or artists that match the search query: "${query}".
Return a list of exactly 6 highly relevant, matching, or recommended songs.
For each song, provide:
1. A unique string ID.
2. The track title.
3. The artist name.
4. The album name.
5. An estimated duration of the song in seconds.

Return the result as a JSON array conforming to this schema:
[
  {
    "id": "unique_string_id",
    "title": "Song Title",
    "artist": "Artist Name",
    "album": "Album Name",
    "duration": 240
  }
]`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              artist: { type: Type.STRING },
              album: { type: Type.STRING },
              duration: { type: Type.INTEGER }
            },
            required: ["id", "title", "artist", "album", "duration"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini API");
    }

    const aiTracks = JSON.parse(text);

    // Map audio sources and cover images stably using simple hash/index mapping
    const enrichedTracks = aiTracks.map((track: any, index: number) => {
      const audioIndex = Math.abs(index) % AUDIO_SOURCES.length;
      const coverIndex = Math.abs(index + query.charCodeAt(0)) % COVER_IMAGES.length;
      const finalId = track.id && track.id !== "unique_string_id" && track.id !== "unique_id"
        ? `${track.id}_${index}_${Math.random().toString(36).substring(2, 6)}`
        : `gemini_${index}_${Math.random().toString(36).substring(2, 6)}`;
      return {
        id: finalId,
        title: track.title,
        artist: track.artist,
        album: track.album || "Single",
        img: COVER_IMAGES[coverIndex],
        src: AUDIO_SOURCES[audioIndex],
        duration: track.duration || 210
      };
    });

    res.json(enrichedTracks);
  } catch (error) {
    console.error("Gemini Search Error, falling back to smart client-side search:", error);
    // Fallback: search default tracks locally if Gemini is not set up
    const filtered = DEFAULT_TRACKS.filter(t => 
      t.title.toLowerCase().includes(query.toLowerCase()) || 
      t.artist.toLowerCase().includes(query.toLowerCase()) ||
      t.album.toLowerCase().includes(query.toLowerCase())
    );
    res.json(filtered.length > 0 ? filtered : DEFAULT_TRACKS.slice(0, 3));
  }
});

// Endpoint to generate personalized recommendations or smart playlist based on mood
app.get("/api/recommend", async (req, res) => {
  const seed = req.query.seed || "chill, coding, focused";
  try {
    const ai = getGenAI();
    const prompt = `Return a list of exactly 6 beautiful songs or ambient soundscapes matching the theme/mood: "${seed}".
Return the result as a JSON array conforming to this schema:
[
  {
    "id": "unique_id",
    "title": "Song Title",
    "artist": "Artist Name",
    "album": "Album Name",
    "duration": 240
  }
]`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              artist: { type: Type.STRING },
              album: { type: Type.STRING },
              duration: { type: Type.INTEGER }
            },
            required: ["id", "title", "artist", "album", "duration"]
          }
        }
      }
    });

    const aiTracks = JSON.parse(response.text || "[]");
    const enriched = aiTracks.map((track: any, index: number) => {
      const audioIndex = (index + 4) % AUDIO_SOURCES.length;
      const coverIndex = (index + 7) % COVER_IMAGES.length;
      const finalId = track.id && track.id !== "unique_string_id" && track.id !== "unique_id"
        ? `${track.id}_${index}_${Math.random().toString(36).substring(2, 6)}`
        : `recommend_${index}_${Math.random().toString(36).substring(2, 6)}`;
      return {
        id: finalId,
        title: track.title,
        artist: track.artist,
        album: track.album || "Personalized Mix",
        img: COVER_IMAGES[coverIndex],
        src: AUDIO_SOURCES[audioIndex],
        duration: track.duration || 240
      };
    });
    res.json(enriched);
  } catch (error) {
    res.json(DEFAULT_TRACKS);
  }
});

// Setup Vite Dev Server / Static Hosting Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Spotify Clone server running on http://localhost:${PORT}`);
  });
}

startServer();
