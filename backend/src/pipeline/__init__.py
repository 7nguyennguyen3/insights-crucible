"""
Podcast Analysis Pipeline

A refactored, maintainable pipeline for processing podcast transcripts
and generating AI-powered content analysis and assets.
"""

from .orchestrators.analysis_pipeline import AnalysisPipeline
from .factories.pipeline_factory import PipelineFactory

# Backward compatibility: expose the main entry point function
try:
    from ..new_pipeline import run_full_analysis
    # Also expose the legacy function name for any code that might use it
    run_full_analysis_legacy = run_full_analysis
except ImportError:
    # Fallback if new_pipeline.py is not available
    run_full_analysis = None
    run_full_analysis_legacy = None

__all__ = [
    "AnalysisPipeline", 
    "PipelineFactory",
    "run_full_analysis",
    "run_full_analysis_legacy"
]