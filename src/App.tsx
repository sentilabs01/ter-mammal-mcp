import React, { useState, useEffect } from 'react';
import Header from './components/Layout/Header';
import TerminalGrid from './components/Terminal/TerminalGrid';
import VoiceCommandPanel from './components/Voice/VoiceCommandPanel';
import AuthModal from './components/Auth/AuthModal';
import { useAuth } from './hooks/useAuth';
import { useWebSocket } from './hooks/useWebSocket';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { WebSocketProvider } from './contexts/WebSocketContext';

function AppContent() {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      setShowAuthModal(true);
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-true-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-electric-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-terminal-text">Initializing AI Agent Platform...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-true-black text-terminal-text flex flex-col">
      <Header 
        voiceEnabled={voiceEnabled} 
        onToggleVoice={() => setVoiceEnabled(!voiceEnabled)} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 p-4">
          <TerminalGrid />
        </div>
        
        {voiceEnabled && (
          <VoiceCommandPanel />
        )}
      </div>

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <WebSocketProvider>
          <AppContent />
        </WebSocketProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;