"""
Pipeline factory for dependency injection and object creation.
"""

import os
from typing import Dict, Any

# Import services
from ..services.transcript import (
    DefaultTranscriptNormalizer,
    YouTubeTranscriptNormalizer,
    DynamicWordSegmenter,
    TimeBasedSegmenter,
    MonologueSegmenter,
    AssemblyAIProcessor,
)
from ..services.analysis import (
    PersonaBasedAnalyzer,
    ConsultantSynthesizer,
    GeneralSynthesizer,
    DeepDiveSynthesizer,
    PodcasterSynthesizer,
)
from ..services.enrichment import (
    EntityEnricher,
    FirestoreEntityCache,
    TavilySearchProvider,
    ClaimProcessor,
    ContextualBriefingGenerator,
)

# Import orchestrators
from ..orchestrators import (
    AnalysisPipeline,
    SectionProcessor,
)

# Import implementations for content generation
from ..implementations.title_generator import DefaultTitleGenerator
from ..implementations.segmenter_strategy import SegmenterStrategy

from ..config import get_persona_config


class PipelineFactory:
    """Factory for creating pipeline components with proper dependency injection."""
    
    def __init__(
        self,
        db_manager,
        llm_clients_module,  # src.clients module
        token_tracker,
    ):
        self.db_manager = db_manager
        self.clients = llm_clients_module
        self.token_tracker = token_tracker
        
        # Initialize shared dependencies
        self._cache_provider = None
        self._search_provider = None
        self._entity_enricher = None
        self._audio_processor = None
    
    def create_pipeline(self, persona: str = "general") -> AnalysisPipeline:
        """Create a complete analysis pipeline for the given persona."""
        
        # Create transcript processing components
        transcript_normalizer = DefaultTranscriptNormalizer()
        youtube_normalizer = YouTubeTranscriptNormalizer()
        segmenter = self._create_segmenter_strategy()
        audio_processor = self._get_audio_processor()
        
        # Create analysis components
        content_analyzer = self._create_content_analyzer(persona)
        meta_analyzer = self._create_meta_analyzer(persona)
        
        # Create enrichment components
        entity_enricher = self._get_entity_enricher()
        claim_processor = ClaimProcessor(self._get_llm_client("best-lite"))
        briefing_generator = ContextualBriefingGenerator(
            self._get_llm_client("best-lite"),
            self._get_search_provider()
        )
        
        # Create orchestrators
        section_processor = SectionProcessor(
            content_analyzer=content_analyzer,
            entity_enricher=entity_enricher,
            db_manager=self.db_manager,
            persona=persona,
        )
        
        title_generator = DefaultTitleGenerator(self._get_llm_client("best-lite"))
        
        # Create main pipeline
        return AnalysisPipeline(
            transcript_normalizer=transcript_normalizer,
            youtube_normalizer=youtube_normalizer,
            segmenter=segmenter,
            audio_processor=audio_processor,
            section_processor=section_processor,
            meta_analyzer=meta_analyzer,
            title_generator=title_generator,
            claim_processor=claim_processor,
            briefing_generator=briefing_generator,
            db_manager=self.db_manager,
            token_tracker=self.token_tracker,
        )
    
    def _create_content_analyzer(self, persona: str) -> PersonaBasedAnalyzer:
        """Create content analyzer for the given persona."""
        llm_client = self._get_llm_client("best-lite")
        return PersonaBasedAnalyzer(llm_client, persona)
    
    def _create_meta_analyzer(self, persona: str):
        """Create meta-analyzer based on persona."""
        llm_client = self._get_llm_client("best-lite")

        if persona == "consultant":
            return ConsultantSynthesizer(llm_client)
        elif persona == "deep_dive":
            return DeepDiveSynthesizer(llm_client)
        elif persona == "podcaster":
            return PodcasterSynthesizer(llm_client)
        else:
            return GeneralSynthesizer(llm_client)
    
    def _create_segmenter_strategy(self) -> SegmenterStrategy:
        """Create segmenter strategy that chooses the right segmenter."""
        return SegmenterStrategy(
            word_segmenter=DynamicWordSegmenter(),
            time_segmenter=TimeBasedSegmenter(),
            monologue_segmenter=MonologueSegmenter(),
        )
    
    def _get_entity_enricher(self) -> EntityEnricher:
        """Get or create entity enricher with dependencies."""
        if self._entity_enricher is None:
            self._entity_enricher = EntityEnricher(
                llm_client=self._get_llm_client("best-lite"),
                cache_provider=self._get_cache_provider(),
                search_provider=self._get_search_provider(),
            )
        return self._entity_enricher
    
    def _get_cache_provider(self) -> FirestoreEntityCache:
        """Get or create cache provider."""
        if self._cache_provider is None:
            self._cache_provider = FirestoreEntityCache(self.db_manager.db)
        return self._cache_provider
    
    def _get_search_provider(self) -> TavilySearchProvider:
        """Get or create search provider."""
        if self._search_provider is None:
            tavily_api_key = os.getenv("TAVILY_API_KEY")
            if not tavily_api_key:
                raise ValueError("TAVILY_API_KEY environment variable is required")
            self._search_provider = TavilySearchProvider(tavily_api_key)
        return self._search_provider
    
    def _get_audio_processor(self) -> AssemblyAIProcessor:
        """Get or create audio processor."""
        if self._audio_processor is None:
            api_key = os.getenv("ASSEMBLYAI_API_KEY")
            if not api_key:
                raise ValueError("ASSEMBLYAI_API_KEY environment variable is required")
            
            self._audio_processor = AssemblyAIProcessor(
                api_key=api_key,
                httpx_client=self.clients.httpx_client,
                gcs_client=self.clients.gcs_client,
            )
        return self._audio_processor
    
    def _get_llm_client(self, model_type: str = "best-lite"):
        """Get LLM client from clients module."""
        llm, _ = self.clients.get_llm(model_type, temperature=0.2)
        return llm
    
    @classmethod
    def create_default_pipeline(
        cls,
        db_manager,
        clients_module,
        token_tracker,
        persona: str = "general"
    ) -> AnalysisPipeline:
        """Convenience method to create a pipeline with default configuration."""
        factory = cls(db_manager, clients_module, token_tracker)
        return factory.create_pipeline(persona)