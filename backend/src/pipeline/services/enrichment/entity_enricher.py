"""
Entity enrichment service.
"""

import asyncio
import os
from typing import List, Dict, Any
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
from tavily import TavilyClient
from firebase_admin import firestore
from rich import print

from ...interfaces import CacheProvider, SearchProvider, EntityExplanation
from ...utils import get_normalized_cache_key, retry_with_exponential_backoff
from ...config.constants import ENTITY_CACHE_COLLECTION


class FirestoreEntityCache(CacheProvider):
    """Firestore implementation of entity cache."""
    
    def __init__(self, db_client):
        self.db = db_client
    
    async def get(self, key: str) -> Dict[str, Any]:
        """Get cached entity explanation."""
        try:
            doc_ref = self.db.collection(ENTITY_CACHE_COLLECTION).document(key)
            doc = doc_ref.get()
            return doc.to_dict() if doc.exists else None
        except Exception as e:
            print(f"[red]Error accessing cache for key '{key}': {e}[/red]")
            return None
    
    async def set(self, key: str, data: Dict[str, Any]) -> None:
        """Store entity explanation in cache."""
        try:
            self.db.collection(ENTITY_CACHE_COLLECTION).document(key).set({
                "explanation": data.get("explanation", ""),
                "last_updated": firestore.SERVER_TIMESTAMP
            })
        except Exception as e:
            print(f"[red]Error updating cache for key '{key}': {e}[/red]")
    
    async def exists(self, key: str) -> bool:
        """Check if entity exists in cache."""
        result = await self.get(key)
        return result is not None


class TavilySearchProvider(SearchProvider):
    """Tavily implementation of search provider."""
    
    def __init__(self, api_key: str):
        self.client = TavilyClient(api_key=api_key)
    
    async def search(self, query: str, **kwargs) -> List[Dict[str, Any]]:
        """Perform web search using Tavily."""
        try:
            # Run Tavily search in thread pool to avoid blocking
            result = await asyncio.to_thread(
                self.client.search,
                query=query.strip().split("\n")[0][:390],
                search_depth=kwargs.get("search_depth", "basic"),
            )
            return result.get("results", [])
        except Exception as e:
            print(f"[red]Search failed for query '{query[:50]}...': {e}[/red]")
            return []


