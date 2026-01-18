import requests
import json

BASE_URL = "http://localhost:8000"

def test_health_check():
    """Test if API is running"""
    print("\n1️⃣  Testing health check...")
    response = requests.get(f"{BASE_URL}/")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    return response.status_code == 200

def test_upload_documents():
    """Test document upload"""
    print("\n2️⃣  Testing document upload...")
    
    # Create a sample text file
    with open("sample_doc.txt", "w") as f:
        f.write("""
        RAG Systems Overview
        
        Retrieval-Augmented Generation (RAG) is a technique that combines information retrieval 
        with language generation. It works by first retrieving relevant documents from a knowledge 
        base, then using those documents as context for generating responses.
        
        Key components of RAG:
        1. Document Chunking: Breaking documents into smaller pieces (chunks)
        2. Embeddings: Converting text into vector representations
        3. Vector Database: Storing and retrieving similar chunks
        4. Generation: Using an LLM to synthesize answers from retrieved chunks
        
        Common chunk sizes range from 256 to 1024 tokens, with overlap between chunks to 
        maintain context continuity.
        """)
    
    files = {'files': open('sample_doc.txt', 'rb')}
    response = requests.post(f"{BASE_URL}/upload", files=files)
    
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    return response.status_code == 200

def test_ingest():
    """Test document ingestion"""
    print("\n3️⃣  Testing document ingestion...")
    print("   ⏳ This may take 30-60 seconds...")
    
    response = requests.post(f"{BASE_URL}/ingest")
    
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    return response.status_code == 200

def test_evaluation():
    """Test pipeline evaluation"""
    print("\n4️⃣  Testing evaluation...")
    print("   ⏳ This may take 1-2 minutes...")
    
    test_questions = [
        "What is RAG?",
        "What are the key components of a RAG system?",
        "What are common chunk sizes used in RAG systems?"
    ]
    
    payload = {
        "test_questions": test_questions
    }
    
    response = requests.post(
        f"{BASE_URL}/evaluate",
        json=payload,
        timeout=300  # 5 minute timeout
    )
    
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\n   🏆 WINNER: {result['winner']}")
        print(f"\n   📊 SUMMARY:")
        for pipeline, metrics in result['summary'].items():
            print(f"      {pipeline}:")
            print(f"         Accuracy: {metrics['avg_accuracy']}")
            print(f"         Relevance: {metrics['avg_relevance']}")
            print(f"         Completeness: {metrics['avg_completeness']}")
            print(f"         Cost: ${metrics['avg_cost']}")
            print(f"         Composite Score: {metrics['composite_score']}")
    else:
        print(f"   Error: {response.text}")
    
    return response.status_code == 200

def run_all_tests():
    """Run all tests in sequence"""
    print("=" * 70)
    print("🧪 RUNNING RAG PIPELINE OPTIMIZER TESTS")
    print("=" * 70)
    
    tests = [
        ("Health Check", test_health_check),
        ("Document Upload", test_upload_documents),
        ("Document Ingestion", test_ingest),
        ("Pipeline Evaluation", test_evaluation)
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            success = test_func()
            results.append((test_name, success))
            if not success:
                print(f"\n   ❌ {test_name} failed! Stopping tests.")
                break
        except Exception as e:
            print(f"\n   ❌ {test_name} error: {str(e)}")
            results.append((test_name, False))
            break
    
    # Print summary
    print("\n" + "=" * 70)
    print("📊 TEST SUMMARY")
    print("=" * 70)
    for test_name, success in results:
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{status} - {test_name}")
    
    print("=" * 70)

if __name__ == "__main__":
    run_all_tests()