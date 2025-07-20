#!/usr/bin/env python3
"""
AI Agent Communication Platform Backend
Flask-SocketIO server for real-time terminal communication
"""

import os
import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional

from flask import Flask, request
from flask_socketio import SocketIO, emit, join_room, leave_room, disconnect
from flask_cors import CORS
from dotenv import load_dotenv

from services.terminal_manager import TerminalManager
from services.mcp_client import MCPClient
from services.voice_processor import VoiceProcessor
from services.auth_service import AuthService
from utils.logging_config import setup_logging

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')

# Configure CORS
CORS(app, origins=["http://localhost:3000", "http://localhost:5173"])

# Initialize SocketIO
socketio = SocketIO(
    app,
    cors_allowed_origins=["http://localhost:3000", "http://localhost:5173"],
    async_mode='eventlet',
    logger=True,
    engineio_logger=True
)

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

# Initialize services
terminal_manager = TerminalManager()
mcp_client = MCPClient()
voice_processor = VoiceProcessor()
auth_service = AuthService()

# Global state
connected_clients: Dict[str, Dict] = {}
active_terminals: Dict[str, Dict] = {}


@app.route('/health')
def health_check():
    """Health check endpoint"""
    return {
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'services': {
            'terminal_manager': terminal_manager.is_healthy(),
            'mcp_client': mcp_client.is_connected(),
            'voice_processor': voice_processor.is_available(),
        }
    }


@app.route('/api/terminals')
def get_terminals():
    """Get all active terminals"""
    return {
        'terminals': list(active_terminals.values()),
        'count': len(active_terminals)
    }


@socketio.on('connect')
def handle_connect(auth=None):
    """Handle client connection"""
    client_id = request.sid
    
    # Authenticate user if auth data provided
    user_data = None
    if auth and 'token' in auth:
        try:
            user_data = auth_service.verify_token(auth['token'])
        except Exception as e:
            logger.error(f"Authentication failed: {e}")
            disconnect()
            return False
    
    # Store client information
    connected_clients[client_id] = {
        'id': client_id,
        'user': user_data,
        'connected_at': datetime.utcnow().isoformat(),
        'terminals': []
    }
    
    logger.info(f"Client {client_id} connected")
    
    # Send initial status
    emit('status', {
        'connected': True,
        'client_id': client_id,
        'server_time': datetime.utcnow().isoformat(),
        'available_services': {
            'claude_code': True,
            'gemini_cli': True,
            'mcp_protocol': mcp_client.is_connected(),
            'voice_commands': voice_processor.is_available()
        }
    })


@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    client_id = request.sid
    
    if client_id in connected_clients:
        # Clean up client terminals
        client_terminals = connected_clients[client_id].get('terminals', [])
        for terminal_id in client_terminals:
            terminal_manager.cleanup_terminal(terminal_id)
        
        del connected_clients[client_id]
        logger.info(f"Client {client_id} disconnected")


@socketio.on('create_terminal')
def handle_create_terminal(data):
    """Create a new terminal session"""
    client_id = request.sid
    terminal_type = data.get('type', 'system')
    terminal_name = data.get('name', f'Terminal {len(active_terminals) + 1}')
    
    try:
        # Create terminal session
        terminal_id = terminal_manager.create_terminal(
            client_id=client_id,
            terminal_type=terminal_type,
            name=terminal_name
        )
        
        # Store terminal info
        active_terminals[terminal_id] = {
            'id': terminal_id,
            'name': terminal_name,
            'type': terminal_type,
            'client_id': client_id,
            'created_at': datetime.utcnow().isoformat(),
            'status': 'ready'
        }
        
        # Add to client's terminal list
        if client_id in connected_clients:
            connected_clients[client_id]['terminals'].append(terminal_id)
        
        # Join terminal room for real-time updates
        join_room(f"terminal_{terminal_id}")
        
        emit('terminal_created', {
            'terminal_id': terminal_id,
            'name': terminal_name,
            'type': terminal_type,
            'status': 'ready'
        })
        
        logger.info(f"Created terminal {terminal_id} for client {client_id}")
        
    except Exception as e:
        logger.error(f"Error creating terminal: {e}")
        emit('error', {'message': f'Failed to create terminal: {str(e)}'})


@socketio.on('execute_command')
def handle_execute_command(data):
    """Execute command in terminal"""
    client_id = request.sid
    terminal_id = data.get('terminal_id')
    command = data.get('command', '').strip()
    
    if not terminal_id or not command:
        emit('error', {'message': 'Terminal ID and command are required'})
        return
    
    if terminal_id not in active_terminals:
        emit('error', {'message': 'Terminal not found'})
        return
    
    try:
        # Check if this is an AI agent command
        if command.startswith('claude'):
            handle_claude_command(terminal_id, command, client_id)
        elif command.startswith('gemini'):
            handle_gemini_command(terminal_id, command, client_id)
        else:
            handle_system_command(terminal_id, command, client_id)
            
    except Exception as e:
        logger.error(f"Error executing command: {e}")
        emit('error', {'message': f'Command execution failed: {str(e)}'})


