"""
Title generator implementation.
"""

from typing import Dict, Any
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableConfig
import json
from rich import print

from ..interfaces import TitleGenerator


class DefaultTitleGenerator(TitleGenerator):
    """Default implementation of title generator."""
    
    def __init__(self, llm_client):
        self.llm = llm_client
    
    async def generate_title(
        self,
        synthesis_data: Dict[str, Any],
        runnable_config: RunnableConfig
    ) -> str:
        """
        Generates a final, overarching title based on high-level synthesis
        or argument structure data.
        """
        print("  - [blue]Generating final holistic title from Pass 2 analysis...[/blue]")
        
        # If the Pass 2 analysis failed or was empty, return a default
        if not synthesis_data:
            return "Untitled Analysis"
        
        parser = StrOutputParser()
        
        prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                "You are a master copywriter. Based on the following high-level summary "
                "of a document, create one single, concise, and engaging title for the entire "
                "document. The title should be 3-6 words long.",
            ),
            (
                "human",
                """Here is the document's high-level analysis:
--- ANALYSIS ---
{analysis_context}
--- END ANALYSIS ---

Provide only the title text and nothing else.""",
            ),
        ])
        
        chain = prompt | self.llm | parser
        
        try:
            title = await chain.ainvoke({
                "analysis_context": json.dumps(synthesis_data)
            }, config=runnable_config)
            
            # Clean up any potential quotation marks from the output
            return title.strip().strip('"')
            
        except Exception as e:
            print(f"  - [red]Error generating final title: {e}. Using default.[/red]")
            return "Insight Analysis"