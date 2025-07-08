class AppConfig:
    # --- LLM Model Names ---
    # A dictionary makes it easy to manage and swap models
    LLM_MODELS = {
        "best": "gemini-2.5-flash",
        "best-lite": "gemini-2.5-flash-lite-preview-06-17",
        "main": "gemini-2.0-flash-001",
        "main-lite": "gemini-2.0-flash-lite",
        "default": "gemini-1.5-flash",
    }

    # --- Sectioning Parameters ---
    # Central place to tune how your transcript is segmented
    SECTIONING_PARAMS = {"lines_per_chunk": 60, "overlap_lines": 10}

    SEMANTIC_BOUNDARY_PARAMS = {"max_words": 12, "min_capitalization_ratio": 0.7}

    # --- Pricing and Cost ---
    MINIMUM_JOB_CHARGE_USD = 0.01

    # You can even store parts of prompts here if you want
    # For example:
    # PROMPT_FRAGMENTS = {
    #     "DEFAULT_SYSTEM_PROMPT": "You are a helpful assistant."
    # }


# Create a single instance to be imported by other modules
app_config = AppConfig()
