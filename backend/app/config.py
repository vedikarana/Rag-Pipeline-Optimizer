import os
from dotenv import load_dotenv
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
env_path = backend_dir / '.env'
load_dotenv(dotenv_path=env_path)
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "dummy")

if not GROQ_API_KEY:
    raise ValueError(f"GROQ_API_KEY not found. Check .env at: {env_path}")

print(f"✓ Loaded Groq API key: {GROQ_API_KEY[:20]}...")
print("✓ Using FREE Groq API for evaluations!")