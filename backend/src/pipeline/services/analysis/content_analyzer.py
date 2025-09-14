"""
Content analysis services.
"""

from typing import List, Dict, Any
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain.output_parsers import OutputFixingParser
from langchain_core.runnables import RunnableConfig
from rich import print

from ...interfaces import ContentAnalyzer, AnalysisResult
from ...config import get_persona_config
from ...utils import clean_line_for_analysis


class PersonaBasedAnalyzer(ContentAnalyzer):
    """Content analyzer that uses persona-based prompts."""

    def __init__(self, llm_client, persona: str = "general"):
        self.llm = llm_client
        self.persona = persona
        self.persona_config = get_persona_config(persona)

    async def analyze_content(
        self, content: str, runnable_config: RunnableConfig
    ) -> AnalysisResult:
        """Perform broad analysis on content based on persona configuration."""
        print(
            f"     - [yellow]Phase 1: Performing '{self.persona}' analysis...[/yellow]"
        )

        # Clean content for analysis
        clean_content = "\n".join(
            [clean_line_for_analysis(line) for line in content.splitlines()]
        )

        parser = JsonOutputParser()
        fixing_parser = OutputFixingParser.from_llm(parser=parser, llm=self.llm)

        prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    self.persona_config["prompt_system"].format(
                        format_instructions=parser.get_format_instructions()
                    ),
                ),
                ("human", "--- TEXT TO ANALYZE ---\n{content}\n--- END TEXT ---"),
            ]
        )

        chain = prompt | self.llm | fixing_parser
        result = await chain.ainvoke({"content": clean_content}, config=runnable_config)

        # Map result to standard format using persona config
        output_keys = self.persona_config["output_keys"]

        # Handle special case for deep_dive persona where quotes might be objects
        quotes_data = result.get(output_keys["quotes"], [])
        actionable_takeaways_data = []

        if (
            self.persona == "deep_dive"
            and isinstance(quotes_data, list)
            and quotes_data
        ):
            # For deep_dive, extract supporting_quote from each actionable takeaway object for quotes
            # But also preserve the full actionable_takeaways data
            processed_quotes = []
            actionable_takeaways_data = quotes_data.copy()  # Preserve the full data

            for item in quotes_data:
                if isinstance(item, dict):
                    # Extract the supporting_quote from the takeaway object
                    supporting_quote = item.get("supporting_quote", "")
                    if supporting_quote:
                        processed_quotes.append(supporting_quote)
                else:
                    # Handle case where item is already a string
                    processed_quotes.append(str(item))
            quotes_data = processed_quotes
        elif not isinstance(quotes_data, list):
            quotes_data = []

        # Handle entities data
        entities_data = result.get(output_keys["entities"], [])
        if not isinstance(entities_data, list):
            entities_data = []

        # Handle claims data
        claims_key = output_keys.get("claims", "")
        claims_data = (
            result.get(claims_key, []) if claims_key and "claims" in output_keys else []
        )
        if not isinstance(claims_data, list):
            claims_data = []

        # Map result to standard format using persona config
        mapped_result = AnalysisResult(
            title=result.get(output_keys["title"], ""),
            summary=result.get(output_keys["summary"], ""),
            quotes=quotes_data,
            entities=entities_data,
            claims=claims_data,
            additional_data={
                k: v for k, v in result.items() if k not in output_keys.values()
            },
        )

        # For deep_dive persona, explicitly add actionable_takeaways to additional_data
        if self.persona == "deep_dive" and actionable_takeaways_data:
            mapped_result.additional_data["actionable_takeaways"] = (
                actionable_takeaways_data
            )

        # Debug logging for deep_dive persona
        elif self.persona == "deep_dive":
            print(
                f"[blue]Debug - Deep dive LLM result keys: {list(result.keys())}[/blue]"
            )
            if "actionable_takeaways" in result:
                print(
                    f"[blue]Debug - Found actionable_takeaways: {len(result['actionable_takeaways'])} items[/blue]"
                )
            else:
                print(f"[yellow]Debug - No actionable_takeaways in result[/yellow]")

        return mapped_result

    async def filter_entities(
        self, entities: List[str], content: str, runnable_config: RunnableConfig
    ) -> List[str]:
        """Filter entities to the most important ones."""
        if not entities:
            return []

        print(
            f"     - [yellow]Phase 2: Filtering {len(entities)} potential entities...[/yellow]"
        )

        parser = JsonOutputParser()
        fixing_parser = OutputFixingParser.from_llm(parser=parser, llm=self.llm)

        prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "You are a content strategist. From the 'LIST OF POTENTIAL ENTITIES', "
                    "select the top 3 to 4 most important and relevant entities that a listener "
                    "would want explained, based on the provided 'TRANSCRIPT SECTION'.\n"
                    "CRITICAL: Your output must be a single, valid JSON object. "
                    "All keys and string values MUST be enclosed in double quotes.\n{format_instructions}",
                ),
                (
                    "human",
                    "TRANSCRIPT SECTION (for context):\n{content}\n\n"
                    "LIST OF POTENTIAL ENTITIES:\n{entity_list}",
                ),
            ]
        )

        chain = prompt | self.llm | fixing_parser

        try:
            result = await chain.ainvoke(
                {
                    "content": content,
                    "entity_list": str(entities),
                    "format_instructions": parser.get_format_instructions(),
                },
                config=runnable_config,
            )

            key_entities = result.get("entities", [])

            # Validate and normalize the result
            validated_entities = []
            if key_entities and isinstance(key_entities[0], dict):
                # Handle case where LLM returns list of dictionaries
                print(
                    "[yellow]LLM returned dictionaries. Normalizing to strings...[/yellow]"
                )
                for item in key_entities:
                    if "entity" in item:
                        validated_entities.append(item["entity"])
                    elif "name" in item:
                        validated_entities.append(item["name"])
            else:
                # Normal case: list of strings
                validated_entities = [
                    entity for entity in key_entities if isinstance(entity, str)
                ]

            print(
                f"     - [green]✓ Found {len(validated_entities)} key entities: {validated_entities}[/green]"
            )
            return validated_entities

        except Exception as e:
            print(f"     - [red]Entity filtering failed: {e}[/red]")
            return []

    async def filter_claims(
        self, claims: List[str], content: str, runnable_config: RunnableConfig
    ) -> str:
        """Filter claims to find the most valuable one."""
        if not claims:
            return ""

        print(
            f"     - [yellow]Phase 3: Filtering {len(claims)} potential claims...[/yellow]"
        )

        # For consultant persona, just return first open question
        if self.persona == "consultant":
            return claims[0] if claims else ""

        parser = JsonOutputParser()

        prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "You are a meticulous podcast editor. Your goal is to select the single "
                    "most intellectually stimulating and thematically relevant claim from a list. "
                    "A high-value claim is insightful, debatable, and core to the section's main argument.\n\n"
                    "**CRITICAL RULE: You MUST REJECT any claim that is promotional, an advertisement, "
                    "or a call-to-action.** If a claim mentions discounts, offers, website URLs for "
                    "products, or sounds like a sponsor read, it is INVALID. If all the potential "
                    "claims are promotional, you MUST return an empty string for the 'best_claim' value.\n\n"
                    "AVOID selecting:\n"
                    "- **Sponsor-Related:** (e.g., 'You can get 35% off...').\n"
                    "- **Trivial Facts:** (e.g., 'Q2 stadium is in Austin, Texas').\n"
                    "- **Purely Personal Anecdotes:** (e.g., 'My heart rate went up 15 points').\n\n"
                    "Based on this strict rubric, analyze the 'TRANSCRIPT SECTION' for context and "
                    "select the best non-promotional claim from the 'LIST OF POTENTIAL CLAIMS'. "
                    "Your output must be a JSON object with a single key 'best_claim' containing "
                    "a single string.\n{format_instructions}",
                ),
                (
                    "human",
                    "TRANSCRIPT SECTION (for context):\n{content}\n\n"
                    "LIST OF POTENTIAL CLAIMS:\n{claim_list}",
                ),
            ]
        )

        chain = prompt | self.llm | parser

        try:
            result = await chain.ainvoke(
                {
                    "content": content,
                    "claim_list": str(claims),
                    "format_instructions": parser.get_format_instructions(),
                },
                config=runnable_config,
            )

            best_claim = result.get("best_claim", "")

            # Additional validation for promotional content
            if "http" in best_claim or "% off" in best_claim:
                print(
                    "[bold red]Claim filtering returned promotional content. Rejecting.[/bold red]"
                )
                return ""

            return best_claim

        except Exception as e:
            print(f"     - [red]Claim filtering failed: {e}[/red]")
            return ""
