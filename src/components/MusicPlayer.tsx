import React, { useRef, useEffect, useState } from "react";
import { Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Volume2, VolumeX, Heart, ListMusic } from "lucide-react";
import { Track } from "../types";

interface MusicPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  likedTracks: Track[];
  onToggleLike: (track: Track) => void;
}

export default function MusicPlayer({
  currentTrack,
  isPlaying,
  onPlayPause,
  onPrev,
  onNext,
  likedTracks,
  onToggleLike
}: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);

  // Synchronize audio element state based on props
  useEffect(() => {
    if (!audioRef.current) return;

    if (currentTrack) {
      const prevSrc = audioRef.current.src;
      if (prevSrc !== currentTrack.src) {
        audioRef.current.src = currentTrack.src;
        audioRef.current.load();
      }

      if (isPlaying) {
        audioRef.current.play().catch(err => {
          console.warn("Autoplay block / playback error: ", err);
        });
      } else {
        audioRef.current.pause();
      }
    } else {
      audioRef.current.pause();
    }
  }, [currentTrack, isPlaying]);

  // Volume synchronization
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const nextTime = Number(e.target.value);
      audioRef.current.currentTime = nextTime;
      setCurrentTime(nextTime);
    }
  };

  const handleEnded = () => {
    if (isRepeat) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(err => console.warn(err));
      }
    } else {
      onNext();
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs === Infinity) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const isLiked = currentTrack ? likedTracks.some(t => t.id === currentTrack.id) : false;

  return (
    <div id="spotify-music-player" className="w-full h-24 bg-black border-t border-zinc-900/60 px-6 py-4 flex items-center justify-between select-none shrink-0">
      {/* Native HTML5 Audio Controller */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {/* Track Details Meta */}
      <div className="flex items-center gap-4 w-1/4 min-w-[200px]">
        {currentTrack ? (
          <>
            <img src={currentTrack.img} alt={currentTrack.title} className="w-14 h-14 object-cover rounded-lg shadow-lg" />
            <div className="flex flex-col truncate max-w-[150px]">
              <span className="text-sm font-bold text-white truncate">{currentTrack.title}</span>
              <span className="text-xs text-zinc-400 truncate">{currentTrack.artist}</span>
            </div>
            <button 
              onClick={() => onToggleLike(currentTrack)}
              className="text-zinc-400 hover:text-white transition p-2"
              id="player-heart-btn"
            >
              <Heart className={`w-4 h-4 ${isLiked ? "text-green-500 fill-green-500" : ""}`} />
            </button>
          </>
        ) : (
          <>
            <div className="w-14 h-14 bg-zinc-900 rounded-lg flex items-center justify-center border border-zinc-800/30">
              <ListMusic className="w-6 h-6 text-zinc-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-zinc-500">Not Playing</span>
              <span className="text-xs text-zinc-600">Select a track</span>
            </div>
          </>
        )}
      </div>

      {/* Main Control Center */}
      <div className="flex flex-col items-center gap-1.5 w-2/4 max-w-xl">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsShuffle(!isShuffle)}
            className={`transition ${isShuffle ? "text-green-500 scale-105" : "text-zinc-400 hover:text-white"}`}
            title="Shuffle"
            id="player-shuffle-btn"
            disabled={!currentTrack}
          >
            <Shuffle className="w-4 h-4" />
          </button>
          
          <button 
            onClick={onPrev}
            className="text-zinc-400 hover:text-white transition disabled:opacity-30"
            title="Previous"
            id="player-prev-btn"
            disabled={!currentTrack}
          >
            <SkipBack className="w-5 h-5 fill-zinc-400 hover:fill-white" />
          </button>

          <button 
            onClick={onPlayPause}
            className="bg-white hover:bg-zinc-100 text-black p-3 rounded-full hover:scale-105 transition disabled:opacity-50"
            title={isPlaying ? "Pause" : "Play"}
            id="player-play-pause-btn"
            disabled={!currentTrack}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black" />}
          </button>

          <button 
            onClick={onNext}
            className="text-zinc-400 hover:text-white transition disabled:opacity-30"
            title="Next"
            id="player-next-btn"
            disabled={!currentTrack}
          >
            <SkipForward className="w-5 h-5 fill-zinc-400 hover:fill-white" />
          </button>

          <button 
            onClick={() => setIsRepeat(!isRepeat)}
            className={`transition ${isRepeat ? "text-green-500 scale-105" : "text-zinc-400 hover:text-white"}`}
            title="Repeat"
            id="player-repeat-btn"
            disabled={!currentTrack}
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Playback Seek Bar */}
        <div className="flex items-center gap-3 w-full text-xs text-zinc-400 font-medium">
          <span className="min-w-[40px] text-right">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            id="playback-range"
            className="flex-1 accent-green-500 bg-zinc-800 h-1 rounded-lg cursor-pointer"
            disabled={!currentTrack}
          />
          <span className="min-w-[40px]">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume & Utility Controllers */}
      <div className="flex items-center justify-end gap-3 w-1/4 min-w-[150px]">
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className="text-zinc-400 hover:text-white transition"
          id="player-mute-btn"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => { setVolume(Number(e.target.value)); setIsMuted(false); }}
          id="volume-range"
          className="w-24 accent-green-500 bg-zinc-800 h-1 rounded-lg cursor-pointer"
        />
      </div>
    </div>
  );
}
