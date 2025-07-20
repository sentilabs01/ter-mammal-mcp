import React, { useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import TerminalPanel from './TerminalPanel';
import TerminalControls from './TerminalControls';

interface Terminal {
  id: number;
  title: string;
  active: boolean;
  order: number;
}

function TerminalGrid() {
  const [terminals, setTerminals] = useState<Terminal[]>([
    { id: 1, title: 'Terminal 1', active: true, order: 0 },
    { id: 2, title: 'Terminal 2', active: false, order: 1 },
    { id: 3, title: 'Terminal 3', active: false, order: 2 },
  ]);

  const [panelSizes, setPanelSizes] = useState<number[]>([33.33, 33.33, 33.34]);

  const [activeTerminal, setActiveTerminal] = useState(1);

  const handleTerminalActivate = (terminalId: number) => {
    setActiveTerminal(terminalId);
    setTerminals(prev => 
      prev.map(t => ({ ...t, active: t.id === terminalId }))
    );
  };

  const handleTerminalRename = (terminalId: number, newTitle: string) => {
    setTerminals(prev =>
      prev.map(t => t.id === terminalId ? { ...t, title: newTitle } : t)
    );
  };

  const handleTerminalReorder = (dragIndex: number, hoverIndex: number) => {
    const draggedTerminal = terminals[dragIndex];
    const newTerminals = [...terminals];
    
    // Remove the dragged terminal
    newTerminals.splice(dragIndex, 1);
    // Insert it at the new position
    newTerminals.splice(hoverIndex, 0, draggedTerminal);
    
    // Update order property
    const updatedTerminals = newTerminals.map((terminal, index) => ({
      ...terminal,
      order: index
    }));
    
    setTerminals(updatedTerminals);
  };

  const handlePanelResize = (sizes: number[]) => {
    setPanelSizes(sizes);
  };

  // Sort terminals by order
  const sortedTerminals = [...terminals].sort((a, b) => a.order - b.order);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-full flex flex-col">
        <TerminalControls 
          terminals={sortedTerminals}
          activeTerminal={activeTerminal}
          onTerminalSelect={handleTerminalActivate}
          onTerminalRename={handleTerminalRename}
        />
        
        <div className="flex-1 min-h-0">
          <PanelGroup 
            direction="horizontal" 
            className="h-full"
            onLayout={handlePanelResize}
          >
            {sortedTerminals.map((terminal, index) => (
              <React.Fragment key={terminal.id}>
                <Panel 
                  defaultSize={panelSizes[index] || 100 / sortedTerminals.length}
                  minSize={20}
                  className="relative"
                >
                  <TerminalPanel
                    terminalId={terminal.id}
                    title={terminal.title}
                    isActive={terminal.active}
                    onActivate={() => handleTerminalActivate(terminal.id)}
                    index={index}
                    onReorder={handleTerminalReorder}
                  />
                </Panel>
                {index < sortedTerminals.length - 1 && (
                  <PanelResizeHandle className="w-2 bg-gray-800 hover:bg-electric-blue transition-colors cursor-col-resize group">
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-1 h-8 bg-gray-600 group-hover:bg-electric-blue rounded transition-colors"></div>
                    </div>
                  </PanelResizeHandle>
                )}
              </React.Fragment>
            ))}
          </PanelGroup>
        </div>
      </div>
    </DndProvider>
  );
}

export default TerminalGrid;