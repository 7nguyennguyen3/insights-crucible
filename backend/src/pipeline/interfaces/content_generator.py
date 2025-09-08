"""
Abstract interfaces for content generation.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any
from langchain_core.runnables import RunnableConfig
from .content_analyzer import SectionAnalysis


class ContentGenerator(ABC):
    """Abstract base class for content generation."""
    
    @abstractmethod
    async def generate(
        self,
        sections: List[SectionAnalysis],
        runnable_config: RunnableConfig,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate content from analyzed sections."""
        pass


class BlogPostGenerator(ContentGenerator):
    """Abstract base class for blog post generation."""
    pass


class SocialMediaGenerator(ContentGenerator):  
    """Abstract base class for social media content generation."""
    pass


class SlideGenerator(ContentGenerator):
    """Abstract base class for slide deck generation."""
    pass


class TitleGenerator(ABC):
    """Abstract base class for title generation."""
    
    @abstractmethod
    async def generate_title(
        self,
        synthesis_data: Dict[str, Any],
        runnable_config: RunnableConfig
    ) -> str:
        """Generate final title from synthesis data."""
        pass