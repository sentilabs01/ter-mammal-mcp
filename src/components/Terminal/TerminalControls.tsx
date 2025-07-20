import React, { useState } from 'react';
import { Plus, Settings, Save, FolderOpen, History } from 'lucide-react';

interface Terminal {
  id: number;
  title: string;
  active: boolean;
}

interface TerminalControlsProps {
  terminals: Terminal[];
  activeTerminal: number;
  onTerminalSelect: (id: number) => void;
  onTerminalRename: (id: number, title: string) => void;
}

function TerminalControls({ terminals, activeTerminal, onTerminalSelect, onTerminalRename }: TerminalControlsProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleRename = (id: number, currentTitle: string) => {
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const handleSaveRename = () => {
    if (editingId && editTitle.trim()) {
      onTerminalRename(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveRename();
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditTitle('');
    }
  };

  return (
    <div className="flex items-center justify-between mb-4 p-4 bg-gray-900 rounded-lg border border-gray-800">
      <div className="flex items-center space-x-4">
        <h2 className="text-lg font-semibold text-terminal-text">Terminal Sessions</h2>
        
        <div className="flex items-center space-x-2">
          {terminals.map(terminal => (
            <div key={terminal.id} className="flex items-center space-x-1">
              <button
                onClick={() => onTerminalSelect(terminal.id)}
                className={`px-3 py-1 rounded text-sm transition-all duration-200 ${
                  terminal.active
                    ? 'bg-electric-blue text-true-black font-medium'
                    : 'bg-gray-800 text-terminal-secondary hover:bg-gray-700 hover:text-terminal-text'
                }`}
              >
                {editingId === terminal.id ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleSaveRename}
                    onKeyDown={handleKeyPress}
                    className="bg-transparent border-none outline-none text-inherit w-20"
                    autoFocus
                  />
                ) : (
                  <span onDoubleClick={() => handleRename(terminal.id, terminal.title)}>
                    {terminal.title}
                  </span>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button 
          className="p-2 rounded-lg bg-gray-800 text-terminal-secondary hover:bg-gray-700 hover:text-terminal-text transition-colors"
          title="Command History"
        >
          <History className="w-4 h-4" />
        </button>
        
        <button className="p-2 rounded-lg bg-gray-800 text-terminal-secondary hover:bg-gray-700 hover:text-terminal-text transition-colors">
          <FolderOpen className="w-4 h-4" />
        </button>
        
        <button className="p-2 rounded-lg bg-gray-800 text-terminal-secondary hover:bg-gray-700 hover:text-terminal-text transition-colors">
          <Save className="w-4 h-4" />
        </button>
        
        <button className="p-2 rounded-lg bg-gray-800 text-terminal-secondary hover:bg-gray-700 hover:text-terminal-text transition-colors">
          <Settings className="w-4 h-4" />
        </button>
        
        <button className="p-2 rounded-lg bg-neon-green text-true-black hover:bg-green-400 transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default TerminalControls;