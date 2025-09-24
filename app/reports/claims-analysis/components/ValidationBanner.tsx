'use client';

/**
 * ValidationBanner component to display parsing results and validation messages
 */

import React, { useState } from 'react';
import { ValidationMessage } from '../lib/validator';

interface ValidationBannerProps {
  messages: ValidationMessage[];
  className?: string;
}

export function ValidationBanner({ messages, className = '' }: ValidationBannerProps) {
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());
  
  if (messages.length === 0) return null;

  const toggleMessage = (index: number) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const getIconForType = (type: ValidationMessage['type']) => {
    switch (type) {
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getBackgroundColorForType = (type: ValidationMessage['type']) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColorForType = (type: ValidationMessage['type']) => {
    switch (type) {
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-amber-800';
      case 'info':
        return 'text-blue-800';
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {messages.map((message, index) => (
        <div
          key={index}
          className={`border p-4 ${getBackgroundColorForType(message.type)}`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getIconForType(message.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className={`text-sm font-medium ${getTextColorForType(message.type)}`}>
                  {message.message}
                </p>
                
                {message.details && message.details.length > 0 && (
                  <button
                    onClick={() => toggleMessage(index)}
                    className={`text-xs ${getTextColorForType(message.type)} opacity-75 hover:opacity-100 flex-shrink-0`}
                    aria-expanded={expandedMessages.has(index)}
                  >
                    {expandedMessages.has(index) ? 'Hide Details' : 'Show Details'}
                  </button>
                )}
              </div>
              
              {message.details && expandedMessages.has(index) && (
                <div className={`mt-3 text-xs ${getTextColorForType(message.type)} opacity-90`}>
                  <ul className="space-y-1">
                    {message.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-start gap-2">
                        <span className="text-xs opacity-50 mt-1">•</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Compact version for when space is limited
 */
export function ValidationBannerCompact({ messages, className = '' }: ValidationBannerProps) {
  if (messages.length === 0) return null;

  const errorCount = messages.filter(m => m.type === 'error').length;
  const warningCount = messages.filter(m => m.type === 'warning').length;
  const infoCount = messages.filter(m => m.type === 'info').length;

  return (
    <div className={`flex items-center gap-4 p-3 bg-gray-50 border border-gray-200 text-sm ${className}`}>
      <span className="text-gray-600">Upload Status:</span>
      
      {errorCount > 0 && (
        <div className="flex items-center gap-1 text-red-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{errorCount} error{errorCount !== 1 ? 's' : ''}</span>
        </div>
      )}
      
      {warningCount > 0 && (
        <div className="flex items-center gap-1 text-amber-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{warningCount} warning{warningCount !== 1 ? 's' : ''}</span>
        </div>
      )}
      
      {infoCount > 0 && (
        <div className="flex items-center gap-1 text-blue-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>{infoCount} info</span>
        </div>
      )}
      
      {errorCount === 0 && warningCount === 0 && infoCount === 0 && (
        <div className="flex items-center gap-1 text-green-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>All good</span>
        </div>
      )}
    </div>
  );
}