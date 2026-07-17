import React, { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "./firebase";
import { Playlist, Track, ViewType } from "./types";
import Sidebar from "./components/Sidebar";
import MainContent from "./components/MainContent";
import MusicPlayer from "./components/MusicPlayer";
import AuthModal from "./components/AuthModal";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

function SpotifyApp() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setView] = useState<ViewType>("home");
  const [selectedPlaylist, setPlaylist] = useState<Playlist | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Playback state
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Firebase Real-time Synchronization States
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);

  // Monitor Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setPlaylists([]);
        setLikedTracks([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync Playlists from Firestore
  useEffect(() => {
    if (!user) return;

    const path = "playlists";
    const q = query(collection(db, path), where("ownerId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Playlist[] = [];
      snapshot.forEach((doc) => {
        list.push({ playlistId: doc.id, ...doc.data() } as Playlist);
      });
      setPlaylists(list);
    }, (error) => {
      console.error("Error fetching playlists from Firestore:", error);
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user]);

  // Sync Liked Songs from Firestore
  useEffect(() => {
    if (!user) return;

    const path = "liked_songs";
    const q = query(collection(db, path), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Track[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.track) {
          list.push(data.track as Track);
        }
      });
      setLikedTracks(list);
    }, (error) => {
      console.error("Error fetching liked songs from Firestore:", error);
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user]);

  const handleToggleLike = async (track: Track) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    const likedSongId = `${user.uid}_${track.id}`;
    const docRef = doc(db, "liked_songs", likedSongId);
    try {
      const isAlreadyLiked = likedTracks.some((t) => t.id === track.id);
      if (isAlreadyLiked) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, {
          id: likedSongId,
          userId: user.uid,
          trackId: track.id,
          track,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      handleFirestoreError(error, OperationType.WRITE, "liked_songs/" + likedSongId);
    }
  };

  const handlePlayTrack = (track: Track) => {
    if (currentTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  const handleNextTrack = () => {
    if (!currentTrack) return;
    const activeList = selectedPlaylist ? selectedPlaylist.tracks : likedTracks.length > 0 ? likedTracks : [];
    if (activeList.length === 0) return;

    const currentIndex = activeList.findIndex((t) => t.id === currentTrack.id);
    if (currentIndex !== -1 && currentIndex < activeList.length - 1) {
      setCurrentTrack(activeList[currentIndex + 1]);
      setIsPlaying(true);
    } else {
      setCurrentTrack(activeList[0]);
      setIsPlaying(true);
    }
  };

  const handlePrevTrack = () => {
    if (!currentTrack) return;
    const activeList = selectedPlaylist ? selectedPlaylist.tracks : likedTracks.length > 0 ? likedTracks : [];
    if (activeList.length === 0) return;

    const currentIndex = activeList.findIndex((t) => t.id === currentTrack.id);
    if (currentIndex > 0) {
      setCurrentTrack(activeList[currentIndex - 1]);
      setIsPlaying(true);
    } else {
      setCurrentTrack(activeList[activeList.length - 1]);
      setIsPlaying(true);
    }
  };

  return (
    <div id="spotify-app-container" className="flex flex-col h-screen bg-black text-white overflow-hidden font-sans">
      <div className="flex flex-1 overflow-hidden p-2 gap-2">
        <Sidebar
          currentView={currentView}
          setView={setView}
          selectedPlaylist={selectedPlaylist}
          setPlaylist={setPlaylist}
          user={user}
          onOpenAuth={() => setIsAuthOpen(true)}
          playlists={playlists}
          likedTracksCount={likedTracks.length}
        />
        <MainContent
          currentView={currentView}
          setView={setView}
          selectedPlaylist={selectedPlaylist}
          setPlaylist={setPlaylist}
          user={user}
          onOpenAuth={() => setIsAuthOpen(true)}
          playlists={playlists}
          likedTracks={likedTracks}
          onToggleLike={handleToggleLike}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onPlayTrack={handlePlayTrack}
        />
      </div>
      <MusicPlayer
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        onPrev={handlePrevTrack}
        onNext={handleNextTrack}
        likedTracks={likedTracks}
        onToggleLike={handleToggleLike}
      />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SpotifyApp />
    </QueryClientProvider>
  );
}
