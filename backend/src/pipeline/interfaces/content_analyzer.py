"""
Abstract interfaces for content analysis.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from langchain_core.runnables import RunnableConfig


@dataclass
class AnalysisResult:
    """Result of content analysis."""
    title: str
    summary: str
    quotes: List[str]
    entities: List[str]
    claims: List[str]
    additional_data: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.additional_data is None:
            self.additional_data = {}


@dataclass 
class EntityExplanation:
    """Entity with explanation."""
    name: str
    explanation: str


@dataclass
class SectionAnalysis:
    """Complete analysis result for a transcript section."""
    start_time: str
    end_time: str
    title: str
    summary: str
    quotes: List[str] 
    entities: List[EntityExplanation]
    contextual_briefing: Dict[str, Any] = None
    additional_data: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.contextual_briefing is None:
            self.contextual_briefing = {}
        if self.additional_data is None:
            self.additional_data = {}


class ContentAnalyzer(ABC):
    """Abstract base class for content analysis."""
    
    @abstractmethod
    async def analyze_content(
        self, 
        content: str, 
        runnable_config: RunnableConfig
    ) -> AnalysisResult:
        """Perform broad analysis on content."""
        pass
    
    @abstractmethod
    async def filter_entities(
        self,
        entities: List[str],
        content: str, 
        runnable_config: RunnableConfig
    ) -> List[str]:
        """Filter entities to most important ones."""
        pass
    
    @abstractmethod
    async def filter_claims(
        self,
        claims: List[str],
        content: str,
        runnable_config: RunnableConfig  
    ) -> str:
        """Filter claims to find the most valuable one."""
        pass


class MetaAnalyzer(ABC):
    """Abstract base class for meta-analysis across sections."""
    
    @abstractmethod
    async def perform_synthesis(
        self,
        section_analyses: List[SectionAnalysis],
        runnable_config: RunnableConfig,
        original_transcript: str = None
    ) -> Dict[str, Any]:
        """Perform meta-synthesis across all sections.""" 
        pass
    
    @abstractmethod
    async def generate_argument_structure(
        self,
        section_analyses: List[SectionAnalysis], 
        runnable_config: RunnableConfig
    ) -> Dict[str, Any]:
        """Generate argument structure from sections."""
        pass