def handle_claude_command(terminal_id: str, command: str, client_id: str):
    """Handle Claude Code commands"""
    try:
        # Extract prompt from command
        prompt = command[6:].strip() if len(command) > 6 else ""
        
        # Send command acknowledgment
        socketio.emit('terminal_output', {
            'terminal_id': terminal_id,
            'type': 'system',
            'content': f'[Claude Code] Processing: {command}\n',
            'timestamp': datetime.utcnow().isoformat()
        }, room=f"terminal_{terminal_id}")
        
        # Process through MCP if available
        if mcp_client.is_connected():
            response = mcp_client.send_claude_request(prompt or "Hello Claude")
        else:
            # Fallback simulation
            response = f"Claude Code Response: I understand you want to {prompt or 'start an interactive session'}.\n\nI'm ready to help with code analysis, editing, and development tasks."
        
        # Send response
        socketio.emit('terminal_output', {
            'terminal_id': terminal_id,
            'type': 'claude_response',
            'content': response + '\n',
            'timestamp': datetime.utcnow().isoformat()
        }, room=f"terminal_{terminal_id}")
        
    except Exception as e:
        logger.error(f"Claude command error: {e}")
        socketio.emit('terminal_output', {
            'terminal_id': terminal_id,
            'type': 'error',
            'content': f'Error: {str(e)}\n',
            'timestamp': datetime.utcnow().isoformat()
        }, room=f"terminal_{terminal_id}")


def handle_gemini_command(terminal_id: str, command: str, client_id: str):
    """Handle Gemini CLI commands"""
    try:
        # Extract prompt from command
        prompt = command[6:].strip() if len(command) > 6 else ""
        
        # Send command acknowledgment
        socketio.emit('terminal_output', {
            'terminal_id': terminal_id,
            'type': 'system',
            'content': f'[Gemini CLI] Processing: {command}\n',
            'timestamp': datetime.utcnow().isoformat()
        }, room=f"terminal_{terminal_id}")
        
        # Process through MCP if available
        if mcp_client.is_connected():
            response = mcp_client.send_gemini_request(prompt or "Hello Gemini")
        else:
            # Fallback simulation
            response = f"Gemini CLI Response: I can help with {prompt or 'various tasks'}.\n\nI have access to Google Search and can assist with code generation, analysis, and complex queries."
        
        # Send response
        socketio.emit('terminal_output', {
            'terminal_id': terminal_id,
            'type': 'gemini_response',
            'content': response + '\n',
            'timestamp': datetime.utcnow().isoformat()
        }, room=f"terminal_{terminal_id}")
        
    except Exception as e:
        logger.error(f"Gemini command error: {e}")
        socketio.emit('terminal_output', {
            'terminal_id': terminal_id,
            'type': 'error',
            'content': f'Error: {str(e)}\n',
            'timestamp': datetime.utcnow().isoformat()
        }, room=f"terminal_{terminal_id}")


def handle_system_command(terminal_id: str, command: str, client_id: str):
    """Handle system shell commands"""
    try:
        # Execute system command through terminal manager
        result = terminal_manager.execute_command(terminal_id, command)
        
        # Send output
        socketio.emit('terminal_output', {
            'terminal_id': terminal_id,
            'type': 'stdout',
            'content': result['output'],
            'timestamp': datetime.utcnow().isoformat(),
            'exit_code': result.get('exit_code', 0)
        }, room=f"terminal_{terminal_id}")
        
    except Exception as e:
        logger.error(f"System command error: {e}")
        socketio.emit('terminal_output', {
            'terminal_id': terminal_id,
            'type': 'error',
            'content': f'Error: {str(e)}\n',
            'timestamp': datetime.utcnow().isoformat()
        }, room=f"terminal_{terminal_id}")


@socketio.on('voice_command')
def handle_voice_command(data):
    """Handle voice command processing"""
    client_id = request.sid
    audio_data = data.get('audio')
    transcript = data.get('transcript')
    
    try:
        if audio_data:
            # Process audio through Whisper
            transcript = voice_processor.transcribe_audio(audio_data)
        
        if not transcript:
            emit('error', {'message': 'No transcript provided or generated'})
            return
        
        # Process voice command
        command_result = voice_processor.process_voice_command(transcript)
        
        # Execute the parsed command
        if command_result['success']:
            # Route to appropriate handler
            if command_result['type'] == 'terminal_command':
                handle_execute_command({
                    'terminal_id': command_result['terminal_id'],
                    'command': command_result['command']
                })
            elif command_result['type'] == 'navigation':
                emit('navigation', command_result['action'])
            elif command_result['type'] == 'system':
                emit('system_action', command_result['action'])
        
        # Send voice command result
        emit('voice_command_result', {
            'transcript': transcript,
            'parsed_command': command_result,
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Voice command error: {e}")
        emit('error', {'message': f'Voice command processing failed: {str(e)}'})


@socketio.on('join_terminal')
def handle_join_terminal(data):
    """Join a terminal room for real-time updates"""
    terminal_id = data.get('terminal_id')
    if terminal_id:
        join_room(f"terminal_{terminal_id}")
        emit('joined_terminal', {'terminal_id': terminal_id})


@socketio.on('leave_terminal')
def handle_leave_terminal(data):
    """Leave a terminal room"""
    terminal_id = data.get('terminal_id')
    if terminal_id:
        leave_room(f"terminal_{terminal_id}")
        emit('left_terminal', {'terminal_id': terminal_id})


if __name__ == '__main__':
    logger.info("Starting AI Agent Communication Platform Backend")
    logger.info(f"Environment: {os.getenv('FLASK_ENV', 'development')}")
    
    # Initialize services
    try:
        mcp_client.initialize()
        voice_processor.initialize()
        logger.info("All services initialized successfully")
    except Exception as e:
        logger.error(f"Service initialization error: {e}")
    
    # Start the server
    socketio.run(
        app,
        host='0.0.0.0',
        port=int(os.getenv('PORT', 5000)),
        debug=os.getenv('FLASK_ENV') == 'development',
        use_reloader=False  # Disable reloader when using eventlet
    )