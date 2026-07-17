import React, { useState, useEffect } from "react";
import { Search, LogIn, LogOut, Disc, Play, Pause, Heart, Plus, Sparkles, Music, Trash2 } from "lucide-react";
import { Track, Playlist, ViewType } from "../types";
import { db, auth, handleFirestoreError, OperationType } from "../firebase";
import { collection, doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";

interface MainContentProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  selectedPlaylist: Playlist | null;
  setPlaylist: (playlist: Playlist | null) => void;
  user: any;
  onOpenAuth: () => void;
  playlists: Playlist[];
  likedTracks: Track[];
  onToggleLike: (track: Track) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
}

export default function MainContent({
  currentView,
  setView,
  selectedPlaylist,
  setPlaylist,
  user,
  onOpenAuth,
  playlists,
  likedTracks,
  onToggleLike,
  currentTrack,
  isPlaying,
  onPlayTrack
}: MainContentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [aiMood, setAiMood] = useState("");
  const [activePlaylistMenu, setActivePlaylistMenu] = useState<string | null>(null);

  const getGradientClass = () => {
    switch (currentView) {
      case "home":
        return "from-emerald-950/40 via-[#09090b] to-[#09090b]";
      case "liked":
        return "from-purple-950/40 via-[#09090b] to-[#09090b]";
      case "playlist":
        return "from-indigo-950/40 via-[#09090b] to-[#09090b]";
      case "search":
        return "from-zinc-900/50 via-[#09090b] to-[#09090b]";
      default:
        return "from-zinc-950/40 via-[#09090b] to-[#09090b]";
    }
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch featured home tracks
  const { data: featuredTracks = [], isLoading: loadingFeatured } = useQuery<Track[]>({
    queryKey: ["featured"],
    queryFn: async () => {
      const res = await fetch("/api/featured");
      return res.json();
    }
  });

  // Fetch search tracks
  const { data: searchResults = [], isLoading: searching } = useQuery<Track[]>({
    queryKey: ["search", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch) return [];
      const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedSearch)}`);
      return res.json();
    },
    enabled: !!debouncedSearch
  });

  // Generate AI mood-based recommendations
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiTracks, setAiTracks] = useState<Track[]>([]);

  const handleGenerateAiPlaylist = async () => {
    if (!aiMood) return;
    setAiGenerating(true);
    try {
      const res = await fetch(`/api/recommend?seed=${encodeURIComponent(aiMood)}`);
      const data = await res.json();
      setAiTracks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleAddTrackToPlaylist = async (track: Track, playlist: Playlist) => {
    try {
      const playlistRef = doc(db, "playlists", playlist.playlistId);
      await updateDoc(playlistRef, {
        tracks: arrayUnion(track),
        updatedAt: serverTimestamp()
      });
      setActivePlaylistMenu(null);
    } catch (e) {
      console.error("Error adding track to playlist:", e);
      handleFirestoreError(e, OperationType.UPDATE, "playlists/" + playlist.playlistId);
    }
  };

  const handleRemoveTrackFromPlaylist = async (track: Track, playlist: Playlist) => {
    try {
      const playlistRef = doc(db, "playlists", playlist.playlistId);
      await updateDoc(playlistRef, {
        tracks: arrayRemove(track),
        updatedAt: serverTimestamp()
      });
      // Update local state for immediate feedback
      if (selectedPlaylist && selectedPlaylist.playlistId === playlist.playlistId) {
        setPlaylist({
          ...selectedPlaylist,
          tracks: selectedPlaylist.tracks.filter(t => t.id !== track.id)
        });
      }
    } catch (e) {
      console.error("Error removing track:", e);
      handleFirestoreError(e, OperationType.UPDATE, "playlists/" + playlist.playlistId);
    }
  };

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <div id="spotify-main-content" className="flex-1 h-full bg-[#09090b] rounded-xl overflow-y-auto relative flex flex-col scrollbar-thin border border-zinc-900/40 z-0">
      {/* Immersive Header Gradient */}
      <div className={`absolute inset-x-0 top-0 bg-gradient-to-b ${getGradientClass()} h-[340px] -z-10 pointer-events-none`} />

      {/* Sticky Header Nav */}
      <header className="sticky top-0 bg-[#09090b]/80 backdrop-blur-md z-30 px-8 py-4 flex items-center justify-between border-b border-zinc-900/40">
        <div className="flex items-center gap-4 flex-1 max-w-md">
          {currentView === "search" && (
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                placeholder="What do you want to play?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="search-input-field"
                className="w-full bg-[#18181b] hover:bg-[#27272a]/80 focus:bg-[#27272a] focus:outline-none focus:ring-1 focus:ring-zinc-700 text-sm text-white pl-10 pr-4 py-2.5 rounded-full transition border border-zinc-800/40"
              />
            </div>
          )}
        </div>

        {/* User Auth Controls */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="bg-zinc-800 py-1.5 px-4 rounded-full flex items-center gap-2 border border-zinc-700 text-xs font-semibold text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                {user.displayName || user.email || "Guest User"}
              </div>
              <button 
                onClick={handleLogout}
                id="logout-btn"
                className="text-zinc-400 hover:text-white text-sm font-semibold flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 py-2 px-4 rounded-full transition"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          ) : (
            <button 
              onClick={onOpenAuth}
              id="login-btn"
              className="bg-white text-black hover:bg-zinc-100 font-bold py-2 px-6 rounded-full transition"
            >
              Log in
            </button>
          )}
        </div>
      </header>

      {/* Main Scrollable Views */}
      <div className="flex-1 p-8 pb-32">
        {currentView === "home" && (
          <div className="space-y-8">
            {/* AI Playlist Seeder Section */}
            <div className="relative bg-black/40 border border-zinc-800/40 rounded-2xl p-6 overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-transparent to-transparent pointer-events-none"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                    <Sparkles className="w-5 h-5 text-green-400 fill-green-400" />
                    Generate with AI
                  </h3>
                  <p className="text-zinc-400 text-xs max-w-md font-medium leading-relaxed">
                    Describe your desired vibe or activity (e.g. "Focus coding session", "Cozy rainy sunday morning", "High tempo workout") and let Gemini AI create a custom tracklist!
                  </p>
                </div>
                <div className="flex w-full md:w-auto items-center gap-2">
                  <input
                    type="text"
                    placeholder="Enter mood, genre or theme..."
                    value={aiMood}
                    onChange={(e) => setAiMood(e.target.value)}
                    id="ai-mood-input"
                    className="flex-1 md:w-64 bg-zinc-950 hover:bg-zinc-900 text-xs py-2.5 px-4 rounded-full border border-zinc-800/80 focus:outline-none focus:ring-1 focus:ring-green-500 text-white transition-all"
                  />
                  <button 
                    onClick={handleGenerateAiPlaylist}
                    disabled={aiGenerating || !aiMood}
                    id="generate-ai-btn"
                    className="bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black text-xs font-bold py-2.5 px-5 rounded-full transition flex items-center gap-1.5 shrink-0 shadow-lg shadow-green-500/10 hover:scale-105 duration-200"
                  >
                    {aiGenerating ? "Thinking..." : "Generate"}
                  </button>
                </div>
              </div>

              {/* AI Generated Tracks Output */}
              {aiTracks.length > 0 && (
                <div className="mt-6 pt-6 border-t border-emerald-500/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-emerald-400 tracking-wider uppercase">Your AI Recommended Soundscape</h4>
                    <button 
                      onClick={() => setAiTracks([])} 
                      className="text-zinc-400 hover:text-white text-xs"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {aiTracks.map((track) => (
                      <div key={track.id} className="bg-zinc-950/40 hover:bg-zinc-950/80 border border-zinc-800/40 p-3 rounded-xl flex items-center justify-between group transition">
                        <div className="flex items-center gap-3">
                          <img src={track.img} alt={track.title} className="w-12 h-12 object-cover rounded-lg" />
                          <div>
                            <p className="text-sm font-bold text-white line-clamp-1">{track.title}</p>
                            <p className="text-xs text-zinc-400 line-clamp-1">{track.artist}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => onPlayTrack(track)}
                            className="bg-emerald-500 hover:bg-emerald-400 text-black p-2 rounded-full transition opacity-0 group-hover:opacity-100"
                          >
                            <Play className="w-4 h-4 fill-black" />
                          </button>
                          <button 
                            onClick={() => onToggleLike(track)}
                            className="text-zinc-400 hover:text-white p-2"
                          >
                            <Heart className={`w-4 h-4 ${likedTracks.some(t => t.id === track.id) ? "text-emerald-500 fill-emerald-500" : ""}`} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Trending / Featured Tracks Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight text-white">Trending Now</h2>
              {loadingFeatured ? (
                <div className="flex items-center justify-center py-12">
                  <span className="w-8 h-8 rounded-full border-4 border-zinc-800 border-t-green-500 animate-spin"></span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {featuredTracks.map((track) => {
                    const isCurrent = currentTrack?.id === track.id;
                    return (
                      <div 
                        key={track.id} 
                        className="group relative bg-[#121214]/40 hover:bg-[#18181c]/80 p-4 rounded-xl cursor-pointer transition-all duration-300 border border-zinc-900/40 hover:border-zinc-800/60 hover:shadow-2xl"
                      >
                        <div className="relative aspect-square mb-4 shadow-lg">
                          <img src={track.img} alt={track.title} className="w-full h-full object-cover rounded-lg" />
                          {/* Play overlay hover button */}
                          <button 
                            onClick={() => onPlayTrack(track)}
                            className="absolute bottom-3 right-3 bg-green-500 hover:bg-green-400 p-3 rounded-full text-black shadow-xl shadow-black/40 scale-95 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition duration-300"
                          >
                            {isCurrent && isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black" />}
                          </button>
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm text-white truncate">{track.title}</h4>
                          <p className="text-xs text-zinc-400 truncate">{track.artist}</p>
                        </div>

                        {/* Top Heart and Playlist controls */}
                        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button 
                            onClick={() => onToggleLike(track)}
                            className="bg-black/60 p-1.5 rounded-full hover:scale-105 transition"
                          >
                            <Heart className={`w-3.5 h-3.5 ${likedTracks.some(t => t.id === track.id) ? "text-green-500 fill-green-500" : "text-white"}`} />
                          </button>
                          
                          {/* Add to Playlist button */}
                          <div className="relative">
                            <button 
                              onClick={() => setActivePlaylistMenu(activePlaylistMenu === track.id ? null : track.id)}
                              className="bg-black/60 p-1.5 rounded-full hover:scale-105 transition text-white"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            {activePlaylistMenu === track.id && (
                              <div className="absolute right-0 mt-1 bg-zinc-950 border border-zinc-800 p-2 rounded-lg shadow-xl w-48 z-40 text-xs">
                                <p className="font-semibold text-zinc-400 pb-1.5 border-b border-zinc-800 mb-1.5">Add to Playlist</p>
                                {playlists.length === 0 ? (
                                  <p className="text-[10px] text-zinc-600">No playlists found</p>
                                ) : (
                                  playlists.map(p => (
                                    <button
                                      key={p.playlistId}
                                      onClick={() => handleAddTrackToPlaylist(track, p)}
                                      className="w-full text-left py-1 hover:text-green-500 truncate"
                                    >
                                      {p.name}
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === "search" && (
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight text-white">Search Results</h2>
              {searching ? (
                <div className="flex items-center justify-center py-12">
                  <span className="w-8 h-8 rounded-full border-4 border-zinc-800 border-t-green-500 animate-spin"></span>
                </div>
              ) : !debouncedSearch ? (
                <div className="p-12 text-center text-zinc-500 space-y-2">
                  <Search className="w-12 h-12 mx-auto mb-2 text-zinc-600" />
                  <p className="text-sm font-semibold">Search for songs, artists, or moods</p>
                  <p className="text-xs text-zinc-600">Our smart search is backed by Gemini AI to understand your description.</p>
                </div>
              ) : searchResults.length === 0 ? (
                <p className="text-sm text-zinc-500">No results found for "{searchQuery}". Try something else!</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {searchResults.map((track) => (
                    <div 
                      key={track.id} 
                      className="group relative bg-[#121214]/40 hover:bg-[#18181c]/80 p-4 rounded-xl cursor-pointer transition-all duration-300 border border-zinc-900/40 hover:border-zinc-800/60 hover:shadow-2xl"
                    >
                      <div className="relative aspect-square mb-4 shadow-lg">
                        <img src={track.img} alt={track.title} className="w-full h-full object-cover rounded-lg" />
                        <button 
                          onClick={() => onPlayTrack(track)}
                          className="absolute bottom-3 right-3 bg-green-500 hover:bg-green-400 p-3 rounded-full text-black shadow-xl opacity-0 group-hover:opacity-100 group-hover:scale-105 transition"
                        >
                          <Play className="w-5 h-5 fill-black" />
                        </button>
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-white truncate">{track.title}</h4>
                        <p className="text-xs text-zinc-400 truncate">{track.artist}</p>
                      </div>

                      {/* Heart and Playlist Controls */}
                      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button 
                          onClick={() => onToggleLike(track)}
                          className="bg-black/60 p-1.5 rounded-full hover:scale-105 transition"
                        >
                          <Heart className={`w-3.5 h-3.5 ${likedTracks.some(t => t.id === track.id) ? "text-green-500 fill-green-500" : "text-white"}`} />
                        </button>
                        
                        <div className="relative">
                          <button 
                            onClick={() => setActivePlaylistMenu(activePlaylistMenu === track.id ? null : track.id)}
                            className="bg-black/60 p-1.5 rounded-full hover:scale-105 transition text-white"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          {activePlaylistMenu === track.id && (
                            <div className="absolute right-0 mt-1 bg-zinc-950 border border-zinc-800 p-2 rounded-lg shadow-xl w-48 z-40 text-xs">
                              <p className="font-semibold text-zinc-400 pb-1.5 border-b border-zinc-800 mb-1.5">Add to Playlist</p>
                              {playlists.length === 0 ? (
                                <p className="text-[10px] text-zinc-600">No playlists found</p>
                              ) : (
                                playlists.map(p => (
                                  <button
                                    key={p.playlistId}
                                    onClick={() => handleAddTrackToPlaylist(track, p)}
                                    className="w-full text-left py-1 hover:text-green-500 truncate"
                                  >
                                    {p.name}
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === "playlist" && selectedPlaylist && (
          <div className="space-y-8 relative z-10">
            {/* Playlist Header Meta */}
            <div className="flex flex-col md:flex-row items-end gap-6 pb-6 border-b border-zinc-900/60">
              <div className="w-48 h-48 bg-gradient-to-br from-indigo-950/80 to-purple-950/60 rounded-2xl flex items-center justify-center shadow-2xl border border-zinc-800/20">
                <Music className="w-16 h-16 text-zinc-300" />
              </div>
              <div className="space-y-2 flex-1">
                <span className="text-xs uppercase font-bold text-green-500 tracking-widest">Playlist</span>
                <h1 className="text-5xl md:text-7xl font-black text-white leading-tight">{selectedPlaylist.name}</h1>
                <p className="text-zinc-400 text-sm font-medium">{selectedPlaylist.description || "No description provided."}</p>
                <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                  <span className="font-bold text-white">{selectedPlaylist.ownerName}</span>
                  <span className="text-zinc-500">•</span>
                  <span>{selectedPlaylist.tracks.length} {selectedPlaylist.tracks.length === 1 ? "song" : "songs"}</span>
                </div>
              </div>
            </div>

            {/* Tracks List */}
            <div className="space-y-2">
              {selectedPlaylist.tracks.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 space-y-4">
                  <p className="text-sm font-semibold">This playlist is empty</p>
                  <p className="text-xs text-zinc-600 max-w-sm mx-auto">Go search for your favorite songs and add them directly to this playlist.</p>
                  <button 
                    onClick={() => setView("search")}
                    className="bg-green-500 text-black text-xs font-bold py-2 px-6 rounded-full hover:scale-105 transition"
                  >
                    Go Search
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {/* List Header */}
                  <div className="grid grid-cols-12 text-xs font-semibold text-zinc-400 px-4 py-2 border-b border-zinc-900/40 mb-2 uppercase tracking-wider">
                    <span className="col-span-1">#</span>
                    <span className="col-span-5">Title</span>
                    <span className="col-span-4">Album</span>
                    <span className="col-span-2 text-right">Actions</span>
                  </div>

                  {selectedPlaylist.tracks.map((track, i) => {
                    const isCurrent = currentTrack?.id === track.id;
                    return (
                      <div 
                        key={track.id}
                        className={`grid grid-cols-12 items-center px-4 py-3 rounded-xl hover:bg-[#18181c]/60 group transition-all duration-200 border border-transparent hover:border-zinc-900/30 ${isCurrent ? "bg-[#18181c]/50" : ""}`}
                      >
                        <div className="col-span-1 text-zinc-400 text-sm font-semibold flex items-center">
                          <span className="group-hover:hidden">{i + 1}</span>
                          <button 
                            onClick={() => onPlayTrack(track)}
                            className="hidden group-hover:flex text-white hover:text-green-500"
                          >
                            <Play className="w-4 h-4 fill-white hover:fill-green-500" />
                          </button>
                        </div>
                        <div className="col-span-5 flex items-center gap-3">
                          <img src={track.img} alt={track.title} className="w-10 h-10 object-cover rounded-lg" />
                          <div>
                            <p className={`text-sm font-semibold ${isCurrent ? "text-green-500" : "text-white"}`}>{track.title}</p>
                            <p className="text-xs text-zinc-400">{track.artist}</p>
                          </div>
                        </div>
                        <span className="col-span-4 text-sm text-zinc-400 truncate">{track.album || "Single"}</span>
                        <div className="col-span-2 flex items-center justify-end gap-2 pr-2">
                          <button 
                            onClick={() => onToggleLike(track)}
                            className="text-zinc-500 hover:text-white transition"
                          >
                            <Heart className={`w-4 h-4 ${likedTracks.some(t => t.id === track.id) ? "text-green-500 fill-green-500" : ""}`} />
                          </button>
                          
                          {user && user.uid === selectedPlaylist.ownerId && (
                            <button 
                              onClick={() => handleRemoveTrackFromPlaylist(track, selectedPlaylist)}
                              className="text-zinc-500 hover:text-red-500 transition"
                              title="Remove track"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === "liked" && (
          <div className="space-y-8 relative z-10">
            <div className="flex flex-col md:flex-row items-end gap-6 pb-6 border-b border-zinc-900/60">
              <div className="w-48 h-48 bg-gradient-to-br from-purple-900/80 to-indigo-950/60 rounded-2xl flex items-center justify-center shadow-2xl border border-zinc-800/20">
                <Heart className="w-20 h-20 text-white fill-white" />
              </div>
              <div className="space-y-2 flex-1">
                <span className="text-xs uppercase font-bold text-purple-400 tracking-widest">Playlist</span>
                <h1 className="text-5xl md:text-7xl font-black text-white leading-tight">Liked Songs</h1>
                <div className="flex items-center gap-1.5 text-sm text-zinc-400">
                  <span className="font-bold text-white">{user?.displayName || "Guest"}</span>
                  <span className="text-zinc-500">•</span>
                  <span>{likedTracks.length} {likedTracks.length === 1 ? "song" : "songs"}</span>
                </div>
              </div>
            </div>

            {/* Liked Tracks list */}
            <div className="space-y-2">
              {likedTracks.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 space-y-4">
                  <p className="text-sm font-semibold">Your liked songs list is empty</p>
                  <p className="text-xs text-zinc-600 max-w-sm mx-auto">Heart any track from home or search to save it securely in your liked songs collection.</p>
                  <button 
                    onClick={() => setView("home")}
                    className="bg-green-500 text-black text-xs font-bold py-2 px-6 rounded-full hover:scale-105 transition"
                  >
                    Go Listen
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="grid grid-cols-12 text-xs font-semibold text-zinc-400 px-4 py-2 border-b border-zinc-900/40 mb-2 uppercase tracking-wider">
                    <span className="col-span-1">#</span>
                    <span className="col-span-5">Title</span>
                    <span className="col-span-4">Album</span>
                    <span className="col-span-2 text-right">Actions</span>
                  </div>

                  {likedTracks.map((track, i) => {
                    const isCurrent = currentTrack?.id === track.id;
                    return (
                      <div 
                        key={track.id}
                        className={`grid grid-cols-12 items-center px-4 py-3 rounded-xl hover:bg-[#18181c]/60 group transition-all duration-200 border border-transparent hover:border-zinc-900/30 ${isCurrent ? "bg-[#18181c]/50" : ""}`}
                      >
                        <div className="col-span-1 text-zinc-400 text-sm font-semibold flex items-center">
                          <span className="group-hover:hidden">{i + 1}</span>
                          <button 
                            onClick={() => onPlayTrack(track)}
                            className="hidden group-hover:flex text-white hover:text-green-500"
                          >
                            <Play className="w-4 h-4 fill-white hover:fill-green-500" />
                          </button>
                        </div>
                        <div className="col-span-5 flex items-center gap-3">
                          <img src={track.img} alt={track.title} className="w-10 h-10 object-cover rounded-lg" />
                          <div>
                            <p className={`text-sm font-semibold ${isCurrent ? "text-green-500" : "text-white"}`}>{track.title}</p>
                            <p className="text-xs text-zinc-400">{track.artist}</p>
                          </div>
                        </div>
                        <span className="col-span-4 text-sm text-zinc-400 truncate">{track.album || "Single"}</span>
                        <div className="col-span-2 flex items-center justify-end gap-2 pr-2">
                          <button 
                            onClick={() => onToggleLike(track)}
                            className="text-green-500 fill-green-500 p-2"
                          >
                            <Heart className="w-4 h-4 text-green-500 fill-green-500" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
