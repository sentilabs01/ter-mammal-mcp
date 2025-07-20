import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

function VoiceCommandPanel() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Check if speech recognition is available
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
          setConfidence(result[0].confidence * 100);
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);

      if (finalTranscript) {
        handleVoiceCommand(finalTranscript.trim());
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    const startListening = () => {
      try {
        recognition.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    };

    const stopListening = () => {
      recognition.stop();
    };

    // Auto-start listening when component mounts
    startListening();

    return () => {
      recognition.stop();
    };
  }, []);

  const handleVoiceCommand = async (command: string) => {
    setIsProcessing(true);
    setLastCommand(command);

    // Process voice command (mock implementation)
    try {
      console.log('Processing voice command:', command);
      
      // Simulate command processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Here you would implement actual command processing
      // - Parse the command
      // - Route to appropriate AI agent
      // - Execute the command
      
    } catch (error) {
      console.error('Error processing voice command:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const exampleCommands = [
    "Ask Claude to refactor this function",
    "Tell Gemini to explain this algorithm",
    "Switch to terminal two",
    "Clear all terminals",
    "Show agent status",
  ];

  return (
    <div className="bg-gray-900 border-t border-gray-800 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-terminal-text flex items-center space-x-2">
            <Volume2 className="w-5 h-5 text-neon-green" />
            <span>Voice Commands</span>
          </h3>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-neon-green animate-pulse' : 'bg-gray-600'}`}></div>
              <span className="text-sm text-terminal-secondary">
                {isListening ? 'Listening...' : 'Standby'}
              </span>
            </div>
            
            {confidence > 0 && (
              <div className="text-sm text-terminal-secondary">
                Confidence: {confidence.toFixed(0)}%
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Current Recognition */}
          <div className="bg-true-black rounded-lg p-4 border border-gray-800">
            <h4 className="text-sm font-medium text-terminal-text mb-2">Current Recognition</h4>
            <div className="bg-gray-800 rounded p-3 min-h-[60px] flex items-center">
              {isProcessing ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-electric-blue border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-terminal-secondary">Processing command...</span>
                </div>
              ) : transcript ? (
                <span className="text-terminal-text">{transcript}</span>
              ) : (
                <span className="text-terminal-secondary italic">
                  {isListening ? 'Speak a command...' : 'Voice recognition inactive'}
                </span>
              )}
            </div>
            
            {lastCommand && (
              <div className="mt-2 text-sm">
                <span className="text-terminal-secondary">Last command: </span>
                <span className="text-neon-green">{lastCommand}</span>
              </div>
            )}
          </div>

          {/* Example Commands */}
          <div className="bg-true-black rounded-lg p-4 border border-gray-800">
            <h4 className="text-sm font-medium text-terminal-text mb-2">Example Commands</h4>
            <div className="space-y-2">
              {exampleCommands.map((command, index) => (
                <div
                  key={index}
                  className="text-sm text-terminal-secondary hover:text-terminal-text cursor-pointer transition-colors p-2 rounded hover:bg-gray-800"
                  onClick={() => handleVoiceCommand(command)}
                >
                  "{command}"
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Voice Command Tips */}
        <div className="mt-4 p-3 bg-electric-blue/10 border border-electric-blue/20 rounded-lg">
          <div className="text-sm text-terminal-text">
            <strong>Voice Command Tips:</strong> Speak clearly and use natural language. 
            Try commands like "Ask Claude to...\" or "Tell Gemini to...\" for AI interactions, 
            or "Switch to terminal X\" for navigation.
          </div>
        </div>
      </div>
    </div>
  );
}

export default VoiceCommandPanel;