class EntityEnricher:
    """Service for enriching entities with explanations."""
    
    def __init__(
        self,
        llm_client,
        cache_provider: CacheProvider,
        search_provider: SearchProvider
    ):
        self.llm = llm_client
        self.cache = cache_provider
        self.search = search_provider
    
    @retry_with_exponential_backoff()
    async def enrich_entities(
        self,
        entities: List[str],
        transcript_context: str,
        section_index: int = -1,
    ) -> Dict[str, Any]:
        """
        Fetch context for entities and return explanations with cost metrics.
        """
        cost_metrics = {"tavily_searches": 0}
        final_explanations = {}
        
        if not entities:
            return {"explanations": {}, "cost_metrics": cost_metrics}
        
        log_prefix = f"         - [Section {section_index + 1}]" if section_index >= 0 else "         -"
        print(f"{log_prefix} [cyan]Starting Context Enrichment...[/cyan]")
        
        # Step 1: Check cache for existing explanations
        print(f"{log_prefix}    - 1. Checking cache with normalized keys...")
        entities_to_fetch = []
        
        for entity in entities:
            if not entity or not entity.strip():
                continue
                
            cache_key = get_normalized_cache_key(entity)
            if not cache_key:
                continue
                
            cached_data = await self.cache.get(cache_key)
            if cached_data:
                final_explanations[entity] = cached_data.get("explanation", "")
            else:
                entities_to_fetch.append(entity)
        
        if not entities_to_fetch:
            print(f"{log_prefix}    - [green]All entities found in cache. Done.[/green]")
            return {"explanations": final_explanations, "cost_metrics": cost_metrics}
        
        print(f"{log_prefix}    - 2. Searching web for {len(entities_to_fetch)} cache misses...")
        
        # Step 2: Generate smart search queries
        query_gen_prompt = ChatPromptTemplate.from_template(
            "You are a search query generator. Create a single, concise search query to "
            "explain the term '{topic}' using the provided context. "
            "CRITICAL: Your output must be ONLY the search query string. Do not add any "
            "explanation, formatting, titles, or introductory text. The query must be under 50 words.\n\n"
            "CONTEXT:\n{context}"
        )
        query_gen_chain = query_gen_prompt | self.llm | StrOutputParser()
        
        query_gen_tasks = [
            query_gen_chain.ainvoke({"topic": entity, "context": transcript_context})
            for entity in entities_to_fetch
        ]
        smart_queries = await asyncio.gather(*query_gen_tasks)
        
        print(f"{log_prefix} [blue]DEBUG: Generated smart queries: {smart_queries}[/blue]")
        
        # Step 3: Perform concurrent web searches
        search_tasks = [
            self.search.search(query)
            for query in smart_queries
            if query and query.strip()
        ]
        search_results_list = await asyncio.gather(*search_tasks)
        
        # Count searches for cost tracking
        cost_metrics["tavily_searches"] = len(search_results_list)
        
        # Combine all search results
        all_search_results = []
        for result_group in search_results_list:
            all_search_results.extend(result_group)
        
        # Deduplicate by URL
        unique_results = list({result["url"]: result for result in all_search_results}.values())
        
        if not unique_results:
            print(f"{log_prefix}    - [yellow]Web search returned no results. Aborting enrichment.[/yellow]")
            return {"explanations": final_explanations, "cost_metrics": cost_metrics}
        
        # Step 4: Synthesize explanations from search results
        print(f"{log_prefix}    - 3. Synthesizing explanations from {len(unique_results)} sources...")
        
        new_explanations = await self._synthesize_explanations(
            entities_to_fetch, unique_results
        )
        
        # Step 5: Update cache and combine results
        print(f"{log_prefix}    - 4. Updating cache with new explanations...")
        for entity, explanation in new_explanations.items():
            cache_key = get_normalized_cache_key(entity)
            if cache_key and explanation:
                await self.cache.set(cache_key, {"explanation": explanation})
            final_explanations[entity] = explanation
        
        return {"explanations": final_explanations, "cost_metrics": cost_metrics}
    
    async def _synthesize_explanations(
        self, 
        entities: List[str], 
        search_results: List[Dict[str, Any]]
    ) -> Dict[str, str]:
        """Synthesize explanations from search results."""
        parser = JsonOutputParser()
        
        summarizer_prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                "You are a helpful assistant. Your job is to provide concise, 1-2 sentence "
                "definitions for a list of topics based on provided search results. Your output "
                "must be a single JSON object where keys are the topics and values are the "
                "string definitions.\n{format_instructions}",
            ),
            (
                "human",
                "Please generate explanations for...\nTOPICS TO EXPLAIN:\n{topics_list}\n\n"
                "COMBINED SEARCH RESULTS:\n{results_text}",
            ),
        ])
        
        synthesis_chain = summarizer_prompt | self.llm | parser
        
        try:
            return await synthesis_chain.ainvoke({
                "topics_list": str(entities),
                "results_text": "\n\n".join([str(res) for res in search_results]),
                "format_instructions": parser.get_format_instructions(),
            })
        except Exception as e:
            print(f"[red]Error synthesizing explanations: {e}[/red]")
            return {}
    
    def convert_to_entity_explanations(
        self, 
        entities: List[str], 
        explanations_map: Dict[str, str]
    ) -> List[EntityExplanation]:
        """Convert explanations map to list of EntityExplanation objects."""
        return [
            EntityExplanation(
                name=entity_name,
                explanation=explanations_map.get(entity_name, "No explanation found.")
            )
            for entity_name in entities
        ]