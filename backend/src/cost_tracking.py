# cost_tracking.py
from langchain.callbacks.base import BaseCallbackHandler
from typing import Any, Dict, List, Optional
from langchain_core.outputs import LLMResult, ChatGeneration

# Assuming db_manager can be imported here. If not, this script
# would need a way to pass data back, but for now it just collects.
# import db_manager


class TokenCostCallbackHandler(BaseCallbackHandler):
    """
    A LangChain callback handler to track token usage and cost for LLM calls.
    """

    def __init__(self, user_id: str, job_id: str):
        self.user_id = user_id
        self.job_id = job_id
        self.total_input_tokens = 0
        self.total_output_tokens = 0
        self.llm_calls_count = 0

    def on_llm_start(
        self, serialized: Dict[str, Any], prompts: List[str], **kwargs: Any
    ) -> None:
        """
        Increment the LLM call counter on start.
        """
        self.llm_calls_count += 1
        # Optional: Add a debug print if needed
        # print(f"DEBUG: LLM Call #{self.llm_calls_count} started.")

    def on_llm_end(self, response: LLMResult, **kwargs: Any) -> None:
        """
        Extract token usage from the response and accumulate it.
        This version is corrected to find 'usage_metadata' from Google's GenAI library.
        """
        # The response object from Google's GenAI contains a list of lists of Generations
        if not response.generations:
            return

        current_prompt_tokens = 0
        current_completion_tokens = 0

        # The actual token usage is nested inside the generation objects
        for gen_list in response.generations:
            for gen in gen_list:
                # This is the primary location for the latest langchain-google-genai
                if hasattr(gen, "message") and hasattr(gen.message, "usage_metadata"):
                    usage_metadata = gen.message.usage_metadata
                    if usage_metadata:
                        current_prompt_tokens += usage_metadata.get("input_tokens", 0)
                        current_completion_tokens += usage_metadata.get(
                            "output_tokens", 0
                        )
                        # The key is `input_tokens` and `output_tokens` now, not prompt/completion
                        # but keeping the old keys just in case of version differences.
                        current_prompt_tokens += usage_metadata.get(
                            "prompt_token_count", 0
                        )
                        current_completion_tokens += usage_metadata.get(
                            "completion_token_count", 0
                        )

                # Fallback for other potential structures, though less likely for your setup
                elif hasattr(gen, "generation_info") and gen.generation_info:
                    usage_metadata = gen.generation_info.get("usage_metadata")
                    if usage_metadata:
                        current_prompt_tokens += usage_metadata.get("input_tokens", 0)
                        current_completion_tokens += usage_metadata.get(
                            "output_tokens", 0
                        )

        # Update the total counts
        self.total_input_tokens += current_prompt_tokens
        self.total_output_tokens += current_completion_tokens

        # print(f"DEBUG: Captured Input Tokens (this call): {current_prompt_tokens}")
        # print(f"DEBUG: Captured Output Tokens (this call): {current_completion_tokens}")
        # print(f"DEBUG: Accumulated Total LLM Input Tokens: {self.total_input_tokens}")
        # print(f"DEBUG: Accumulated Total LLM Output Tokens: {self.total_output_tokens}")

    def get_metrics(self) -> Dict[str, int]:
        """
        Returns the final collected metrics.
        """
        return {
            "llm_input_tokens": self.total_input_tokens,
            "llm_output_tokens": self.total_output_tokens,
            "llm_calls": self.llm_calls_count,
        }
