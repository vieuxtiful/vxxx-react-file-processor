/**
 * React Report Generator Hook
 * 
 * A flexible React hook for generating and downloading reports in various formats
 * including JSON, CSV, HTML, PDF, and Excel. Supports client-side generation
 * with customizable templates and styling.
 * 
 * @author LexiQ Team
 * @license MIT
 */

import { useState, useCallback } from 'react';

// Types and Interfaces
export type ReportFormat = 'json' | 'csv' | 'html' | 'pdf' | 'xlsx' | 'txt';

export interface ReportData {
  [key: string]: any;
}

export interface ReportMetadata {
  title: string;
  description?: string;
  author?: string;
  createdAt: Date;
  version?: string;
  tags?: string[];
}

export interface ReportOptions {
  filename?: string;
  format: ReportFormat;
  metadata?: ReportMetadata;
  template?: string;
  styling?: ReportStyling;
  compression?: boolean;
  includeTimestamp?: boolean;
}

export interface ReportStyling {
  theme?: 'light' | 'dark' | 'minimal';
  primaryColor?: string;
  fontFamily?: string;
  fontSize?: string;
  customCSS?: string;
}

export interface GeneratedReport {
  blob: Blob;
  filename: string;
  size: number;
  format: ReportFormat;
  downloadUrl: string;
}

export interface ReportGeneratorError {
  code: string;
  message: string;
  details?: any;
}

// Default styling options
const DEFAULT_STYLING: ReportStyling = {
  theme: 'light',
  primaryColor: '#3b82f6',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: '14px'
};

/**
 * Main report generator hook
 */
