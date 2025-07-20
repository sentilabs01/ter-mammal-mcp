import subprocess
import threading
import uuid
import os
from typing import Dict, Optional, List
import logging

logger = logging.getLogger(__name__)


class TerminalManager:
    """Manages terminal sessions and command execution"""
    
    def __init__(self):
        self.terminals: Dict[str, Dict] = {}
        self.processes: Dict[str, subprocess.Popen] = {}
        self._lock = threading.Lock()
    
    def create_terminal(self, client_id: str, terminal_type: str = 'system', name: str = 'Terminal') -> str:
        """Create a new terminal session"""
        terminal_id = str(uuid.uuid4())
        
        with self._lock:
            self.terminals[terminal_id] = {
                'id': terminal_id,
                'client_id': client_id,
                'type': terminal_type,
                'name': name,
                'working_directory': os.getcwd(),
                'environment': os.environ.copy(),
                'history': [],
                'active': True
            }
        
        logger.info(f"Created terminal {terminal_id} for client {client_id}")
        return terminal_id
    
    def execute_command(self, terminal_id: str, command: str) -> Dict:
        """Execute a command in the specified terminal"""
        if terminal_id not in self.terminals:
            raise ValueError(f"Terminal {terminal_id} not found")
        
        terminal = self.terminals[terminal_id]
        working_dir = terminal['working_directory']
        env = terminal['environment']
        
        try:
            # Handle built-in commands
            if command == 'clear':
                return {'output': '\033[2J\033[H', 'exit_code': 0}
            
            if command == 'pwd':
                return {'output': working_dir + '\n', 'exit_code': 0}
            
            if command.startswith('cd '):
                new_dir = command[3:].strip()
                if new_dir == '..':
                    new_dir = os.path.dirname(working_dir)
                elif not os.path.isabs(new_dir):
                    new_dir = os.path.join(working_dir, new_dir)
                
                if os.path.isdir(new_dir):
                    terminal['working_directory'] = os.path.abspath(new_dir)
                    return {'output': '', 'exit_code': 0}
                else:
                    return {'output': f'cd: {new_dir}: No such file or directory\n', 'exit_code': 1}
            
            # Execute command
            process = subprocess.Popen(
                command,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                stdin=subprocess.PIPE,
                cwd=working_dir,
                env=env,
                text=True,
                bufsize=0
            )
            
            # Get output
            output, _ = process.communicate(timeout=30)
            exit_code = process.returncode
            
            # Store in history
            terminal['history'].append({
                'command': command,
                'output': output,
                'exit_code': exit_code,
                'timestamp': str(uuid.uuid4())  # Simplified timestamp
            })
            
            return {
                'output': output,
                'exit_code': exit_code
            }
            
        except subprocess.TimeoutExpired:
            process.kill()
            return {
                'output': 'Command timed out\n',
                'exit_code': 124
            }
        except Exception as e:
            logger.error(f"Command execution error: {e}")
            return {
                'output': f'Error: {str(e)}\n',
                'exit_code': 1
            }
    
    def cleanup_terminal(self, terminal_id: str):
        """Clean up terminal session"""
        with self._lock:
            if terminal_id in self.terminals:
                terminal = self.terminals[terminal_id]
                terminal['active'] = False
                
                # Kill any running processes
                if terminal_id in self.processes:
                    try:
                        process = self.processes[terminal_id]
                        process.terminate()
                        process.wait(timeout=5)
                    except:
                        try:
                            process.kill()
                        except:
                            pass
                    del self.processes[terminal_id]
                
                del self.terminals[terminal_id]
                logger.info(f"Cleaned up terminal {terminal_id}")
    
    def get_terminal_info(self, terminal_id: str) -> Optional[Dict]:
        """Get terminal information"""
        return self.terminals.get(terminal_id)
    
    def list_terminals(self, client_id: str = None) -> List[Dict]:
        """List terminals, optionally filtered by client"""
        terminals = list(self.terminals.values())
        if client_id:
            terminals = [t for t in terminals if t['client_id'] == client_id]
        return terminals
    
    def is_healthy(self) -> bool:
        """Check if terminal manager is healthy"""
        return True