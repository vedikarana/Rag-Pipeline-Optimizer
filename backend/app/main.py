import os
import shutil
from typing import List, Dict, Optional

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.config import OPENAI_API_KEY
from app.models.schemas import (
    EvaluationRequest,
    EvaluationResponse,
    PipelineResult,
    EvaluationMetrics,
)
from app.pipelines.rag_engine import RAGComparator
from app.evaluators.gpt_judge import GPTJudge

# --------------------------------------------------
# FastAPI App
# --------------------------------------------------
app = FastAPI(
    title="RAG Pipeline Optimizer",
    description="Compare and optimize RAG configurations",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# Global State
# --------------------------------------------------
rag_comparator: Optional[RAGComparator] = None
uploaded_files: List[str] = []

# --------------------------------------------------
# Health Check
# --------------------------------------------------
@app.get("/")
async def root():
    return {
        "status": "healthy",
        "api_key_loaded": bool(OPENAI_API_KEY),
        "pipelines_ready": rag_comparator is not None,
    }

# --------------------------------------------------
# Upload Documents
# --------------------------------------------------
@app.post("/upload")
async def upload_documents(files: List[UploadFile] = File(...)):
    global uploaded_files

    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    upload_dir = "./data/uploads"
    if os.path.exists(upload_dir):
        shutil.rmtree(upload_dir)

    os.makedirs(upload_dir, exist_ok=True)
    uploaded_files = []

    for file in files:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in [".pdf", ".txt", ".docx"]:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {ext}",
            )

        file_path = os.path.join(upload_dir, file.filename)
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        uploaded_files.append(file_path)

    return {
        "message": f"{len(uploaded_files)} files uploaded",
        "files": [os.path.basename(f) for f in uploaded_files],
    }

# --------------------------------------------------
# Ingest Documents
# --------------------------------------------------
@app.post("/ingest")
async def ingest_documents():
    global rag_comparator

    if not uploaded_files:
        raise HTTPException(status_code=400, detail="Upload documents first")

    rag_comparator = RAGComparator()
    rag_comparator.ingest_documents(uploaded_files)

    return {
        "message": "Documents ingested successfully",
        "pipelines": list(rag_comparator.pipelines.keys()),
    }

# --------------------------------------------------
# Evaluate Pipelines
# --------------------------------------------------
@app.post("/evaluate", response_model=EvaluationResponse)
async def evaluate_pipelines(request: EvaluationRequest):
    if not rag_comparator:
        raise HTTPException(
            status_code=400,
            detail="No pipelines initialized. Run /ingest first.",
        )

    if not request.test_questions:
        raise HTTPException(status_code=400, detail="No test questions provided")

    judge = GPTJudge()

    print("\n🚀 Running RAG comparison...")
    raw_results = rag_comparator.compare_pipelines(request.test_questions)

    evaluated_results = []

    for question, pipeline_outputs in raw_results.items():
        question_result = {}

        for pipeline_name, output in pipeline_outputs.items():
            scores = judge.evaluate(
                question=question,
                answer=output["answer"],
                context=output["context"],
            )

            metrics = EvaluationMetrics(
                accuracy=scores["accuracy"],
                relevance=scores["relevance"],
                completeness=scores["completeness"],
                reasoning=scores["reasoning"],
                cost=output["cost"],
            )

            question_result[pipeline_name] = PipelineResult(
                pipeline_name=pipeline_name,
                answer=output["answer"],
                retrieved_context=output["context"],
                metrics=metrics,
                processing_time=output["processing_time"],
            )

        evaluated_results.append(question_result)

    winner, summary = calculate_winner(evaluated_results)

    return EvaluationResponse(
        results=evaluated_results,
        winner=winner,
        summary=summary,
    )

# --------------------------------------------------
# Winner Calculation
# --------------------------------------------------
def calculate_winner(results: List[Dict]) -> tuple:
    scores = {}

    for question in results:
        for name, result in question.items():
            scores.setdefault(
                name,
                {"acc": 0, "rel": 0, "comp": 0, "cost": 0, "count": 0},
            )

            scores[name]["acc"] += result.metrics.accuracy
            scores[name]["rel"] += result.metrics.relevance
            scores[name]["comp"] += result.metrics.completeness
            scores[name]["cost"] += result.metrics.cost
            scores[name]["count"] += 1

    summary = {}
    winner = None
    best_score = -1

    for name, s in scores.items():
        c = s["count"]
        composite = (s["acc"] * s["rel"] * s["comp"]) / (s["cost"] * 1000 + 1)

        summary[name] = {
            "avg_accuracy": round(s["acc"] / c, 2),
            "avg_relevance": round(s["rel"] / c, 2),
            "avg_completeness": round(s["comp"] / c, 2),
            "avg_cost": round(s["cost"] / c, 6),
            "composite_score": round(composite, 2),
        }

        if composite > best_score:
            best_score = composite
            winner = name

    return winner, summary

# --------------------------------------------------
# Status
# --------------------------------------------------
@app.get("/status")
async def status():
    return {
        "documents_uploaded": len(uploaded_files),
        "pipelines_ready": rag_comparator is not None,
    }

# --------------------------------------------------
# Run Server
# --------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
