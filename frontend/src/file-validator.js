/**
 * FileValidator class for handling file type validation and MIME type detection
 * Supports PDF, DOC, DOCX, and TXT formats with configurable size limits
 */
class FileValidator {
    constructor(config = {}) {
        this.config = {
            maxFileSize: config.maxFileSize || 5 * 1024 * 1024, // 5MB default
            supportedFormats: config.supportedFormats || [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain'
            ],
            supportedExtensions: config.supportedExtensions || ['.pdf', '.doc', '.docx', '.txt']
        };
    }

    /**
     * Validates a file against supported formats and size limits
     * @param {File} file - The file to validate
     * @returns {ValidationResult} - Validation result with details
     */
    validateFile(file) {
        // Check if file exists first
        if (!file) {
            return {
                isValid: false,
                mimeType: null,
                fileName: null,
                fileSize: 0,
                errorMessage: 'No file provided for validation. Please select a file to upload.',
                supportedFormats: this.getSupportedFormatsDisplay(),
                maxSizeFormatted: this.formatFileSize(this.config.maxFileSize),
                errorCode: 'NO_FILE'
            };
        }

        // Check if file object is valid
        if (typeof file !== 'object' || !file.name || typeof file.size !== 'number') {
            return {
                isValid: false,
                mimeType: file.type || null,
                fileName: file.name || 'Unknown',
                fileSize: file.size || 0,
                errorMessage: 'Invalid file object. The selected file appears to be corrupted or unreadable.',
                supportedFormats: this.getSupportedFormatsDisplay(),
                maxSizeFormatted: this.formatFileSize(this.config.maxFileSize),
                errorCode: 'INVALID_FILE_OBJECT'
            };
        }

        const result = {
            isValid: false,
            mimeType: file.type,
            fileName: file.name,
            fileSize: file.size,
            errorMessage: null,
            supportedFormats: this.getSupportedFormatsDisplay(),
            maxSizeFormatted: this.formatFileSize(this.config.maxFileSize),
            errorCode: null
        };

        // Validate file size
        const sizeValidation = this.validateFileSize(file);
        if (!sizeValidation.isValid) {
            result.errorMessage = sizeValidation.errorMessage;
            result.errorCode = sizeValidation.errorCode || 'SIZE_INVALID';
            return result;
        }

        // Validate MIME type
        const mimeValidation = this.validateMimeType(file);
        if (!mimeValidation.isValid) {
            result.errorMessage = mimeValidation.errorMessage;
            result.errorCode = mimeValidation.errorCode || 'MIME_TYPE_INVALID';
            return result;
        }

        // Validate file extension as fallback
        const extensionValidation = this.validateFileExtension(file);
        if (!extensionValidation.isValid) {
            result.errorMessage = extensionValidation.errorMessage;
            result.errorCode = extensionValidation.errorCode || 'EXTENSION_INVALID';
            return result;
        }

        // Additional security validation
        const securityValidation = this.validateFileSecurity(file);
        if (!securityValidation.isValid) {
            result.errorMessage = securityValidation.errorMessage;
            result.errorCode = securityValidation.errorCode || 'SECURITY_INVALID';
            return result;
        }

        result.isValid = true;
        result.mimeType = this.detectMimeType(file);
        result.errorCode = null;
        return result;
    }

    /**
     * Validates file size against configured limits
     * @param {File} file - The file to validate
     * @returns {Object} - Size validation result
     */
    validateFileSize(file) {
        if (file.size <= 0) {
            return {
                isValid: false,
                errorMessage: 'File appears to be empty or corrupted. Please select a valid file with content.',
                errorCode: 'EMPTY_FILE'
            };
        }

        if (file.size > this.config.maxFileSize) {
            const suggestions = this.getSizeLimitSuggestions(file.size);
            return {
                isValid: false,
                errorMessage: `File size (${this.formatFileSize(file.size)}) exceeds the maximum allowed size of ${this.formatFileSize(this.config.maxFileSize)}. ${suggestions}`,
                errorCode: 'FILE_TOO_LARGE'
            };
        }

        // Warn about very small files that might not contain useful content
        if (file.size < 100) { // Less than 100 bytes
            console.warn(`File ${file.name} is very small (${file.size} bytes). It may not contain useful content.`);
        }

        return { isValid: true };
    }

