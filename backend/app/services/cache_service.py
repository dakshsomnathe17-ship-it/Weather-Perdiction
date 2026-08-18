import json
from typing import Optional, Any
from app.config import settings

class CacheService:
    def __init__(self):
        self._in_memory = {}
        # In a full implementation, we'd setup redis here if available
        
    async def get(self, key: str) -> Optional[Any]:
        return self._in_memory.get(key)
        
    async def set(self, key: str, value: Any, ttl: int = 600):
        self._in_memory[key] = value
        
    async def delete(self, key: str):
        if key in self._in_memory:
            del self._in_memory[key]
            
    async def clear(self):
        self._in_memory.clear()

cache_service = CacheService()
