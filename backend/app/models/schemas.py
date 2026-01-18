from pydantic import BaseModel
from typing import List, Optional, Dict

class PipelineConfig(BaseModel):
    name: str
    chunk_size: int
    overlap: int
    embedder: str
    reranker: Optional[str] = None

class EvaluationMetrics(BaseModel):
    accuracy: float
    relevance: float
    completeness: float
    reasoning: str
    cost: float

class PipelineResult(BaseModel):
    pipeline_name: str
    answer: str
    retrieved_context: List[str]
    metrics: EvaluationMetrics
    processing_time: float

class EvaluationRequest(BaseModel):
    test_questions: List[str]

class EvaluationResponse(BaseModel):
    results: List[Dict[str, PipelineResult]]
    winner: str
    summary: Dict[str, Dict[str, float]]