'use client';

/**
 * Claims Analysis Page - Main component connecting all features
 * Route: /reports/claims-analysis
 */

import React, { useState, useCallback, useMemo } from 'react';
import { ClaimsTable } from './components/ClaimsTable';
import { MonthSelector, useMonthWindow } from './components/MonthSelector';
import { FileUploader } from './components/FileUploader';
import { ValidationBanner } from './components/ValidationBanner';
import { exportToCSV, exportToXLSX, prepareExportData } from './lib/exporter';
import { validateParsedData, ValidationMessage } from './lib/validator';
import { generateSampleFiles, downloadSampleFile, getCSVFormatDocs } from './utils/sample-data';
import { ProcessedData, ParseResult, TableRow, getSectionForRow } from './lib/schema';

interface PageState {
  data: ProcessedData | null;
  validationMessages: ValidationMessage[];
  isLoading: boolean;
}

export default function ClaimsAnalysisPage() {
  const [pageState, setPageState] = useState<PageState>({
    data: null,
    validationMessages: [],
    isLoading: false
  });

  const [showSampleFiles, setShowSampleFiles] = useState(false);
  const [showFormatDocs, setShowFormatDocs] = useState(false);

  // Month window management
  const availableMonths = pageState.data?.availableMonths || [];
  const [currentWindow, setCurrentWindow] = useMonthWindow(availableMonths);

  // Handle file processing
  const handleFileProcessed = useCallback((result: ParseResult) => {
    const validation = validateParsedData(result);
    
    setPageState({
      data: validation.canProceed ? result.data : null,
      validationMessages: validation.messages,
      isLoading: false
    });
  }, []);

  const handleProcessingStart = useCallback(() => {
    setPageState(prev => ({ ...prev, isLoading: true }));
  }, []);

  // Prepare table rows
  const tableRows = useMemo((): TableRow[] => {
    if (!pageState.data) return [];

    const rows: TableRow[] = [];
    
    pageState.data.data.forEach((rowData, rowLabel) => {
      rows.push({
        id: rowLabel,
        rowLabel,
        section: getSectionForRow(rowLabel),
        values: rowData,
        isVisible: true
      });
    });

    return rows;
  }, [pageState.data]);

  // Handle exports
  const handleExport = useCallback(async (format: 'csv' | 'xlsx') => {
    if (!pageState.data || !currentWindow.months.length) return;

    try {
      const exportData = prepareExportData(
        tableRows,
        currentWindow.months,
        currentWindow.startMonth,
        currentWindow.endMonth
      );

      if (format === 'csv') {
        await exportToCSV(exportData);
      } else {
        await exportToXLSX(exportData);
      }
    } catch (error) {
      console.error('Export failed:', error);
      // In a real app, you'd show a toast notification here
    }
  }, [pageState.data, currentWindow, tableRows]);

  // Sample files
  const sampleFiles = generateSampleFiles();
  const formatDocs = getCSVFormatDocs();

  const hasData = pageState.data && availableMonths.length > 0;
  const hasValidationMessages = pageState.validationMessages.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Claims Analysis
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Upload and analyze claims/budget data across rolling 12-month windows
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFormatDocs(!showFormatDocs)}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Format Requirements
                </button>
                <button
                  onClick={() => setShowSampleFiles(!showSampleFiles)}
                  className="text-sm bg-gray-100 text-gray-700 px-3 py-2 hover:bg-gray-200"
                >
                  Sample Files
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          
          {/* Sample Files Panel */}
          {showSampleFiles && (
            <div className="bg-white border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Sample Files</h3>
                <button
                  onClick={() => setShowSampleFiles(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="grid gap-4 md:grid-cols-3">
                {sampleFiles.map((file) => (
                  <div key={file.name} className="border border-gray-200 p-4">
                    <h4 className="font-medium text-gray-900 mb-2">{file.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{file.description}</p>
                    <button
                      onClick={() => downloadSampleFile(file)}
                      className="text-sm bg-blue-600 text-white px-3 py-2 hover:bg-blue-700"
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Format Documentation Panel */}
          {showFormatDocs && (
            <div className="bg-white border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">{formatDocs.title}</h3>
                <button
                  onClick={() => setShowFormatDocs(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-6">
                {formatDocs.sections.map((section) => (
                  <div key={section.heading}>
                    <h4 className="font-medium text-gray-900 mb-2">{section.heading}</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {section.content.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-gray-400 mt-1.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* File Upload */}
          {!hasData && (
            <div className="bg-white border border-gray-200 p-6">
              <FileUploader
                onFileProcessed={handleFileProcessed}
                onProcessingStart={handleProcessingStart}
                disabled={pageState.isLoading}
              />
            </div>
          )}

          {/* Validation Messages */}
          {hasValidationMessages && (
            <ValidationBanner messages={pageState.validationMessages} />
          )}

          {/* Data Analysis Interface */}
          {hasData && (
            <div className="space-y-6">
              {/* Controls */}
              <div className="bg-white border border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <MonthSelector
                    availableMonths={availableMonths}
                    selectedWindow={currentWindow}
                    onWindowChange={setCurrentWindow}
                  />
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setPageState({
                        data: null,
                        validationMessages: [],
                        isLoading: false
                      })}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      Upload New File
                    </button>
                    
                    <div className="h-4 w-px bg-gray-300" />
                    
                    <span className="text-sm text-gray-500">
                      {pageState.data.totalRowsProcessed.toLocaleString()} rows processed
                    </span>
                  </div>
                </div>
              </div>

              {/* Main Table */}
              <ClaimsTable
                data={pageState.data}
                visibleMonths={currentWindow.months}
                onExport={handleExport}
              />

              {/* Data Summary */}
              <div className="bg-white border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                  <div>
                    <div className="font-medium text-gray-900 mb-2">Data Coverage</div>
                    <div className="text-gray-600 space-y-1">
                      <div>Total months: {availableMonths.length}</div>
                      <div>Date range: {availableMonths[0]} to {availableMonths[availableMonths.length - 1]}</div>
                      <div>Current window: {currentWindow.months.length} months</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="font-medium text-gray-900 mb-2">Data Quality</div>
                    <div className="text-gray-600 space-y-1">
                      <div>Missing rows: {pageState.data.missingRows.length}</div>
                      <div>Ignored rows: {pageState.data.ignoredRows.length}</div>
                      <div>Total processed: {pageState.data.totalRowsProcessed.toLocaleString()}</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="font-medium text-gray-900 mb-2">Export Options</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleExport('csv')}
                        className="px-3 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Export CSV
                      </button>
                      <button
                        onClick={() => handleExport('xlsx')}
                        className="px-3 py-2 text-sm bg-green-600 text-white hover:bg-green-700"
                      >
                        Export Excel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {pageState.isLoading && (
            <div className="bg-white border border-gray-200 p-6">
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-gray-600">Processing your file...</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}