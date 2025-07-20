const express = require('express');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
const PORT = process.env.MCP_PORT || 8001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'claude-code-mcp-server',
    timestamp: new Date().toISOString()
  });
});

// MCP JSON-RPC 2.0 message handler
function createMCPResponse(id, result, error = null) {
  return {
    jsonrpc: '2.0',
    id: id,
    result: result,
    error: error
  };
}

// Simulate Claude Code interaction
function processClaudeRequest(prompt) {
  // This would integrate with actual Claude Code CLI
  // For now, we simulate the response
  
  if (!prompt) {
    return "Claude Code is ready. I can help with code analysis, editing, and development tasks.";
  }
  
  // Simulate different response types
  if (prompt.includes('refactor')) {
    return `I'll help you refactor the code. Here's my analysis:

1. Analyzing current code structure...
2. Identifying optimization opportunities...
3. Proposing refactoring plan...

Ready to proceed with the refactoring?`;
  }
  
  if (prompt.includes('test')) {
    return `I'll help you write comprehensive tests:

1. Analyzing code coverage requirements...
2. Setting up test framework...
3. Writing unit and integration tests...

Shall I implement the test suite?`;
  }
  
  return `Claude Code: I'll help you with "${prompt}". Let me analyze the request and provide a comprehensive solution.`;
}

// MCP WebSocket server
const wss = new WebSocket.Server({ 
  port: PORT + 1000,  // WebSocket on port 9001
  path: '/mcp'
});

wss.on('connection', (ws) => {
  console.log('MCP client connected');
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      console.log('Received MCP message:', message);
      
      if (message.method === 'claude/complete') {
        const prompt = message.params?.prompt || '';
        const response = processClaudeRequest(prompt);
        
        const mcpResponse = createMCPResponse(message.id, {
          completion: response,
          tokens_used: response.length,
          model: 'claude-code'
        });
        
        ws.send(JSON.stringify(mcpResponse));
      } else {
        const errorResponse = createMCPResponse(message.id, null, {
          code: -32601,
          message: 'Method not found'
        });
        ws.send(JSON.stringify(errorResponse));
      }
    } catch (error) {
      console.error('MCP message processing error:', error);
      const errorResponse = createMCPResponse(null, null, {
        code: -32700,
        message: 'Parse error'
      });
      ws.send(JSON.stringify(errorResponse));
    }
  });
  
  ws.on('close', () => {
    console.log('MCP client disconnected');
  });
});

// HTTP MCP endpoint (alternative to WebSocket)
app.post('/mcp', (req, res) => {
  const message = req.body;
  
  if (message.method === 'claude/complete') {
    const prompt = message.params?.prompt || '';
    const response = processClaudeRequest(prompt);
    
    const mcpResponse = createMCPResponse(message.id, {
      completion: response,
      tokens_used: response.length,
      model: 'claude-code'
    });
    
    res.json(mcpResponse);
  } else {
    const errorResponse = createMCPResponse(message.id, null, {
      code: -32601,
      message: 'Method not found'
    });
    res.status(400).json(errorResponse);
  }
});

app.listen(PORT, () => {
  console.log(`Claude Code MCP Server running on port ${PORT}`);
  console.log(`WebSocket MCP Server running on port ${PORT + 1000}`);
});