"""
Abstract interfaces for storage and caching.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List


class CacheProvider(ABC):
    """Abstract base class for caching operations."""
    
    @abstractmethod
    async def get(self, key: str) -> Optional[Dict[str, Any]]:
        """Get cached data by key."""
        pass
    
    @abstractmethod
    async def set(self, key: str, data: Dict[str, Any]) -> None:
        """Store data in cache with key."""
        pass
    
    @abstractmethod
    async def exists(self, key: str) -> bool:
        """Check if key exists in cache."""
        pass


class SearchProvider(ABC):
    """Abstract base class for web search operations."""
    
    @abstractmethod
    async def search(self, query: str, **kwargs) -> List[Dict[str, Any]]:
        """Perform web search and return results."""
        pass


class StorageProvider(ABC):
    """Abstract base class for file storage operations."""
    
    @abstractmethod
    async def download_bytes(self, path: str) -> bytes:
        """Download file as bytes from storage."""
        pass
    
    @abstractmethod
    async def delete(self, path: str) -> None:
        """Delete file from storage."""
        pass