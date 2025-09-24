'use client';

/**
 * MonthSelector component for 12-month window selection
 * Provides dropdown to select starting month for a rolling 12-month view
 */

import React, { useMemo } from 'react';
import { MonthKey, MonthWindow, DEFAULT_WINDOW_SIZE } from '../lib/schema';

interface MonthSelectorProps {
  availableMonths: MonthKey[];
  selectedWindow: MonthWindow;
  onWindowChange: (window: MonthWindow) => void;
  windowSize?: number;
  className?: string;
}

export function MonthSelector({
  availableMonths,
  selectedWindow,
  onWindowChange,
  windowSize = DEFAULT_WINDOW_SIZE,
  className = ''
}: MonthSelectorProps) {
  // Calculate all possible start months that yield a full window
  const validStartMonths = useMemo(() => {
    if (availableMonths.length < windowSize) {
      // If we have fewer months than window size, just use all available
      return availableMonths.length > 0 ? [availableMonths[0]] : [];
    }

    const validStarts: { month: MonthKey; endMonth: MonthKey; label: string }[] = [];
    
    for (let i = 0; i <= availableMonths.length - windowSize; i++) {
      const startMonth = availableMonths[i];
      const endMonth = availableMonths[i + windowSize - 1];
      
      // Create human-readable label
      const startLabel = formatMonthLabel(startMonth);
      const endLabel = formatMonthLabel(endMonth);
      const label = `${startLabel} to ${endLabel}`;
      
      validStarts.push({
        month: startMonth,
        endMonth,
        label
      });
    }
    
    return validStarts;
  }, [availableMonths, windowSize]);

  // Handle window change
  const handleWindowChange = (startMonth: MonthKey) => {
    const startIndex = availableMonths.indexOf(startMonth);
    if (startIndex === -1) return;
    
    const endIndex = Math.min(startIndex + windowSize - 1, availableMonths.length - 1);
    const months = availableMonths.slice(startIndex, endIndex + 1);
    
    const newWindow: MonthWindow = {
      startMonth,
      endMonth: availableMonths[endIndex],
      months
    };
    
    onWindowChange(newWindow);
  };

  // Format month for display
  function formatMonthLabel(monthKey: MonthKey): string {
    try {
      const date = new Date(monthKey + '-01');
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      });
    } catch {
      return monthKey;
    }
  }

  // Get current window info
  const currentWindowInfo = useMemo(() => {
    if (selectedWindow.months.length === 0) {
      return 'No data available';
    }
    
    const startLabel = formatMonthLabel(selectedWindow.startMonth);
    const endLabel = formatMonthLabel(selectedWindow.endMonth);
    const monthCount = selectedWindow.months.length;
    
    if (monthCount === windowSize) {
      return `${monthCount}-month window: ${startLabel} to ${endLabel}`;
    } else {
      return `${monthCount} months available: ${startLabel} to ${endLabel}`;
    }
  }, [selectedWindow, windowSize]);

  if (availableMonths.length === 0) {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <label className="text-sm font-medium text-gray-700">
          Date Range:
        </label>
        <span className="text-sm text-gray-500">
          No data available
        </span>
      </div>
    );
  }

  if (validStartMonths.length <= 1) {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <label className="text-sm font-medium text-gray-700">
          Date Range:
        </label>
        <span className="text-sm text-gray-900">
          {currentWindowInfo}
        </span>
        {availableMonths.length < windowSize && (
          <span className="text-xs text-amber-600">
            (Only {availableMonths.length} months available)
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <label htmlFor="month-window-select" className="text-sm font-medium text-gray-700">
        Date Range:
      </label>
      
      <div className="flex items-center gap-2">
        <select
          id="month-window-select"
          value={selectedWindow.startMonth}
          onChange={(e) => handleWindowChange(e.target.value)}
          className="block px-3 py-2 text-sm border border-gray-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-label="Select date range for analysis"
        >
          {validStartMonths.map(({ month, label }) => (
            <option key={month} value={month}>
              {label}
            </option>
          ))}
        </select>
        
        <span className="text-xs text-gray-500">
          ({selectedWindow.months.length} months)
        </span>
      </div>
      
      {/* Quick selection buttons for common ranges */}
      {availableMonths.length >= windowSize && (
        <div className="flex gap-1 ml-4">
          <button
            onClick={() => {
              // Select latest 12 months
              const latestStart = availableMonths[availableMonths.length - windowSize];
              handleWindowChange(latestStart);
            }}
            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium"
            disabled={selectedWindow.startMonth === availableMonths[availableMonths.length - windowSize]}
          >
            Latest
          </button>
          
          <button
            onClick={() => {
              // Select earliest 12 months
              handleWindowChange(availableMonths[0]);
            }}
            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium"
            disabled={selectedWindow.startMonth === availableMonths[0]}
          >
            Earliest
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Hook to manage month window state
 */
export function useMonthWindow(availableMonths: MonthKey[], windowSize: number = DEFAULT_WINDOW_SIZE) {
  const [currentWindow, setCurrentWindow] = React.useState<MonthWindow>(() => {
    if (availableMonths.length === 0) {
      return {
        startMonth: '',
        endMonth: '',
        months: []
      };
    }
    
    // Default to latest available months
    const actualWindowSize = Math.min(windowSize, availableMonths.length);
    const startIndex = availableMonths.length - actualWindowSize;
    const months = availableMonths.slice(startIndex);
    
    return {
      startMonth: months[0],
      endMonth: months[months.length - 1],
      months
    };
  });

  // Update window when available months change
  React.useEffect(() => {
    if (availableMonths.length === 0) {
      setCurrentWindow({
        startMonth: '',
        endMonth: '',
        months: []
      });
      return;
    }

    // Check if current window is still valid
    const currentStartIndex = availableMonths.indexOf(currentWindow.startMonth);
    
    if (currentStartIndex === -1) {
      // Current start month no longer exists, reset to latest
      const actualWindowSize = Math.min(windowSize, availableMonths.length);
      const startIndex = availableMonths.length - actualWindowSize;
      const months = availableMonths.slice(startIndex);
      
      setCurrentWindow({
        startMonth: months[0],
        endMonth: months[months.length - 1],
        months
      });
    } else {
      // Update the window months based on current start
      const endIndex = Math.min(currentStartIndex + windowSize - 1, availableMonths.length - 1);
      const months = availableMonths.slice(currentStartIndex, endIndex + 1);
      
      setCurrentWindow(prev => ({
        ...prev,
        endMonth: availableMonths[endIndex],
        months
      }));
    }
  }, [availableMonths, windowSize, currentWindow.startMonth]);

  return [currentWindow, setCurrentWindow] as const;
}