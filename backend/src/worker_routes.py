from fastapi import APIRouter, Depends, Request, BackgroundTasks, HTTPException
from src import db_manager
from src.pipeline import run_full_analysis  # <-- 1. IMPORT from your new file
from src.security import verify_gcp_task_request

router = APIRouter()


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
