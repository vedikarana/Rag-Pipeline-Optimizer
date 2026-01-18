import React from 'react';
import { Clock, Trophy, ChevronRight } from 'lucide-react';

function HistoryPanel({ history, onSelect }) {
  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <Clock className="w-6 h-6" />
        Evaluation History
      </h3>
      
      <div className="space-y-3">
        {history.map((item, index) => (
          <button
            key={index}
            onClick={() => onSelect(item)}
            className="w-full bg-slate-800 hover:bg-slate-700 rounded-lg p-4 text-left transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span className="text-white font-semibold">
                    Winner: {item.winner.replace('pipeline_', 'Pipeline ').toUpperCase()}
                  </span>
                </div>
                <div className="text-slate-400 text-sm">
                  {new Date(item.timestamp).toLocaleString()}
                </div>
                <div className="text-slate-500 text-xs mt-1">
                  {item.questions?.length || 0} questions evaluated
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-purple-400 transition-colors" />
            </div>
            
            {/* Mini metrics preview */}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-700">
              <div>
                <div className="text-slate-500 text-xs">Accuracy</div>
                <div className="text-purple-400 font-semibold">
                  {item.summary[item.winner].avg_accuracy.toFixed(1)}
                </div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">Relevance</div>
                <div className="text-blue-400 font-semibold">
                  {item.summary[item.winner].avg_relevance.toFixed(1)}
                </div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">Score</div>
                <div className="text-white font-semibold">
                  {item.summary[item.winner].composite_score.toFixed(0)}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default HistoryPanel;