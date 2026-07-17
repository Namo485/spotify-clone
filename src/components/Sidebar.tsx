import React, { useState } from "react";
import { Home, Search, Library, Plus, Heart, Music, Play, Trash2 } from "lucide-react";
import { Playlist, Track, ViewType } from "../types";
import { collection, query, where, onSnapshot, deleteDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "../firebase";
import { useQuery } from "@tanstack/react-query";

interface SidebarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  selectedPlaylist: Playlist | null;
  setPlaylist: (playlist: Playlist | null) => void;
  user: any;
  onOpenAuth: () => void;
  playlists: Playlist[];
  likedTracksCount: number;
}

export default function Sidebar({
  currentView,
  setView,
  selectedPlaylist,
  setPlaylist,
  user,
  onOpenAuth,
  playlists,
  likedTracksCount
}: SidebarProps) {

  const handleCreatePlaylist = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }

    const docRef = doc(collection(db, "playlists"));
    try {
      const newPlaylistName = `My Playlist #${playlists.length + 1}`;
      await setDoc(docRef, {
        playlistId: docRef.id,
        name: newPlaylistName,
        description: "A custom playlist created on Spotify Clone.",
        ownerId: user.uid,
        ownerName: user.displayName || "User",
        isPublic: true,
        tracks: [],
        createdAt: serverTimestamp()
      });
      console.log("Playlist created: ", docRef.id);
    } catch (error) {
      console.error("Error creating playlist:", error);
      handleFirestoreError(error, OperationType.CREATE, "playlists/" + docRef.id);
    }
  };

  const handleDeletePlaylist = async (e: React.MouseEvent, playlistId: string) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await deleteDoc(doc(db, "playlists", playlistId));
      if (selectedPlaylist?.playlistId === playlistId) {
        setView("home");
        setPlaylist(null);
      }
    } catch (error) {
      console.error("Error deleting playlist:", error);
      handleFirestoreError(error, OperationType.DELETE, "playlists/" + playlistId);
    }
  };

  return (
    <div id="spotify-sidebar" className="w-[300px] h-full flex flex-col gap-2 select-none">
      {/* Navigation Box */}
      <div className="bg-black rounded-xl p-5 flex flex-col gap-5 border border-zinc-900/40">
        <div className="flex items-center gap-2.5 px-1 pb-1">
          <a href="https://open.spotify.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 hover:opacity-85 transition-opacity">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg" 
              alt="Spotify Logo" 
              className="w-8 h-8 object-contain" 
              referrerPolicy="no-referrer"
            />
            <span className="text-xl font-bold tracking-tight text-white">Spotify</span>
          </a>
        </div>

        <div 
          onClick={() => { setView("home"); setPlaylist(null); }}
          className={`flex items-center gap-5 text-sm font-bold cursor-pointer transition duration-200 ${currentView === "home" ? "text-green-500" : "text-zinc-400 hover:text-white"}`}
        >
          <Home className="w-5 h-5" />
          Home
        </div>
        <div 
          onClick={() => { setView("search"); setPlaylist(null); }}
          className={`flex items-center gap-5 text-sm font-bold cursor-pointer transition duration-200 ${currentView === "search" ? "text-green-500" : "text-zinc-400 hover:text-white"}`}
        >
          <Search className="w-5 h-5" />
          Search
        </div>
      </div>

      {/* Library Box */}
      <div className="bg-black rounded-xl p-5 flex-1 flex flex-col gap-4 overflow-hidden border border-zinc-900/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-zinc-400 hover:text-white transition duration-200 cursor-pointer">
            <Library className="w-5 h-5" />
            <span className="text-sm font-bold">Your Library</span>
          </div>
          <button 
            onClick={handleCreatePlaylist}
            id="create-playlist-sidebar-btn"
            className="text-zinc-400 hover:text-white hover:bg-zinc-900 p-1.5 rounded-full transition"
            title="Create playlist"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Playlists & Likes scroll area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
          {/* Liked Songs Entry */}
          <div 
            onClick={() => { setView("liked"); setPlaylist(null); }}
            className={`flex items-center gap-4 p-2 rounded-lg cursor-pointer transition duration-200 ${currentView === "liked" ? "bg-zinc-900" : "hover:bg-zinc-900/50"}`}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-900 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/10">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">Liked Songs</span>
              <span className="text-xs text-zinc-400">{likedTracksCount} {likedTracksCount === 1 ? "song" : "songs"}</span>
            </div>
          </div>

          {/* Seeding Custom User Playlists */}
          <div className="space-y-1">
            {playlists.length === 0 ? (
              <div className="p-4 bg-zinc-900/40 border border-zinc-800/40 rounded-xl text-center space-y-3 mt-2">
                <p className="text-xs font-medium text-zinc-400">Create your first playlist</p>
                <p className="text-[10px] text-zinc-500">It's easy, we'll help you</p>
                <button 
                  onClick={handleCreatePlaylist}
                  className="bg-green-500 text-black text-xs font-bold py-1.5 px-4 rounded-full hover:scale-105 transition"
                >
                  Create Playlist
                </button>
              </div>
            ) : (
              playlists.map((playlist) => (
                <div 
                  key={playlist.playlistId}
                  onClick={() => { setPlaylist(playlist); setView("playlist"); }}
                  className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition duration-200 ${selectedPlaylist?.playlistId === playlist.playlistId ? "bg-zinc-900" : "hover:bg-zinc-900/50"}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-900 rounded-lg flex items-center justify-center border border-zinc-800/20">
                      <Music className="w-5 h-5 text-zinc-500" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white truncate max-w-[150px]">{playlist.name}</span>
                      <span className="text-xs text-zinc-400">Playlist • {playlist.tracks.length} {playlist.tracks.length === 1 ? "song" : "songs"}</span>
                    </div>
                  </div>
                  
                  {user && user.uid === playlist.ownerId && (
                    <button 
                      onClick={(e) => handleDeletePlaylist(e, playlist.playlistId)}
                      className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-500 p-2 rounded-full transition"
                      title="Delete playlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
