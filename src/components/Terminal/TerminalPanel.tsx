import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { Play, Square, RotateCcw, Settings, GripVertical } from 'lucide-react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useDrag, useDrop } from 'react-dnd';

interface TerminalPanelProps {
  terminalId: number;
  title: string;
  isActive: boolean;
  onActivate: () => void;
  index?: number;
  onReorder?: (dragIndex: number, hoverIndex: number) => void;
}

function TerminalPanel({ terminalId, title, isActive, onActivate, index, onReorder }: TerminalPanelProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const { sendMessage, isConnected } = useWebSocket();

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm.js
    const terminal = new Terminal({
      theme: {
        background: '#000000',
        foreground: '#FFFFFF',
        cursor: '#FFFFFF',
        cursorAccent: '#000000',
        black: '#000000',
        red: '#FF4444',
        green: '#4CAF50',
        yellow: '#FFC107',
        blue: '#00BFFF',
        magenta: '#E91E63',
        cyan: '#39FF14',
        white: '#FFFFFF',
        brightBlack: '#666666',
        brightRed: '#FF6B6B',
        brightGreen: '#66BB6A',
        brightYellow: '#FFD54F',
        brightBlue: '#42A5F5',
        brightMagenta: '#F06292',
        brightCyan: '#4DD0E1',
        brightWhite: '#FFFFFF',
      },
      fontSize: 14,
      fontFamily: 'Monaco, Menlo, Ubuntu Mono, Consolas, monospace',
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 10000,
      tabStopWidth: 4,
      allowTransparency: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);

    terminal.open(terminalRef.current);

    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Defer fitAddon.fit() to next event loop to ensure xterm.js is fully initialized
    setTimeout(() => {
      try {
        fitAddon.fit();
      } catch (error) {
        console.warn('Failed to fit terminal dimensions:', error);
      }
    }, 100);

    // Initial welcome message
    terminal.writeln('\x1b[32m╔═══════════════════════════════════════════════════════════════╗\x1b[0m');
    terminal.writeln('\x1b[32m║                  AI Agent Communication Platform              ║\x1b[0m');
    terminal.writeln('\x1b[32m╚═══════════════════════════════════════════════════════════════╝\x1b[0m');
    terminal.writeln('');
    terminal.writeln('\x1b[36mWelcome to Terminal ' + terminalId + '\x1b[0m');
    terminal.writeln('\x1b[90mType commands to interact with AI agents or run system commands.\x1b[0m');
    terminal.writeln('');
    terminal.writeln('\x1b[33mAvailable AI agents:\x1b[0m');
    terminal.writeln('  \x1b[96mclaude\x1b[0m     - Start Claude Code session');
    terminal.writeln('  \x1b[96mgemini\x1b[0m     - Start Gemini CLI session');
    terminal.writeln('  \x1b[96mhelp\x1b[0m       - Show available commands');
    terminal.writeln('');
    terminal.write('\x1b[32m$ \x1b[0m');

    let currentLine = '';

    // Handle user input
    terminal.onData((data) => {
      const char = data;
      
      if (char === '\r') {
        // Enter key pressed
        terminal.write('\r\n');
        if (currentLine.trim()) {
          handleCommand(currentLine.trim());
          setCurrentCommand(currentLine.trim());
          // Add to command history
          setCommandHistory(prev => [...prev, currentLine.trim()]);
          setHistoryIndex(-1);
        }
        currentLine = '';
        terminal.write('\x1b[32m$ \x1b[0m');
      } else if (char === '\x7f') {
        // Backspace
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          terminal.write('\b \b');
        }
      } else if (char >= ' ' || char === '\t') {
        // Regular character
        currentLine += char;
        terminal.write(char);
      }
    });

    // Handle keyboard events for copy/paste and history
    terminal.onKey(({ key, domEvent }) => {
      const event = domEvent as KeyboardEvent;
      
      // Handle Ctrl+C (copy)
      if (event.ctrlKey && key === 'c') {
        const selection = terminal.getSelection();
        if (selection) {
          navigator.clipboard.writeText(selection);
          // Visual feedback
          terminal.write('\r\n\x1b[32m✓ Copied to clipboard\x1b[0m\r\n\x1b[32m$ \x1b[0m');
        }
        return;
      }
      
      // Handle Ctrl+V (paste)
      if (event.ctrlKey && key === 'v') {
        navigator.clipboard.readText().then(text => {
          terminal.write(text);
          currentLine += text;
          // Visual feedback
          terminal.write('\r\n\x1b[32m✓ Pasted from clipboard\x1b[0m\r\n\x1b[32m$ \x1b[0m' + currentLine);
        });
        return;
      }
      
      // Handle up arrow (command history)
      if (key === '\x1b[A') { // Up arrow
        event.preventDefault();
        if (commandHistory.length > 0) {
          let newIndex = historyIndex;
          if (newIndex === -1) {
            newIndex = commandHistory.length - 1;
          } else if (newIndex > 0) {
            newIndex--;
          }
          
          if (newIndex >= 0) {
            // Clear current line
            terminal.write('\r\x1b[K');
            currentLine = commandHistory[newIndex];
            terminal.write('\x1b[32m$ \x1b[0m' + currentLine);
            setHistoryIndex(newIndex);
          }
        }
        return;
      }
      
      // Handle down arrow (command history)
      if (key === '\x1b[B') { // Down arrow
        event.preventDefault();
        if (historyIndex >= 0) {
          let newIndex = historyIndex;
          if (newIndex < commandHistory.length - 1) {
            newIndex++;
          } else {
            newIndex = -1; // Back to empty line
          }
          
          // Clear current line
          terminal.write('\r\x1b[K');
          if (newIndex >= 0) {
            currentLine = commandHistory[newIndex];
            terminal.write('\x1b[32m$ \x1b[0m' + currentLine);
          } else {
            currentLine = '';
            terminal.write('\x1b[32m$ \x1b[0m');
          }
          setHistoryIndex(newIndex);
        }
        return;
      }
    });

    const handleCommand = (command: string) => {
      if (command === 'clear') {
        terminal.clear();
        terminal.write('\x1b[32m$ \x1b[0m');
        return;
      }

      if (command === 'help') {
        terminal.writeln('\x1b[33mAvailable commands:\x1b[0m');
        terminal.writeln('  \x1b[96mclaude\x1b[0m             - Start Claude Code interactive session');
        terminal.writeln('  \x1b[96mgemini\x1b[0m             - Start Gemini CLI interactive session');
        terminal.writeln('  \x1b[96mclaude <prompt>\x1b[0m    - Send prompt to Claude Code');
        terminal.writeln('  \x1b[96mgemini <prompt>\x1b[0m    - Send prompt to Gemini CLI');
        terminal.writeln('  \x1b[96mclear\x1b[0m              - Clear terminal');
        terminal.writeln('  \x1b[96mhelp\x1b[0m               - Show this help message');
        terminal.writeln('  \x1b[96mstatus\x1b[0m             - Show AI agent status');
        terminal.writeln('  \x1b[96mhistory\x1b[0m            - Show command history');
        terminal.writeln('');
        terminal.writeln('\x1b[33mKeyboard shortcuts:\x1b[0m');
        terminal.writeln('  \x1b[96m↑/↓\x1b[0m                - Navigate command history');
        terminal.writeln('  \x1b[96mCtrl+C\x1b[0m             - Copy selected text');
        terminal.writeln('  \x1b[96mCtrl+V\x1b[0m             - Paste from clipboard');
        terminal.writeln('  \x1b[96mRight-click\x1b[0m        - Copy selected text');
        terminal.writeln('');
        return;
      }

      if (command === 'status') {
        terminal.writeln('\x1b[33mAI Agent Status:\x1b[0m');
        terminal.writeln('  \x1b[32m●\x1b[0m Claude Code   - Ready (MCP Connected)');
        terminal.writeln('  \x1b[32m●\x1b[0m Gemini CLI    - Ready (MCP Connected)');
        terminal.writeln('  \x1b[36m●\x1b[0m WebSocket     - ' + (isConnected ? 'Connected' : 'Disconnected'));
        terminal.writeln('');
        return;
      }

      if (command === 'history') {
        terminal.writeln('\x1b[33mCommand History:\x1b[0m');
        if (commandHistory.length === 0) {
          terminal.writeln('  \x1b[90mNo commands in history\x1b[0m');
        } else {
          commandHistory.forEach((cmd, index) => {
            terminal.writeln(`  \x1b[96m${index + 1}.\x1b[0m ${cmd}`);
          });
        }
        terminal.writeln('');
        return;
      }

      if (command.startsWith('claude')) {
        const prompt = command.slice(6).trim();
        setIsRunning(true);
        terminal.writeln('\x1b[96m[Claude Code]\x1b[0m Processing request...');
        
        if (prompt) {
          terminal.writeln('\x1b[90m> ' + prompt + '\x1b[0m');
          
          // Simulate AI response
          setTimeout(() => {
            terminal.writeln('\x1b[36mClaude:\x1b[0m I understand you want to ' + prompt + '. Here\'s what I would do:');
            terminal.writeln('');
            terminal.writeln('1. Analyze the current codebase structure');
            terminal.writeln('2. Identify the relevant files and dependencies');
            terminal.writeln('3. Implement the requested changes safely');
            terminal.writeln('4. Run tests to ensure nothing breaks');
            terminal.writeln('');
            terminal.writeln('\x1b[33mWould you like me to proceed? (y/n)\x1b[0m');
            setIsRunning(false);
          }, 2000);
        } else {
          setTimeout(() => {
            terminal.writeln('\x1b[36mClaude Code Interactive Session Started\x1b[0m');
            terminal.writeln('\x1b[90mType your requests and I\'ll help you with code analysis and editing.\x1b[0m');
            setIsRunning(false);
          }, 1000);
        }
        return;
      }

      if (command.startsWith('gemini')) {
        const prompt = command.slice(6).trim();
        setIsRunning(true);
        terminal.writeln('\x1b[96m[Gemini CLI]\x1b[0m Processing request...');
        
        if (prompt) {
          terminal.writeln('\x1b[90m> ' + prompt + '\x1b[0m');
          
          // Simulate AI response
          setTimeout(() => {
            terminal.writeln('\x1b[35mGemini:\x1b[0m I can help you with ' + prompt + '. Let me break this down:');
            terminal.writeln('');
            terminal.writeln('• First, I\'ll search for relevant information');
            terminal.writeln('• Then, I\'ll analyze the context and requirements');
            terminal.writeln('• Finally, I\'ll provide a comprehensive solution');
            terminal.writeln('');
            terminal.writeln('\x1b[33mSearching Google for additional context...\x1b[0m');
            setIsRunning(false);
          }, 1500);
        } else {
          setTimeout(() => {
            terminal.writeln('\x1b[35mGemini CLI Interactive Session Started\x1b[0m');
            terminal.writeln('\x1b[90mI can help with code generation, analysis, and complex queries.\x1b[0m');
            setIsRunning(false);
          }, 1000);
        }
        return;
      }

      // Default: treat as system command
      setIsRunning(true);
      terminal.writeln('\x1b[90m[System]\x1b[0m Executing: ' + command);
      
      // Simulate command execution
      setTimeout(() => {
        if (command === 'ls') {
          terminal.writeln('src/          package.json  README.md');
          terminal.writeln('public/       tsconfig.json Dockerfile');
          terminal.writeln('node_modules/ vite.config.ts docker-compose.yml');
        } else if (command === 'pwd') {
          terminal.writeln('/home/project/ai-agent-platform');
        } else if (command.startsWith('echo')) {
          terminal.writeln(command.slice(5));
        } else {
          terminal.writeln('\x1b[31mCommand not found: ' + command + '\x1b[0m');
          terminal.writeln('\x1b[90mTry "help" for available commands\x1b[0m');
        }
        setIsRunning(false);
      }, 800);
    };

    // Handle resize
    const handleResize = () => {
      fitAddon.fit();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      terminal.dispose();
    };
  }, [terminalId, isConnected]);

  const handleStop = () => {
    if (xtermRef.current) {
      xtermRef.current.write('\r\n\x1b[31m^C\x1b[0m\r\n\x1b[32m$ \x1b[0m');
      setIsRunning(false);
    }
  };

  const handleRestart = () => {
    if (xtermRef.current) {
      xtermRef.current.clear();
      xtermRef.current.writeln('\x1b[32mTerminal ' + terminalId + ' restarted\x1b[0m');
      xtermRef.current.write('\x1b[32m$ \x1b[0m');
      setIsRunning(false);
    }
  };

  // Drag and drop functionality
  const [{ isDragging }, drag] = useDrag({
    type: 'TERMINAL',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: 'TERMINAL',
    hover: (item: { index: number }) => {
      if (item.index === index) {
        return;
      }
      if (onReorder) {
        onReorder(item.index, index!);
        item.index = index!;
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div 
      ref={drop}
      className={`bg-terminal-bg rounded-lg border-2 transition-all duration-200 flex flex-col ${
        isActive 
          ? 'border-electric-blue shadow-lg shadow-electric-blue/20' 
          : 'border-gray-800 hover:border-gray-600'
      } ${isDragging ? 'opacity-50' : ''} ${isOver ? 'border-neon-green' : ''}`}
      onClick={onActivate}
    >
      {/* Terminal Header */}
      <div 
        ref={drag}
        className="flex items-center justify-between p-3 border-b border-gray-800 cursor-move"
      >
        <div className="flex items-center space-x-2">
          <GripVertical className="w-4 h-4 text-terminal-secondary" />
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-error-red rounded-full"></div>
            <div className="w-3 h-3 bg-warning-amber rounded-full"></div>
            <div className="w-3 h-3 bg-success-green rounded-full"></div>
          </div>
          <span className="text-sm font-medium text-terminal-text">{title}</span>
          {isRunning && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
              <span className="text-xs text-terminal-secondary">Running</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          {isRunning ? (
            <button
              onClick={handleStop}
              className="p-1 text-terminal-secondary hover:text-error-red transition-colors"
              title="Stop process"
            >
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => {}}
              className="p-1 text-terminal-secondary hover:text-neon-green transition-colors"
              title="Run command"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={handleRestart}
            className="p-1 text-terminal-secondary hover:text-electric-blue transition-colors"
            title="Restart terminal"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => {}}
            className="p-1 text-terminal-secondary hover:text-terminal-text transition-colors"
            title="Terminal settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 p-2 min-h-0">
        <div 
          ref={terminalRef} 
          className="h-full w-full"
          onContextMenu={(e) => {
            e.preventDefault();
            const selection = xtermRef.current?.getSelection();
            if (selection) {
              navigator.clipboard.writeText(selection);
            }
          }}
        />
      </div>

      {/* Status Bar */}
      <div className="px-3 py-1 border-t border-gray-800 text-xs text-terminal-secondary">
        <div className="flex items-center justify-between">
          <span>Terminal {terminalId}</span>
          <div className="flex items-center space-x-4">
            <span className="text-electric-blue">↑↓ History • Ctrl+C/V Copy/Paste</span>
            <span>{currentCommand && `Last: ${currentCommand}`}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TerminalPanel;