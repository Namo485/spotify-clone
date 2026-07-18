import React, { useState } from "react";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { auth } from "../firebase";
import { X, Music, AlertCircle, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Email/Password state
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/unauthorized-domain") {
        setError("This domain is not authorized for Google Sign-In yet. Please use Email/Password login or Guest Mode which work everywhere instantly!");
      } else {
        setError(err.message || "An error occurred during Google sign-in.");
      }
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

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (isSignUp && !displayName) {
      setError("Please enter your name.");
      return;
    }
    if (password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: displayName,
          photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(displayName)}`
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      let msg = err.message || "An authentication error occurred.";
      if (err.code === "auth/operation-not-allowed") {
        msg = "Email/Password sign-in is not enabled in Firebase. Please enable it in the Firebase Console settings.";
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        msg = "Invalid email or password.";
      } else if (err.code === "auth/email-already-in-use") {
        msg = "This email is already registered.";
      } else if (err.code === "auth/invalid-email") {
        msg = "Please enter a valid email address.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="auth-modal-overlay" className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            id="auth-modal-card"
            className="relative bg-zinc-950 border border-zinc-800 text-white rounded-2xl w-full max-w-md p-6 my-8 overflow-hidden shadow-2xl"
          >
            <button
              onClick={onClose}
              id="auth-modal-close"
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex flex-col items-center justify-center text-center mt-2 mb-4">
              <div className="bg-green-500 p-3 rounded-full mb-3 shadow-lg shadow-green-500/20">
                <Music className="w-7 h-7 text-black stroke-[2.5]" />
              </div>
              <h2 className="text-xl font-bold tracking-tight">Millions of Songs</h2>
              <p className="text-zinc-400 text-xs mt-1">
                {isSignUp ? "Create a free account to save playlists." : "Log in to access your personal playlists."}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Email Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3 mb-5">
              {isSignUp && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1 uppercase tracking-wider">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-green-500 transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 uppercase tracking-wider">Email address</label>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-green-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-green-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-500 text-black hover:bg-green-400 font-bold py-2.5 rounded-full transition duration-200 mt-2 text-sm flex items-center justify-center shadow-lg shadow-green-500/10 disabled:opacity-50"
              >
                {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Log In"}
              </button>
            </form>

            <div className="flex items-center justify-between text-xs text-zinc-400 mb-5">
              <span>
                {isSignUp ? "Already have an account?" : "New to Spotify?"}
              </span>
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                }}
                className="text-green-500 hover:underline font-bold"
              >
                {isSignUp ? "Log In here" : "Sign Up free"}
              </button>
            </div>

            <div className="relative flex py-2 items-center mb-4">
              <div className="flex-grow border-t border-zinc-800"></div>
              <span className="flex-shrink mx-4 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Universal Logins</span>
              <div className="flex-grow border-t border-zinc-800"></div>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                type="button"
                id="google-signin-btn"
                className="w-full flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-100 font-bold py-2.5 px-4 rounded-full text-xs transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
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
                type="button"
                id="anonymous-signin-btn"
                className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 font-bold py-2.5 px-4 rounded-full text-xs transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-800"
              >
                Continue as Guest (Anonymous)
              </button>
            </div>

            <div className="mt-4 p-2 bg-blue-500/5 border border-blue-500/10 rounded-lg text-[10px] text-zinc-400 flex gap-2">
              <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
              <span>
                <strong>Cross-Host Tip:</strong> Email/Password login and Guest Mode do not restrict domains, making them fully compatible with <strong>Vercel.com</strong>, localhost, and all external hosting environments instantly.
              </span>
            </div>

            <p className="text-center text-[10px] text-zinc-500 mt-4 px-2 leading-relaxed">
              By continuing, you agree to Spotify Clone's Terms of Service and Privacy Policy.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

