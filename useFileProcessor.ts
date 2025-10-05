/**
 * React File Processor Hooks
 * 
 * A collection of React hooks for handling file processing, validation, and management
 * in modern web applications. Provides type-safe, reusable file handling capabilities.
 * 
 * @author LexiQ Team
 * @license MIT
 */

import { useState, useCallback, useRef } from 'react';

// Types and Interfaces
export interface ProcessedFile {
  content: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  lastModified: number;
  characterCount: number;
  wordCount: number;
  lineCount: number;
  encoding?: string;
  checksum?: string;
}

export interface FileValidationOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  allowedExtensions?: string[];
  minSize?: number;
  customValidator?: (file: File) => Promise<boolean> | boolean;
}

export interface FileProcessingOptions {
  encoding?: string;
  includeMetadata?: boolean;
  calculateChecksum?: boolean;
  chunkSize?: number;
  onProgress?: (progress: number) => void;
}

export interface FileProcessorError {
  code: string;
  message: string;
  file?: File;
  details?: any;
}

export interface UseFileProcessorOptions {
  validation?: FileValidationOptions;
  processing?: FileProcessingOptions;
  onError?: (error: FileProcessorError) => void;
  onSuccess?: (result: ProcessedFile) => void;
}

// Default validation options
const DEFAULT_VALIDATION: FileValidationOptions = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['text/plain', 'text/csv', 'application/json', 'text/html', 'text/markdown'],
  allowedExtensions: ['.txt', '.csv', '.json', '.html', '.md', '.docx', '.pdf'],
  minSize: 1
};

// Default processing options
const DEFAULT_PROCESSING: FileProcessingOptions = {
  encoding: 'utf-8',
  includeMetadata: true,
  calculateChecksum: false,
  chunkSize: 64 * 1024 // 64KB chunks
};

/**
 * Main file processor hook
 */
