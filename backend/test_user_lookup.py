"""
Test script to debug the intermittent user profile lookup issue
"""
import asyncio
import sys
import os

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import get_database

async def test_user_lookup(user_id: str, iterations: int = 10):
    """Test user profile lookup multiple times to identify patterns"""
    db = get_database()
    
    print(f"🔍 Testing user lookup for ID: {user_id}")
    print(f"📊 Running {iterations} iterations...")
    print("-" * 50)
    
    success_count = 0
    failure_count = 0
    response_times = []
    
    for i in range(iterations):
        try:
            import time
            start_time = time.time()
            
            # Same query as in security.py
            result = db.table("user_profiles").select("*").eq("id", user_id).execute()
            
            end_time = time.time()
            response_time = (end_time - start_time) * 1000
            response_times.append(response_time)
            
            if result.data:
                success_count += 1
                user_data = result.data[0]
                print(f"✅ Iteration {i+1}: SUCCESS ({response_time:.2f}ms) - {user_data.get('email')}")
            else:
                failure_count += 1
                print(f"❌ Iteration {i+1}: FAILED ({response_time:.2f}ms) - No data returned")
                print(f"   Result: {result}")
                
        except Exception as e:
            failure_count += 1
            print(f"💥 Iteration {i+1}: ERROR - {e}")
        
        # Small delay between requests
        await asyncio.sleep(0.1)
    
    print("-" * 50)
    print(f"📈 Results Summary:")
    print(f"   Success: {success_count}/{iterations} ({success_count/iterations*100:.1f}%)")
    print(f"   Failures: {failure_count}/{iterations} ({failure_count/iterations*100:.1f}%)")
    
    if response_times:
        avg_time = sum(response_times) / len(response_times)
        min_time = min(response_times)
        max_time = max(response_times)
        print(f"   Response times: avg={avg_time:.2f}ms, min={min_time:.2f}ms, max={max_time:.2f}ms")
    
    # Test with service role key if available
    print("\n🔑 Testing with service role (bypassing RLS)...")
    try:
        # Create a new client with service role key
        from supabase import create_client
        from app.core.config import settings
        
        service_db = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        
        result = service_db.table("user_profiles").select("*").eq("id", user_id).execute()
        
        if result.data:
            print(f"✅ Service role query SUCCESS - User exists in database")
            print(f"   Data: {result.data[0]}")
        else:
            print(f"❌ Service role query FAILED - User not found even with service role")
            
    except Exception as e:
        print(f"💥 Service role test ERROR: {e}")

if __name__ == "__main__":
    # Use the user ID from your logs
    user_id = "26650d4e-fc9f-4397-9135-1d87122773b2"  # Replace with actual user ID
    asyncio.run(test_user_lookup(user_id, 20))
