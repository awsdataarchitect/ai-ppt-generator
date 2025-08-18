/**
 * FileProcessor class for handling file conversion to base64 with proper MIME type handling
 * Supports PDF, DOC, DOCX, and TXT formats with comprehensive error handling
 */
class FileProcessor {
    constructor(validator = null) {
        this.validator = validator;
        
        // MIME type to prefix mapping for base64 data URLs
        this.mimeTypePrefixes = {
            'application/pdf': 'data:application/pdf;base64,',
            'application/msword': 'data:application/msword;base64,',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,',
            'text/plain': 'data:text/plain;base64,'
        };
    }

    /**
     * Converts a file to base64 with proper MIME type handling
     * @param {File} file - The file to convert
     * @param {Object} options - Conversion options
     * @returns {Promise<Base64Result>} - Promise resolving to base64 conversion result
     */
    async fileToBase64(file, options = {}) {
        const {
            includeDataUrl = false,  // Whether to include the data URL prefix
            validateFile = true      // Whether to validate the file before conversion
        } = options;

        try {
            // Validate file if validator is available and validation is enabled
            if (validateFile && this.validator) {
                const validationResult = this.validator.validateFile(file);
                if (!validationResult.isValid) {
                    throw new FileProcessingError(
                        'FILE_VALIDATION_FAILED',
                        validationResult.errorMessage,
                        { validationResult }
                    );
                }
            }

            // Detect MIME type
            const mimeType = this.detectMimeType(file);
            
            // Convert file to base64
            const base64Data = await this.convertToBase64(file);
            
            // Prepare result
            const result = {
                base64Data: includeDataUrl ? `${this.mimeTypePrefixes[mimeType] || 'data:application/octet-stream;base64,'}${base64Data}` : base64Data,
                mimeType: mimeType,
                size: file.size,
                filename: file.name,
                success: true,
                processingTime: Date.now()
            };

            return result;

        } catch (error) {
            if (error instanceof FileProcessingError) {
                throw error;
            }
            
            // Provide more specific error messages based on error type
            let errorMessage = `Failed to convert file to base64: ${error.message}`;
            let errorCode = 'CONVERSION_FAILED';
            
            if (error.name === 'SecurityError') {
                errorMessage = 'File access was denied due to security restrictions. Please try a different file.';
                errorCode = 'SECURITY_ERROR';
            } else if (error.name === 'NotReadableError') {
                errorMessage = 'File could not be read. The file may be corrupted or in use by another application.';
                errorCode = 'FILE_NOT_READABLE';
            } else if (error.message.includes('FileReader')) {
                errorMessage = 'File reading failed. Please try uploading the file again.';
                errorCode = 'FILE_READER_ERROR';
            }
            
            throw new FileProcessingError(
                errorCode,
                errorMessage,
                { 
                    originalError: error, 
                    filename: file?.name,
                    fileSize: file?.size,
                    mimeType: file?.type
                }
            );
        }
    }

