/**
 * Enhanced ErrorHandler class for managing file processing errors and user feedback
 * Provides professional styling, toast notifications, retry mechanisms, and help tooltips
 */
class ErrorHandler {
    constructor() {
        this.toastContainer = null;
        this.helpTooltips = new Map();
        this.retryAttempts = new Map();
        this.initializeToastContainer();
        this.initializeStyles();
        
        this.errorMessages = {
            // File validation errors
            FILE_TOO_LARGE: 'File size exceeds the 5MB limit. Please choose a smaller file or compress your document.',
            UNSUPPORTED_FORMAT: 'File format not supported. Please use PDF, DOC, DOCX, or TXT files.',
            FILE_EMPTY: 'The selected file appears to be empty or corrupted. Please choose a different file.',
            NO_FILE_PROVIDED: 'No file was selected. Please choose a file to upload.',
            
            // File processing errors
            CONVERSION_FAILED: 'Failed to process the file. Please try again or choose a different file.',
            FILE_READ_ERROR: 'Unable to read the file. The file may be corrupted or in use by another application.',
            PROCESSING_TIMEOUT: 'File processing is taking longer than expected. Please try again with a smaller file.',
            
            // Network and service errors
            UPLOAD_FAILED: 'Failed to upload the file. Please check your internet connection and try again.',
            SERVICE_UNAVAILABLE: 'The document processing service is temporarily unavailable. Please try again in a few moments.',
            AUTHENTICATION_ERROR: 'Authentication failed. Please sign in again.',
            
            // General errors
            UNKNOWN_ERROR: 'An unexpected error occurred. Please try again or contact support if the issue persists.',
            MULTIPLE_FILES_PARTIAL_FAILURE: 'Some files could not be processed. Successfully processed files are available for use.',
            
            // Recovery suggestions
            RECOVERY_SUGGESTIONS: {
                FILE_TOO_LARGE: [
                    'Try compressing your PDF using online tools',
                    'Split large documents into smaller sections',
                    'Use a different file format if possible'
                ],
                UNSUPPORTED_FORMAT: [
                    'Convert your file to PDF, DOC, DOCX, or TXT format',
                    'Use online conversion tools if needed',
                    'Check that the file extension matches the actual file type'
                ],
                CONVERSION_FAILED: [
                    'Try uploading the file again',
                    'Check if the file is corrupted by opening it in another application',
                    'Try converting the file to a different supported format'
                ],
                UPLOAD_FAILED: [
                    'Check your internet connection',
                    'Try refreshing the page and uploading again',
                    'Try uploading one file at a time'
                ]
            }
        };
        
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 second
        this.toastTimeout = 5000; // 5 seconds for auto-dismiss
        this.helpTooltipDelay = 500; // 500ms delay for tooltips
    }

    /**
     * Initialize toast notification container with professional styling
     */
    initializeToastContainer() {
        if (this.toastContainer) return;
        
        this.toastContainer = document.createElement('div');
        this.toastContainer.id = 'toast-container';
        this.toastContainer.className = 'toast-container';
        document.body.appendChild(this.toastContainer);
    }

