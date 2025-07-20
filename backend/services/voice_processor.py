import openai
import json
import re
import logging
from typing import Dict, Optional, List
import base64
import io
import os

logger = logging.getLogger(__name__)


class VoiceProcessor:
    """Handles voice command processing using Whisper and NLP"""
    
    def __init__(self):
        self.openai_client = None
        self.available = False
        self._initialize_openai()
    
    def _initialize_openai(self):
        """Initialize OpenAI client for Whisper"""
        api_key = os.getenv('OPENAI_API_KEY')
        if api_key:
            try:
                openai.api_key = api_key
                self.openai_client = openai
                self.available = True
                logger.info("OpenAI client initialized for voice processing")
            except Exception as e:
                logger.error(f"OpenAI initialization failed: {e}")
                self.available = False
        else:
            logger.warning("No OpenAI API key provided, voice processing unavailable")
            self.available = False
    
    def initialize(self):
        """Initialize voice processor"""
        if not self.available:
            logger.warning("Voice processor not available")
    
    def is_available(self) -> bool:
        """Check if voice processing is available"""
        return self.available
    
    def transcribe_audio(self, audio_data: str) -> str:
        """Transcribe audio using Whisper"""
        if not self.available:
            raise Exception("Voice processing not available")
        
        try:
            # Decode base64 audio data
            audio_bytes = base64.b64decode(audio_data)
            audio_file = io.BytesIO(audio_bytes)
            audio_file.name = "audio.wav"
            
            # Use Whisper to transcribe
            response = self.openai_client.Audio.transcribe(
                model="whisper-1",
                file=audio_file,
                language="en"
            )
            
            transcript = response.get('text', '').strip()
            logger.info(f"Transcribed audio: {transcript}")
            
            return transcript
            
        except Exception as e:
            logger.error(f"Audio transcription failed: {e}")
            raise Exception(f"Transcription failed: {str(e)}")
    
    def process_voice_command(self, transcript: str) -> Dict:
        """Process voice command transcript into actionable commands"""
        try:
            # Normalize transcript
            transcript = transcript.lower().strip()
            
            # Parse command intent
            command_result = self._parse_command_intent(transcript)
            
            logger.info(f"Processed voice command: {transcript} -> {command_result}")
            return command_result
            
        except Exception as e:
            logger.error(f"Voice command processing failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'transcript': transcript
            }
    
    def _parse_command_intent(self, transcript: str) -> Dict:
        """Parse command intent from transcript"""
        # Define command patterns
        patterns = {
            'claude_command': [
                r'ask claude (to )?(.+)',
                r'tell claude (to )?(.+)',
                r'claude (.+)',
                r'have claude (.+)'
            ],
            'gemini_command': [
                r'ask gemini (to )?(.+)',
                r'tell gemini (to )?(.+)',
                r'gemini (.+)',
                r'have gemini (.+)'
            ],
            'terminal_navigation': [
                r'switch to terminal (\d+)',
                r'go to terminal (\d+)',
                r'open terminal (\d+)',
                r'focus terminal (\d+)'
            ],
            'system_commands': [
                r'clear (all )?terminals?',
                r'restart terminals?',
                r'show (agent )?status',
                r'toggle voice',
                r'stop (all )?processes?'
            ]
        }
        
        # Try to match patterns
        for command_type, pattern_list in patterns.items():
            for pattern in pattern_list:
                match = re.search(pattern, transcript)
                if match:
                    return self._create_command_result(command_type, match, transcript)
        
        # If no specific pattern matches, try to infer intent
        return self._infer_command_intent(transcript)
    
    def _create_command_result(self, command_type: str, match, transcript: str) -> Dict:
        """Create command result based on matched pattern"""
        if command_type == 'claude_command':
            prompt = match.group(2) if match.group(2) else match.group(1)
            return {
                'success': True,
                'type': 'terminal_command',
                'agent': 'claude',
                'command': f'claude {prompt}',
                'terminal_id': 'active',  # Use active terminal
                'original_transcript': transcript
            }
        
        elif command_type == 'gemini_command':
            prompt = match.group(2) if match.group(2) else match.group(1)
            return {
                'success': True,
                'type': 'terminal_command',
                'agent': 'gemini',
                'command': f'gemini {prompt}',
                'terminal_id': 'active',
                'original_transcript': transcript
            }
        
        elif command_type == 'terminal_navigation':
            terminal_num = match.group(1)
            return {
                'success': True,
                'type': 'navigation',
                'action': {
                    'type': 'switch_terminal',
                    'terminal_number': int(terminal_num)
                },
                'original_transcript': transcript
            }
        
        elif command_type == 'system_commands':
            return {
                'success': True,
                'type': 'system',
                'action': {
                    'type': self._parse_system_action(transcript)
                },
                'original_transcript': transcript
            }
        
        return {
            'success': False,
            'error': 'Unknown command type',
            'original_transcript': transcript
        }
    
    def _parse_system_action(self, transcript: str) -> str:
        """Parse system action from transcript"""
        if 'clear' in transcript:
            return 'clear_terminals'
        elif 'restart' in transcript:
            return 'restart_terminals'
        elif 'status' in transcript:
            return 'show_status'
        elif 'voice' in transcript:
            return 'toggle_voice'
        elif 'stop' in transcript:
            return 'stop_processes'
        else:
            return 'unknown'
    
    def _infer_command_intent(self, transcript: str) -> Dict:
        """Infer command intent when no specific pattern matches"""
        # Keywords that suggest AI agent interaction
        ai_keywords = ['help', 'write', 'create', 'generate', 'explain', 'analyze', 'debug']
        claude_keywords = ['code', 'refactor', 'edit', 'file']
        gemini_keywords = ['search', 'find', 'information', 'research']
        
        # Check for AI keywords
        has_ai_keywords = any(keyword in transcript for keyword in ai_keywords)
        has_claude_keywords = any(keyword in transcript for keyword in claude_keywords)
        has_gemini_keywords = any(keyword in transcript for keyword in gemini_keywords)
        
        if has_ai_keywords:
            # Determine which agent is more appropriate
            if has_claude_keywords:
                return {
                    'success': True,
                    'type': 'terminal_command',
                    'agent': 'claude',
                    'command': f'claude {transcript}',
                    'terminal_id': 'active',
                    'original_transcript': transcript,
                    'inferred': True
                }
            elif has_gemini_keywords:
                return {
                    'success': True,
                    'type': 'terminal_command',
                    'agent': 'gemini',
                    'command': f'gemini {transcript}',
                    'terminal_id': 'active',
                    'original_transcript': transcript,
                    'inferred': True
                }
            else:
                # Default to Claude for code-related tasks
                return {
                    'success': True,
                    'type': 'terminal_command',
                    'agent': 'claude',
                    'command': f'claude {transcript}',
                    'terminal_id': 'active',
                    'original_transcript': transcript,
                    'inferred': True
                }
        
        # Fallback: treat as system command
        return {
            'success': True,
            'type': 'terminal_command',
            'agent': 'system',
            'command': transcript,
            'terminal_id': 'active',
            'original_transcript': transcript,
            'inferred': True
        }