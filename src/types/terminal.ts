export interface Terminal {
  id: number;
  title: string;
  active: boolean;
  type: 'claude' | 'gemini' | 'system';
  status: 'idle' | 'running' | 'error';
}

export interface TerminalSession {
  id: string;
  terminalId: number;
  commands: TerminalCommand[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TerminalCommand {
  id: string;
  command: string;
  output: string;
  timestamp: Date;
  type: 'command' | 'response' | 'error';
  agentType?: 'claude' | 'gemini';
}

export interface VoiceCommand {
  id: string;
  transcript: string;
  processedCommand: string;
  confidence: number;
  timestamp: Date;
  executed: boolean;
}