export const useFileProcessor = (options: UseFileProcessorOptions = {}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<FileProcessorError | null>(null);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const validationOptions = { ...DEFAULT_VALIDATION, ...options.validation };
  const processingOptions = { ...DEFAULT_PROCESSING, ...options.processing };

  /**
   * Validate a file against the specified criteria
   */
  const validateFile = useCallback(async (file: File): Promise<boolean> => {
    try {
      // Size validation
      if (validationOptions.maxSize && file.size > validationOptions.maxSize) {
        throw new Error(`File size (${file.size} bytes) exceeds maximum allowed size (${validationOptions.maxSize} bytes)`);
      }
      
      if (validationOptions.minSize && file.size < validationOptions.minSize) {
        throw new Error(`File size (${file.size} bytes) is below minimum required size (${validationOptions.minSize} bytes)`);
      }

      // Type validation
      if (validationOptions.allowedTypes && !validationOptions.allowedTypes.includes(file.type)) {
        throw new Error(`File type '${file.type}' is not allowed`);
      }

      // Extension validation
      if (validationOptions.allowedExtensions) {
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!validationOptions.allowedExtensions.includes(extension)) {
          throw new Error(`File extension '${extension}' is not allowed`);
        }
      }

      // Custom validation
      if (validationOptions.customValidator) {
        const isValid = await validationOptions.customValidator(file);
        if (!isValid) {
          throw new Error('File failed custom validation');
        }
      }

      return true;
    } catch (error) {
      const fileError: FileProcessorError = {
        code: 'VALIDATION_ERROR',
        message: error instanceof Error ? error.message : 'Validation failed',
        file
      };
      setError(fileError);
      options.onError?.(fileError);
      return false;
    }
  }, [validationOptions, options.onError]);

  /**
   * Calculate file checksum (SHA-256)
   */
  const calculateChecksum = useCallback(async (content: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }, []);

  /**
   * Count words in text content
   */
  const countWords = useCallback((text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }, []);

  /**
   * Count lines in text content
   */
  const countLines = useCallback((text: string): number => {
    return text.split('\n').length;
  }, []);

  /**
   * Process a single file
   */
  const processFile = useCallback(async (file: File): Promise<ProcessedFile | null> => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      // Create abort controller for this operation
      abortControllerRef.current = new AbortController();

      // Validate file first
      const isValid = await validateFile(file);
      if (!isValid) {
        return null;
      }

      // Read file content
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = () => {
          resolve(reader.result as string);
        };
        
        reader.onerror = () => {
          reject(new Error('Failed to read file'));
        };
        
        reader.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            setProgress(progress);
            processingOptions.onProgress?.(progress);
          }
        };

        reader.readAsText(file, processingOptions.encoding);
      });

      // Check if operation was aborted
      if (abortControllerRef.current?.signal.aborted) {
        throw new Error('Operation was aborted');
      }

      // Process content and calculate metadata
      const characterCount = content.length;
      const wordCount = countWords(content);
      const lineCount = countLines(content);
      
      let checksum: string | undefined;
      if (processingOptions.calculateChecksum) {
        checksum = await calculateChecksum(content);
      }

      const processedFile: ProcessedFile = {
        content,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        lastModified: file.lastModified,
        characterCount,
        wordCount,
        lineCount,
        encoding: processingOptions.encoding,
        checksum
      };

      setProgress(100);
      setProcessedFiles(prev => [...prev, processedFile]);
      options.onSuccess?.(processedFile);
      
      return processedFile;

    } catch (error) {
      const fileError: FileProcessorError = {
        code: 'PROCESSING_ERROR',
        message: error instanceof Error ? error.message : 'Processing failed',
        file,
        details: error
      };
      setError(fileError);
      options.onError?.(fileError);
      return null;
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  }, [validateFile, countWords, countLines, calculateChecksum, processingOptions, options.onSuccess, options.onError]);

  /**
   * Process multiple files
   */
  const processFiles = useCallback(async (files: File[]): Promise<ProcessedFile[]> => {
    const results: ProcessedFile[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await processFile(file);
      if (result) {
        results.push(result);
      }
      
      // Update overall progress
      const overallProgress = ((i + 1) / files.length) * 100;
      setProgress(overallProgress);
    }
    
    return results;
  }, [processFile]);

  /**
   * Abort current processing operation
   */
  const abortProcessing = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsProcessing(false);
      setProgress(0);
    }
  }, []);

  /**
   * Clear processed files and reset state
   */
  const clearProcessedFiles = useCallback(() => {
    setProcessedFiles([]);
    setError(null);
    setProgress(0);
  }, []);

  /**
   * Get file by name from processed files
   */
  const getProcessedFile = useCallback((fileName: string): ProcessedFile | undefined => {
    return processedFiles.find(file => file.fileName === fileName);
  }, [processedFiles]);

  return {
    // State
    isProcessing,
    progress,
    error,
    processedFiles,
    
    // Actions
    processFile,
    processFiles,
    abortProcessing,
    clearProcessedFiles,
    validateFile,
    getProcessedFile,
    
    // Utilities
    countWords,
    countLines,
    calculateChecksum
  };
};

/**
 * Hook for drag and drop file handling
 */
export const useFileDrop = (options: UseFileProcessorOptions = {}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileProcessor = useFileProcessor(options);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);

    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      await fileProcessor.processFiles(files);
    }
  }, [fileProcessor]);

  return {
    ...fileProcessor,
    isDragOver,
    handleDragOver,
    handleDragLeave,
    handleDrop
  };
};

/**
 * Hook for file input handling
 */
export const useFileInput = (options: UseFileProcessorOptions = {}) => {
  const fileProcessor = useFileProcessor(options);
  const inputRef = useRef<HTMLInputElement>(null);

  const openFileDialog = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      await fileProcessor.processFiles(files);
    }
    
    // Clear input to allow selecting the same file again
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [fileProcessor]);

  return {
    ...fileProcessor,
    inputRef,
    openFileDialog,
    handleFileChange
  };
};
