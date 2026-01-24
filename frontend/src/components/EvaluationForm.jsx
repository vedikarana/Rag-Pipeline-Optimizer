import React, { useState } from 'react';
import { Plus, X, Play } from 'lucide-react';

function EvaluationForm({ onEvaluate, isEvaluating }) {
  const [questions, setQuestions] = useState(['']);


  const addQuestion = () => {
    setQuestions([...questions, '']);
  };

  const updateQuestion = (index, value) => {
    const newQuestions = [...questions];
    newQuestions[index] = value;
    setQuestions(newQuestions);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const validQuestions = questions.filter(q => q.trim() !== '');
    if (validQuestions.length === 0) {
      alert('Please add at least one question');
      return;
    }
    onEvaluate(validQuestions);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white text-center mb-8">
        Evaluation Questions
      </h2>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((question, index) => (
          <div key={index} className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={question}
                onChange={(e) => updateQuestion(index, e.target.value)}
                placeholder={`Question ${index + 1}: What would you like to know?`}
                className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            {questions.length > 1 && (
              <button
                onClick={() => removeQuestion(index)}
                className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add Question Button */}
      <button
        onClick={addQuestion}
        className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
      >
        <Plus className="w-5 h-5" />
        Add Another Question
      </button>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isEvaluating}
        className="w-full bg-purple-500 hover:bg-purple-600 text-white py-4 rounded-lg font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
      >
        {isEvaluating ? (
          <>
            <Play className="w-5 h-5 animate-pulse" />
            Evaluating 4 Pipelines...
          </>
        ) : (
          <>
            <Play className="w-5 h-5" />
            Start Evaluation
          </>
        )}
      </button>

      {/* Quick Examples */}
      <div className="bg-slate-800/50 rounded-lg p-4">
        <p className="text-slate-300 text-sm mb-2">💡 Example Questions:</p>
        <ul className="text-slate-400 text-sm space-y-1">
          <li>• What is the main topic of this document?</li>
          <li>• Summarize the key findings</li>
          <li>• What recommendations are provided?</li>
        </ul>
      </div>
    </div>
  );
}

export default EvaluationForm;