# React File Processor Hooks

[![npm version](https://badge.fury.io/js/react-file-processor-hooks.svg)](https://badge.fury.io/js/react-file-processor-hooks)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

A comprehensive collection of React hooks for file processing, validation, and report generation. Built with TypeScript for type safety and modern React patterns.

## Features

- 🚀 **File Processing**: Handle file uploads with validation and metadata extraction
- 📊 **Report Generation**: Generate reports in multiple formats (JSON, CSV, HTML, TXT)
- 🎯 **Drag & Drop**: Built-in drag and drop file handling
- ✅ **Validation**: Comprehensive file validation (size, type, custom rules)
- 📈 **Progress Tracking**: Real-time progress updates for long operations
- 🎨 **Customizable**: Flexible styling and templating options
- 🔒 **Type Safe**: Full TypeScript support with comprehensive type definitions
- ⚡ **Performance**: Optimized for large files with chunked processing
- 🛡️ **Error Handling**: Robust error handling with detailed error information

## Installation

```bash
npm install react-file-processor-hooks
```

```bash
yarn add react-file-processor-hooks
```

```bash
pnpm add react-file-processor-hooks
```

## Quick Start

### Basic File Processing

```tsx
import React from 'react';
import { useFileProcessor } from 'react-file-processor-hooks';

function FileUploader() {
  const { processFile, isProcessing, processedFiles, error } = useFileProcessor({
    validation: {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['text/plain', 'text/csv', 'application/json']
    },
    onSuccess: (file) => {
      console.log('File processed:', file);
    },
    onError: (error) => {
      console.error('Processing failed:', error);
    }
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileSelect} />
      {isProcessing && <p>Processing...</p>}
      {error && <p>Error: {error.message}</p>}
      {processedFiles.map((file, index) => (
        <div key={index}>
          <h3>{file.fileName}</h3>
          <p>Size: {file.fileSize} bytes</p>
          <p>Words: {file.wordCount}</p>
          <p>Lines: {file.lineCount}</p>
        </div>
      ))}
    </div>
  );
}
```

### Drag and Drop File Handling

```tsx
import React from 'react';
import { useFileDrop } from 'react-file-processor-hooks';

function DropZone() {
  const {
    isDragOver,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    processedFiles,
    isProcessing
  } = useFileDrop({
    validation: {
      allowedTypes: ['image/*', 'text/*'],
      maxSize: 10 * 1024 * 1024 // 10MB
    }
  });

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${isDragOver ? '#007bff' : '#ccc'}`,
        borderRadius: '8px',
        padding: '40px',
        textAlign: 'center',
        backgroundColor: isDragOver ? '#f8f9fa' : 'transparent'
      }}
    >
      {isProcessing ? (
        <p>Processing files...</p>
      ) : (
        <p>Drag and drop files here</p>
      )}
      
      {processedFiles.length > 0 && (
        <div>
          <h3>Processed Files:</h3>
          {processedFiles.map((file, index) => (
            <p key={index}>{file.fileName} ({file.fileSize} bytes)</p>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Report Generation

```tsx
import React from 'react';
import { useReportGenerator } from 'react-file-processor-hooks';

function ReportGenerator() {
  const { generateReport, isGenerating, progress } = useReportGenerator();

  const data = [
    { name: 'John Doe', age: 30, city: 'New York' },
    { name: 'Jane Smith', age: 25, city: 'Los Angeles' },
    { name: 'Bob Johnson', age: 35, city: 'Chicago' }
  ];

  const handleGenerateReport = async (format: 'json' | 'csv' | 'html') => {
    await generateReport(data, {
      format,
      filename: 'user-report',
      metadata: {
        title: 'User Report',
        description: 'A comprehensive report of user data',
        author: 'Your App',
        createdAt: new Date()
      }
    });
  };

  return (
    <div>
      <h2>Generate Reports</h2>
      <button onClick={() => handleGenerateReport('json')}>
        Generate JSON Report
      </button>
      <button onClick={() => handleGenerateReport('csv')}>
        Generate CSV Report
      </button>
      <button onClick={() => handleGenerateReport('html')}>
        Generate HTML Report
      </button>
      
      {isGenerating && (
        <div>
          <p>Generating report... {progress}%</p>
          <progress value={progress} max={100} />
        </div>
      )}
    </div>
  );
}
```

## API Reference

### useFileProcessor

The main hook for file processing with validation and metadata extraction.

```tsx
const {
  isProcessing,
  progress,
  error,
  processedFiles,
  processFile,
  processFiles,
  abortProcessing,
  clearProcessedFiles,
  validateFile,
  getProcessedFile
} = useFileProcessor(options);
```

#### Options

```tsx
interface UseFileProcessorOptions {
  validation?: {
    maxSize?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
    minSize?: number;
    customValidator?: (file: File) => Promise<boolean> | boolean;
  };
  processing?: {
    encoding?: string;
    includeMetadata?: boolean;
    calculateChecksum?: boolean;
    chunkSize?: number;
    onProgress?: (progress: number) => void;
  };
  onError?: (error: FileProcessorError) => void;
  onSuccess?: (result: ProcessedFile) => void;
}
```

### useFileDrop

Hook for drag and drop file handling.

```tsx
const {
  // All useFileProcessor returns plus:
  isDragOver,
  handleDragOver,
  handleDragLeave,
  handleDrop
} = useFileDrop(options);
```

### useFileInput

Hook for file input handling with programmatic file dialog.

```tsx
const {
  // All useFileProcessor returns plus:
  inputRef,
  openFileDialog,
  handleFileChange
} = useFileInput(options);
```

### useReportGenerator

Hook for generating reports in various formats.

```tsx
const {
  isGenerating,
  progress,
  error,
  generatedReports,
  generateReport,
  generateMultipleReports,
  clearReports,
  getReportStats
} = useReportGenerator();
```

#### Report Options

```tsx
interface ReportOptions {
  filename?: string;
  format: 'json' | 'csv' | 'html' | 'pdf' | 'xlsx' | 'txt';
  metadata?: {
    title: string;
    description?: string;
    author?: string;
    createdAt: Date;
    version?: string;
    tags?: string[];
  };
  styling?: {
    theme?: 'light' | 'dark' | 'minimal';
    primaryColor?: string;
    fontFamily?: string;
    fontSize?: string;
    customCSS?: string;
  };
  compression?: boolean;
  includeTimestamp?: boolean;
}
```

## Advanced Usage

### Custom Validation

```tsx
const { processFile } = useFileProcessor({
  validation: {
    customValidator: async (file) => {
      // Custom validation logic
      const content = await file.text();
      return content.includes('required-header');
    }
  }
});
```

### Progress Tracking

```tsx
const { processFile } = useFileProcessor({
  processing: {
    onProgress: (progress) => {
      console.log(`Processing: ${progress}%`);
    }
  }
});
```

### Custom Report Styling

```tsx
const { generateReport } = useReportGenerator();

await generateReport(data, {
  format: 'html',
  styling: {
    theme: 'dark',
    primaryColor: '#ff6b6b',
    customCSS: `
      .custom-header {
        background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
      }
    `
  }
});
```

### Multiple Format Export

```tsx
const { generateMultipleReports } = useReportGenerator();

const reports = await generateMultipleReports(
  data,
  ['json', 'csv', 'html'],
  {
    filename: 'multi-format-report',
    metadata: {
      title: 'Comprehensive Report',
      author: 'Your App',
      createdAt: new Date()
    }
  }
);
```

## TypeScript Support

This library is built with TypeScript and provides comprehensive type definitions. All hooks and their options are fully typed for the best development experience.

```tsx
import type {
  ProcessedFile,
  FileValidationOptions,
  ReportFormat,
  GeneratedReport
} from 'react-file-processor-hooks';
```

## Browser Compatibility

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

### v1.0.0
- Initial release
- File processing with validation
- Drag and drop support
- Report generation in multiple formats
- Full TypeScript support
- Comprehensive error handling

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/lexiq-team/react-file-processor-hooks/issues) on GitHub.