    /**
     * Initialize professional CSS styles for error handling components
     */
    initializeStyles() {
        if (document.getElementById('error-handler-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'error-handler-styles';
        styles.textContent = `
            /* Toast Container */
            .toast-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 400px;
                pointer-events: none;
            }

            /* Toast Notifications */
            .toast {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                border-radius: 12px;
                padding: 16px 20px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                display: flex;
                align-items: flex-start;
                gap: 12px;
                transform: translateX(100%);
                opacity: 0;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                pointer-events: auto;
                position: relative;
                overflow: hidden;
            }

            .toast.show {
                transform: translateX(0);
                opacity: 1;
            }

            .toast.hide {
                transform: translateX(100%);
                opacity: 0;
            }

            .toast::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: var(--toast-accent-color);
                border-radius: 12px 12px 0 0;
            }

            .toast-success {
                --toast-accent-color: #10b981;
                color: #065f46;
            }

            .toast-error {
                --toast-accent-color: #ef4444;
                color: #7f1d1d;
            }

            .toast-warning {
                --toast-accent-color: #f59e0b;
                color: #78350f;
            }

            .toast-info {
                --toast-accent-color: #3b82f6;
                color: #1e3a8a;
            }

            .toast-icon {
                font-size: 20px;
                flex-shrink: 0;
                margin-top: 2px;
            }

            .toast-content {
                flex: 1;
                min-width: 0;
            }

            .toast-title {
                font-weight: 600;
                font-size: 14px;
                margin-bottom: 4px;
                line-height: 1.3;
            }

            .toast-message {
                font-size: 13px;
                line-height: 1.4;
                opacity: 0.9;
                word-wrap: break-word;
            }

            .toast-actions {
                display: flex;
                gap: 8px;
                margin-top: 8px;
            }

            .toast-button {
                background: rgba(0, 0, 0, 0.1);
                border: none;
                border-radius: 6px;
                padding: 4px 8px;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .toast-button:hover {
                background: rgba(0, 0, 0, 0.2);
                transform: translateY(-1px);
            }

            .toast-button.primary {
                background: var(--toast-accent-color);
                color: white;
            }

            .toast-button.primary:hover {
                filter: brightness(1.1);
            }

            .toast-close {
                position: absolute;
                top: 8px;
                right: 8px;
                background: none;
                border: none;
                font-size: 16px;
                cursor: pointer;
                opacity: 0.5;
                transition: opacity 0.2s ease;
                padding: 4px;
                border-radius: 4px;
            }

            .toast-close:hover {
                opacity: 1;
                background: rgba(0, 0, 0, 0.1);
            }

            /* Professional Error Messages */
            .error-message-professional {
                background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05));
                border: 1px solid rgba(239, 68, 68, 0.3);
                border-radius: 12px;
                padding: 20px;
                margin: 16px 0;
                position: relative;
                overflow: hidden;
            }

            .error-message-professional::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: linear-gradient(90deg, #ef4444, #dc2626);
            }

            .error-message-warning {
                background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.05));
                border: 1px solid rgba(245, 158, 11, 0.3);
            }

            .error-message-warning::before {
                background: linear-gradient(90deg, #f59e0b, #d97706);
            }

            .error-message-info {
                background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05));
                border: 1px solid rgba(59, 130, 246, 0.3);
            }

            .error-message-info::before {
                background: linear-gradient(90deg, #3b82f6, #2563eb);
            }

            .error-header {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 12px;
            }

            .error-icon {
                font-size: 24px;
                flex-shrink: 0;
            }

            .error-title {
                font-weight: 600;
                font-size: 16px;
                color: rgba(255, 255, 255, 0.95);
                margin: 0;
            }

            .error-description {
                color: rgba(255, 255, 255, 0.85);
                line-height: 1.5;
                margin-bottom: 16px;
            }

            .error-suggestions {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 16px;
            }

            .error-suggestions-title {
                font-weight: 600;
                color: rgba(255, 255, 255, 0.95);
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .error-suggestions-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            .error-suggestions-list li {
                padding: 4px 0;
                color: rgba(255, 255, 255, 0.8);
                position: relative;
                padding-left: 20px;
            }

            .error-suggestions-list li::before {
                content: '→';
                position: absolute;
                left: 0;
                color: rgba(255, 255, 255, 0.6);
            }

            .error-actions {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
            }

            .error-button {
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: rgba(255, 255, 255, 0.95);
                padding: 10px 16px;
                border-radius: 8px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
            }

            .error-button:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            }

            .error-button.primary {
                background: rgba(59, 130, 246, 0.8);
                border-color: rgba(59, 130, 246, 0.9);
            }

            .error-button.primary:hover {
                background: rgba(59, 130, 246, 0.9);
            }

            /* Help Tooltips */
            .help-tooltip {
                position: relative;
                display: inline-block;
                cursor: help;
            }

            .help-tooltip-trigger {
                background: rgba(59, 130, 246, 0.2);
                border: 1px solid rgba(59, 130, 246, 0.4);
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: bold;
                color: #60a5fa;
                cursor: help;
                transition: all 0.2s ease;
            }

            .help-tooltip-trigger:hover {
                background: rgba(59, 130, 246, 0.3);
                transform: scale(1.1);
            }

            .help-tooltip-content {
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                font-size: 13px;
                line-height: 1.4;
                white-space: nowrap;
                max-width: 300px;
                white-space: normal;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                z-index: 1000;
                opacity: 0;
                visibility: hidden;
                transition: all 0.2s ease;
                margin-bottom: 8px;
            }

            .help-tooltip-content::after {
                content: '';
                position: absolute;
                top: 100%;
                left: 50%;
                transform: translateX(-50%);
                border: 6px solid transparent;
                border-top-color: rgba(0, 0, 0, 0.9);
            }

            .help-tooltip:hover .help-tooltip-content {
                opacity: 1;
                visibility: visible;
            }

            /* Retry Progress Indicator */
            .retry-progress {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 8px;
                padding: 8px 12px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                font-size: 13px;
            }

            .retry-spinner {
                width: 16px;
                height: 16px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-top: 2px solid rgba(255, 255, 255, 0.8);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            /* Mobile Responsiveness */
            @media (max-width: 768px) {
                .toast-container {
                    top: 10px;
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }

                .toast {
                    margin: 0;
                }

                .error-message-professional {
                    margin: 12px 0;
                    padding: 16px;
                }

                .error-actions {
                    flex-direction: column;
                }

                .error-button {
                    justify-content: center;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    /**
     * Handles file processing errors and provides user feedback
     * @param {Error} error - The error to handle
     * @param {Object} context - Additional context about the error
     * @returns {Object} - Error handling result with user message and recovery options
     */
    handleError(error, context = {}) {
        const errorInfo = this.categorizeError(error, context);
        const userMessage = this.getUserFriendlyMessage(errorInfo);
        const recoverySuggestions = this.getRecoverySuggestions(errorInfo);
        
        // Log error for debugging
        this.logError(error, context, errorInfo);
        
        return {
            type: errorInfo.type,
            severity: errorInfo.severity,
            userMessage,
            recoverySuggestions,
            canRetry: errorInfo.canRetry,
            shouldShowDetails: errorInfo.shouldShowDetails,
            technicalDetails: error.message,
            timestamp: new Date().toISOString(),
            context
        };
    }

    /**
     * Categorizes errors into types for appropriate handling
     * @param {Error} error - The error to categorize
     * @param {Object} context - Additional context
     * @returns {Object} - Error categorization information
     */
    categorizeError(error, context) {
        const errorMessage = error.message?.toLowerCase() || '';
        const errorCode = error.code || '';
        
        // File validation errors
        if (errorCode === 'FILE_VALIDATION_FAILED' || errorMessage.includes('validation')) {
            if (errorMessage.includes('size') || errorMessage.includes('exceeds')) {
                return {
                    type: 'FILE_TOO_LARGE',
                    severity: 'warning',
                    canRetry: false,
                    shouldShowDetails: false
                };
            }
            if (errorMessage.includes('format') || errorMessage.includes('supported')) {
                return {
                    type: 'UNSUPPORTED_FORMAT',
                    severity: 'warning',
                    canRetry: false,
                    shouldShowDetails: false
                };
            }
            if (errorMessage.includes('empty') || errorMessage.includes('corrupted')) {
                return {
                    type: 'FILE_EMPTY',
                    severity: 'warning',
                    canRetry: false,
                    shouldShowDetails: false
                };
            }
            if (errorMessage.includes('no file') || errorMessage.includes('not provided')) {
                return {
                    type: 'NO_FILE_PROVIDED',
                    severity: 'info',
                    canRetry: false,
                    shouldShowDetails: false
                };
            }
        }
        
        // File processing errors
        if (errorCode === 'CONVERSION_FAILED' || errorMessage.includes('conversion') || errorMessage.includes('filereader')) {
            return {
                type: 'CONVERSION_FAILED',
                severity: 'error',
                canRetry: true,
                shouldShowDetails: true
            };
        }
        
        // Network errors
        if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('connection')) {
            return {
                type: 'UPLOAD_FAILED',
                severity: 'error',
                canRetry: true,
                shouldShowDetails: false
            };
        }
        
        // Service errors
        if (errorMessage.includes('service') || errorMessage.includes('server') || errorMessage.includes('503') || errorMessage.includes('502')) {
            return {
                type: 'SERVICE_UNAVAILABLE',
                severity: 'error',
                canRetry: true,
                shouldShowDetails: false
            };
        }
        
        // Authentication errors
        if (errorMessage.includes('auth') || errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
            return {
                type: 'AUTHENTICATION_ERROR',
                severity: 'error',
                canRetry: false,
                shouldShowDetails: false
            };
        }
        
        // Timeout errors
        if (errorMessage.includes('timeout') || errorMessage.includes('time out')) {
            return {
                type: 'PROCESSING_TIMEOUT',
                severity: 'warning',
                canRetry: true,
                shouldShowDetails: false
            };
        }
        
        // Default to unknown error
        return {
            type: 'UNKNOWN_ERROR',
            severity: 'error',
            canRetry: true,
            shouldShowDetails: true
        };
    }

    /**
     * Gets user-friendly error message
     * @param {Object} errorInfo - Error categorization information
     * @returns {string} - User-friendly error message
     */
    getUserFriendlyMessage(errorInfo) {
        return this.errorMessages[errorInfo.type] || this.errorMessages.UNKNOWN_ERROR;
    }

    /**
     * Gets recovery suggestions for the error
     * @param {Object} errorInfo - Error categorization information
     * @returns {Array<string>} - Array of recovery suggestions
     */
    getRecoverySuggestions(errorInfo) {
        return this.errorMessages.RECOVERY_SUGGESTIONS[errorInfo.type] || [];
    }

    /**
     * Logs error information for debugging
     * @param {Error} error - The original error
     * @param {Object} context - Error context
     * @param {Object} errorInfo - Categorized error information
     */
    logError(error, context, errorInfo) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: errorInfo.type,
            severity: errorInfo.severity,
            message: error.message,
            stack: error.stack,
            context,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // Log to console in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.error('File Processing Error:', logEntry);
        }
        
        // In production, you might want to send this to a logging service
        // this.sendToLoggingService(logEntry);
    }

    /**
     * Show toast notification with professional styling
     * @param {string} message - Toast message
     * @param {string} type - Toast type (success, error, warning, info)
     * @param {Object} options - Additional options
     */
    showToast(message, type = 'info', options = {}) {
        const {
            title = null,
            duration = this.toastTimeout,
            actions = [],
            persistent = false,
            icon = null
        } = options;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const defaultIcons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        const toastIcon = icon || defaultIcons[type] || defaultIcons.info;
        
        toast.innerHTML = `
            <div class="toast-icon">${toastIcon}</div>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${title}</div>` : ''}
                <div class="toast-message">${message}</div>
                ${actions.length > 0 ? `
                    <div class="toast-actions">
                        ${actions.map(action => `
                            <button class="toast-button ${action.primary ? 'primary' : ''}" 
                                    onclick="${action.onclick}">
                                ${action.label}
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;

        this.toastContainer.appendChild(toast);

        // Trigger show animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Auto-dismiss unless persistent
        if (!persistent && duration > 0) {
            setTimeout(() => {
                toast.classList.add('hide');
                setTimeout(() => {
                    if (toast.parentElement) {
                        toast.parentElement.removeChild(toast);
                    }
                }, 300);
            }, duration);
        }

        return toast;
    }

    /**
     * Show success toast notification
     * @param {string} message - Success message
     * @param {Object} options - Additional options
     */
    showSuccessToast(message, options = {}) {
        return this.showToast(message, 'success', {
            title: 'Success',
            icon: '🎉',
            ...options
        });
    }

    /**
     * Show error toast notification with retry option
     * @param {string} message - Error message
     * @param {Object} options - Additional options
     */
    showErrorToast(message, options = {}) {
        const { onRetry, canRetry = false, ...otherOptions } = options;
        
        const actions = [];
        if (canRetry && onRetry) {
            actions.push({
                label: '🔄 Retry',
                primary: true,
                onclick: `(${onRetry.toString()})()`
            });
        }

        return this.showToast(message, 'error', {
            title: 'Error',
            persistent: canRetry,
            actions,
            ...otherOptions
        });
    }

    /**
     * Show warning toast notification
     * @param {string} message - Warning message
     * @param {Object} options - Additional options
     */
    showWarningToast(message, options = {}) {
        return this.showToast(message, 'warning', {
            title: 'Warning',
            ...options
        });
    }

    /**
     * Show info toast notification
     * @param {string} message - Info message
     * @param {Object} options - Additional options
     */
    showInfoToast(message, options = {}) {
        return this.showToast(message, 'info', {
            title: 'Information',
            ...options
        });
    }

    /**
     * Create help tooltip for UI elements
     * @param {HTMLElement} element - Element to attach tooltip to
     * @param {string} content - Tooltip content
     * @param {Object} options - Additional options
     */
    createHelpTooltip(element, content, options = {}) {
        const { position = 'top', delay = this.helpTooltipDelay } = options;
        
        if (!element) return;

        // Create tooltip wrapper
        const wrapper = document.createElement('span');
        wrapper.className = 'help-tooltip';
        
        // Create trigger
        const trigger = document.createElement('span');
        trigger.className = 'help-tooltip-trigger';
        trigger.textContent = '?';
        
        // Create content
        const tooltipContent = document.createElement('div');
        tooltipContent.className = 'help-tooltip-content';
        tooltipContent.textContent = content;
        
        wrapper.appendChild(trigger);
        wrapper.appendChild(tooltipContent);
        
        // Insert after the element
        element.parentNode.insertBefore(wrapper, element.nextSibling);
        
        // Store reference for cleanup
        const tooltipId = `tooltip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.helpTooltips.set(tooltipId, wrapper);
        
        return tooltipId;
    }

    /**
     * Remove help tooltip
     * @param {string} tooltipId - Tooltip ID returned by createHelpTooltip
     */
    removeHelpTooltip(tooltipId) {
        const tooltip = this.helpTooltips.get(tooltipId);
        if (tooltip && tooltip.parentElement) {
            tooltip.parentElement.removeChild(tooltip);
            this.helpTooltips.delete(tooltipId);
        }
    }

    /**
     * Enhanced retry operation with visual feedback
     * @param {Function} operation - The operation to retry
     * @param {Object} options - Retry options
     */
    async retryOperationWithFeedback(operation, options = {}) {
        const {
            maxRetries = this.maxRetries,
            baseDelay = this.retryDelay,
            backoffMultiplier = 2,
            onRetry = null,
            showProgress = true,
            operationName = 'Operation'
        } = options;

        let progressToast = null;
        let lastError;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                // Show progress for retries
                if (showProgress && attempt > 0) {
                    if (progressToast) {
                        progressToast.remove();
                    }
                    progressToast = this.showToast(
                        `Retrying ${operationName.toLowerCase()}... (Attempt ${attempt + 1}/${maxRetries + 1})`,
                        'info',
                        {
                            title: 'Retrying',
                            persistent: true,
                            icon: '🔄'
                        }
                    );
                }

                const result = await operation();
                
                // Success - clean up progress toast
                if (progressToast) {
                    progressToast.remove();
                }
                
                // Show success toast for retries
                if (attempt > 0) {
                    this.showSuccessToast(`${operationName} succeeded after ${attempt + 1} attempt${attempt > 0 ? 's' : ''}!`);
                }
                
                return result;
                
            } catch (error) {
                lastError = error;
                
                if (attempt === maxRetries) {
                    break; // Don't wait after the last attempt
                }
                
                // Calculate delay with exponential backoff
                const delay = baseDelay * Math.pow(backoffMultiplier, attempt);
                
                // Call retry callback if provided
                if (onRetry) {
                    onRetry(attempt + 1, maxRetries + 1, error);
                }
                
                // Update progress toast with countdown
                if (showProgress && progressToast) {
                    const countdownSeconds = Math.ceil(delay / 1000);
                    progressToast.querySelector('.toast-message').textContent = 
                        `Retrying in ${countdownSeconds} second${countdownSeconds !== 1 ? 's' : ''}...`;
                }
                
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        // Clean up progress toast
        if (progressToast) {
            progressToast.remove();
        }
        
        // Show final error toast
        this.showErrorToast(
            `${operationName} failed after ${maxRetries + 1} attempts: ${lastError.message}`,
            {
                title: 'Operation Failed',
                persistent: true
            }
        );
        
        throw lastError;
    }

    /**
     * Displays error message to user with professional styling
     * @param {Object} errorResult - Result from handleError method
     * @param {string} containerId - ID of container to display error in
     */
    displayError(errorResult, containerId = 'status') {
        const container = document.getElementById(containerId);
        if (!container) {
            // Fallback to toast notification if container not found
            this.showErrorToast(errorResult.userMessage, {
                canRetry: errorResult.canRetry,
                onRetry: () => {
                    if (window.lastFailedOperation) {
                        window.lastFailedOperation();
                    }
                }
            });
            return;
        }

        // Clear existing content
        container.innerHTML = '';
        
        // Create professional error message element
        const errorDiv = document.createElement('div');
        errorDiv.className = `error-message-professional error-message-${errorResult.severity}`;
        
        // Error header with icon and title
        const headerDiv = document.createElement('div');
        headerDiv.className = 'error-header';
        
        const iconSpan = document.createElement('span');
        iconSpan.className = 'error-icon';
        iconSpan.textContent = this.getErrorIcon(errorResult.severity);
        
        const titleH3 = document.createElement('h3');
        titleH3.className = 'error-title';
        titleH3.textContent = this.getErrorTitle(errorResult.type, errorResult.severity);
        
        headerDiv.appendChild(iconSpan);
        headerDiv.appendChild(titleH3);
        errorDiv.appendChild(headerDiv);
        
        // Error description
        const descriptionP = document.createElement('p');
        descriptionP.className = 'error-description';
        descriptionP.textContent = errorResult.userMessage;
        errorDiv.appendChild(descriptionP);
        
        // Recovery suggestions with professional styling
        if (errorResult.recoverySuggestions.length > 0) {
            const suggestionsDiv = document.createElement('div');
            suggestionsDiv.className = 'error-suggestions';
            
            const suggestionsTitle = document.createElement('div');
            suggestionsTitle.className = 'error-suggestions-title';
            suggestionsTitle.innerHTML = '<span>💡</span> Suggested Solutions';
            
            const suggestionsList = document.createElement('ul');
            suggestionsList.className = 'error-suggestions-list';
            
            errorResult.recoverySuggestions.forEach(suggestion => {
                const li = document.createElement('li');
                li.textContent = suggestion;
                suggestionsList.appendChild(li);
            });
            
            suggestionsDiv.appendChild(suggestionsTitle);
            suggestionsDiv.appendChild(suggestionsList);
            errorDiv.appendChild(suggestionsDiv);
        }
        
        // Action buttons with professional styling
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'error-actions';
        
        // Retry button if applicable
        if (errorResult.canRetry) {
            const retryButton = document.createElement('button');
            retryButton.className = 'error-button primary';
            retryButton.innerHTML = '<span>🔄</span> Try Again';
            
            const operationKey = `${errorResult.type}_${Date.now()}`;
            this.retryAttempts.set(operationKey, 0);
            
            retryButton.onclick = async () => {
                const attempts = this.retryAttempts.get(operationKey) || 0;
                this.retryAttempts.set(operationKey, attempts + 1);
                
                // Show retry progress
                const progressDiv = document.createElement('div');
                progressDiv.className = 'retry-progress';
                progressDiv.innerHTML = `
                    <div class="retry-spinner"></div>
                    <span>Retrying operation...</span>
                `;
                
                retryButton.parentNode.insertBefore(progressDiv, retryButton.nextSibling);
                retryButton.disabled = true;
                
                try {
                    // Clear the error display
                    container.innerHTML = '';
                    
                    // Trigger retry logic
                    if (window.lastFailedOperation) {
                        await window.lastFailedOperation();
                    }
                } catch (retryError) {
                    // Handle retry failure
                    const newErrorResult = this.handleError(retryError, {
                        ...errorResult.context,
                        retryAttempt: attempts + 1
                    });
                    this.displayError(newErrorResult, containerId);
                } finally {
                    if (progressDiv.parentElement) {
                        progressDiv.parentElement.removeChild(progressDiv);
                    }
                }
            };
            
            actionsDiv.appendChild(retryButton);
        }
        
        // Help button
        const helpButton = document.createElement('button');
        helpButton.className = 'error-button';
        helpButton.innerHTML = '<span>❓</span> Get Help';
        helpButton.onclick = () => {
            this.showHelpDialog(errorResult);
        };
        actionsDiv.appendChild(helpButton);
        
        // Dismiss button for non-critical errors
        if (errorResult.severity !== 'error') {
            const dismissButton = document.createElement('button');
            dismissButton.className = 'error-button';
            dismissButton.innerHTML = '<span>✕</span> Dismiss';
            dismissButton.onclick = () => {
                errorDiv.style.transition = 'all 0.3s ease';
                errorDiv.style.opacity = '0';
                errorDiv.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    if (container.contains(errorDiv)) {
                        container.removeChild(errorDiv);
                    }
                }, 300);
            };
            actionsDiv.appendChild(dismissButton);
        }
        
        errorDiv.appendChild(actionsDiv);
        
        // Technical details (collapsible) with professional styling
        if (errorResult.shouldShowDetails && errorResult.technicalDetails) {
            const detailsDiv = document.createElement('details');
            detailsDiv.style.marginTop = '16px';
            detailsDiv.style.background = 'rgba(0, 0, 0, 0.2)';
            detailsDiv.style.borderRadius = '8px';
            detailsDiv.style.padding = '12px';
            
            const summary = document.createElement('summary');
            summary.textContent = 'Technical Details';
            summary.style.cursor = 'pointer';
            summary.style.fontWeight = '600';
            summary.style.color = 'rgba(255, 255, 255, 0.9)';
            summary.style.marginBottom = '8px';
            
            const detailsContent = document.createElement('pre');
            detailsContent.textContent = errorResult.technicalDetails;
            detailsContent.style.fontSize = '12px';
            detailsContent.style.lineHeight = '1.4';
            detailsContent.style.color = 'rgba(255, 255, 255, 0.8)';
            detailsContent.style.background = 'rgba(0, 0, 0, 0.3)';
            detailsContent.style.padding = '12px';
            detailsContent.style.borderRadius = '6px';
            detailsContent.style.overflow = 'auto';
            detailsContent.style.maxHeight = '200px';
            detailsContent.style.margin = '0';
            
            detailsDiv.appendChild(summary);
            detailsDiv.appendChild(detailsContent);
            errorDiv.appendChild(detailsDiv);
        }
        
        container.appendChild(errorDiv);
        
        // Animate in
        errorDiv.style.opacity = '0';
        errorDiv.style.transform = 'translateY(10px)';
        setTimeout(() => {
            errorDiv.style.transition = 'all 0.3s ease';
            errorDiv.style.opacity = '1';
            errorDiv.style.transform = 'translateY(0)';
        }, 10);
        
        // Auto-hide after delay for non-critical errors
        if (errorResult.severity === 'info' || errorResult.severity === 'warning') {
            setTimeout(() => {
                if (container.contains(errorDiv)) {
                    errorDiv.style.transition = 'all 0.5s ease';
                    errorDiv.style.opacity = '0';
                    errorDiv.style.transform = 'translateY(-10px)';
                    setTimeout(() => {
                        if (container.contains(errorDiv)) {
                            container.removeChild(errorDiv);
                        }
                    }, 500);
                }
            }, 8000); // Increased from 5 seconds to 8 seconds
        }
        
        // Also show toast notification for better visibility
        this.showToast(errorResult.userMessage, errorResult.severity, {
            title: this.getErrorTitle(errorResult.type, errorResult.severity),
            actions: errorResult.canRetry ? [{
                label: 'Retry',
                primary: true,
                onclick: 'document.querySelector(".error-button.primary")?.click()'
            }] : []
        });
    }

    /**
     * Get appropriate icon for error severity
     * @param {string} severity - Error severity
     * @returns {string} - Icon emoji
     */
    getErrorIcon(severity) {
        const icons = {
            error: '🚨',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[severity] || icons.error;
    }

    /**
     * Get appropriate title for error type and severity
     * @param {string} type - Error type
     * @param {string} severity - Error severity
     * @returns {string} - Error title
     */
    getErrorTitle(type, severity) {
        const titles = {
            FILE_TOO_LARGE: 'File Size Limit Exceeded',
            UNSUPPORTED_FORMAT: 'Unsupported File Format',
            FILE_EMPTY: 'Invalid File',
            NO_FILE_PROVIDED: 'No File Selected',
            CONVERSION_FAILED: 'File Processing Failed',
            FILE_READ_ERROR: 'File Read Error',
            PROCESSING_TIMEOUT: 'Processing Timeout',
            UPLOAD_FAILED: 'Upload Failed',
            SERVICE_UNAVAILABLE: 'Service Temporarily Unavailable',
            AUTHENTICATION_ERROR: 'Authentication Required',
            UNKNOWN_ERROR: 'Unexpected Error'
        };
        
        return titles[type] || (severity === 'error' ? 'Error' : severity === 'warning' ? 'Warning' : 'Information');
    }

    /**
     * Show help dialog with detailed guidance
     * @param {Object} errorResult - Error result object
     */
    showHelpDialog(errorResult) {
        const helpContent = this.getHelpContent(errorResult.type);
        
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(5px);
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        `;
        
        // Create modal content
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.9));
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 24px;
            max-width: 500px;
            width: 100%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            color: #1a202c;
        `;
        
        modal.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #2d3748; font-size: 20px; font-weight: 600;">
                    ${this.getErrorIcon(errorResult.severity)} Help & Guidance
                </h2>
                <button onclick="this.closest('[style*=\"position: fixed\"]').remove()" 
                        style="background: none; border: none; font-size: 24px; cursor: pointer; color: #718096;">
                    ×
                </button>
            </div>
            <div style="line-height: 1.6; color: #4a5568;">
                ${helpContent}
            </div>
            <div style="margin-top: 20px; text-align: right;">
                <button onclick="this.closest('[style*=\"position: fixed\"]').remove()" 
                        style="background: #3182ce; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 500;">
                    Got it
                </button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
    }

    /**
     * Get detailed help content for error types
     * @param {string} errorType - Type of error
     * @returns {string} - HTML help content
     */
    getHelpContent(errorType) {
        const helpContent = {
            FILE_TOO_LARGE: `
                <h3>File Size Limit</h3>
                <p>The file you're trying to upload exceeds our 5MB size limit. Here's what you can do:</p>
                <ul>
                    <li><strong>Compress your PDF:</strong> Use online tools like SmallPDF or ILovePDF to reduce file size</li>
                    <li><strong>Split large documents:</strong> Break your document into smaller sections</li>
                    <li><strong>Remove unnecessary content:</strong> Delete images or pages that aren't essential</li>
                    <li><strong>Use text format:</strong> Convert to plain text if formatting isn't critical</li>
                </ul>
                <p><strong>Why this limit exists:</strong> Large files take longer to process and may cause timeouts.</p>
            `,
            UNSUPPORTED_FORMAT: `
                <h3>Supported File Formats</h3>
                <p>We currently support these file formats:</p>
                <ul>
                    <li><strong>PDF:</strong> Portable Document Format (.pdf)</li>
                    <li><strong>Word Documents:</strong> .doc and .docx files</li>
                    <li><strong>Text Files:</strong> Plain text (.txt) files</li>
                </ul>
                <h4>How to convert your file:</h4>
                <ul>
                    <li><strong>Google Docs:</strong> File → Download → Choose supported format</li>
                    <li><strong>Microsoft Office:</strong> Save As → Select PDF or Word format</li>
                    <li><strong>Online converters:</strong> Use CloudConvert or similar services</li>
                </ul>
            `,
            CONVERSION_FAILED: `
                <h3>File Processing Issues</h3>
                <p>The file couldn't be processed. This usually happens when:</p>
                <ul>
                    <li><strong>File is corrupted:</strong> Try opening the file in another application first</li>
                    <li><strong>File is password protected:</strong> Remove password protection before uploading</li>
                    <li><strong>File contains only images:</strong> Ensure your PDF has selectable text</li>
                    <li><strong>File is too complex:</strong> Simplify formatting or convert to plain text</li>
                </ul>
                <h4>Quick fixes:</h4>
                <ul>
                    <li>Try saving/exporting the file again from the original application</li>
                    <li>Convert to a different supported format</li>
                    <li>Check if the file opens correctly in other applications</li>
                </ul>
            `,
            UPLOAD_FAILED: `
                <h3>Upload Connection Issues</h3>
                <p>The upload failed due to connection problems. Try these steps:</p>
                <ul>
                    <li><strong>Check your internet:</strong> Ensure you have a stable connection</li>
                    <li><strong>Refresh the page:</strong> Sometimes a simple refresh helps</li>
                    <li><strong>Try a different network:</strong> Switch to mobile data or different WiFi</li>
                    <li><strong>Disable VPN:</strong> VPNs can sometimes interfere with uploads</li>
                </ul>
                <h4>If problems persist:</h4>
                <ul>
                    <li>Try uploading one file at a time</li>
                    <li>Use a different browser</li>
                    <li>Clear your browser cache and cookies</li>
                </ul>
            `,
            SERVICE_UNAVAILABLE: `
                <h3>Service Temporarily Down</h3>
                <p>Our document processing service is temporarily unavailable. This is usually brief.</p>
                <h4>What you can do:</h4>
                <ul>
                    <li><strong>Wait a few minutes:</strong> Most service issues resolve quickly</li>
                    <li><strong>Check our status page:</strong> Look for any announced maintenance</li>
                    <li><strong>Try again later:</strong> The service should be back up soon</li>
                </ul>
                <h4>If this continues:</h4>
                <ul>
                    <li>Contact our support team</li>
                    <li>Try uploading a smaller file first</li>
                    <li>Check if other features are working</li>
                </ul>
            `
        };
        
        return helpContent[errorType] || `
            <h3>General Troubleshooting</h3>
            <p>Here are some general steps that often resolve issues:</p>
            <ul>
                <li><strong>Refresh the page:</strong> Sometimes a simple refresh helps</li>
                <li><strong>Try a different file:</strong> Test with a simple text file first</li>
                <li><strong>Check your connection:</strong> Ensure you have stable internet</li>
                <li><strong>Clear browser cache:</strong> Old cached data can cause problems</li>
                <li><strong>Try a different browser:</strong> Some browsers handle uploads better</li>
            </ul>
            <p>If none of these steps help, please contact our support team with details about what you were trying to do.</p>
        `;
    }

    /**
     * Gets CSS class for error severity
     * @param {string} severity - Error severity level
     * @returns {string} - CSS class name
     */
    getSeverityClass(severity) {
        const severityMap = {
            'info': 'info',
            'warning': 'warning',
            'error': 'error'
        };
        return severityMap[severity] || 'error';
    }

    /**
     * Handles multiple file processing with partial failures
     * @param {Array} results - Array of processing results
     * @param {Array} errors - Array of processing errors
     * @returns {Object} - Summary of results and user feedback
     */
    handleMultipleFileResults(results, errors) {
        const totalFiles = results.length + errors.length;
        const successCount = results.length;
        const errorCount = errors.length;
        
        if (errorCount === 0) {
            return {
                type: 'success',
                message: `✅ Successfully processed ${successCount} file${successCount !== 1 ? 's' : ''}`,
                details: results
            };
        }
        
        if (successCount === 0) {
            return {
                type: 'error',
                message: `❌ Failed to process all ${totalFiles} file${totalFiles !== 1 ? 's' : ''}`,
                details: errors,
                suggestions: [
                    'Check that all files are in supported formats (PDF, DOC, DOCX, TXT)',
                    'Ensure files are not corrupted or too large',
                    'Try uploading files one at a time'
                ]
            };
        }
        
        // Partial success
        return {
            type: 'warning',
            message: `⚠️ Processed ${successCount} of ${totalFiles} files successfully`,
            details: {
                successful: results,
                failed: errors
            },
            suggestions: [
                'Check the failed files for format or size issues',
                'Successfully processed files are ready to use',
                'You can try uploading the failed files again'
            ]
        };
    }

    /**
     * Implements retry logic with exponential backoff (legacy method)
     * @param {Function} operation - The operation to retry
     * @param {Object} options - Retry options
     * @returns {Promise} - Promise that resolves when operation succeeds or max retries reached
     */
    async retryOperation(operation, options = {}) {
        const {
            maxRetries = this.maxRetries,
            baseDelay = this.retryDelay,
            backoffMultiplier = 2,
            onRetry = null
        } = options;
        
        let lastError;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                
                if (attempt === maxRetries) {
                    break; // Don't wait after the last attempt
                }
                
                // Calculate delay with exponential backoff
                const delay = baseDelay * Math.pow(backoffMultiplier, attempt);
                
                // Call retry callback if provided
                if (onRetry) {
                    onRetry(attempt + 1, maxRetries + 1, error);
                }
                
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        throw lastError;
    }

    /**
     * Add help tooltips to common UI elements
     */
    addCommonHelpTooltips() {
        // File upload help
        const uploadArea = document.getElementById('upload-area');
        if (uploadArea) {
            this.createHelpTooltip(uploadArea, 
                'Drag and drop files here or click to browse. Supported formats: PDF, DOC, DOCX, TXT. Maximum size: 5MB per file.'
            );
        }

        // File input help
        const fileInput = document.getElementById('file-input');
        if (fileInput) {
            this.createHelpTooltip(fileInput,
                'Select one or more documents to upload. Multiple files can be processed at once.'
            );
        }

        // Prompt input help
        const promptInput = document.getElementById('prompt-input');
        if (promptInput) {
            this.createHelpTooltip(promptInput,
                'Describe the presentation you want to create. Be specific about the topic, audience, and key points you want to cover.'
            );
        }

        // Generate button help
        const generateBtn = document.getElementById('generate-btn');
        if (generateBtn) {
            this.createHelpTooltip(generateBtn,
                'Generate a presentation using your uploaded documents as context. The AI will create slides based on your prompt and document content.'
            );
        }
    }

    /**
     * Initialize error handling for the application
     */
    initializeErrorHandling() {
        // Add global error handlers
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.showErrorToast('An unexpected error occurred. Please refresh the page if problems persist.');
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.showErrorToast('A network or processing error occurred. Please try again.');
        });

        // Add common help tooltips
        this.addCommonHelpTooltips();

        // Store reference for global access
        window.errorHandler = this;
    }

    /**
     * Clean up resources
     */
    cleanup() {
        // Remove toast container
        if (this.toastContainer && this.toastContainer.parentElement) {
            this.toastContainer.parentElement.removeChild(this.toastContainer);
        }

        // Remove all help tooltips
        this.helpTooltips.forEach((tooltip, id) => {
            this.removeHelpTooltip(id);
        });

        // Clear retry attempts
        this.retryAttempts.clear();

        // Remove global reference
        if (window.errorHandler === this) {
            delete window.errorHandler;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
} else if (typeof window !== 'undefined') {
    window.ErrorHandler = ErrorHandler;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (!window.errorHandler) {
                const errorHandler = new ErrorHandler();
                errorHandler.initializeErrorHandling();
            }
        });
    } else {
        // DOM is already ready
        if (!window.errorHandler) {
            const errorHandler = new ErrorHandler();
            errorHandler.initializeErrorHandling();
        }
    }
}