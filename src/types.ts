export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  img: string;
  src: string;
  duration: number; // in seconds
}

export interface Playlist {
  playlistId: string;
  name: string;
  description?: string;
  ownerId: string;
  ownerName: string;
  isPublic: boolean;
  tracks: Track[];
  createdAt: any;
  updatedAt?: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: any;
}

export type ViewType = "home" | "search" | "playlist" | "liked" | "recent";
