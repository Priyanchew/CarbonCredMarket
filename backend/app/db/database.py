from supabase import create_client, Client
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class Database:
    def __init__(self):
        self.supabase: Client = None
        
    def connect(self):
        """Create Supabase client connection with anon key (for RLS)"""
        try:
            self.supabase = create_client(
                settings.SUPABASE_URL, 
                settings.SUPABASE_ANON_KEY  # Use anon key for RLS, set JWT token per request
            )
            return self.supabase
        except Exception as e:
            logger.error(f"Failed to connect to Supabase: {e}")
            raise
    
    def get_client(self) -> Client:
        """Get Supabase client instance with retry logic"""
        if not self.supabase:
            self.connect()
        
        # Test the connection with a simple query to ensure it's working
        try:
            # This is a lightweight test query
            self.supabase.table("user_profiles").select("count").limit(0).execute()
        except Exception as e:
            logger.warning(f"Supabase connection test failed, reconnecting: {e}")
            self.supabase = None
            self.connect()
            
        return self.supabase
    
    def get_client_with_token(self, token: str) -> Client:
        """Get Supabase client with user token for RLS"""
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
        client.postgrest.auth(token)
        return client
    
    def get_service_role_client(self) -> Client:
        """Get Supabase client with service role key (bypasses RLS)"""
        return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

# Global database instance
db = Database()

def get_database() -> Client:
    """Dependency to get database client"""
    return db.get_client()

def get_service_role_database() -> Client:
    """Dependency to get service role database client (bypasses RLS)"""
    return db.get_service_role_client()
