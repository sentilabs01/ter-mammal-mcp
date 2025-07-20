# AI Agent Communication Platform

A sophisticated web application enabling real-time communication between AI agents (Claude Code and Gemini CLI) through the Model Context Protocol (MCP), featuring three independent terminal panels, voice commands, and a beautiful true black dark mode interface.

## 🚀 Features

### Core Functionality
- **Three Independent Terminal Panels**: Each terminal can run any command-line tool
- **AI Agent Integration**: Seamless interaction with Claude Code and Gemini CLI
- **Voice Commands**: Hands-free operation using Whisper speech recognition
- **Real-time Communication**: WebSocket-based live terminal interaction
- **Session Persistence**: Save and restore terminal sessions across devices

### Design & User Experience
- **True Black Dark Mode**: Professional (#000000) background with electric blue (#00BFFF) and neon green (#39FF14) accents
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Terminal Emulation**: Full xterm.js integration with VT100 compatibility
- **Smooth Animations**: Subtle micro-interactions and transitions

### AI Agent Features
- **Dynamic Command Routing**: Type `claude` or `gemini` to interact with AI agents
- **MCP Protocol Integration**: Standardized communication between agents
- **Cross-Agent Communication**: Agents can communicate with each other
- **Context Awareness**: Maintain conversation context across sessions

### Authentication & Storage
- **Google OAuth Integration**: Secure authentication with Google accounts
- **Supabase Backend**: Real-time database and user management
- **Command History**: Searchable history of all terminal interactions
- **User Preferences**: Customizable themes and settings

## 🛠 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **xterm.js** for terminal emulation
- **Socket.IO** for real-time communication
- **Supabase Client** for authentication and data

### Backend
- **Flask** with Flask-SocketIO
- **Python 3.11** with asyncio support
- **Docker** for containerization
- **Redis** for session management
- **OpenAI Whisper** for voice recognition

### AI Integration
- **Model Context Protocol (MCP)** for agent communication
- **Claude Code** container with MCP server
- **Gemini CLI** container with MCP server
- **JSON-RPC 2.0** for standardized messaging

## 📋 Prerequisites

- **Node.js 18+** (for frontend and AI agent containers)
- **Python 3.11+** (for backend)
- **Docker & Docker Compose** (for containerization)
- **Supabase Account** (for authentication and database)
- **API Keys**:
  - OpenAI API key (for Whisper voice recognition)
  - Anthropic API key (for Claude Code)
  - Google API key (for Gemini CLI)

## 🚀 Quick Start

### 1. Clone and Setup
```bash
git clone <repository-url>
cd ai-agent-communication-platform

# Copy environment variables
cp .env.example .env
# Edit .env with your API keys and Supabase credentials
```

### 2. Environment Configuration
Update `.env` with your credentials:
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# API Keys
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GOOGLE_API_KEY=your-google-api-key
```

### 3. Development Setup

#### Option A: Docker Compose (Recommended)
```bash
# Start all services
docker-compose up --build

# Access the application
open http://localhost:3000
```

#### Option B: Manual Setup
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Start services in separate terminals
npm run dev          # Frontend (port 3000)
python app.py        # Backend (port 5000)
```

### 4. Supabase Setup
1. Create a new Supabase project
2. Run the provided SQL migrations in the Supabase SQL editor
3. Enable Google OAuth in Authentication > Providers
4. Update your `.env` with the Supabase URL and anon key

## 🎯 Usage

### Basic Commands
- **System Commands**: Any standard shell command (`ls`, `pwd`, `cd`, etc.)
- **Claude Code**: `claude <prompt>` - Interact with Claude for code tasks
- **Gemini CLI**: `gemini <prompt>` - Use Gemini for research and generation
- **Help**: `help` - Show available commands
- **Status**: `status` - Check AI agent connectivity

### Voice Commands
Enable voice commands using the microphone button, then speak naturally:
- "Ask Claude to refactor this function"
- "Tell Gemini to explain machine learning"
- "Switch to terminal two"
- "Clear all terminals"

### Terminal Features
- **Multiple Sessions**: Each terminal operates independently
- **Session Persistence**: Sessions survive browser refreshes
- **Command History**: Searchable with up/down arrows
- **Real-time Output**: Live streaming of command results

## 🏗 Architecture

### Container Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                           │
│  React Frontend + xterm.js + Voice Commands + Dark Mode        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼ WebSocket + REST API
┌─────────────────────────────────────────────────────────────────┐
│                     Backend Services                            │
│  Flask + SocketIO + Google Auth + Supabase + Voice Processing  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼ MCP Protocol
┌─────────────────────────────────────────────────────────────────┐
│                   AI Agent Containers                          │
│  Claude Code Container + Gemini CLI Container + MCP Servers    │
└─────────────────────────────────────────────────────────────────┘
```

### MCP Communication Flow
1. User types command in terminal
2. Frontend sends command via WebSocket to backend
3. Backend routes command to appropriate AI agent container
4. MCP client sends JSON-RPC 2.0 message to agent's MCP server
5. Agent processes request and returns response via MCP
6. Backend streams response back to frontend terminal

## 🔧 Development

### Project Structure
```
ai-agent-communication-platform/
├── src/                        # React frontend
│   ├── components/            # React components
│   ├── contexts/              # React contexts
│   ├── hooks/                 # Custom hooks
│   └── lib/                   # Utilities and services
├── backend/                   # Flask backend
│   ├── services/              # Core services
│   └── utils/                 # Utilities
├── containers/                # Docker containers
│   ├── claude-code/          # Claude Code container
│   └── gemini-cli/           # Gemini CLI container
└── docker-compose.yml        # Container orchestration
```

### Adding New AI Agents
1. Create new container in `containers/new-agent/`
2. Implement MCP server following the existing pattern
3. Add container to `docker-compose.yml`
4. Update backend routing in `app.py`
5. Add frontend command recognition

### Customizing Voice Commands
Edit `backend/services/voice_processor.py` to add new voice command patterns:
```python
patterns = {
    'new_command': [
        r'my custom pattern (.+)',
        r'another pattern (.+)'
    ]
}
```

## 🚢 Deployment

### Production Build
```bash
# Build optimized frontend
npm run build

# Build Docker images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables for Production
- Set strong `SECRET_KEY` for Flask
- Use production Supabase project
- Configure proper CORS origins
- Set up SSL certificates
- Enable rate limiting and monitoring

## 🔒 Security

- **Authentication**: Google OAuth with JWT tokens
- **Authorization**: Role-based access control
- **Container Isolation**: Sandboxed AI agent execution
- **Input Validation**: Comprehensive command sanitization
- **API Rate Limiting**: Protection against abuse
- **Audit Logging**: Complete activity tracking

## 📊 Monitoring

- **Health Checks**: Container and service health monitoring
- **Performance Metrics**: Response times and resource usage
- **Error Tracking**: Comprehensive error logging
- **User Analytics**: Usage patterns and feature adoption

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Report bugs and request features via GitHub Issues
- **Community**: Join our Discord server for discussions
- **Email**: Contact support@ai-agent-platform.com

## 🙏 Acknowledgments

- **Anthropic** for Claude Code and MCP specification
- **Google** for Gemini CLI
- **OpenAI** for Whisper speech recognition
- **Supabase** for authentication and database services
- **xterm.js** for excellent terminal emulation

---

Built with ❤️ for the AI development community. Transform your development workflow with AI agents working together seamlessly.