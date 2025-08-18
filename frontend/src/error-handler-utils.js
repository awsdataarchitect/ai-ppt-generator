/**
 * Utility functions for enhanced error handling integration
 * These functions provide easy-to-use interfaces for the enhanced ErrorHandler
 */

/**
 * Show success notification with celebration
 * @param {string} message - Success message
 * @param {Object} options - Additional options
 */
function showSuccessNotification(message, options = {}) {
    if (window.errorHandler) {
        return window.errorHandler.showSuccessToast(message, {
            duration: 4000,
            ...options
        });
    }
    console.log('Success:', message);
}

/**
 * Show error notification with retry option
 * @param {string} message - Error message
 * @param {Object} options - Additional options
 */
function showErrorNotification(message, options = {}) {
    if (window.errorHandler) {
        return window.errorHandler.showErrorToast(message, {
            duration: 0, // Persistent for errors
            ...options
        });
    }
    console.error('Error:', message);
}

/**
 * Show warning notification
 * @param {string} message - Warning message
 * @param {Object} options - Additional options
 */
function showWarningNotification(message, options = {}) {
    if (window.errorHandler) {
        return window.errorHandler.showWarningToast(message, {
            duration: 6000,
            ...options
        });
    }
    console.warn('Warning:', message);
}

/**
 * Show info notification
 * @param {string} message - Info message
 * @param {Object} options - Additional options
 */
function showInfoNotification(message, options = {}) {
    if (window.errorHandler) {
        return window.errorHandler.showInfoToast(message, {
            duration: 4000,
            ...options
        });
    }
    console.info('Info:', message);
}

/**
 * Handle file processing error with enhanced feedback
 * @param {Error} error - The error that occurred
 * @param {Object} context - Additional context
 * @param {string} containerId - Container to display error in
 */
function handleFileProcessingError(error, context = {}, containerId = 'status') {
    if (window.errorHandler) {
        const errorResult = window.errorHandler.handleError(error, {
            operation: 'file_processing',
            ...context
        });
        
        // Display in container and show toast
        window.errorHandler.displayError(errorResult, containerId);
        
        return errorResult;
    } else {
        // Fallback error handling
        console.error('File processing error:', error);
        const statusElement = document.getElementById(containerId);
        if (statusElement) {
            statusElement.textContent = `Error: ${error.message}`;
            statusElement.className = 'status error';
        }
        return null;
    }
}

/**
 * Retry operation with enhanced feedback
 * @param {Function} operation - Operation to retry
 * @param {Object} options - Retry options
 */
async function retryOperationWithFeedback(operation, options = {}) {
    if (window.errorHandler) {
        return await window.errorHandler.retryOperationWithFeedback(operation, {
            showProgress: true,
            operationName: 'File Processing',
            ...options
        });
    } else {
        // Fallback to simple retry
        return await operation();
    }
}

/**
 * Add help tooltip to an element
 * @param {HTMLElement|string} element - Element or element ID
 * @param {string} helpText - Help text to display
 * @param {Object} options - Additional options
 */
function addHelpTooltip(element, helpText, options = {}) {
    if (window.errorHandler) {
        const targetElement = typeof element === 'string' ? 
            document.getElementById(element) : element;
        
        if (targetElement) {
            return window.errorHandler.createHelpTooltip(targetElement, helpText, options);
        }
    }
    return null;
}

/**
 * Show contextual help for common operations
 * @param {string} operation - Operation type
 */
function showContextualHelp(operation) {
    const helpMessages = {
        file_upload: 'Upload documents in PDF, DOC, DOCX, or TXT format. Maximum 5MB per file. Multiple files can be processed together.',
        presentation_generation: 'Describe your presentation topic clearly. The AI will use your uploaded documents to create relevant content.',
        file_validation: 'Ensure your files are not corrupted and in supported formats. Password-protected files need to be unlocked first.',
        network_issues: 'Check your internet connection. Try refreshing the page or switching networks if uploads fail.',
        processing_timeout: 'Large files may take longer to process. Try splitting large documents or using smaller files.'
    };
    
    const message = helpMessages[operation] || 'For additional help, check the help tooltips next to each feature.';
    showInfoNotification(message, {
        title: 'Help',
        duration: 8000
    });
}

/**
 * Initialize enhanced error handling for file operations
 */
function initializeFileErrorHandling() {
    // Store last failed operation for retry functionality
    window.lastFailedOperation = null;
    
    // Add error handling to file input
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        fileInput.addEventListener('error', (event) => {
            handleFileProcessingError(new Error('File input error'), {
                element: 'file-input'
            });
        });
    }
    
    // Add error handling to upload area
    const uploadArea = document.getElementById('upload-area');
    if (uploadArea) {
        uploadArea.addEventListener('error', (event) => {
            handleFileProcessingError(new Error('Upload area error'), {
                element: 'upload-area'
            });
        });
    }
    
    // Add help tooltips to key elements
    setTimeout(() => {
        addHelpTooltip('upload-area', 'Drag files here or click to browse. Supports PDF, DOC, DOCX, TXT up to 5MB each.');
        addHelpTooltip('prompt-input', 'Describe your presentation topic. Be specific about content, audience, and key points.');
        addHelpTooltip('generate-btn', 'Create AI-powered presentations using your uploaded documents as context.');
    }, 1000); // Delay to ensure elements are loaded
}

/**
 * Handle batch file processing with enhanced error reporting
 * @param {Array} files - Files to process
 * @param {Function} processingFunction - Function to process each file
 */
async function handleBatchFileProcessing(files, processingFunction) {
    const results = [];
    const errors = [];
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
            // Store current operation for retry
            window.lastFailedOperation = () => processingFunction(file);
            
            const result = await retryOperationWithFeedback(
                () => processingFunction(file),
                {
                    operationName: `Processing ${file.name}`,
                    maxRetries: 2
                }
            );
            
            results.push(result);
            
        } catch (error) {
            const errorResult = handleFileProcessingError(error, {
                filename: file.name,
                fileIndex: i,
                totalFiles: files.length
            });
            
            errors.push({
                file,
                error: errorResult || error
            });
        }
    }
    
    // Show summary
    if (window.errorHandler && (results.length > 0 || errors.length > 0)) {
        const summary = window.errorHandler.handleMultipleFileResults(results, errors);
        
        if (summary.type === 'success') {
            showSuccessNotification(summary.message);
        } else if (summary.type === 'warning') {
            showWarningNotification(summary.message);
        } else {
            showErrorNotification(summary.message);
        }
    }
    
    return { results, errors };
}

// Export functions for global use
if (typeof window !== 'undefined') {
    window.showSuccessNotification = showSuccessNotification;
    window.showErrorNotification = showErrorNotification;
    window.showWarningNotification = showWarningNotification;
    window.showInfoNotification = showInfoNotification;
    window.handleFileProcessingError = handleFileProcessingError;
    window.retryOperationWithFeedback = retryOperationWithFeedback;
    window.addHelpTooltip = addHelpTooltip;
    window.showContextualHelp = showContextualHelp;
    window.initializeFileErrorHandling = initializeFileErrorHandling;
    window.handleBatchFileProcessing = handleBatchFileProcessing;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFileErrorHandling);
} else {
    initializeFileErrorHandling();
}