import React, { useState } from "react";
import { signInWithPopup, GoogleAuthProvider, signInAnonymously } from "firebase/auth";
import { auth } from "../firebase";
import { X, Music } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during Google sign-in.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInAnonymously(auth);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during Guest sign-in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="auth-modal-overlay" className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            id="auth-modal-card"
            className="relative bg-zinc-900 border border-zinc-800 text-white rounded-2xl w-full max-w-md p-6 overflow-hidden shadow-2xl"
          >
            <button
              onClick={onClose}
              id="auth-modal-close"
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex flex-col items-center justify-center text-center mt-4 mb-6">
              <div className="bg-green-500 p-3 rounded-full mb-3 shadow-lg shadow-green-500/20">
                <Music className="w-8 h-8 text-black" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Millions of Songs</h2>
              <p className="text-zinc-400 text-sm mt-1">Log in to create playlists and save liked tracks.</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg text-center">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                id="google-signin-btn"
                className="w-full flex items-center justify-center gap-3 bg-white text-black hover:bg-zinc-100 font-semibold py-3 px-4 rounded-full transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.18.97-.69 1.8-1.47 2.35v2.79h2.38c1.39-1.28 2.18-3.18 2.18-5.4z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-2.38-2.79c-.66.44-1.51.7-2.5.7-1.92 0-4.63-1.3-5.21-3.05H1.49v2.87C3.32 20.25 7.38 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M6.79 15.2c-.15-.44-.23-.9-.23-1.38s.08-.94.23-1.38V10.95H1.49C.98 12 .7 13.16.7 14.39c0 1.23.28 2.39.79 3.44l2.85-2.2-.07-.43z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.04c1.62 0 3.08.56 4.22 1.66l3.17-3.17C17.45 1.62 14.97 1 12 1 7.38 1 3.32 3.75 1.49 7.52l3.41 2.6c.58-1.75 3.29-3.08 5.21-3.08z"
                  />
                </svg>
                Continue with Google
              </button>

              <button
                onClick={handleAnonymousSignIn}
                disabled={loading}
                id="anonymous-signin-btn"
                className="w-full flex items-center justify-center gap-3 bg-zinc-800 text-white hover:bg-zinc-700 font-semibold py-3 px-4 rounded-full transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700"
              >
                Continue as Guest (Anonymous)
              </button>
            </div>

            <p className="text-center text-xs text-zinc-500 mt-6 px-4 leading-relaxed">
              By continuing, you agree to Spotify Clone's Terms of Service and Privacy Policy.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
