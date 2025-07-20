import jwt
import os
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional
from supabase import create_client, Client

logger = logging.getLogger(__name__)


class AuthService:
    """Handles authentication and user management"""
    
    def __init__(self):
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_ANON_KEY')
        self.jwt_secret = os.getenv('JWT_SECRET', 'fallback-secret-key')
        
        self.supabase: Optional[Client] = None
        
        if self.supabase_url and self.supabase_key:
            try:
                self.supabase = create_client(self.supabase_url, self.supabase_key)
                logger.info("Supabase client initialized")
            except Exception as e:
                logger.error(f"Supabase initialization failed: {e}")
        else:
            logger.warning("Supabase credentials not provided")
    
    def verify_token(self, token: str) -> Dict:
        """Verify JWT token and return user data"""
        try:
            # Decode JWT token
            payload = jwt.decode(token, self.jwt_secret, algorithms=['HS256'])
            
            # Extract user information
            user_data = {
                'id': payload.get('sub'),
                'email': payload.get('email'),
                'name': payload.get('name'),
                'avatar_url': payload.get('avatar_url'),
                'exp': payload.get('exp')
            }
            
            # Check if token is expired
            if datetime.utcnow().timestamp() > user_data['exp']:
                raise Exception("Token expired")
            
            return user_data
            
        except jwt.ExpiredSignatureError:
            raise Exception("Token expired")
        except jwt.InvalidTokenError:
            raise Exception("Invalid token")
        except Exception as e:
            raise Exception(f"Token verification failed: {str(e)}")
    
    def create_token(self, user_data: Dict) -> str:
        """Create JWT token for user"""
        payload = {
            'sub': user_data['id'],
            'email': user_data['email'],
            'name': user_data.get('name'),
            'avatar_url': user_data.get('avatar_url'),
            'iat': datetime.utcnow(),
            'exp': datetime.utcnow() + timedelta(hours=24)
        }
        
        token = jwt.encode(payload, self.jwt_secret, algorithm='HS256')
        return token
    
    def get_user_profile(self, user_id: str) -> Optional[Dict]:
        """Get user profile from Supabase"""
        if not self.supabase:
            return None
        
        try:
            response = self.supabase.table('users').select('*').eq('id', user_id).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"Error fetching user profile: {e}")
            return None
    
    def update_user_profile(self, user_id: str, profile_data: Dict) -> bool:
        """Update user profile in Supabase"""
        if not self.supabase:
            return False
        
        try:
            response = self.supabase.table('users').update(profile_data).eq('id', user_id).execute()
            return len(response.data) > 0
        except Exception as e:
            logger.error(f"Error updating user profile: {e}")
            return False