    /**
     * Converts file to base64 using FileReader
     * @param {File} file - The file to convert
     * @returns {Promise<string>} - Promise resolving to base64 string (without data URL prefix)
     */
    convertToBase64(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('No file provided for conversion'));
                return;
            }

            const reader = new FileReader();
            
            reader.onload = () => {
                try {
                    // Extract base64 data without the data URL prefix
                    const result = reader.result;
                    if (typeof result !== 'string') {
                        reject(new Error('FileReader result is not a string'));
                        return;
                    }

                    // Split on comma to remove data URL prefix (e.g., "data:application/pdf;base64,")
                    const base64Data = result.split(',')[1];
                    if (!base64Data) {
                        reject(new Error('Failed to extract base64 data from FileReader result'));
                        return;
                    }

                    resolve(base64Data);
                } catch (error) {
                    reject(new Error(`Error processing FileReader result: ${error.message}`));
                }
            };

            reader.onerror = () => {
                const errorMessage = reader.error?.message || 'Unknown error';
                const errorName = reader.error?.name || 'UnknownError';
                
                let userFriendlyMessage = `FileReader error: ${errorMessage}`;
                
                // Provide more specific error messages
                if (errorName === 'NotReadableError') {
                    userFriendlyMessage = 'The file could not be read. It may be corrupted, in use by another application, or you may not have permission to access it.';
                } else if (errorName === 'SecurityError') {
                    userFriendlyMessage = 'File access was denied due to security restrictions.';
                } else if (errorName === 'NotFoundError') {
                    userFriendlyMessage = 'The file could not be found. It may have been moved or deleted.';
                }
                
                reject(new Error(userFriendlyMessage));
            };

            reader.onabort = () => {
                reject(new Error('File reading was cancelled. Please try uploading the file again.'));
            };

            // Start reading the file as data URL
            try {
                reader.readAsDataURL(file);
            } catch (error) {
                reject(new Error(`Failed to start file reading: ${error.message}`));
            }
        });
    }

    /**
     * Detects MIME type from file, with fallback to extension-based detection
     * @param {File} file - The file to analyze
     * @returns {string} - Detected MIME type
     */
    detectMimeType(file) {
        // Use validator's MIME type detection if available
        if (this.validator && typeof this.validator.detectMimeType === 'function') {
            return this.validator.detectMimeType(file);
        }

        // Fallback implementation
        if (file.type && file.type !== 'application/octet-stream') {
            return file.type;
        }

        // Extension-based fallback
        const fileName = file.name.toLowerCase();
        if (fileName.endsWith('.pdf')) {
            return 'application/pdf';
        } else if (fileName.endsWith('.doc')) {
            return 'application/msword';
        } else if (fileName.endsWith('.docx')) {
            return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        } else if (fileName.endsWith('.txt')) {
            return 'text/plain';
        }

        return file.type || 'application/octet-stream';
    }

    /**
     * Processes multiple files and converts them to base64
     * @param {FileList|Array<File>} files - Files to process
     * @param {Object} options - Processing options
     * @returns {Promise<Array<Base64Result>>} - Promise resolving to array of conversion results
     */
    async processMultipleFiles(files, options = {}) {
        const {
            continueOnError = true,  // Whether to continue processing if one file fails
            maxConcurrent = 3        // Maximum number of concurrent file processing
        } = options;

        const fileArray = Array.from(files);
        const results = [];
        const errors = [];

        // Process files in batches to avoid overwhelming the system
        for (let i = 0; i < fileArray.length; i += maxConcurrent) {
            const batch = fileArray.slice(i, i + maxConcurrent);
            
            const batchPromises = batch.map(async (file, index) => {
                try {
                    const result = await this.fileToBase64(file, options);
                    return { success: true, result, index: i + index };
                } catch (error) {
                    const errorResult = {
                        success: false,
                        error,
                        filename: file?.name,
                        index: i + index
                    };
                    
                    if (!continueOnError) {
                        throw error;
                    }
                    
                    return errorResult;
                }
            });

            const batchResults = await Promise.all(batchPromises);
            
            batchResults.forEach(result => {
                if (result.success) {
                    results.push(result.result);
                } else {
                    errors.push(result);
                }
            });
        }

        return {
            results,
            errors,
            totalProcessed: fileArray.length,
            successCount: results.length,
            errorCount: errors.length
        };
    }

    /**
     * Gets file metadata for processing
     * @param {File} file - The file to analyze
     * @returns {Object} - File metadata
     */
    getFileMetadata(file) {
        if (this.validator && typeof this.validator.getFileMetadata === 'function') {
            return this.validator.getFileMetadata(file);
        }

        // Fallback implementation
        return {
            name: file.name,
            size: file.size,
            type: this.detectMimeType(file),
            lastModified: file.lastModified,
            formattedSize: this.formatFileSize(file.size),
            extension: this.getFileExtension(file.name)
        };
    }

    /**
     * Formats file size in human-readable format
     * @param {number} bytes - File size in bytes
     * @returns {string} - Formatted file size
     */
    formatFileSize(bytes) {
        if (typeof bytes !== 'number' || bytes < 0 || isNaN(bytes)) {
            return '0 B';
        }

        if (bytes === 0) {
            return '0 B';
        }

        const units = ['B', 'KB', 'MB', 'GB'];
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        const unitIndex = Math.min(i, units.length - 1);
        const size = bytes / Math.pow(k, unitIndex);
        
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }

    /**
     * Extracts file extension from filename
     * @param {string} filename - The filename
     * @returns {string} - File extension including the dot
     */
    getFileExtension(filename) {
        const lastDotIndex = filename.lastIndexOf('.');
        return lastDotIndex !== -1 ? filename.substring(lastDotIndex) : '';
    }
}

/**
 * Custom error class for file processing errors
 */
class FileProcessingError extends Error {
    constructor(code, message, details = {}) {
        super(message);
        this.name = 'FileProcessingError';
        this.code = code;
        this.details = details;
        this.timestamp = new Date().toISOString();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FileProcessor, FileProcessingError };
} else if (typeof window !== 'undefined') {
    window.FileProcessor = FileProcessor;
    window.FileProcessingError = FileProcessingError;
}