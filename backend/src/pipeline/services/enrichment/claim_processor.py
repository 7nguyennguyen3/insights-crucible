"""
Claim processing and contextual briefing service.
"""

import json
from typing import List, Dict, Any
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.runnables import RunnableConfig
from rich import print

from ...utils import retry_with_exponential_backoff


class ClaimProcessor:
    """Service for processing and selecting claims."""
    
    def __init__(self, llm_client):
        self.llm = llm_client
    
    async def select_best_global_claim(
        self,
        all_claims: List[str],
        synthesis_data: Dict[str, Any],
        runnable_config: RunnableConfig,
    ) -> str:
        """
        Select the best claim from all sections using synthesis data as context.
        """
        if not all_claims:
            return ""
        
        print(f"\n[magenta]🧠 Selecting best claim from {len(all_claims)} candidates...[/magenta]")
        
        parser = JsonOutputParser()
        
        prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                "You are a senior editor. You have been given a high-level strategic analysis "
                "of a document and a list of specific claims made within it. "
                "Your task is to select the SINGLE most important, insightful, and thematically "
                "central claim from the list. This claim will be used for a detailed briefing, "
                "so it should be a substantive statement. "
                "Your output must be a JSON object with a single key 'best_claim' containing "
                "the chosen string.\n{format_instructions}",
            ),
            (
                "human",
                "HIGH-LEVEL ANALYSIS (for context):\n{high_level_context}\n\n"
                "LIST OF POTENTIAL CLAIMS TO CHOOSE FROM:\n{claim_list}",
            ),
        ])
        
        chain = prompt | self.llm | parser
        
        try:
            result = await chain.ainvoke({
                "high_level_context": json.dumps(synthesis_data),
                "claim_list": json.dumps(list(set(all_claims))),
                "format_instructions": parser.get_format_instructions(),
            }, config=runnable_config)
            
            best_claim = result.get("best_claim", "")
            print(f"  [green]✓ Best claim selected: '{best_claim[:80]}...'[/green]")
            return best_claim
            
        except Exception as e:
            print(f"[red]Could not select best claim: {e}. Using first claim.[/red]")
            return all_claims[0] if all_claims else ""


class ContextualBriefingGenerator:
    """Service for generating contextual briefings."""
    
    def __init__(self, llm_client, search_provider):
        self.llm = llm_client
        self.search = search_provider
    
    @retry_with_exponential_backoff()
    async def generate_briefing(
        self,
        claim_text: str,
        context: str,
        section_index: int = -1,
    ) -> Dict[str, Any]:
        """
        Generate a contextual briefing for a given claim.
        """
        # Legacy contextual briefing feature has been removed
        return {
            "briefing": {"error": "ContextualBriefingRemoved", "details": "This feature has been removed."},
            "cost_metrics": {"tavily_searches": 0},
        }