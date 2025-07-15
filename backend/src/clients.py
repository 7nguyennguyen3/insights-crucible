# src/clients.py

from langchain_google_genai import ChatGoogleGenerativeAI
from tavily import TavilyClient
from typing import Dict, Any, Tuple, Optional
import httpx
from google.cloud import storage as gcs_storage


llm_best: Optional[ChatGoogleGenerativeAI] = None
llm_best_lite: Optional[ChatGoogleGenerativeAI] = None
llm_main: Optional[ChatGoogleGenerativeAI] = None
tavily_client: Optional[TavilyClient] = None
gcs_client: Optional[gcs_storage.Client] = None
httpx_client: Optional[httpx.AsyncClient] = None


def get_llm(
    model_name: str, temperature: Optional[float] = None
) -> Tuple[ChatGoogleGenerativeAI, Dict[str, Any]]:
    """
    Gets a shared LLM client and returns it with a separate options dictionary.
    This is compatible with older versions of LangChain.
    """
    client_map = {
        "best": llm_best,
        "best-lite": llm_best_lite,
        "main": llm_main,
    }
    base_llm = client_map.get(model_name)

    if base_llm is None:
        raise ValueError(f"LLM client '{model_name}' not found or not initialized.")

    # Create an options dictionary for the .ainvoke() call
    options = {}
    if temperature is not None:
        options["temperature"] = temperature

    # Return the client and the options separately
    return base_llm, options
