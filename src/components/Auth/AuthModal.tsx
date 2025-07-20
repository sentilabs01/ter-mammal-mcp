import React from 'react';
import { Github, Chrome, Mail } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface AuthModalProps {
  onClose: () => void;
}

function AuthModal({ onClose }: AuthModalProps) {
  const { signInWithGoogle, signInAsGuest } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      onClose();
    } catch (error) {
      console.error('Authentication error:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-true-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 max-w-md w-full animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-electric-blue rounded-lg flex items-center justify-center mx-auto mb-4">
            <div className="text-2xl text-true-black font-bold">AI</div>
          </div>
          <h2 className="text-2xl font-bold text-terminal-text mb-2">
            Welcome to AI Agent Platform
          </h2>
          <p className="text-terminal-secondary">
            Sign in to access your terminals, save sessions, and sync across devices.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center space-x-3 bg-white text-gray-900 hover:bg-gray-100 transition-colors px-4 py-3 rounded-lg font-medium"
          >
            <Chrome className="w-5 h-5" />
            <span>Continue with Google</span>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-gray-900 px-2 text-terminal-secondary">Coming Soon</span>
            </div>
          </div>

          <button
            disabled
            className="w-full flex items-center justify-center space-x-3 bg-gray-800 text-terminal-secondary px-4 py-3 rounded-lg font-medium cursor-not-allowed opacity-50"
          >
            <Github className="w-5 h-5" />
            <span>Continue with GitHub</span>
          </button>

          <button
            onClick={async () => {
              try {
                await signInAsGuest();
                onClose();
              } catch (error) {
                console.error('Guest sign-in error:', error);
              }
            }}
            className="w-full flex items-center justify-center space-x-3 bg-gray-800 text-terminal-secondary hover:bg-gray-700 hover:text-terminal-text transition-colors px-4 py-3 rounded-lg font-medium"
          >
            <Mail className="w-5 h-5" />
            <span>Continue as Guest</span>
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-terminal-secondary">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;