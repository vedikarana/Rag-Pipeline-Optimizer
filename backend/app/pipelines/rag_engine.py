import os
import time
import httpx
from typing import List, Dict
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader
from langchain.schema import Document
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

class RAGPipeline:
    """Single RAG pipeline with specific configuration"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.name = config['name']
        self.chunk_size = config['chunk_size']
        self.overlap = config['overlap']
        self.embedder_name = config['embedder']
        self.reranker = config.get('reranker')
        
        # Initialize FREE embeddings
        self.embeddings = self._get_embeddings()
        self.vectorstore = None
        
        # Initialize Groq client
        self.groq_client = Groq(
    api_key=os.getenv("GROQ_API_KEY"),
    http_client=httpx.Client()
)
        
        # Cost tracking
        self.embedding_tokens = 0
        self.generation_tokens = 0
    
    def _get_embeddings(self):
        """Get FREE embedding model using sentence-transformers"""
        if self.embedder_name == "text-embedding-3-large":
            model_name = "sentence-transformers/all-mpnet-base-v2"
        elif self.embedder_name == "text-embedding-3-small":
            model_name = "sentence-transformers/all-MiniLM-L6-v2"
        else:
            model_name = "sentence-transformers/all-MiniLM-L6-v2"
        
        return HuggingFaceEmbeddings(
            model_name=model_name,
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True}
        )
    
    def load_documents(self, file_paths: List[str]) -> List[Document]:
        """Load documents from various file types"""
        documents = []
        
        for file_path in file_paths:
            try:
                if file_path.endswith('.pdf'):
                    loader = PyPDFLoader(file_path)
                elif file_path.endswith('.docx'):
                    loader = Docx2txtLoader(file_path)
                elif file_path.endswith('.txt'):
                    loader = TextLoader(file_path, encoding='utf-8')
                else:
                    print(f"Unsupported file type: {file_path}")
                    continue
                
                docs = loader.load()
                documents.extend(docs)
                print(f"✓ Loaded {len(docs)} pages from {os.path.basename(file_path)}")
            except Exception as e:
                print(f"✗ Error loading {file_path}: {str(e)}")
        
        return documents
    
    def chunk_documents(self, documents: List[Document]) -> List[Document]:
        """Split documents into chunks"""
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.overlap,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
        
        chunks = text_splitter.split_documents(documents)
        print(f"✓ Created {len(chunks)} chunks (size={self.chunk_size}, overlap={self.overlap})")
        
        self.embedding_tokens = sum(len(chunk.page_content.split()) for chunk in chunks)
        
        return chunks
    
    def build_vectorstore(self, chunks: List[Document]):
        """Create vector database from chunks"""
        persist_directory = f"./data/vectordb/{self.name}"
        
        self.vectorstore = Chroma.from_documents(
            documents=chunks,
            embedding=self.embeddings,
            persist_directory=persist_directory
        )
        
        print(f"✓ Built vector database for {self.name}")
    
    def query(self, question: str) -> Dict:
        """Query the RAG pipeline using Groq directly"""
        if not self.vectorstore:
            raise ValueError("Vector store not initialized. Call build_vectorstore first.")
        
        start_time = time.time()
        
        # Retrieve relevant documents
        retriever = self.vectorstore.as_retriever(search_kwargs={"k": 4})
        retrieved_docs = retriever.get_relevant_documents(question)
        
        # Format context from retrieved documents
        context_text = "\n\n".join([doc.page_content for doc in retrieved_docs])
        
        # Create prompt for Groq
        prompt = f"""Based on the following context, answer the question.

Context:
{context_text}

Question: {question}

Answer:"""
        
        # Generate answer using Groq API directly
        try:
            chat_completion = self.groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that answers questions based on the provided context."},
                    {"role": "user", "content": prompt}
                ],
                model="llama-3.1-8b-instant",
                temperature=0,
                max_tokens=500
            )
            
            answer = chat_completion.choices[0].message.content
            
        except Exception as e:
            print(f"Error calling Groq API: {e}")
            answer = "Error generating answer"
        
        processing_time = time.time() - start_time
        
        # Extract context
        context = [doc.page_content for doc in retrieved_docs]
        
        # Estimate generation tokens
        self.generation_tokens += len(answer.split())
        
        return {
            'answer': answer,
            'context': context,
            'processing_time': processing_time
        }
    
    def calculate_cost(self) -> float:
        """Calculate cost - all FREE now!"""
        return 0.0


class RAGComparator:
    """Manages multiple RAG pipelines for comparison"""
    
    def __init__(self):
        self.pipelines = self._initialize_pipelines()
    
    def _initialize_pipelines(self) -> Dict[str, RAGPipeline]:
        """Initialize 4 different RAG configurations"""
        configs = {
            "pipeline_a": {
                "name": "pipeline_a",
                "chunk_size": 512,
                "overlap": 50,
                "embedder": "text-embedding-3-small",
                "reranker": None
            },
            "pipeline_b": {
                "name": "pipeline_b",
                "chunk_size": 1024,
                "overlap": 100,
                "embedder": "text-embedding-3-large",
                "reranker": None
            },
            "pipeline_c": {
                "name": "pipeline_c",
                "chunk_size": 256,
                "overlap": 25,
                "embedder": "text-embedding-3-small",
                "reranker": None
            },
            "pipeline_d": {
                "name": "pipeline_d",
                "chunk_size": 800,
                "overlap": 80,
                "embedder": "text-embedding-3-small",
                "reranker": None
            }
        }
        
        return {name: RAGPipeline(config) for name, config in configs.items()}
    
    def ingest_documents(self, file_paths: List[str]):
        """Ingest documents into all pipelines"""
        print("\n📚 INGESTING DOCUMENTS INTO ALL PIPELINES...")
        print("=" * 60)
        
        for name, pipeline in self.pipelines.items():
            print(f"\n🔧 Building {name}...")
            
            # Load documents
            documents = pipeline.load_documents(file_paths)
            
            # Chunk documents
            chunks = pipeline.chunk_documents(documents)
            
            # Build vector store
            pipeline.build_vectorstore(chunks)
        
        print("\n✅ All pipelines ready!")
    
    def compare_pipelines(self, questions: List[str]) -> Dict:
        """Run all questions through all pipelines"""
        results = {}
        
        for question in questions:
            print(f"\n❓ Question: {question}")
            question_results = {}
            
            for name, pipeline in self.pipelines.items():
                result = pipeline.query(question)
                result['cost'] = pipeline.calculate_cost()
                question_results[name] = result
                
                print(f"  ✓ {name}: {result['processing_time']:.2f}s (FREE!)")
            
            results[question] = question_results
        
        return results