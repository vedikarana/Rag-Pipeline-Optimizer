import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X } from 'lucide-react';

function FileUpload({ onUpload }) {
  const [files, setFiles] = React.useState([]);

  const onDrop = useCallback((acceptedFiles) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }
  });

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
  if (files.length === 0) {
    alert('Please select at least one file');
    return;
  }
  
  // Show loading message
  if (!window.confirm(`Upload and process ${files.length} file(s)? This will take 30-60 seconds.`)) {
    return;
  }
  
  onUpload(files);
};

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white text-center mb-8">
        Upload Your Documents
      </h2>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-4 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
          isDragActive 
            ? 'border-purple-400 bg-purple-900/20' 
            : 'border-slate-600 hover:border-purple-500 bg-slate-800/50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-16 h-16 text-purple-400 mx-auto mb-4" />
        <p className="text-white text-xl mb-2">
          {isDragActive ? 'Drop files here...' : 'Drag & drop files here'}
        </p>
        <p className="text-slate-400">
          or click to browse (PDF, TXT, DOCX)
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-white">
            Selected Files ({files.length})
          </h3>
          {files.map((file, index) => (
            <div key={index} className="bg-slate-700 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <File className="w-5 h-5 text-purple-400" />
                <span className="text-white">{file.name}</span>
                <span className="text-slate-400 text-sm">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="text-red-400 hover:text-red-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={files.length === 0}
        className="w-full bg-purple-500 hover:bg-purple-600 text-white py-4 rounded-lg font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Upload {files.length} {files.length === 1 ? 'File' : 'Files'}
      </button>
    </div>
  );
}

export default FileUpload;