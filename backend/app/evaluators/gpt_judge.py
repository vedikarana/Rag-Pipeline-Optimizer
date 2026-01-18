import json
import os
import httpx
from groq import Groq
from typing import Dict
from dotenv import load_dotenv

# Load environment variables FIRST
load_dotenv()

class GPTJudge:
    """Evaluates RAG outputs using Groq's FREE LLMs"""
    
    def __init__(self):
        # Using Groq's fast and FREE models
        self.model = "llama-3.1-8b-instant"
        # Initialize client INSIDE __init__, not at class level
        self.client = Groq(
    api_key=os.getenv("GROQ_API_KEY"),
    http_client=httpx.Client()
)
    
    def evaluate(self, question: str, answer: str, context: list) -> Dict:
        """Evaluate a single RAG output"""
        
        prompt = f"""You are evaluating a RAG (Retrieval-Augmented Generation) system's output.

QUESTION: {question}

RETRIEVED CONTEXT:
{self._format_context(context)}

GENERATED ANSWER:
{answer}

Evaluate this answer on three dimensions (rate 1-10):

1. ACCURACY: Is the answer factually correct based on the retrieved context?
2. RELEVANCE: Does it directly answer the question asked?
3. COMPLETENESS: Does it cover all important aspects of the question?

Respond ONLY with valid JSON in this exact format:
{{
  "accuracy": <score 1-10>,
  "relevance": <score 1-10>,
  "completeness": <score 1-10>,
  "reasoning": "<brief explanation of scores>"
}}"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert RAG system evaluator. Always respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=300
            )
            
            result_text = response.choices[0].message.content.strip()
            
            # Remove markdown code blocks if present
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()
            
            # Parse JSON response
            result = json.loads(result_text)
            
            # Validate scores are in range
            for key in ['accuracy', 'relevance', 'completeness']:
                if key not in result:
                    result[key] = 5
                result[key] = max(1, min(10, result[key]))
            
            return result
            
        except json.JSONDecodeError:
            print(f"⚠️  Failed to parse JSON. Response: {result_text}")
            return {
                "accuracy": 5,
                "relevance": 5,
                "completeness": 5,
                "reasoning": "Error in evaluation"
            }
        except Exception as e:
            print(f"⚠️  Error: {str(e)}")
            return {
                "accuracy": 5,
                "relevance": 5,
                "completeness": 5,
                "reasoning": f"Error: {str(e)}"
            }
    
    def _format_context(self, context: list) -> str:
        """Format retrieved context for the prompt"""
        formatted = ""
        for i, chunk in enumerate(context, 1):
            formatted += f"[Context {i}]: {chunk}\n\n"
        return formatted