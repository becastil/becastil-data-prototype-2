'use client';

/**
 * FileUploader component with drag-and-drop CSV upload
 * Handles file validation and parsing with progress feedback
 */

import React, { useCallback, useState } from 'react';
import { validateFile } from '../lib/validator';
import { parseCSVFile } from '../lib/parser';
import { ParseResult } from '../lib/schema';

interface FileUploaderProps {
  onFileProcessed: (result: ParseResult) => void;
  onProcessingStart?: () => void;
  className?: string;
  disabled?: boolean;
}

interface FileState {
  file: File | null;
  isProcessing: boolean;
  progress: number;
  dragActive: boolean;
}

export function FileUploader({
  onFileProcessed,
  onProcessingStart,
  className = '',
  disabled = false
}: FileUploaderProps) {
  const [fileState, setFileState] = useState<FileState>({
    file: null,
    isProcessing: false,
    progress: 0,
    dragActive: false
  });

  // Handle file processing
  const processFile = useCallback(async (file: File) => {
    // Validate file first
    const fileValidation = validateFile(file);
    if (!fileValidation.canProceed) {
      onFileProcessed({
        data: {
          data: new Map(),
          availableMonths: [],
          missingRows: [],
          ignoredRows: [],
          totalRowsProcessed: 0
        },
        errors: fileValidation.messages.filter(m => m.type === 'error').map(m => m.message),
        warnings: fileValidation.messages.filter(m => m.type === 'warning').map(m => m.message)
      });
      return;
    }

    setFileState(prev => ({ 
      ...prev, 
      file, 
      isProcessing: true, 
      progress: 0 
    }));
    
    onProcessingStart?.();

    try {
      // Simulate progress updates during parsing
      const progressInterval = setInterval(() => {
        setFileState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 200);

      const result = await parseCSVFile(file);

      clearInterval(progressInterval);
      
      setFileState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        progress: 100 
      }));

      // Brief delay to show completion
      setTimeout(() => {
        onFileProcessed(result);
        setFileState(prev => ({ ...prev, progress: 0 }));
      }, 300);

    } catch (error) {
      setFileState(prev => ({ ...prev, isProcessing: false, progress: 0 }));
      
      onFileProcessed({
        data: {
          data: new Map(),
          availableMonths: [],
          missingRows: [],
          ignoredRows: [],
          totalRowsProcessed: 0
        },
        errors: [`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      });
    }
  }, [onFileProcessed, onProcessingStart]);

  // Handle file input change
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setFileState(prev => ({ ...prev, dragActive: true }));
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFileState(prev => ({ ...prev, dragActive: false }));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setFileState(prev => ({ ...prev, dragActive: false }));
    
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile, disabled]);

  // Reset file state
  const handleReset = useCallback(() => {
    setFileState({
      file: null,
      isProcessing: false,
      progress: 0,
      dragActive: false
    });
  }, []);

  const { file, isProcessing, progress, dragActive } = fileState;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed transition-colors duration-200
          ${dragActive && !disabled 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300'
          }
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
          p-8 text-center
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          disabled={disabled || isProcessing}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          aria-label="Upload CSV file"
        />
        
        {isProcessing ? (
          <div className="space-y-4">
            <div className="text-blue-600">
              <svg className="w-8 h-8 mx-auto animate-spin" fill="none" viewBox="0 0 24 24">
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Processing {file?.name}...
              </p>
              <div className="w-full bg-gray-200 h-2">
                <div 
                  className="bg-blue-600 h-2 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {progress}%
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-gray-400">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            
            <div>
              <p className="text-lg font-medium text-gray-900">
                {dragActive ? 'Drop your CSV file here' : 'Upload Claims Data'}
              </p>
              <p className="text-sm text-gray-500">
                Drag and drop a CSV file, or click to select
              </p>
            </div>
            
            <div className="text-xs text-gray-400 space-y-1">
              <p>Supported formats: .csv files up to 50MB</p>
              <p>Required columns: Category + month data</p>
            </div>
          </div>
        )}
      </div>

      {/* File Info */}
      {file && !isProcessing && (
        <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="text-green-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {file.name}
              </p>
              <p className="text-xs text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          
          <button
            onClick={handleReset}
            className="text-sm text-gray-500 hover:text-gray-700"
            disabled={isProcessing}
          >
            Remove
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-gray-500 space-y-2">
        <div>
          <strong>CSV Format Requirements:</strong>
        </div>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>First column must be named "Category"</li>
          <li>Month columns in format: MMM-YY, MMMM YYYY, or YYYY-MM</li>
          <li>Up to 48 months of historical data supported</li>
          <li>Unknown categories will be ignored (with notification)</li>
        </ul>
      </div>
    </div>
  );
}