    /**
     * Validates MIME type against supported formats
     * @param {File} file - The file to validate
     * @returns {Object} - MIME type validation result
     */
    validateMimeType(file) {
        const detectedMimeType = this.detectMimeType(file);
        
        if (!detectedMimeType || detectedMimeType === 'application/octet-stream') {
            // Fallback to extension-based validation if MIME type is generic
            return { isValid: true }; // Let extension validation handle this
        }

        if (!this.config.supportedFormats.includes(detectedMimeType)) {
            const suggestions = this.getFormatSuggestions(detectedMimeType);
            return {
                isValid: false,
                errorMessage: `File type '${this.getDisplayMimeType(detectedMimeType)}' is not supported. ${suggestions}`,
                errorCode: 'UNSUPPORTED_MIME_TYPE'
            };
        }

        return { isValid: true };
    }

    /**
     * Validates file extension as fallback when MIME type detection fails
     * @param {File} file - The file to validate
     * @returns {Object} - Extension validation result
     */
    validateFileExtension(file) {
        const fileName = file.name.toLowerCase();
        const hasValidExtension = this.config.supportedExtensions.some(ext => 
            fileName.endsWith(ext.toLowerCase())
        );

        if (!hasValidExtension) {
            const currentExtension = this.getFileExtension(file.name);
            const suggestions = this.getExtensionSuggestions(currentExtension);
            
            return {
                isValid: false,
                errorMessage: `File extension '${currentExtension || 'none'}' is not supported. ${suggestions}`,
                errorCode: 'UNSUPPORTED_EXTENSION'
            };
        }

        return { isValid: true };
    }

    /**
     * Detects MIME type from file, with fallback to extension-based detection
     * @param {File} file - The file to analyze
     * @returns {string} - Detected MIME type
     */
    detectMimeType(file) {
        // Use browser-provided MIME type if available and not generic
        if (file.type && file.type !== 'application/octet-stream') {
            return file.type;
        }

        // Fallback to extension-based MIME type detection
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

        // Return original type if no match found
        return file.type || 'application/octet-stream';
    }

    /**
     * Formats file size in human-readable format
     * @param {number} bytes - File size in bytes
     * @returns {string} - Formatted file size
     */
    formatFileSize(bytes) {
        // Handle edge cases
        if (typeof bytes !== 'number' || bytes < 0 || isNaN(bytes)) {
            return '0 B';
        }

        if (bytes === 0) {
            return '0 B';
        }

        const units = ['B', 'KB', 'MB', 'GB'];
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        // Ensure we don't exceed available units
        const unitIndex = Math.min(i, units.length - 1);
        const size = bytes / Math.pow(k, unitIndex);
        
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }

    /**
     * Gets user-friendly display names for supported formats
     * @returns {Array<string>} - Array of format display names
     */
    getSupportedFormatsDisplay() {
        const formatMap = {
            'application/pdf': 'PDF',
            'application/msword': 'DOC',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
            'text/plain': 'TXT'
        };

        return this.config.supportedFormats.map(format => 
            formatMap[format] || format
        );
    }

