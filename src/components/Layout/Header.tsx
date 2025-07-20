import React from 'react';
import { Terminal, Mic, MicOff, Settings, User, Zap } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  voiceEnabled: boolean;
  onToggleVoice: () => void;
}

function Header({ voiceEnabled, onToggleVoice }: HeaderProps) {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-true-black border-b border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-electric-blue rounded-lg flex items-center justify-center">
              <Terminal className="w-5 h-5 text-true-black" />
            </div>
            <h1 className="text-xl font-bold text-terminal-text">
              AI Agent Platform
            </h1>
          </div>
          
          <div className="hidden md:flex items-center space-x-4 text-sm text-terminal-secondary">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse-slow"></div>
              <span>Claude Code Ready</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse-slow"></div>
              <span>Gemini CLI Ready</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-electric-blue rounded-full animate-pulse-slow"></div>
              <span>MCP Connected</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleVoice}
            className={`p-2 rounded-lg transition-all duration-200 ${
              voiceEnabled
                ? 'bg-neon-green text-true-black'
                : 'bg-gray-800 text-terminal-secondary hover:bg-gray-700 hover:text-terminal-text'
            }`}
            title={voiceEnabled ? 'Disable Voice Commands' : 'Enable Voice Commands'}
          >
            {voiceEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          <button className="p-2 rounded-lg bg-gray-800 text-terminal-secondary hover:bg-gray-700 hover:text-terminal-text transition-colors">
            <Settings className="w-5 h-5" />
          </button>

          {user && (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={user.user_metadata?.full_name || 'User'}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-electric-blue rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-true-black" />
                  </div>
                )}
                <span className="text-sm text-terminal-text hidden md:inline">
                  {user.user_metadata?.full_name || user.email}
                </span>
              </div>
              <button
                onClick={signOut}
                className="text-sm text-terminal-secondary hover:text-terminal-text transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;