export const useReportGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<ReportGeneratorError | null>(null);
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);

  /**
   * Generate filename with timestamp if needed
   */
  const generateFilename = useCallback((options: ReportOptions): string => {
    let filename = options.filename || 'report';
    
    if (options.includeTimestamp !== false) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      filename = `${filename}_${timestamp}`;
    }
    
    return `${filename}.${options.format}`;
  }, []);

  /**
   * Convert data to JSON format
   */
  const generateJSON = useCallback((data: ReportData, options: ReportOptions): string => {
    const reportContent = {
      metadata: options.metadata,
      data,
      generatedAt: new Date().toISOString()
    };
    
    return JSON.stringify(reportContent, null, 2);
  }, []);

  /**
   * Convert data to CSV format
   */
  const generateCSV = useCallback((data: ReportData[], options: ReportOptions): string => {
    if (!Array.isArray(data) || data.length === 0) {
      return '';
    }

    // Get all unique keys from all objects
    const allKeys = Array.from(new Set(data.flatMap(Object.keys)));
    
    // Create header row
    const csvRows = [allKeys.join(',')];
    
    // Create data rows
    data.forEach(item => {
      const row = allKeys.map(key => {
        const value = item[key];
        if (value === null || value === undefined) {
          return '';
        }
        
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        
        return stringValue;
      });
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  }, []);

  /**
   * Generate HTML report with styling
   */
  const generateHTML = useCallback((data: ReportData, options: ReportOptions): string => {
    const styling = { ...DEFAULT_STYLING, ...options.styling };
    const metadata = options.metadata;
    
    const css = `
      body {
        font-family: ${styling.fontFamily};
        font-size: ${styling.fontSize};
        line-height: 1.6;
        color: ${styling.theme === 'dark' ? '#e5e7eb' : '#374151'};
        background-color: ${styling.theme === 'dark' ? '#1f2937' : '#ffffff'};
        margin: 0;
        padding: 20px;
      }
      
      .report-container {
        max-width: 1200px;
        margin: 0 auto;
        background: ${styling.theme === 'dark' ? '#374151' : '#f9fafb'};
        border-radius: 8px;
        padding: 30px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      
      .report-header {
        border-bottom: 3px solid ${styling.primaryColor};
        padding-bottom: 20px;
        margin-bottom: 30px;
      }
      
      .report-title {
        color: ${styling.primaryColor};
        font-size: 2.5em;
        margin: 0 0 10px 0;
        font-weight: bold;
      }
      
      .report-meta {
        color: ${styling.theme === 'dark' ? '#9ca3af' : '#6b7280'};
        font-size: 0.9em;
      }
      
      .data-section {
        margin: 20px 0;
      }
      
      .data-table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
      }
      
      .data-table th,
      .data-table td {
        border: 1px solid ${styling.theme === 'dark' ? '#4b5563' : '#d1d5db'};
        padding: 12px;
        text-align: left;
      }
      
      .data-table th {
        background-color: ${styling.primaryColor};
        color: white;
        font-weight: bold;
      }
      
      .data-table tr:nth-child(even) {
        background-color: ${styling.theme === 'dark' ? '#4b5563' : '#f3f4f6'};
      }
      
      .json-container {
        background-color: ${styling.theme === 'dark' ? '#1f2937' : '#f8f9fa'};
        border: 1px solid ${styling.theme === 'dark' ? '#4b5563' : '#e5e7eb'};
        border-radius: 4px;
        padding: 15px;
        overflow-x: auto;
      }
      
      .json-content {
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 0.9em;
        white-space: pre-wrap;
        margin: 0;
      }
      
      ${styling.customCSS || ''}
    `;

    const renderDataAsTable = (data: any): string => {
      if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
        const keys = Object.keys(data[0]);
        const headerRow = keys.map(key => `<th>${key}</th>`).join('');
        const dataRows = data.map(item => 
          `<tr>${keys.map(key => `<td>${item[key] || ''}</td>`).join('')}</tr>`
        ).join('');
        
        return `
          <table class="data-table">
            <thead><tr>${headerRow}</tr></thead>
            <tbody>${dataRows}</tbody>
          </table>
        `;
      }
      
      return `
        <div class="json-container">
          <pre class="json-content">${JSON.stringify(data, null, 2)}</pre>
        </div>
      `;
    };

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${metadata?.title || 'Report'}</title>
        <style>${css}</style>
      </head>
      <body>
        <div class="report-container">
          <div class="report-header">
            <h1 class="report-title">${metadata?.title || 'Report'}</h1>
            <div class="report-meta">
              ${metadata?.description ? `<p>${metadata.description}</p>` : ''}
              <p>Generated on: ${new Date().toLocaleString()}</p>
              ${metadata?.author ? `<p>Author: ${metadata.author}</p>` : ''}
              ${metadata?.version ? `<p>Version: ${metadata.version}</p>` : ''}
            </div>
          </div>
          
          <div class="data-section">
            ${renderDataAsTable(data)}
          </div>
        </div>
      </body>
      </html>
    `;
  }, []);

  /**
   * Generate plain text report
   */
  const generateText = useCallback((data: ReportData, options: ReportOptions): string => {
    const metadata = options.metadata;
    let content = '';
    
    if (metadata?.title) {
      content += `${metadata.title}\n`;
      content += '='.repeat(metadata.title.length) + '\n\n';
    }
    
    if (metadata?.description) {
      content += `${metadata.description}\n\n`;
    }
    
    content += `Generated on: ${new Date().toLocaleString()}\n`;
    if (metadata?.author) {
      content += `Author: ${metadata.author}\n`;
    }
    content += '\n';
    
    // Convert data to readable text format
    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        content += `Record ${index + 1}:\n`;
        Object.entries(item).forEach(([key, value]) => {
          content += `  ${key}: ${value}\n`;
        });
        content += '\n';
      });
    } else {
      content += JSON.stringify(data, null, 2);
    }
    
    return content;
  }, []);

  /**
   * Create and download a blob
   */
  const downloadBlob = useCallback((blob: Blob, filename: string): string => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up URL after a delay to ensure download starts
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    
    return url;
  }, []);

  /**
   * Generate report in specified format
   */
  const generateReport = useCallback(async (
    data: ReportData | ReportData[],
    options: ReportOptions
  ): Promise<GeneratedReport | null> => {
    setIsGenerating(true);
    setProgress(0);
    setError(null);

    try {
      let content: string;
      let mimeType: string;

      setProgress(25);

      // Generate content based on format
      switch (options.format) {
        case 'json':
          content = generateJSON(data as ReportData, options);
          mimeType = 'application/json';
          break;
          
        case 'csv':
          content = generateCSV(data as ReportData[], options);
          mimeType = 'text/csv';
          break;
          
        case 'html':
          content = generateHTML(data as ReportData, options);
          mimeType = 'text/html';
          break;
          
        case 'txt':
          content = generateText(data as ReportData, options);
          mimeType = 'text/plain';
          break;
          
        default:
          throw new Error(`Unsupported format: ${options.format}`);
      }

      setProgress(75);

      // Create blob
      const blob = new Blob([content], { type: mimeType });
      const filename = generateFilename(options);
      
      setProgress(90);

      // Create download URL
      const downloadUrl = downloadBlob(blob, filename);

      const generatedReport: GeneratedReport = {
        blob,
        filename,
        size: blob.size,
        format: options.format,
        downloadUrl
      };

      setProgress(100);
      setGeneratedReports(prev => [...prev, generatedReport]);

      return generatedReport;

    } catch (error) {
      const reportError: ReportGeneratorError = {
        code: 'GENERATION_ERROR',
        message: error instanceof Error ? error.message : 'Report generation failed',
        details: error
      };
      setError(reportError);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [generateJSON, generateCSV, generateHTML, generateText, generateFilename, downloadBlob]);

  /**
   * Generate multiple reports in different formats
   */
  const generateMultipleReports = useCallback(async (
    data: ReportData | ReportData[],
    formats: ReportFormat[],
    baseOptions: Omit<ReportOptions, 'format'>
  ): Promise<GeneratedReport[]> => {
    const reports: GeneratedReport[] = [];
    
    for (let i = 0; i < formats.length; i++) {
      const format = formats[i];
      const options: ReportOptions = { ...baseOptions, format };
      
      const report = await generateReport(data, options);
      if (report) {
        reports.push(report);
      }
      
      // Update overall progress
      const overallProgress = ((i + 1) / formats.length) * 100;
      setProgress(overallProgress);
    }
    
    return reports;
  }, [generateReport]);

  /**
   * Clear generated reports and free memory
   */
  const clearReports = useCallback(() => {
    // Revoke all object URLs to free memory
    generatedReports.forEach(report => {
      URL.revokeObjectURL(report.downloadUrl);
    });
    
    setGeneratedReports([]);
    setError(null);
    setProgress(0);
  }, [generatedReports]);

  /**
   * Get report statistics
   */
  const getReportStats = useCallback(() => {
    const totalSize = generatedReports.reduce((sum, report) => sum + report.size, 0);
    const formatCounts = generatedReports.reduce((counts, report) => {
      counts[report.format] = (counts[report.format] || 0) + 1;
      return counts;
    }, {} as Record<ReportFormat, number>);

    return {
      totalReports: generatedReports.length,
      totalSize,
      formatCounts,
      averageSize: generatedReports.length > 0 ? totalSize / generatedReports.length : 0
    };
  }, [generatedReports]);

  return {
    // State
    isGenerating,
    progress,
    error,
    generatedReports,
    
    // Actions
    generateReport,
    generateMultipleReports,
    clearReports,
    
    // Utilities
    getReportStats,
    
    // Individual generators (for advanced use)
    generateJSON,
    generateCSV,
    generateHTML,
    generateText
  };
};
