from fastapi import APIRouter, Depends, Request, BackgroundTasks, HTTPException
from src import db_manager
from src.new_pipeline import run_full_analysis  # Updated to use refactored pipeline
from src.security import verify_gcp_task_request
from src.features import grade_open_ended_response
from src import clients
from langchain_core.runnables import RunnableConfig
from langchain.callbacks.base import BaseCallbackHandler
import asyncio

router = APIRouter()


@router.get("/health", status_code=200)
async def worker_health_check():
    """
    Health check endpoint for the worker service.
    Used to verify the worker service is accessible and operational.
    """
    import time
    import os
    
    return {
        "status": "healthy",
        "service": "analysis_worker",
        "timestamp": time.time(),
        "environment": {
            "google_cloud_project": os.getenv("GOOGLE_CLOUD_PROJECT"),
            "google_cloud_location": os.getenv("GOOGLE_CLOUD_LOCATION"), 
            "google_cloud_queue_id": os.getenv("GOOGLE_CLOUD_QUEUE_ID"),
            "has_db_connection": db_manager.db is not None,
            "worker_service_url": os.getenv("WORKER_SERVICE_URL")
        },
        "message": "Worker service is running and ready to process analysis tasks"
    }


@router.post("/run-analysis", status_code=200)
async def run_analysis_worker(
    request: Request,
    background_tasks: BackgroundTasks,
    _=Depends(verify_gcp_task_request),
):
    """
    This worker receives a task, checks the job's analysis_persona,
    and calls the unified background function, passing the persona.
    """
    body = await request.json()
    user_id = body.get("user_id")
    job_id = body.get("job_id")

    if not user_id or not job_id:
        raise HTTPException(
            status_code=400, detail="Missing user_id or job_id in task payload"
        )

    # --- This logic to fetch the persona remains the same ---
    try:
        job_doc = db_manager.get_job_status(user_id, job_id)
        if not job_doc:
            raise HTTPException(status_code=404, detail=f"Job {job_id} not found.")

        request_data = job_doc.get("request_data", {})
        config = request_data.get("config", {})
        analysis_persona = config.get("analysis_persona", "general")

    except Exception as e:
        db_manager.update_job_status(
            user_id, job_id, "FAILED", f"Could not read job config: {e}"
        )
        raise HTTPException(
            status_code=500, detail=f"Failed to read job config for {job_id}."
        )

    # --- 2. THE ROUTING LOGIC IS NOW SIMPLIFIED ---
    # No more if/else block needed here.
    print(f"Routing job {job_id} with persona: '{analysis_persona}'")

    background_tasks.add_task(
        run_full_analysis,
        user_id=user_id,
        job_id=job_id,
        persona=analysis_persona,  # <-- 3. Pass the persona as an argument
    )

    return {"status": "acknowledged", "job_id": job_id}


# --- NEW: Open-Ended Grading Worker ---

@router.post("/grade-open-ended", status_code=200)
async def grade_open_ended_worker(
    request: Request,
    _=Depends(verify_gcp_task_request),
):
    """
    Worker endpoint to grade open-ended responses using the new migrated architecture.
    """
    body = await request.json()
    user_id = body.get("user_id")
    job_id = body.get("job_id")
    question_id = body.get("question_id")

    if not user_id or not job_id or not question_id:
        raise HTTPException(
            status_code=400, detail="Missing user_id, job_id, or question_id in task payload"
        )

    try:
        # Update grading status to PROCESSING in the new subcollection
        db_manager.update_open_ended_grading(user_id, job_id, question_id, "PROCESSING")
        
        # Get the question data from the new subcollection
        question_data = db_manager.get_open_ended_question_status(user_id, job_id, question_id)
        if not question_data:
            raise HTTPException(status_code=404, detail=f"Question {question_id} not found in job {job_id}.")

        # Get the analysis job to retrieve section data and questions
        job_doc = db_manager.get_job_status(user_id, job_id)
        if not job_doc:
            raise HTTPException(status_code=404, detail=f"Job {job_id} not found.")

        # Get open-ended questions from the main job document
        quiz_questions = job_doc.get("generated_quiz_questions", {})
        open_ended_questions = quiz_questions.get("open_ended_questions", [])
        
        print(f"DEBUG: Looking for question {question_id} in {len(open_ended_questions)} open-ended questions from main job document")
        
        if not open_ended_questions:
            raise HTTPException(status_code=404, detail=f"No open-ended questions found for job {job_id}.")

        # Find the specific question by index (since questions no longer have question_id)
        try:
            question_index = int(question_id) - 1  # Convert to 0-based index
            if question_index < 0 or question_index >= len(open_ended_questions):
                raise IndexError("Question index out of range")
            target_question = open_ended_questions[question_index]
        except (ValueError, IndexError):
            raise HTTPException(status_code=404, detail=f"Question {question_id} not found. Available questions: 1-{len(open_ended_questions)}")
        
        print(f"DEBUG: Found target question {question_id}: {target_question.get('question', 'No question text')}")
            
        # Get section results to find the relevant section for context
        section_results = db_manager.get_job_results_from_subcollection(user_id, job_id)
        if not section_results:
            raise HTTPException(status_code=404, detail=f"No section results found for job {job_id}.")
            
        # Find the relevant section based on the question's section_range
        relevant_section = None
        question_section_range = target_question.get("section_range", "")
        
        # Extract section number from section_range (e.g., "Section 1" -> 1, "Sections 1-2" -> 1)
        if "Section" in question_section_range:
            try:
                # Handle both "Section 1" and "Sections 1-2" formats
                section_part = question_section_range.split("Section")[1].strip()
                if section_part.startswith("s "):  # "Sections 1-2"
                    section_part = section_part[2:]
                section_number = int(section_part.split("-")[0].strip())
                section_index = section_number - 1  # Convert to 0-based index
                
                if 0 <= section_index < len(section_results):
                    relevant_section = section_results[section_index]
            except (ValueError, IndexError):
                # Fallback: use the first section if parsing fails
                relevant_section = section_results[0] if section_results else None
        
        if not relevant_section:
            # Fallback: use the first available section for context
            relevant_section = section_results[0]

        # Set up LLM for grading
        llm, options = clients.get_llm("best-lite", temperature=0.1)
        token_tracker = BaseCallbackHandler()
        runnable_config = RunnableConfig(callbacks=[token_tracker])

        # Grade the response using ONLY disclosed criteria (fair grading)
        grading_result = await grade_open_ended_response(
            user_answer=question_data["user_answer"],
            question=target_question["question"],
            question_metadata=target_question.get("metadata", {}),  # DISCLOSED ONLY
            runnable_config=runnable_config,
            transcript_excerpt=relevant_section.get("content", "")  # Optional context
        )

        # Update grading status with results in the new subcollection
        db_manager.update_open_ended_grading(user_id, job_id, question_id, "COMPLETED", grading_result)

        return {"status": "completed", "job_id": job_id, "question_id": question_id, "result": grading_result}

    except Exception as e:
        # Update grading status to FAILED in the new subcollection
        try:
            db_manager.update_open_ended_grading(user_id, job_id, question_id, "FAILED")
        except Exception as update_error:
            print(f"WARNING: Failed to update grading status to FAILED: {update_error}")
        
        print(f"ERROR: Failed to grade open-ended response: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to grade open-ended response: {e}"
        )