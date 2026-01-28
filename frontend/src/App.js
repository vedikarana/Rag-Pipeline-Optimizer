import React, { useState } from 'react';
import { Upload, Play, Download, BarChart3, Trophy, Clock } from 'lucide-react';
import axios from 'axios';
import FileUpload from './components/FileUpload';
import EvaluationForm from './components/EvaluationForm';
import ResultsDashboard from './components/ResultsDashboard';
import HistoryPanel from './components/HistoryPanel';

const API_URL = process.env.REACT_APP_API_URL || 'https://rag-optimizer-api.onrender.com';

function App() {
  const [step, setStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isIngesting, setIsIngesting] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [results, setResults] = useState(null);
  const [history, setHistory] = useState([]);

  const handleFileUpload = async (files) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadedFiles(response.data.files);
      setStep(2);
    } catch (error) {
      alert('Upload failed: ' + error.message);
    }
  };

  const handleIngest = async () => {
  setIsIngesting(true);
  try {
    console.log("Starting ingestion...");
    const response = await axios.post(`${API_URL}/ingest`, {}, {
      timeout: 300000  // 5 MINUTE timeout
    });
    console.log("Ingestion response:", response.data);
    setStep(3);
  } catch (error) {
    console.error("Ingestion error:", error);
    console.error("Error details:", error.response?.data);
    alert('Ingestion failed: ' + (error.response?.data?.detail || error.message));
  } finally {
    setIsIngesting(false);
  }
};
  
      
      setResults(resultWithTimestamp);
      setHistory([resultWithTimestamp, ...history].slice(0, 10));
      setStep(4);
    } catch (error) {
      alert('Evaluation failed: ' + error.message);
    } finally {
      setIsEvaluating(false);
    }
  };
const handleEvaluate = async (questions) => {
  setIsEvaluating(true);
  try {
    console.log("⏳ Evaluating 4 pipelines... This may take 1-2 minutes");
    
    const response = await axios.post(`${API_URL}/evaluate`, {
      test_questions: questions
    }, {
      timeout: 180000  // 3 minute timeout
    });
    
    // ... rest of code
  }
};
  const exportResults = () => {
    if (!results) return;
    
    const csv = generateCSV(results);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rag-evaluation-${new Date().toISOString()}.csv`;
    a.click();
  };

  const generateCSV = (data) => {
    const headers = ['Pipeline', 'Avg Accuracy', 'Avg Relevance', 'Avg Completeness', 'Cost', 'Composite Score'];
    const rows = Object.entries(data.summary).map(([pipeline, metrics]) => [
      pipeline,
      metrics.avg_accuracy,
      metrics.avg_relevance,
      metrics.avg_completeness,
      metrics.avg_cost,
      metrics.composite_score
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const resetWorkflow = () => {
    setStep(1);
    setUploadedFiles([]);
    setResults(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <BarChart3 className="w-12 h-12 text-purple-400" />
            <h1 className="text-5xl font-bold text-white">
              RAG Pipeline Optimizer
            </h1>
          </div>
          <p className="text-purple-200 text-lg">
            Compare, Evaluate, and Optimize your RAG configurations
          </p>
        </header>

        {/* Progress Steps */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-4">
            {[
              { num: 1, icon: Upload, label: 'Upload' },
              { num: 2, icon: Play, label: 'Ingest' },
              { num: 3, icon: BarChart3, label: 'Evaluate' },
              { num: 4, icon: Trophy, label: 'Results' }
            ].map(({ num, icon: Icon, label }) => (
              <React.Fragment key={num}>
                <div className={`flex flex-col items-center ${step >= num ? 'opacity-100' : 'opacity-40'}`}>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    step >= num ? 'bg-purple-500' : 'bg-slate-700'
                  } transition-all duration-300`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-white text-sm mt-2">{label}</span>
                </div>
                {num < 4 && (
                  <div className={`w-16 h-1 ${step > num ? 'bg-purple-500' : 'bg-slate-700'} transition-all duration-300`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="glass rounded-2xl p-8 mb-8">
          {step === 1 && (
            <FileUpload onUpload={handleFileUpload} />
          )}

          {step === 2 && (
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-6">Files Uploaded!</h2>
              <div className="mb-8">
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="bg-slate-700 rounded-lg p-4 mb-2">
                    <span className="text-white">📄 {file}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleIngest}
                disabled={isIngesting}
                className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isIngesting ? (
                  <span className="flex items-center gap-2">
                    <Clock className="w-5 h-5 animate-spin" />
                    Ingesting into 4 pipelines...
                  </span>
                ) : (
                  'Ingest Documents'
                )}
              </button>
            </div>
          )}

          {step === 3 && (
            <EvaluationForm 
              onEvaluate={handleEvaluate}
              isEvaluating={isEvaluating}
            />
          )}

          {step === 4 && results && (
            <>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-white">Evaluation Results</h2>
                <div className="flex gap-4">
                  <button
                    onClick={exportResults}
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Export CSV
                  </button>
                  <button
                    onClick={resetWorkflow}
                    className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-semibold"
                  >
                    New Evaluation
                  </button>
                </div>
              </div>
              <ResultsDashboard results={results} />
            </>
          )}
        </div>

        {/* History Panel */}
        {history.length > 0 && (
          <HistoryPanel 
            history={history}
            onSelect={(item) => setResults(item)}
          />
        )}

      </div>
    </div>
  );
}

export default App;