    /**
     * Gets file metadata for processing
     * @param {File} file - The file to analyze
     * @returns {Object} - File metadata
     */
    getFileMetadata(file) {
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
     * Extracts file extension from filename
     * @param {string} filename - The filename
     * @returns {string} - File extension including the dot
     */
    getFileExtension(filename) {
        const lastDotIndex = filename.lastIndexOf('.');
        return lastDotIndex !== -1 ? filename.substring(lastDotIndex) : '';
    }

    /**
     * Validates file for security concerns
     * @param {File} file - The file to validate
     * @returns {Object} - Security validation result
     */
    validateFileSecurity(file) {
        // Check for suspicious file names
        const suspiciousPatterns = [
            /\.(exe|bat|cmd|scr|pif|com|vbs|js|jar|app|deb|rpm)$/i,
            /^\./, // Hidden files
            /[<>:"|?*]/, // Invalid filename characters
            /\x00/, // Null bytes
        ];

        for (const pattern of suspiciousPatterns) {
            if (pattern.test(file.name)) {
                return {
                    isValid: false,
                    errorMessage: 'File name contains suspicious characters or patterns. Please rename your file and try again.',
                    errorCode: 'SUSPICIOUS_FILENAME'
                };
            }
        }

        // Check for excessively long filenames
        if (file.name.length > 255) {
            return {
                isValid: false,
                errorMessage: 'File name is too long. Please use a shorter filename (maximum 255 characters).',
                errorCode: 'FILENAME_TOO_LONG'
            };
        }

        // Check for double extensions (potential security risk)
        const extensions = file.name.toLowerCase().match(/\.[a-z0-9]+/g);
        if (extensions && extensions.length > 1) {
            const lastExtension = extensions[extensions.length - 1];
            if (!this.config.supportedExtensions.includes(lastExtension)) {
                return {
                    isValid: false,
                    errorMessage: 'File has multiple extensions which may indicate a security risk. Please use a file with a single, supported extension.',
                    errorCode: 'MULTIPLE_EXTENSIONS'
                };
            }
        }

        return { isValid: true };
    }

    /**
     * Gets suggestions for file size limit issues
     * @param {number} fileSize - The file size that exceeded the limit
     * @returns {string} - Helpful suggestions
     */
    getSizeLimitSuggestions(fileSize) {
        const ratio = fileSize / this.config.maxFileSize;
        
        if (ratio > 10) {
            return 'This file is extremely large. Consider compressing it or splitting it into smaller documents.';
        } else if (ratio > 5) {
            return 'Try compressing the file or reducing its content to fit within the size limit.';
        } else if (ratio > 2) {
            return 'The file is slightly too large. Try compressing it or removing unnecessary content.';
        } else {
            return 'Please select a smaller file or compress the current one.';
        }
    }

    /**
     * Gets suggestions for unsupported file formats
     * @param {string} mimeType - The unsupported MIME type
     * @returns {string} - Helpful suggestions
     */
    getFormatSuggestions(mimeType) {
        const commonConversions = {
            'image/jpeg': 'If this is a scanned document, try converting it to PDF first.',
            'image/png': 'If this is a scanned document, try converting it to PDF first.',
            'application/zip': 'Please extract the archive and upload the individual documents.',
            'application/x-rar-compressed': 'Please extract the archive and upload the individual documents.',
            'video/mp4': 'Video files are not supported. Please upload text documents instead.',
            'audio/mpeg': 'Audio files are not supported. Please upload text documents instead.',
        };

        const suggestion = commonConversions[mimeType];
        if (suggestion) {
            return `${suggestion} Supported formats: ${this.getSupportedFormatsDisplay().join(', ')}.`;
        }

        return `Please convert your file to one of the supported formats: ${this.getSupportedFormatsDisplay().join(', ')}.`;
    }

    /**
     * Gets suggestions for unsupported file extensions
     * @param {string} extension - The unsupported extension
     * @returns {string} - Helpful suggestions
     */
    getExtensionSuggestions(extension) {
        const commonConversions = {
            '.rtf': 'Try saving as .doc or .docx from your word processor.',
            '.odt': 'Try saving as .doc or .docx from LibreOffice or OpenOffice.',
            '.pages': 'Try exporting as .doc or .pdf from Pages.',
            '.jpg': 'If this is a scanned document, try converting it to PDF.',
            '.png': 'If this is a scanned document, try converting it to PDF.',
            '.zip': 'Please extract the archive and upload individual documents.',
            '.rar': 'Please extract the archive and upload individual documents.',
        };

        const suggestion = commonConversions[extension?.toLowerCase()];
        if (suggestion) {
            return `${suggestion} Supported extensions: ${this.config.supportedExtensions.join(', ')}.`;
        }

        return `Please use files with these extensions: ${this.config.supportedExtensions.join(', ')}.`;
    }

    /**
     * Gets user-friendly display name for MIME type
     * @param {string} mimeType - The MIME type
     * @returns {string} - Display name
     */
    getDisplayMimeType(mimeType) {
        const displayNames = {
            'image/jpeg': 'JPEG Image',
            'image/png': 'PNG Image',
            'image/gif': 'GIF Image',
            'video/mp4': 'MP4 Video',
            'audio/mpeg': 'MP3 Audio',
            'application/zip': 'ZIP Archive',
            'application/x-rar-compressed': 'RAR Archive',
            'text/html': 'HTML Document',
            'text/css': 'CSS Stylesheet',
            'application/javascript': 'JavaScript File',
        };

        return displayNames[mimeType] || mimeType;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileValidator;
} else if (typeof window !== 'undefined') {
    window.FileValidator = FileValidator;
}