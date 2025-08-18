// AI PPT Generator - Complete RAG Enhanced Implementation
import './amplify-config.js';
import { AuthService } from './auth.js';
import config from './config.js';

// Initialize auth service
const authService = new AuthService();

// Global variables
let uploadedDocuments = [];
let generatedPresentations = [];

// Status management
function updateStatus(message, type = 'info') {
    const statusElement = document.getElementById('status');
    const statusMessageElement = document.getElementById('status-message');
    
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = `status ${type}`;
    }
    
    if (statusMessageElement) {
        statusMessageElement.textContent = message;
    }
    
    console.log(`Status (${type}):`, message);
}

// Form management
function showForm(formId) {
    const forms = ['signin-form', 'signup-form', 'confirm-form'];
    forms.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.add('hidden');
        }
    });
    
    const targetForm = document.getElementById(formId);
    if (targetForm) {
        targetForm.classList.remove('hidden');
    }
}

// Dashboard management with professional enhancements
function showDashboard(show) {
    const authContainer = document.getElementById('auth-container');
    const dashboard = document.getElementById('dashboard');
    
    if (show) {
        if (authContainer) authContainer.style.display = 'none';
        if (dashboard) {
            dashboard.classList.remove('hidden');
            dashboard.style.display = 'block';
            initializeDashboard();
            initializeProfessionalDashboard();
            
            // Load user's existing documents when dashboard is shown
            loadUserDocuments();
        }
    } else {
        if (authContainer) authContainer.style.display = 'block';
        if (dashboard) {
            dashboard.classList.add('hidden');
            dashboard.style.display = 'none';
        }
    }
}

// Initialize professional dashboard enhancements
function initializeProfessionalDashboard() {
    // Add professional navigation breadcrumbs
    addNavigationBreadcrumbs();
    
    // Initialize status indicators
    initializeStatusIndicators();
    
    // Add professional section headers with icons
    enhanceSectionHeaders();
    
    // Initialize dashboard metrics
    initializeDashboardMetrics();
    
    // Add professional tooltips and help text
    addProfessionalTooltips();
    
    // Initialize dashboard animations
    initializeDashboardAnimations();
    
    // Enhance main header with professional styling
    enhanceMainHeader();
    
    // Add organized section layout
    organizeContentSections();
    
    // Initialize professional typography
    initializeProfessionalTypography();
}

// Initialize dashboard functionality with enhanced UI
function initializeDashboard() {
    // File upload functionality with professional enhancements
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const uploadBtn = document.getElementById('upload-btn');
    
    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.click();
        });
        fileInput.addEventListener('change', handleFileUpload);
    }
    
    if (uploadArea) {
        // Enhanced drag and drop with professional feedback
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleFileDrop);
        uploadArea.addEventListener('click', () => fileInput?.click());
        
        // Add drag feedback element if it doesn't exist
        if (!uploadArea.querySelector('.drag-feedback')) {
            const dragFeedback = document.createElement('div');
            dragFeedback.className = 'drag-feedback';
            dragFeedback.style.cssText = `
                display: none;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(102, 126, 234, 0.9);
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 1.1rem;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                z-index: 10;
            `;
            uploadArea.style.position = 'relative';
            uploadArea.appendChild(dragFeedback);
        }
    }
    
    // Initialize responsive design adjustments
    adjustResponsiveLayout();
    window.addEventListener('resize', adjustResponsiveLayout);
}

// Enhanced file upload handlers with professional styling
function handleDragOver(e) {
    e.preventDefault();
    const uploadArea = e.currentTarget;
    
    // Add professional drag-over styling
    uploadArea.classList.add('drag-over');
    uploadArea.style.borderColor = '#667eea';
    uploadArea.style.backgroundColor = 'rgba(102, 126, 234, 0.15)';
    uploadArea.style.transform = 'scale(1.02)';
    uploadArea.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.3)';
    
    // Update drag feedback text
    const dragFeedback = uploadArea.querySelector('.drag-feedback');
    if (dragFeedback) {
        dragFeedback.textContent = '📁 Drop files here to upload';
        dragFeedback.style.display = 'block';
    }
}

function handleDragLeave(e) {
    e.preventDefault();
    const uploadArea = e.currentTarget;
    
    // Only remove styling if we're actually leaving the upload area
    if (!uploadArea.contains(e.relatedTarget)) {
        resetUploadAreaStyling(uploadArea);
    }
}

function handleFileDrop(e) {
    e.preventDefault();
    const uploadArea = e.currentTarget;
    
    // Reset styling with smooth transition
    resetUploadAreaStyling(uploadArea);
    
    // Add drop animation
    uploadArea.style.transform = 'scale(0.98)';
    setTimeout(() => {
        uploadArea.style.transform = 'scale(1)';
    }, 150);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
        showFilePreview(files);
        processFiles(files);
    }
}

function resetUploadAreaStyling(uploadArea) {
    uploadArea.classList.remove('drag-over');
    uploadArea.style.borderColor = '#cbd5e0';
    uploadArea.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
    uploadArea.style.transform = 'scale(1)';
    uploadArea.style.boxShadow = 'none';
    
    const dragFeedback = uploadArea.querySelector('.drag-feedback');
    if (dragFeedback) {
        dragFeedback.style.display = 'none';
    }
}

function handleFileUpload(e) {
    const files = Array.from(e.target.files);
    processFiles(files);
}

// Enhanced file processing with professional UI feedback
async function processFiles(files) {
    if (files.length === 0) return;
    
    // Initialize error handling if not already done
    if (!errorHandler) {
        initializeFileProcessing();
    }
    
    // Update professional status indicators
    updateStatus('📄 Processing documents...', 'info');
    updateKnowledgeBaseSyncStatus('processing', 'Processing documents for Knowledge Base');
    
    showUploadProgress(true, { 
        initialText: `Preparing ${files.length} file${files.length !== 1 ? 's' : ''}...` 
    });
    
    // Update file preview status
    updateFilePreviewStatus('processing');
    
    try {
        const results = [];
        const errors = [];
        const totalFiles = files.length;
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const progressPercentage = (i / totalFiles) * 90; // Reserve 10% for completion
            
            // Update progress with detailed information
            updateProgressBar(
                progressPercentage, 
                `Processing ${file.name} (${i + 1}/${totalFiles})...`,
                { currentFile: i + 1, totalFiles }
            );
            
            // Update individual file status in preview
            updateIndividualFileStatus(i, 'processing');
            
            try {
                // Validate file before processing if validator is available
                if (fileValidator) {
                    const validationResult = fileValidator.validateFile(file);
                    if (!validationResult.isValid) {
                        throw new Error(validationResult.errorMessage);
                    }
                }
                
                // Add small delay for better UX (shows progress)
                await new Promise(resolve => setTimeout(resolve, 200));
                
                // Process file with Bedrock RAG service
                const result = await processDocumentWithRAG(file);
                console.log('Processing result for', file.name, ':', result);
                
                if (result.success) {
                    const docData = {
                        id: result.documentId,
                        name: file.name,
                        size: file.size,
                        uploadedAt: new Date(),
                        vectorCount: result.vectorCount,
                        textLength: result.textLength,
                        processingTime: result.processingTime
                    };
                    
                    uploadedDocuments.push(docData);
                    results.push(docData);
                    
                    // Update individual file status to success
                    updateIndividualFileStatus(i, 'success');
                    console.log('Added document to list:', docData);
                } else {
                    throw new Error(result.message || 'Processing failed');
                }
                
            } catch (error) {
                console.error('Failed to process', file.name, ':', error);
                errors.push({
                    filename: file.name,
                    error: error.message,
                    originalError: error,
                    index: i
                });
                
                // Update individual file status to error
                updateIndividualFileStatus(i, 'error', error.message);
                
                // Handle individual file error with user-friendly feedback
                if (errorHandler) {
                    const errorResult = errorHandler.handleError(error, { filename: file.name });
                    // For individual file errors during batch processing, we'll continue
                    // but collect the errors for summary at the end
                }
            }
        }
        
        // Final completion phase
        updateProgressBar(100, 'Finalizing...', { phase: 'completion' });
        
        // Small delay for completion animation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('About to update documents list. Documents:', uploadedDocuments);
        updateDocumentsList();
        
        // Hide progress with celebration if successful
        if (results.length > 0) {
            updateProgressBar(100, `✅ Successfully processed ${results.length} document${results.length !== 1 ? 's' : ''}!`);
            updateKnowledgeBaseSyncStatus('ready', `${results.length} document${results.length !== 1 ? 's' : ''} synchronized`);
            setTimeout(() => showUploadProgress(false), 2000);
        } else {
            updateKnowledgeBaseSyncStatus('error', 'Processing failed');
            setTimeout(() => showUploadProgress(false), 1000);
        }
        
        // Handle results summary with enhanced error handling
        if (errorHandler && (results.length > 0 || errors.length > 0)) {
            const summary = errorHandler.handleMultipleFileResults(results, errors);
            
            if (summary.type === 'success') {
                updateStatus(summary.message, 'success');
                showSuccessNotification(`${results.length} document${results.length !== 1 ? 's' : ''} processed successfully!`);
                updateKnowledgeBaseSyncStatus('ready', `Knowledge Base updated with ${results.length} document${results.length !== 1 ? 's' : ''}`);
            } else if (summary.type === 'warning') {
                updateStatus(summary.message, 'warning');
                showWarningNotification(`${results.length} succeeded, ${errors.length} failed`);
                updateKnowledgeBaseSyncStatus('ready', `Partial sync: ${results.length} succeeded, ${errors.length} failed`);
                // Show additional details for partial failures
                if (summary.details.failed.length > 0) {
                    console.warn('Failed files:', summary.details.failed);
                }
            } else {
                updateStatus(summary.message, 'error');
                showErrorNotification('Processing failed for all files');
                updateKnowledgeBaseSyncStatus('error', 'All documents failed to process');
                // Show suggestions for complete failures
                if (summary.suggestions && summary.suggestions.length > 0) {
                    const suggestionsText = summary.suggestions.join('; ');
                    setTimeout(() => {
                        updateStatus(`💡 Suggestions: ${suggestionsText}`, 'info');
                    }, 3000);
                }
            }
        } else {
            // Fallback to simple success message
            const successMessage = `✅ Successfully processed ${results.length} document${results.length !== 1 ? 's' : ''}`;
            updateStatus(successMessage, 'success');
            if (results.length > 0) {
                showSuccessNotification(successMessage);
                updateKnowledgeBaseSyncStatus('ready', `Knowledge Base synchronized with ${results.length} document${results.length !== 1 ? 's' : ''}`);
            }
        }
        
        // Clear file preview after successful processing
        if (results.length === files.length) {
            setTimeout(() => clearFilePreview(), 3000);
        }
        
    } catch (error) {
        console.error('Error processing files:', error);
        
        // Handle general processing error with enhanced error handling
        if (errorHandler) {
            const errorResult = errorHandler.handleError(error, { 
                operation: 'batch_file_processing',
                fileCount: files.length 
            });
            errorHandler.displayError(errorResult);
        } else {
            updateStatus('❌ Error processing documents. Please try again.', 'error');
        }
        
        showErrorNotification('Processing failed');
        showUploadProgress(false);
        updateFilePreviewStatus('error');
    }
}

async function processDocumentWithRAG(file) {
    try {
        const authState = await authService.getCurrentAuthState();
        
        // Convert file to base64
        const base64Content = await fileToBase64(file);
        
        // GraphQL mutation for document upload
        const mutation = `
            mutation UploadDocument($filename: String!, $fileContent: String!) {
                uploadDocument(filename: $filename, fileContent: $fileContent) {
                    success
                    message
                    documentId
                    chunkCount
                    textLength
                    processingTime
                }
            }
        `;
        
        const response = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authState.session.tokens.accessToken.toString()
            },
            body: JSON.stringify({
                query: mutation,
                variables: {
                    filename: file.name,
                    fileContent: base64Content
                }
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            
            if (result.data && result.data.uploadDocument) {
                const uploadResult = result.data.uploadDocument;
                
                return {
                    success: uploadResult.success,
                    documentId: uploadResult.documentId,
                    vectorCount: uploadResult.chunkCount || 0, // Use chunkCount as vectorCount
                    message: uploadResult.message,
                    textLength: uploadResult.textLength,
                    processingTime: uploadResult.processingTime
                };
            } else if (result.errors) {
                console.error('GraphQL errors:', result.errors);
                throw new Error(result.errors[0].message);
            }
        }
        
        throw new Error('Failed to process document');
        
    } catch (error) {
        console.error('Document processing error:', error);
        return {
            success: false,
            message: error.message,
            documentId: null,
            vectorCount: 0
        };
    }
}

// Enhanced file processing with multi-format support and error handling
// Import FileValidator, FileProcessor, and ErrorHandler (these should be loaded before main.js)
let fileValidator = null;
let fileProcessor = null;
let errorHandler = null;

// Initialize file processing components
function initializeFileProcessing() {
    if (typeof FileValidator !== 'undefined') {
        fileValidator = new FileValidator();
    }
    if (typeof FileProcessor !== 'undefined') {
        fileProcessor = new FileProcessor(fileValidator);
    }
    if (typeof ErrorHandler !== 'undefined') {
        errorHandler = new ErrorHandler();
    }
}

// Helper function to convert file to base64 with enhanced multi-format support
async function fileToBase64(file) {
    // Initialize file processing if not already done
    if (!fileProcessor) {
        initializeFileProcessing();
    }

    try {
        // Use enhanced FileProcessor if available
        if (fileProcessor) {
            const result = await fileProcessor.fileToBase64(file, { 
                includeDataUrl: false,
                validateFile: true 
            });
            return result.base64Data;
        }

        // Fallback to original implementation
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                try {
                    // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
                    const base64 = reader.result.split(',')[1];
                    if (!base64) {
                        reject(new Error('Failed to extract base64 data'));
                        return;
                    }
                    resolve(base64);
                } catch (error) {
                    reject(new Error(`Error processing file: ${error.message}`));
                }
            };
            reader.onerror = () => {
                reject(new Error(`FileReader error: ${reader.error?.message || 'Unknown error'}`));
            };
        });
    } catch (error) {
        // If enhanced processing fails, show user-friendly error
        if (error.code === 'FILE_VALIDATION_FAILED') {
            throw new Error(error.message);
        }
        throw new Error(`Failed to process file: ${error.message}`);
    }
}

// Enhanced progress indicators with professional styling
function showUploadProgress(show, options = {}) {
    const progressElement = document.getElementById('upload-progress');
    if (!progressElement) return;
    
    if (show) {
        progressElement.classList.remove('hidden');
        progressElement.style.opacity = '0';
        progressElement.style.transform = 'translateY(10px)';
        
        // Smooth fade-in animation
        setTimeout(() => {
            progressElement.style.transition = 'all 0.3s ease';
            progressElement.style.opacity = '1';
            progressElement.style.transform = 'translateY(0)';
        }, 50);
        
        // Initialize progress with enhanced styling
        updateProgressBar(0, options.initialText || 'Preparing files...', options);
    } else {
        // Smooth fade-out animation
        progressElement.style.transition = 'all 0.3s ease';
        progressElement.style.opacity = '0';
        progressElement.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            progressElement.classList.add('hidden');
            progressElement.style.transform = 'translateY(0)';
        }, 300);
    }
}

function updateProgressBar(percentage, text, options = {}) {
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const progressContainer = document.getElementById('upload-progress');
    
    if (progressBar) {
        // Smooth progress animation
        progressBar.style.transition = 'width 0.3s ease';
        progressBar.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        
        // Dynamic color based on progress
        if (percentage < 30) {
            progressBar.style.background = 'linear-gradient(90deg, #ef4444, #f97316)';
        } else if (percentage < 70) {
            progressBar.style.background = 'linear-gradient(90deg, #f59e0b, #eab308)';
        } else if (percentage < 100) {
            progressBar.style.background = 'linear-gradient(90deg, #3b82f6, #667eea)';
        } else {
            progressBar.style.background = 'linear-gradient(90deg, #10b981, #059669)';
        }
    }
    
    if (progressText) {
        progressText.textContent = text;
        
        // Add processing animation for active states
        if (percentage > 0 && percentage < 100) {
            progressText.style.animation = 'pulse 2s infinite';
        } else {
            progressText.style.animation = 'none';
        }
    }
    
    // Add completion celebration
    if (percentage >= 100 && progressContainer) {
        setTimeout(() => {
            progressContainer.style.animation = 'bounce 0.6s ease';
            setTimeout(() => {
                progressContainer.style.animation = 'none';
            }, 600);
        }, 100);
    }
}

// File preview functionality
function showFilePreview(files) {
    const previewContainer = getOrCreateFilePreview();
    previewContainer.innerHTML = '';
    
    files.forEach((file, index) => {
        const filePreview = createFilePreviewItem(file, index);
        previewContainer.appendChild(filePreview);
    });
    
    // Show preview with animation
    previewContainer.style.display = 'block';
    previewContainer.style.opacity = '0';
    previewContainer.style.transform = 'translateY(10px)';
    
    setTimeout(() => {
        previewContainer.style.transition = 'all 0.3s ease';
        previewContainer.style.opacity = '1';
        previewContainer.style.transform = 'translateY(0)';
    }, 50);
}

function getOrCreateFilePreview() {
    let previewContainer = document.getElementById('file-preview-container');
    
    if (!previewContainer) {
        previewContainer = document.createElement('div');
        previewContainer.id = 'file-preview-container';
        previewContainer.style.cssText = `
            margin-top: 15px;
            padding: 15px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            display: none;
        `;
        
        const uploadSection = document.querySelector('.section');
        if (uploadSection) {
            uploadSection.appendChild(previewContainer);
        }
    }
    
    return previewContainer;
}

function createFilePreviewItem(file, index) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-preview-item';
    fileItem.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px;
        margin-bottom: 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        transition: all 0.2s ease;
    `;
    
    // File icon based on type
    const fileIcon = getFileIcon(file.type || file.name);
    
    // File info
    const fileInfo = document.createElement('div');
    fileInfo.style.cssText = 'display: flex; align-items: center; gap: 10px; flex: 1;';
    
    fileInfo.innerHTML = `
        <span style="font-size: 1.5rem;">${fileIcon}</span>
        <div>
            <div style="color: white; font-weight: 500; font-size: 0.9rem;">${file.name}</div>
            <div style="color: #a0aec0; font-size: 0.8rem;">${formatFileSize(file.size)} • ${getFileTypeDisplay(file)}</div>
        </div>
    `;
    
    // Status indicator
    const statusIndicator = document.createElement('div');
    statusIndicator.className = 'file-status';
    statusIndicator.style.cssText = `
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: 500;
        background: rgba(59, 130, 246, 0.2);
        color: #60a5fa;
        border: 1px solid rgba(59, 130, 246, 0.3);
    `;
    statusIndicator.textContent = 'Ready';
    
    fileItem.appendChild(fileInfo);
    fileItem.appendChild(statusIndicator);
    
    // Add hover effect
    fileItem.addEventListener('mouseenter', () => {
        fileItem.style.background = 'rgba(255, 255, 255, 0.15)';
        fileItem.style.transform = 'translateX(5px)';
    });
    
    fileItem.addEventListener('mouseleave', () => {
        fileItem.style.background = 'rgba(255, 255, 255, 0.1)';
        fileItem.style.transform = 'translateX(0)';
    });
    
    return fileItem;
}

function getFileIcon(fileType) {
    // Handle undefined, null, or empty fileType
    if (!fileType || typeof fileType !== 'string') {
        return '📄'; // Default icon
    }
    
    const iconMap = {
        'application/pdf': '📄',
        'application/msword': '📝',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
        'text/plain': '📄',
        'default': '📄'
    };
    
    // Check by extension if type is not available
    if (!iconMap[fileType]) {
        if (fileType.includes('.pdf')) return '📄';
        if (fileType.includes('.doc')) return '📝';
        if (fileType.includes('.txt')) return '📄';
    }
    
    return iconMap[fileType] || iconMap.default;
}

function getFileTypeDisplay(file) {
    const typeMap = {
        'application/pdf': 'PDF Document',
        'application/msword': 'Word Document',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
        'text/plain': 'Text File'
    };
    
    return typeMap[file.type] || 'Document';
}

// Professional Dashboard Enhancement Functions

// Add navigation breadcrumbs for better user orientation
function addNavigationBreadcrumbs() {
    const header = document.querySelector('header');
    if (!header) return;
    
    // Check if breadcrumbs already exist
    if (header.querySelector('.breadcrumbs')) return;
    
    const breadcrumbs = document.createElement('div');
    breadcrumbs.className = 'breadcrumbs';
    breadcrumbs.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
        color: rgba(255, 255, 255, 0.9);
        font-size: 0.95rem;
        margin-top: 16px;
        padding: 12px 0;
        border-bottom: 2px solid rgba(255, 255, 255, 0.1);
        margin-bottom: 12px;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    `;
    
    breadcrumbs.innerHTML = `
        <nav aria-label="Breadcrumb navigation" style="display: flex; align-items: center; gap: 12px;">
            <span class="breadcrumb-item" style="
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 6px 12px;
                border-radius: 8px;
                background: rgba(255, 255, 255, 0.12);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                cursor: pointer;
                border: 1px solid rgba(255, 255, 255, 0.15);
            " onmouseenter="this.style.background='rgba(255, 255, 255, 0.18)'; this.style.transform='translateY(-1px)'" 
               onmouseleave="this.style.background='rgba(255, 255, 255, 0.12)'; this.style.transform='translateY(0)'">
                <span style="font-size: 1.1rem;">🏠</span>
                <span style="font-weight: 500;">Dashboard</span>
            </span>
            <span class="breadcrumb-separator" style="color: rgba(255, 255, 255, 0.6); font-size: 1.3rem; font-weight: 300;">›</span>
            <span class="breadcrumb-item current" style="
                color: white;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 6px 12px;
                border-radius: 8px;
                background: linear-gradient(135deg, rgba(102, 126, 234, 0.25), rgba(118, 75, 162, 0.25));
                border: 1px solid rgba(102, 126, 234, 0.4);
                box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
            ">
                <span style="font-size: 1.1rem;">🤖</span>
                <span>AI Document Processing</span>
            </span>
        </nav>
    `;
    
    const titleElement = header.querySelector('h1');
    if (titleElement) {
        titleElement.parentNode.insertBefore(breadcrumbs, titleElement.nextSibling);
    }
}

// Initialize comprehensive status indicators
function initializeStatusIndicators() {
    // Add system status indicator to header
    addSystemStatusIndicator();
    
    // Add document processing status panel
    addDocumentStatusPanel();
    
    // Add Knowledge Base sync status
    addKnowledgeBaseSyncStatus();
}

function addSystemStatusIndicator() {
    const header = document.querySelector('header');
    if (!header || header.querySelector('.system-status')) return;
    
    const statusIndicator = document.createElement('div');
    statusIndicator.className = 'system-status';
    statusIndicator.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.15));
        border: 1px solid rgba(16, 185, 129, 0.4);
        border-radius: 24px;
        padding: 8px 16px;
        font-size: 0.9rem;
        color: #10b981;
        font-weight: 600;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
    `;
    
    statusIndicator.innerHTML = `
        <div class="status-dot" style="
            width: 10px;
            height: 10px;
            background: radial-gradient(circle, #10b981, #059669);
            border-radius: 50%;
            animation: pulse 2s infinite;
            box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
        "></div>
        <span>System Online</span>
        <div style="
            display: flex;
            align-items: center;
            gap: 4px;
            margin-left: 4px;
            padding-left: 8px;
            border-left: 1px solid rgba(16, 185, 129, 0.3);
        ">
            <span style="font-size: 0.8rem; opacity: 0.8;">AWS</span>
            <span style="font-size: 0.7rem; opacity: 0.6;">•</span>
            <span style="font-size: 0.8rem; opacity: 0.8;">Bedrock</span>
        </div>
    `;
    
    // Add hover effects
    statusIndicator.addEventListener('mouseenter', () => {
        statusIndicator.style.transform = 'translateY(-2px)';
        statusIndicator.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.3)';
    });
    
    statusIndicator.addEventListener('mouseleave', () => {
        statusIndicator.style.transform = 'translateY(0)';
        statusIndicator.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.2)';
    });
    
    const userInfo = header.querySelector('#user-info');
    if (userInfo) {
        userInfo.parentNode.insertBefore(statusIndicator, userInfo);
    }
}

function addDocumentStatusPanel() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    
    // Check if status panel already exists
    if (sidebar.querySelector('.document-status-panel')) return;
    
    const statusPanel = document.createElement('div');
    statusPanel.className = 'document-status-panel section';
    statusPanel.style.cssText = `
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(102, 126, 234, 0.1) 100%);
        border: 1px solid rgba(59, 130, 246, 0.3);
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 25px;
        position: relative;
        overflow: hidden;
        box-shadow: 0 8px 32px rgba(59, 130, 246, 0.1);
    `;
    
    statusPanel.innerHTML = `
        <div style="
            position: absolute;
            top: 0;
            right: 0;
            width: 100px;
            height: 100px;
            background: radial-gradient(circle, rgba(102, 126, 234, 0.2) 0%, transparent 70%);
            border-radius: 50%;
            transform: translate(30px, -30px);
        "></div>
        <h3 style="
            color: white;
            font-size: 1.3rem;
            font-weight: 700;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 10px;
            position: relative;
            z-index: 1;
        ">
            <span style="
                font-size: 1.5rem;
                background: linear-gradient(135deg, #60a5fa, #3b82f6);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            ">📊</span>
            System Status
        </h3>
        <div class="status-metrics" style="
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            position: relative;
            z-index: 1;
        ">
            <div class="metric-item" style="
                background: rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                padding: 12px;
                text-align: center;
                border: 1px solid rgba(255, 255, 255, 0.2);
                transition: all 0.3s ease;
            ">
                <div class="metric-value" style="
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #10b981;
                    margin-bottom: 2px;
                    text-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
                " id="documents-count">0</div>
                <div class="metric-label" style="
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.8);
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                ">Documents</div>
            </div>
            <div class="metric-item" style="
                background: rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                padding: 12px;
                text-align: center;
                border: 1px solid rgba(255, 255, 255, 0.2);
                transition: all 0.3s ease;
            ">
                <div class="metric-value" style="
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #f59e0b;
                    margin-bottom: 2px;
                    text-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);
                " id="vectors-count">0</div>
                <div class="metric-label" style="
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.8);
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                ">S3 Vectors</div>
            </div>
            <div class="metric-item" style="
                background: rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                padding: 12px;
                text-align: center;
                border: 1px solid rgba(255, 255, 255, 0.2);
                transition: all 0.3s ease;
            ">
                <div class="metric-value" style="
                    font-size: 1.2rem;
                    font-weight: 800;
                    color: #8b5cf6;
                    margin-bottom: 2px;
                    text-shadow: 0 2px 4px rgba(139, 92, 246, 0.3);
                " id="kb-count">0</div>
                <div class="metric-label" style="
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.8);
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                ">Knowledge Bases</div>
            </div>
        </div>
        <div id="sync-status" style="
            margin-top: 16px;
            padding: 12px 16px;
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.2);
            border-radius: 10px;
            color: #10b981;
            font-size: 0.9rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
            position: relative;
            z-index: 1;
        ">
            <span style="animation: pulse 2s infinite;">✅</span>
            Knowledge Base Ready
        </div>
    `;
    
    // Add hover effects to metric items
    const metricItems = statusPanel.querySelectorAll('.metric-item');
    metricItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.background = 'rgba(255, 255, 255, 0.15)';
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.background = 'rgba(255, 255, 255, 0.1)';
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
    });
    
    // Insert at the beginning of sidebar
    const firstSection = sidebar.querySelector('.section');
    if (firstSection) {
        sidebar.insertBefore(statusPanel, firstSection);
    }
}

function addKnowledgeBaseSyncStatus() {
    // This will be updated dynamically during document processing
    updateKnowledgeBaseSyncStatus('ready', 'Ready for document processing');
}

// Enhanced section headers with professional styling
function enhanceSectionHeaders() {
    const sections = document.querySelectorAll('.section h2');
    
    sections.forEach((header, index) => {
        if (header.classList.contains('enhanced')) return;
        
        header.classList.add('enhanced');
        header.style.cssText = `
            color: white;
            font-size: 1.4rem;
            font-weight: 700;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 16px 0 16px 0;
            border-bottom: 2px solid rgba(255, 255, 255, 0.12);
            position: relative;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            letter-spacing: -0.02em;
            line-height: 1.3;
        `;
        
        // Add icon styling for better visual hierarchy
        const icon = header.textContent.match(/^[^\w\s]/);
        if (icon) {
            const iconSpan = document.createElement('span');
            iconSpan.style.cssText = `
                font-size: 1.6rem;
                background: linear-gradient(135deg, #667eea, #764ba2);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                filter: drop-shadow(0 2px 4px rgba(102, 126, 234, 0.3));
            `;
            iconSpan.textContent = icon[0];
            
            // Replace the icon in the text with styled version
            const textWithoutIcon = header.textContent.replace(/^[^\w\s]\s*/, '');
            header.innerHTML = '';
            header.appendChild(iconSpan);
            
            const textSpan = document.createElement('span');
            textSpan.textContent = textWithoutIcon;
            header.appendChild(textSpan);
        }
        
        // Add enhanced gradient underline with animation
        const underline = document.createElement('div');
        underline.style.cssText = `
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 0;
            height: 3px;
            background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
            border-radius: 2px;
            transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
        `;
        header.appendChild(underline);
        
        // Animate underline on load with staggered timing
        setTimeout(() => {
            underline.style.width = '80px';
        }, 300 + (index * 150));
        
        // Add section number for better organization
        const sectionNumber = document.createElement('span');
        sectionNumber.style.cssText = `
            position: absolute;
            top: -8px;
            right: 0;
            background: rgba(102, 126, 234, 0.2);
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.75rem;
            font-weight: 500;
            padding: 2px 8px;
            border-radius: 12px;
            border: 1px solid rgba(102, 126, 234, 0.3);
        `;
        sectionNumber.textContent = `${index + 1}`;
        header.style.position = 'relative';
        header.appendChild(sectionNumber);
    });
}

// Initialize dashboard metrics and counters
function initializeDashboardMetrics() {
    updateDashboardMetrics();
    
    // Update metrics every 30 seconds
    setInterval(updateDashboardMetrics, 30000);
}

async function updateDashboardMetrics() {
    const documentsCountEl = document.getElementById('documents-count');
    const vectorsCountEl = document.getElementById('vectors-count');
    const kbCountEl = document.getElementById('kb-count');
    
    if (documentsCountEl) {
        const documentCount = uploadedDocuments.length;
        animateCounter(documentsCountEl, parseInt(documentsCountEl.textContent) || 0, documentCount);
    }
    
    if (vectorsCountEl) {
        // Try to get real S3 Vectors count, fallback to estimation
        try {
            const realVectorCount = await getRealVectorsCount();
            if (realVectorCount > 0) {
                animateCounter(vectorsCountEl, parseInt(vectorsCountEl.textContent) || 0, realVectorCount);
            } else {
                // Fallback to estimation based on processed documents
                const processedDocs = uploadedDocuments.filter(doc => doc.syncStatus === 'completed');
                const estimatedVectors = processedDocs.reduce((sum, doc) => {
                    // Estimate vectors based on document size and type
                    const sizeKB = (doc.size || 0) / 1024;
                    // Assume ~200 tokens per chunk, ~5KB per chunk for estimation
                    const estimatedChunks = Math.max(1, Math.ceil(sizeKB / 5));
                    return sum + estimatedChunks;
                }, 0);
                
                // Show estimated count if we have processed documents
                const finalCount = processedDocs.length > 0 ? Math.max(estimatedVectors, processedDocs.length * 3) : 0;
                animateCounter(vectorsCountEl, parseInt(vectorsCountEl.textContent) || 0, finalCount);
            }
        } catch (error) {
            console.warn('Failed to get real vector count, using estimation:', error);
            // Fallback estimation
            const processedDocs = uploadedDocuments.filter(doc => doc.syncStatus === 'completed');
            const estimatedVectors = processedDocs.reduce((sum, doc) => {
                const sizeKB = (doc.size || 0) / 1024;
                const estimatedChunks = Math.max(1, Math.ceil(sizeKB / 5));
                return sum + estimatedChunks;
            }, 0);
            
            const finalCount = processedDocs.length > 0 ? Math.max(estimatedVectors, processedDocs.length * 3) : 0;
            animateCounter(vectorsCountEl, parseInt(vectorsCountEl.textContent) || 0, finalCount);
        }
    }
    
    if (kbCountEl) {
        // Try to get real Knowledge Base info, fallback to logic
        try {
            const kbInfo = await getKnowledgeBaseInfo();
            if (kbInfo && kbInfo.count !== undefined) {
                animateCounter(kbCountEl, parseInt(kbCountEl.textContent) || 0, kbInfo.count);
                
                // Update KB status display if available
                if (kbInfo.id) {
                    const kbElement = kbCountEl.parentElement;
                    kbElement.title = `Knowledge Base ID: ${kbInfo.id}\nStatus: ${kbInfo.status}`;
                }
            } else {
                // Fallback logic - show 1 if user has documents, 0 otherwise
                const hasDocuments = uploadedDocuments.length > 0;
                const kbCount = hasDocuments ? 1 : 0;
                animateCounter(kbCountEl, parseInt(kbCountEl.textContent) || 0, kbCount);
            }
        } catch (error) {
            console.warn('Failed to get KB info, using fallback:', error);
            // Fallback logic
            const hasDocuments = uploadedDocuments.length > 0;
            const kbCount = hasDocuments ? 1 : 0;
            animateCounter(kbCountEl, parseInt(kbCountEl.textContent) || 0, kbCount);
        }
    }
}

function animateCounter(element, from, to, duration = 1000) {
    const startTime = performance.now();
    const difference = to - from;
    
    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.round(from + (difference * easeOutQuart));
        
        element.textContent = currentValue.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        }
    }
    
    requestAnimationFrame(updateCounter);
}

// Add professional tooltips and help text
function addProfessionalTooltips() {
    const tooltipElements = [
        {
            selector: '#upload-area',
            text: 'Upload documents to build your Knowledge Base. Supported formats: PDF, DOC, DOCX, TXT (max 10MB each)'
        },
        {
            selector: '#generate-btn',
            text: 'Generate AI presentations using your uploaded documents as context via Bedrock Knowledge Base'
        },
        {
            selector: '.system-status',
            text: 'Real-time system status showing AWS services availability'
        }
    ];
    
    tooltipElements.forEach(({ selector, text }) => {
        const element = document.querySelector(selector);
        if (element && !element.hasAttribute('title')) {
            element.setAttribute('title', text);
            element.setAttribute('data-tooltip', text);
        }
    });
}

// Initialize dashboard animations and transitions
function initializeDashboardAnimations() {
    // Add staggered animation to sections
    const sections = document.querySelectorAll('.section');
    sections.forEach((section, index) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        
        setTimeout(() => {
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }, index * 150);
    });
    
    // Add hover effects to interactive elements
    addInteractiveHoverEffects();
}

function addInteractiveHoverEffects() {
    const interactiveElements = document.querySelectorAll('.btn, .upload-area, .document-item');
    
    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            this.style.transform = this.style.transform.includes('scale') 
                ? this.style.transform 
                : (this.style.transform || '') + ' scale(1.02)';
        });
        
        element.addEventListener('mouseleave', function() {
            this.style.transform = this.style.transform.replace(' scale(1.02)', '');
        });
    });
}

// Update Knowledge Base sync status with professional indicators
function updateKnowledgeBaseSyncStatus(status, message) {
    const syncStatusEl = document.getElementById('sync-status');
    if (!syncStatusEl) return;
    
    const statusConfig = {
        ready: {
            icon: '✅',
            color: '#10b981',
            bgColor: 'rgba(16, 185, 129, 0.1)',
            borderColor: 'rgba(16, 185, 129, 0.2)'
        },
        syncing: {
            icon: '🔄',
            color: '#f59e0b',
            bgColor: 'rgba(245, 158, 11, 0.1)',
            borderColor: 'rgba(245, 158, 11, 0.2)'
        },
        error: {
            icon: '❌',
            color: '#ef4444',
            bgColor: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'rgba(239, 68, 68, 0.2)'
        },
        processing: {
            icon: '⚡',
            color: '#3b82f6',
            bgColor: 'rgba(59, 130, 246, 0.1)',
            borderColor: 'rgba(59, 130, 246, 0.2)'
        }
    };
    
    const config = statusConfig[status] || statusConfig.ready;
    
    syncStatusEl.style.background = config.bgColor;
    syncStatusEl.style.borderColor = config.borderColor;
    syncStatusEl.style.color = config.color;
    
    syncStatusEl.innerHTML = `
        <span style="margin-right: 6px; ${status === 'syncing' ? 'animation: spin 1s linear infinite;' : ''}">${config.icon}</span>
        ${message}
    `;
}

// Enhanced notification system
function showSuccessNotification(message) {
    showNotification(message, 'success');
}

function showWarningNotification(message) {
    showNotification(message, 'warning');
}

function showErrorNotification(message) {
    showNotification(message, 'error');
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.professional-notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = 'professional-notification';
    
    const typeConfig = {
        success: { icon: '✅', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.9)' },
        warning: { icon: '⚠️', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.9)' },
        error: { icon: '❌', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.9)' },
        info: { icon: 'ℹ️', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.9)' }
    };
    
    const config = typeConfig[type] || typeConfig.info;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${config.bgColor};
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 12px;
        font-weight: 500;
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
    `;
    
    notification.innerHTML = `
        <span style="font-size: 1.2rem;">${config.icon}</span>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="
            background: none;
            border: none;
            color: white;
            font-size: 1.2rem;
            cursor: pointer;
            opacity: 0.7;
            margin-left: auto;
            padding: 0;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        ">×</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Enhance main header with professional styling
function enhanceMainHeader() {
    const header = document.querySelector('header');
    if (!header || header.classList.contains('enhanced')) return;
    
    header.classList.add('enhanced');
    header.style.cssText = `
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 16px;
        padding: 24px 32px;
        margin-bottom: 32px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        position: relative;
        overflow: hidden;
    `;
    
    // Add subtle animated background
    const backgroundOverlay = document.createElement('div');
    backgroundOverlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(45deg, transparent, rgba(102, 126, 234, 0.05), transparent);
        animation: shimmer 8s ease-in-out infinite;
        pointer-events: none;
    `;
    header.appendChild(backgroundOverlay);
    
    // Enhance title styling
    const title = header.querySelector('h1');
    if (title) {
        title.style.cssText = `
            font-size: 2.2rem;
            font-weight: 800;
            background: linear-gradient(135deg, #ffffff, #e2e8f0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin: 0;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            letter-spacing: -0.03em;
            line-height: 1.2;
            position: relative;
            z-index: 1;
        `;
    }
    
    // Enhance user controls area
    const controlsArea = header.querySelector('.flex.items-center.gap-4');
    if (controlsArea) {
        controlsArea.style.cssText = `
            display: flex;
            align-items: center;
            gap: 16px;
            position: relative;
            z-index: 1;
        `;
    }
}

// Organize content sections with professional layout
function organizeContentSections() {
    const sidebar = document.querySelector('.sidebar');
    const contentArea = document.querySelector('.content-area');
    
    if (sidebar) {
        // Add section organization to sidebar
        const sections = sidebar.querySelectorAll('.section');
        sections.forEach((section, index) => {
            section.style.cssText = `
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04));
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 16px;
                padding: 24px;
                margin-bottom: 24px;
                backdrop-filter: blur(10px);
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                overflow: hidden;
            `;
            
            // Add hover effects
            section.addEventListener('mouseenter', () => {
                section.style.transform = 'translateY(-2px)';
                section.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
                section.style.borderColor = 'rgba(102, 126, 234, 0.3)';
            });
            
            section.addEventListener('mouseleave', () => {
                section.style.transform = 'translateY(0)';
                section.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
                section.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            });
            
            // Add section priority indicators
            const priorityColors = ['#667eea', '#f093fb', '#ffeaa7'];
            const priorityColor = priorityColors[index % priorityColors.length];
            
            const priorityIndicator = document.createElement('div');
            priorityIndicator.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 4px;
                height: 100%;
                background: linear-gradient(180deg, ${priorityColor}, ${priorityColor}80);
                border-radius: 0 2px 2px 0;
            `;
            section.appendChild(priorityIndicator);
        });
    }
    
    if (contentArea) {
        contentArea.style.cssText = `
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04));
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 16px;
            padding: 32px;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
            min-height: 600px;
            position: relative;
            overflow: hidden;
        `;
        
        // Add content area background pattern
        const pattern = document.createElement('div');
        pattern.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: radial-gradient(circle at 25% 25%, rgba(102, 126, 234, 0.05) 0%, transparent 50%),
                              radial-gradient(circle at 75% 75%, rgba(118, 75, 162, 0.05) 0%, transparent 50%);
            pointer-events: none;
        `;
        contentArea.appendChild(pattern);
    }
}

// Initialize professional typography throughout the application
function initializeProfessionalTypography() {
    // Add professional font loading
    if (!document.querySelector('#professional-fonts')) {
        const fontLink = document.createElement('link');
        fontLink.id = 'professional-fonts';
        fontLink.rel = 'stylesheet';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap';
        document.head.appendChild(fontLink);
    }
    
    // Apply professional typography to key elements
    const typographyElements = [
        { selector: 'body', styles: 'font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif; font-feature-settings: "cv02", "cv03", "cv04", "cv11";' },
        { selector: '.btn', styles: 'font-family: "Inter", sans-serif; font-weight: 600; letter-spacing: -0.01em;' },
        { selector: '.upload-text', styles: 'font-family: "Inter", sans-serif; line-height: 1.6; font-weight: 400;' },
        { selector: '.document-item', styles: 'font-family: "Inter", sans-serif;' },
        { selector: '.presentation-card', styles: 'font-family: "Inter", sans-serif;' }
    ];
    
    typographyElements.forEach(({ selector, styles }) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            element.style.cssText += styles;
        });
    });
}

// Responsive design adjustments with professional enhancements
function adjustResponsiveLayout() {
    const mainContent = document.querySelector('.main-content');
    const sidebar = document.querySelector('.sidebar');
    const contentArea = document.querySelector('.content-area');
    
    if (!mainContent || !sidebar || !contentArea) return;
    
    const isMobile = window.innerWidth <= 768;
    const isTablet = window.innerWidth <= 1024 && window.innerWidth > 768;
    
    if (isMobile) {
        mainContent.style.gridTemplateColumns = '1fr';
        mainContent.style.gap = '20px';
        sidebar.style.order = '2';
        contentArea.style.order = '1';
        
        // Adjust professional elements for mobile
        adjustMobileProfessionalElements();
    } else if (isTablet) {
        mainContent.style.gridTemplateColumns = '1fr 1.5fr';
        mainContent.style.gap = '25px';
        sidebar.style.order = '1';
        contentArea.style.order = '2';
        
        // Adjust professional elements for tablet
        adjustTabletProfessionalElements();
    } else {
        mainContent.style.gridTemplateColumns = '1fr 2fr';
        mainContent.style.gap = '30px';
        sidebar.style.order = '1';
        contentArea.style.order = '2';
        
        // Reset to desktop professional elements
        resetDesktopProfessionalElements();
    }
}

function adjustMobileProfessionalElements() {
    const statusPanel = document.querySelector('.document-status-panel');
    if (statusPanel) {
        statusPanel.style.padding = '15px';
        const metrics = statusPanel.querySelector('.status-metrics');
        if (metrics) {
            metrics.style.gridTemplateColumns = '1fr 1fr';
            metrics.style.gap = '10px';
        }
    }
    
    const breadcrumbs = document.querySelector('.breadcrumbs');
    if (breadcrumbs) {
        breadcrumbs.style.fontSize = '0.8rem';
    }
}

function adjustTabletProfessionalElements() {
    const statusPanel = document.querySelector('.document-status-panel');
    if (statusPanel) {
        statusPanel.style.padding = '18px';
    }
}

function resetDesktopProfessionalElements() {
    const statusPanel = document.querySelector('.document-status-panel');
    if (statusPanel) {
        statusPanel.style.padding = '20px';
    }
}

// Load user's existing documents from backend
async function loadUserDocuments() {
    try {
        console.log('Loading user documents from backend...');
        
        // Get authentication state
        const authState = await authService.getCurrentAuthState();
        if (!authState.isAuthenticated) {
            console.log('User not authenticated, skipping document loading');
            return;
        }
        
        const query = `
            query GetUserDocuments {
                getUserDocuments {
                    id
                    userId
                    filename
                    uploadDate
                    chunkCount
                    textLength
                    status
                    syncStatus
                    fileSize
                    contentType
                    knowledgeBaseId
                    dataSourceId
                    lastModified
                    errorMessage
                    message
                    s3Key
                }
            }
        `;
        
        const response = await fetch(config.graphqlEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authState.session.tokens.idToken.toString()}`
            },
            body: JSON.stringify({ query })
        });
        
        const result = await response.json();
        
        if (result.errors) {
            console.error('GraphQL errors loading documents:', result.errors);
            return;
        }
        
        const documents = result.data.getUserDocuments || [];
        console.log(`Loaded ${documents.length} existing documents:`, documents);
        
        // Convert backend format to frontend format and update global array
        uploadedDocuments = documents.map(doc => ({
            id: doc.id,
            filename: doc.filename,
            uploadDate: doc.uploadDate,
            syncStatus: doc.syncStatus || 'unknown',
            fileSize: doc.fileSize || 0,
            contentType: doc.contentType || '',
            knowledgeBaseId: doc.knowledgeBaseId,
            dataSourceId: doc.dataSourceId,
            lastModified: doc.lastModified,
            errorMessage: doc.errorMessage,
            message: doc.message || '',
            s3Key: doc.s3Key,
            // Add some default values for UI compatibility
            vectorCount: 0, // Will be updated if available
            textLength: 0,  // Will be updated if available
            processingTime: null
        }));
        
        // Update the UI
        updateDocumentsList();
        updateDashboardMetrics();
        
        console.log(`Successfully loaded ${uploadedDocuments.length} documents`);
        
    } catch (error) {
        console.error('Failed to load user documents:', error);
        // Don't show error to user as this is a background operation
    }
}

function updateDocumentsList() {
    const documentsList = document.getElementById('documents-list');
    
    if (!documentsList) return;
    
    if (uploadedDocuments.length === 0) {
        documentsList.innerHTML = `
            <div class="no-documents" style="
                text-align: center;
                padding: 30px 20px;
                color: rgba(255, 255, 255, 0.6);
                font-style: italic;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                border: 2px dashed rgba(255, 255, 255, 0.2);
            ">
                <div style="font-size: 2.5rem; margin-bottom: 12px; opacity: 0.7;">📄</div>
                <p style="margin: 0; font-size: 0.95rem;">No documents uploaded yet</p>
                <p style="margin: 8px 0 0 0; font-size: 0.8rem; color: rgba(255, 255, 255, 0.5);">
                    Upload documents to start building your Knowledge Base
                </p>
            </div>
        `;
        return;
    }
    
    documentsList.innerHTML = uploadedDocuments.map((doc, index) => `
        <div class="document-item professional-document-item" style="
            background: rgba(255, 255, 255, 0.1);
            padding: 16px;
            border-radius: 12px;
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        " onmouseenter="this.style.background='rgba(255, 255, 255, 0.15)'; this.style.transform='translateX(4px)'" 
           onmouseleave="this.style.background='rgba(255, 255, 255, 0.1)'; this.style.transform='translateX(0)'">
            <div style="flex: 1; min-width: 0;">
                <div style="
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 8px;
                ">
                    <span style="font-size: 1.2rem;">${getFileIcon(doc.contentType || doc.name)}</span>
                    <div style="
                        font-weight: 600;
                        font-size: 0.95rem;
                        color: white;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    ">${doc.name || doc.filename}</div>
                    <div class="document-status-badge" style="
                        background: rgba(16, 185, 129, 0.2);
                        color: #10b981;
                        padding: 2px 8px;
                        border-radius: 12px;
                        font-size: 0.7rem;
                        font-weight: 500;
                        border: 1px solid rgba(16, 185, 129, 0.3);
                        white-space: nowrap;
                    ">✅ Processed</div>
                </div>
                <div style="
                    display: flex;
                    gap: 16px;
                    font-size: 0.8rem;
                    color: rgba(255, 255, 255, 0.7);
                    flex-wrap: wrap;
                ">
                    <span style="display: flex; align-items: center; gap: 4px;">
                        <span style="color: #60a5fa;">📊</span>
                        ${formatFileSize(doc.size || doc.fileSize)}
                    </span>
                    <span style="display: flex; align-items: center; gap: 4px;">
                        <span style="color: #34d399;">🔢</span>
                        ${doc.vectorCount || 0} vectors
                    </span>
                    ${doc.textLength ? `
                        <span style="display: flex; align-items: center; gap: 4px;">
                            <span style="color: #f59e0b;">📝</span>
                            ${doc.textLength.toLocaleString()} chars
                        </span>
                    ` : ''}
                    ${doc.processingTime ? `
                        <span style="display: flex; align-items: center; gap: 4px;">
                            <span style="color: #8b5cf6;">⚡</span>
                            ${doc.processingTime.toFixed(2)}s
                        </span>
                    ` : ''}
                </div>
                <div style="
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.5);
                    margin-top: 6px;
                ">
                    Uploaded ${formatRelativeTime(doc.uploadedAt || doc.uploadDate)}
                </div>
            </div>
            <button onclick="removeDocument('${doc.id}')" style="
                background: rgba(239, 68, 68, 0.2);
                color: #ef4444;
                border: 1px solid rgba(239, 68, 68, 0.3);
                border-radius: 8px;
                padding: 8px;
                cursor: pointer;
                font-size: 0.9rem;
                font-weight: 600;
                transition: all 0.2s ease;
                margin-left: 12px;
                min-width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
            " onmouseenter="this.style.background='rgba(239, 68, 68, 0.3)'; this.style.transform='scale(1.1)'" 
               onmouseleave="this.style.background='rgba(239, 68, 68, 0.2)'; this.style.transform='scale(1)'">
                ✕
            </button>
        </div>
    `).join('');
    
    // Update dashboard metrics after updating the list
    updateDashboardMetrics();
    
}

// Helper function to format relative time
function formatRelativeTime(date) {
    // Handle invalid or missing dates
    if (!date) {
        return 'recently';
    }
    
    // Convert to Date object if it's a string
    let dateObj;
    if (typeof date === 'string') {
        dateObj = new Date(date);
    } else if (date instanceof Date) {
        dateObj = date;
    } else {
        return 'recently';
    }
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
        return 'recently';
    }
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - dateObj) / 1000);
    
    // Handle negative differences (future dates)
    if (diffInSeconds < 0) {
        return 'recently';
    }
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hr ago`;
    
    const days = Math.floor(diffInSeconds / 86400);
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function removeDocument(documentId) {
    try {
        // Show confirmation dialog
        const confirmed = confirm('Are you sure you want to delete this document? This will remove it from your Knowledge Base and cannot be undone.');
        if (!confirmed) return;
        
        // Show loading state
        updateStatus('🗑️ Deleting document from S3 and Knowledge Base...', 'info');
        
        // Get authentication state
        const authState = await authService.getCurrentAuthState();
        if (!authState.isAuthenticated) {
            updateStatus('Please sign in to delete documents', 'error');
            return;
        }
        
        // Call backend to delete document from S3 and Knowledge Base
        const query = `
            mutation DeleteDocument($documentId: ID!) {
                deleteDocument(documentId: $documentId)
            }
        `;
        
        const response = await fetch(config.graphqlEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authState.session.tokens.idToken.toString()}`
            },
            body: JSON.stringify({ 
                query, 
                variables: { documentId } 
            })
        });
        
        const result = await response.json();
        
        if (result.errors) {
            throw new Error(result.errors[0].message);
        }
        
        if (result.data.deleteDocument) {
            // Remove from local array
            uploadedDocuments = uploadedDocuments.filter(doc => doc.id !== documentId);
            updateDocumentsList();
            updateStatus('✅ Document deleted successfully from S3 and Knowledge Base', 'success');
            
            // Update dashboard metrics
            updateDashboardMetrics();
        } else {
            throw new Error('Failed to delete document');
        }
        
    } catch (error) {
        console.error('Delete document error:', error);
        updateStatus(`❌ Failed to delete document: ${error.message}`, 'error');
        showErrorNotification(`Failed to delete document: ${error.message}`);
    }
}

// Make removeDocument globally accessible immediately
window.removeDocument = removeDocument;

async function deletePresentation(presentationId) {
    try {
        // Show confirmation dialog
        const confirmed = confirm('Are you sure you want to delete this presentation? This action cannot be undone.');
        if (!confirmed) return;
        
        // Show loading state
        updateStatus('🗑️ Deleting presentation...', 'info');
        
        // Get authentication state
        const authState = await authService.getCurrentAuthState();
        if (!authState.isAuthenticated) {
            updateStatus('Please sign in to delete presentations', 'error');
            return;
        }
        
        // Find the presentation in the local array
        const presentation = generatedPresentations.find(p => p.id === presentationId);
        if (!presentation) {
            throw new Error('Presentation not found');
        }
        
        // If presentation has a DynamoDB ID, delete from backend
        if (presentation.dynamoId) {
            const query = `
                mutation DeletePresentation($id: ID!) {
                    deletePresentation(id: $id)
                }
            `;
            
            const response = await fetch(config.graphqlEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authState.session.tokens.idToken.toString()}`
                },
                body: JSON.stringify({ 
                    query, 
                    variables: { id: presentation.dynamoId } 
                })
            });
            
            const result = await response.json();
            
            if (result.errors) {
                throw new Error(result.errors[0].message);
            }
            
            if (!result.data.deletePresentation) {
                throw new Error('Failed to delete presentation from database');
            }
        }
        
        // Remove from local array
        const index = generatedPresentations.findIndex(p => p.id === presentationId);
        if (index > -1) {
            generatedPresentations.splice(index, 1);
        }
        
        // Update the presentations list
        updatePresentationsList();
        
        // Show welcome message if no presentations left
        if (generatedPresentations.length === 0) {
            const welcomeMessage = document.getElementById('welcome-message');
            const presentationsList = document.getElementById('presentations-list');
            if (welcomeMessage && presentationsList) {
                welcomeMessage.style.display = 'block';
                presentationsList.classList.add('hidden');
            }
        }
        
        updateStatus('✅ Presentation deleted successfully', 'success');
        showSuccessNotification('Presentation deleted successfully');
        
    } catch (error) {
        console.error('Delete presentation error:', error);
        updateStatus(`❌ Failed to delete presentation: ${error.message}`, 'error');
        showErrorNotification(`Failed to delete presentation: ${error.message}`);
    }
}

// Make deletePresentation globally accessible immediately
window.deletePresentation = deletePresentation;







function updatePresentationsList() {
    const container = document.getElementById('presentations-container');
    if (!container) return;
    
    container.innerHTML = generatedPresentations.map((pres, index) => `
        <div class="presentation-card professional-presentation-card" style="
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 20px;
            backdrop-filter: blur(15px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
            animation: scaleIn 0.5s ease-out ${index * 0.1}s both;
        " onmouseenter="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 32px rgba(0, 0, 0, 0.15)'; this.style.borderColor='rgba(102, 126, 234, 0.3)'" 
           onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 24px rgba(0, 0, 0, 0.1)'; this.style.borderColor='rgba(255, 255, 255, 0.2)'">
            
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 4px;
                height: 100%;
                background: linear-gradient(180deg, #667eea, #764ba2);
                border-radius: 0 2px 2px 0;
            "></div>
            
            <div class="presentation-header" style="
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 16px;
            ">
                <div style="flex: 1; min-width: 0;">
                    <div class="presentation-title" style="
                        color: white;
                        font-size: 1.3rem;
                        font-weight: 700;
                        margin-bottom: 8px;
                        font-family: 'Inter', sans-serif;
                        letter-spacing: -0.02em;
                        line-height: 1.3;
                        word-wrap: break-word;
                    ">${pres.title}</div>
                    
                    <!-- Enhanced metadata with RAG context info -->
                    <div class="presentation-meta" style="
                        color: rgba(255, 255, 255, 0.8);
                        font-size: 0.9rem;
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        flex-wrap: wrap;
                        font-family: 'Inter', sans-serif;
                        margin-bottom: 12px;
                    ">
                        <span style="
                            display: flex;
                            align-items: center;
                            gap: 4px;
                            background: rgba(59, 130, 246, 0.2);
                            color: #60a5fa;
                            padding: 2px 8px;
                            border-radius: 12px;
                            font-size: 0.8rem;
                            font-weight: 500;
                        ">
                            📊 ${pres.slideCount || pres.slides?.length || 0} slides
                        </span>
                        <span style="
                            display: flex;
                            align-items: center;
                            gap: 4px;
                            color: rgba(255, 255, 255, 0.7);
                            font-size: 0.8rem;
                        ">
                            🕒 ${formatDate(pres.generatedAt || pres.createdAt)}
                        </span>
                        ${pres.contextUsed ? `
                            <span style="
                                display: flex;
                                align-items: center;
                                gap: 4px;
                                background: rgba(16, 185, 129, 0.2);
                                color: #34d399;
                                padding: 2px 8px;
                                border-radius: 12px;
                                font-size: 0.8rem;
                                font-weight: 500;
                            ">
                                🔍 RAG Enhanced
                            </span>
                        ` : ''}
                        ${pres.relevantChunksCount > 0 ? `
                            <span style="
                                display: flex;
                                align-items: center;
                                gap: 4px;
                                background: rgba(168, 85, 247, 0.2);
                                color: #a855f7;
                                padding: 2px 8px;
                                border-radius: 12px;
                                font-size: 0.8rem;
                                font-weight: 500;
                            ">
                                📚 ${pres.relevantChunksCount} context chunks
                            </span>
                        ` : ''}
                    </div>
                    
                    <!-- Source attribution -->
                    ${pres.sources && pres.sources.length > 0 ? `
                        <div class="presentation-sources" style="
                            background: rgba(0, 0, 0, 0.2);
                            border-radius: 8px;
                            padding: 8px 12px;
                            margin-bottom: 12px;
                            border-left: 3px solid #34d399;
                        ">
                            <div style="
                                color: #34d399;
                                font-size: 0.75rem;
                                font-weight: 600;
                                margin-bottom: 4px;
                                text-transform: uppercase;
                                letter-spacing: 0.5px;
                            ">Sources Used</div>
                            <div style="
                                color: rgba(255, 255, 255, 0.8);
                                font-size: 0.8rem;
                                line-height: 1.4;
                            ">
                                ${pres.sources.map(source => {
                                    const filename = source.split('/').pop() || source;
                                    return `<div style="margin-bottom: 2px;">📄 ${filename}</div>`;
                                }).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div style="
                    background: rgba(102, 126, 234, 0.2);
                    color: #667eea;
                    padding: 8px;
                    border-radius: 12px;
                    font-size: 1.2rem;
                    margin-left: 16px;
                    border: 1px solid rgba(102, 126, 234, 0.3);
                ">🎯</div>
            </div>
            
            <!-- Action buttons with enhanced edit functionality -->
            <div class="export-buttons" style="
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
                justify-content: flex-start;
                margin-top: 20px;
            ">
                <button class="export-btn" onclick="openSlideEditor('${pres.id}')" style="
                    background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(124, 58, 237, 0.3));
                    color: #c4b5fd;
                    border: 1px solid rgba(139, 92, 246, 0.5);
                    padding: 8px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.85rem;
                    font-weight: 600;
                    transition: all 0.2s ease;
                    backdrop-filter: blur(10px);
                    font-family: 'Inter', sans-serif;
                " onmouseenter="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(139, 92, 246, 0.4)'; this.style.color='#ffffff'" 
                   onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='none'; this.style.color='#c4b5fd'">
                    ✏️ Edit Slides
                </button>
                <button class="export-btn" onclick="previewPresentation('${pres.id}')" style="
                    background: linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(22, 163, 74, 0.3));
                    color: #86efac;
                    border: 1px solid rgba(34, 197, 94, 0.5);
                    padding: 8px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.85rem;
                    font-weight: 600;
                    transition: all 0.2s ease;
                    backdrop-filter: blur(10px);
                    font-family: 'Inter', sans-serif;
                " onmouseenter="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(34, 197, 94, 0.4)'; this.style.color='#ffffff'" 
                   onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='none'; this.style.color='#86efac'">
                    👁️ Preview
                </button>
                <button class="export-btn" onclick="exportPresentation('${pres.id}', 'html')" style="
                    background: linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(22, 163, 74, 0.3));
                    color: #86efac;
                    border: 1px solid rgba(34, 197, 94, 0.5);
                    padding: 8px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.85rem;
                    font-weight: 600;
                    transition: all 0.2s ease;
                    backdrop-filter: blur(10px);
                    font-family: 'Inter', sans-serif;
                " onmouseenter="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(34, 197, 94, 0.4)'; this.style.color='#ffffff'" 
                   onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='none'; this.style.color='#86efac'">
                    📄 HTML
                </button>
                <button class="export-btn" onclick="exportPresentation('${pres.id}', 'revealjs')" style="
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(37, 99, 235, 0.3));
                    color: #93c5fd;
                    border: 1px solid rgba(59, 130, 246, 0.5);
                    padding: 8px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.85rem;
                    font-weight: 600;
                    transition: all 0.2s ease;
                    backdrop-filter: blur(10px);
                    font-family: 'Inter', sans-serif;
                " onmouseenter="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(59, 130, 246, 0.4)'; this.style.color='#ffffff'" 
                   onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='none'; this.style.color='#93c5fd'">
                    🎯 Reveal.js
                </button>
                <button class="export-btn" onclick="exportPresentation('${pres.id}', 'marp')" style="
                    background: linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(217, 119, 6, 0.3));
                    color: #fbbf24;
                    border: 1px solid rgba(245, 158, 11, 0.5);
                    padding: 8px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.85rem;
                    font-weight: 600;
                    transition: all 0.2s ease;
                    backdrop-filter: blur(10px);
                    font-family: 'Inter', sans-serif;
                " onmouseenter="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(245, 158, 11, 0.4)'; this.style.color='#ffffff'" 
                   onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='none'; this.style.color='#fbbf24'">
                    📝 Marp
                </button>
                <button class="export-btn" onclick="exportPresentation('${pres.id}', 'pdf')" style="
                    background: linear-gradient(135deg, rgba(220, 38, 38, 0.3), rgba(185, 28, 28, 0.3));
                    color: #f87171;
                    border: 1px solid rgba(220, 38, 38, 0.5);
                    padding: 8px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.85rem;
                    font-weight: 600;
                    transition: all 0.2s ease;
                    backdrop-filter: blur(10px);
                    font-family: 'Inter', sans-serif;
                " onmouseenter="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(220, 38, 38, 0.4)'; this.style.color='#ffffff'" 
                   onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='none'; this.style.color='#f87171'">
                    📄 PDF
                </button>
                <button class="export-btn" onclick="deletePresentation('${pres.id}')" style="
                    background: linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(220, 38, 38, 0.3));
                    color: #fca5a5;
                    border: 1px solid rgba(239, 68, 68, 0.5);
                    padding: 8px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.85rem;
                    font-weight: 600;
                    transition: all 0.2s ease;
                    backdrop-filter: blur(10px);
                    font-family: 'Inter', sans-serif;
                " onmouseenter="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(239, 68, 68, 0.4)'; this.style.color='#ffffff'" 
                   onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='none'; this.style.color='#fca5a5'">
                    🗑️ Delete
                </button>
            </div>
        </div>
    `).join('');
}

function formatDate(date) {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
        Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24)), 'day'
    );
}



// Modern Slide Editor Interface
function openSlideEditor(presentationId) {
    const presentation = generatedPresentations.find(p => p.id === presentationId);
    if (!presentation) {
        showErrorNotification('Presentation not found');
        return;
    }

    // Create modern slide editor modal
    const modal = document.createElement('div');
    modal.className = 'slide-editor-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease-out;
    `;

    modal.innerHTML = `
        <div class="slide-editor-container" style="
            background: linear-gradient(135deg, rgba(30, 30, 30, 0.95), rgba(20, 20, 20, 0.95));
            border-radius: 20px;
            width: 95%;
            max-width: 1400px;
            height: 90%;
            display: flex;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.1);
        ">
            <!-- Slide Navigation Panel -->
            <div class="slide-nav-panel" style="
                width: 300px;
                background: rgba(0, 0, 0, 0.3);
                border-right: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                flex-direction: column;
            ">
                <div class="slide-nav-header" style="
                    padding: 20px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                ">
                    <div class="editable-title" onclick="editPresentationTitle()" style="
                        color: white;
                        margin: 0 0 8px 0;
                        font-size: 1.2rem;
                        font-weight: 600;
                        cursor: pointer;
                        padding: 4px 8px;
                        border-radius: 4px;
                        transition: all 0.2s ease;
                        border: 1px solid transparent;
                    " onmouseenter="this.style.background='rgba(255, 255, 255, 0.1)'; this.style.borderColor='rgba(255, 255, 255, 0.2)'"
                       onmouseleave="this.style.background='transparent'; this.style.borderColor='transparent'"
                       title="Click to edit title">
                        ${presentation.title} ✏️
                    </div>
                    <p style="
                        color: rgba(255, 255, 255, 0.7);
                        margin: 0;
                        font-size: 0.9rem;
                    ">${presentation.slides.length} slides</p>
                </div>
                
                <div class="slide-nav-list" style="
                    flex: 1;
                    overflow-y: auto;
                    padding: 10px;
                " id="slide-nav-list">
                    ${presentation.slides.map((slide, index) => `
                        <div class="slide-nav-item ${index === 0 ? 'active' : ''}" 
                             data-slide-index="${index}"
                             draggable="true"
                             ondragstart="handleSlideDragStart(event, ${index})"
                             ondragover="handleSlideDragOver(event)"
                             ondragleave="handleSlideDragLeave(event)"
                             ondrop="handleSlideDrop(event, ${index})"
                             ondragend="handleSlideDragEnd(event)"
                             onclick="selectSlide(${index})"
                             style="
                                background: ${index === 0 ? 'rgba(102, 126, 234, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
                                border: 1px solid ${index === 0 ? 'rgba(102, 126, 234, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
                                border-radius: 12px;
                                padding: 12px;
                                margin-bottom: 8px;
                                cursor: grab;
                                transition: all 0.2s ease;
                                color: white;
                                position: relative;
                             ">
                            <div class="drag-handle" style="
                                position: absolute;
                                left: 4px;
                                top: 50%;
                                transform: translateY(-50%);
                                color: rgba(255, 255, 255, 0.4);
                                font-size: 0.8rem;
                                cursor: grab;
                            ">⋮⋮</div>
                            <div style="
                                margin-left: 16px;
                                font-weight: 600;
                                font-size: 0.9rem;
                                margin-bottom: 4px;
                            ">Slide ${index + 1}</div>
                            <div style="
                                margin-left: 16px;
                                font-size: 0.8rem;
                                color: rgba(255, 255, 255, 0.7);
                                overflow: hidden;
                                text-overflow: ellipsis;
                                white-space: nowrap;
                            ">${slide.content.substring(0, 50)}...</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Main Editor Panel -->
            <div class="slide-editor-main" style="
                flex: 1;
                display: flex;
                flex-direction: column;
            ">
                <!-- Editor Header -->
                <div class="editor-header" style="
                    padding: 20px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <div style="
                        display: flex;
                        align-items: center;
                        gap: 16px;
                    ">
                        <h4 style="
                            color: white;
                            margin: 0;
                            font-size: 1.1rem;
                            font-weight: 600;
                        ">Slide <span id="current-slide-number">1</span></h4>
                        <button onclick="showTemplateSelector()" style="
                            background: linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(217, 119, 6, 0.3));
                            color: #fbbf24;
                            border: 1px solid rgba(245, 158, 11, 0.5);
                            padding: 8px 16px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 0.85rem;
                            font-weight: 600;
                            transition: all 0.2s ease;
                        " onmouseenter="this.style.color='#ffffff'" onmouseleave="this.style.color='#fbbf24'">📋 Templates</button>
                        <button onclick="improveSlideWithAI()" style="
                            background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(124, 58, 237, 0.3));
                            color: #c4b5fd;
                            border: 1px solid rgba(139, 92, 246, 0.5);
                            padding: 8px 16px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 0.85rem;
                            font-weight: 600;
                            transition: all 0.2s ease;
                        " onmouseenter="this.style.color='#ffffff'" onmouseleave="this.style.color='#c4b5fd'">✨ Improve with AI</button>
                    </div>
                    
                    <div style="display: flex; gap: 12px;">
                        <button onclick="showThemeCustomizer()" style="
                            background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(124, 58, 237, 0.3));
                            color: #c4b5fd;
                            border: 1px solid rgba(139, 92, 246, 0.5);
                            padding: 8px 16px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 0.85rem;
                            font-weight: 600;
                        " onmouseenter="this.style.color='#ffffff'" onmouseleave="this.style.color='#c4b5fd'">🎨 Theme</button>
                        <button onclick="saveSlideChanges()" style="
                            background: linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(22, 163, 74, 0.3));
                            color: #86efac;
                            border: 1px solid rgba(34, 197, 94, 0.5);
                            padding: 8px 16px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 0.85rem;
                            font-weight: 600;
                        " onmouseenter="this.style.color='#ffffff'" onmouseleave="this.style.color='#86efac'">💾 Save</button>
                        <button onclick="closeSlideEditor()" style="
                            background: linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(220, 38, 38, 0.3));
                            color: #fca5a5;
                            border: 1px solid rgba(239, 68, 68, 0.5);
                            padding: 8px 16px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 0.85rem;
                            font-weight: 600;
                        " onmouseenter="this.style.color='#ffffff'" onmouseleave="this.style.color='#fca5a5'">✕ Close</button>
                    </div>
                </div>

                <!-- Editor Content -->
                <div class="editor-content" style="
                    flex: 1;
                    display: flex;
                    gap: 20px;
                    padding: 20px;
                ">
                    <!-- Slide Editor -->
                    <div class="slide-editor" style="
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                    ">
                        <label style="
                            color: rgba(255, 255, 255, 0.8);
                            font-size: 0.9rem;
                            font-weight: 600;
                            margin-bottom: 8px;
                        ">Edit Slide Content</label>
                        <textarea id="slide-content-editor" style="
                            flex: 1;
                            background: rgba(0, 0, 0, 0.3);
                            border: 1px solid rgba(255, 255, 255, 0.2);
                            border-radius: 12px;
                            padding: 16px;
                            color: white;
                            font-family: 'Monaco', 'Menlo', monospace;
                            font-size: 0.9rem;
                            line-height: 1.6;
                            resize: none;
                            outline: none;
                        " placeholder="Edit your slide content here...">${presentation.slides[0]?.content || ''}</textarea>
                    </div>

                    <!-- Live Preview -->
                    <div class="slide-preview" style="
                        width: 400px;
                        display: flex;
                        flex-direction: column;
                    ">
                        <label style="
                            color: rgba(255, 255, 255, 0.8);
                            font-size: 0.9rem;
                            font-weight: 600;
                            margin-bottom: 8px;
                        ">Live Preview</label>
                        <div id="slide-preview-content" style="
                            flex: 1;
                            background: white;
                            border-radius: 12px;
                            padding: 20px;
                            color: #333;
                            font-family: 'Inter', sans-serif;
                            line-height: 1.6;
                            overflow-y: auto;
                            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                        ">${formatSlidePreview(presentation.slides[0]?.content || '')}</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    
    // Store current presentation for editor functions
    window.currentEditingPresentation = presentation;
    window.currentSlideIndex = 0;
    
    // Auto-update preview as user types
    const editor = document.getElementById('slide-content-editor');
    editor.addEventListener('input', updateSlidePreview);
    
    // Focus on editor
    setTimeout(() => editor.focus(), 100);
}

// Select slide in editor
function selectSlide(index) {
    if (!window.currentEditingPresentation) return;
    
    const presentation = window.currentEditingPresentation;
    window.currentSlideIndex = index;
    
    // Update active slide in navigation
    document.querySelectorAll('.slide-nav-item').forEach((item, i) => {
        if (i === index) {
            item.classList.add('active');
            item.style.background = 'rgba(102, 126, 234, 0.2)';
            item.style.borderColor = 'rgba(102, 126, 234, 0.3)';
        } else {
            item.classList.remove('active');
            item.style.background = 'rgba(255, 255, 255, 0.05)';
            item.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        }
    });
    
    // Update editor content
    const editor = document.getElementById('slide-content-editor');
    const slideNumberEl = document.getElementById('current-slide-number');
    
    if (editor && presentation.slides[index]) {
        editor.value = presentation.slides[index].content;
        updateSlidePreview();
    }
    
    if (slideNumberEl) {
        slideNumberEl.textContent = index + 1;
    }
}

// Update slide preview
function updateSlidePreview() {
    const editor = document.getElementById('slide-content-editor');
    const preview = document.getElementById('slide-preview-content');
    
    if (editor && preview) {
        preview.innerHTML = formatSlidePreview(editor.value);
    }
}

// Format slide content for preview
function formatSlidePreview(content) {
    if (!content) return '<p style="color: #999; font-style: italic;">No content</p>';
    
    // Convert markdown-like formatting to HTML
    let formatted = content
        .replace(/^# (.*$)/gm, '<h1 style="color: #333; margin-bottom: 16px; font-size: 1.5rem;">$1</h1>')
        .replace(/^## (.*$)/gm, '<h2 style="color: #444; margin-bottom: 12px; font-size: 1.3rem;">$1</h2>')
        .replace(/^### (.*$)/gm, '<h3 style="color: #555; margin-bottom: 8px; font-size: 1.1rem;">$1</h3>')
        .replace(/^\* (.*$)/gm, '<li style="margin-bottom: 4px;">$1</li>')
        .replace(/^- (.*$)/gm, '<li style="margin-bottom: 4px;">$1</li>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p style="margin-bottom: 12px;">')
        .replace(/\n/g, '<br>');
    
    // Wrap in paragraph if not already wrapped
    if (!formatted.includes('<h1>') && !formatted.includes('<h2>') && !formatted.includes('<li>')) {
        formatted = `<p style="margin-bottom: 12px;">${formatted}</p>`;
    }
    
    // Wrap list items in ul
    if (formatted.includes('<li>')) {
        formatted = formatted.replace(/(<li>.*?<\/li>)/gs, '<ul style="margin-bottom: 12px; padding-left: 20px;">$1</ul>');
    }
    
    return formatted;
}

// Context-aware AI improvement with confirmation
async function improveSlideWithAI() {
    if (!window.currentEditingPresentation || window.currentSlideIndex === undefined) return;
    
    const editor = document.getElementById('slide-content-editor');
    if (!editor) return;
    
    const currentContent = editor.value;
    if (!currentContent.trim()) {
        showErrorNotification('Please add some content to improve');
        return;
    }
    
    // Extract context from slide content - check multiple patterns
    let extractedContext = null;
    
    // Pattern 1: "take context from here: ..." anywhere in content
    let contextMatch = currentContent.match(/take context from here[:\s]*(.+?)(?:\n|$)/i);
    if (contextMatch) {
        extractedContext = contextMatch[1].trim();
    }
    
    // Pattern 2: Check first line for any context instruction
    if (!extractedContext) {
        const firstLine = currentContent.split('\n')[0].trim();
        if (firstLine.length > 10 && (
            firstLine.toLowerCase().includes('context') ||
            firstLine.toLowerCase().includes('based on') ||
            firstLine.toLowerCase().includes('using') ||
            firstLine.toLowerCase().includes('about')
        )) {
            extractedContext = firstLine;
        }
    }
    
    // Pattern 3: Look for "Slide X: ..." pattern
    if (!extractedContext) {
        contextMatch = currentContent.match(/slide\s+\d+[:\s]*(.+?)(?:\n|$)/i);
        if (contextMatch) {
            extractedContext = contextMatch[1].trim();
        }
    }
    
    // Pattern 4: Look for any instruction in the first 100 characters
    if (!extractedContext) {
        const firstPart = currentContent.substring(0, 100).trim();
        if (firstPart.length > 20) {
            extractedContext = firstPart;
        }
    }
    
    // Show confirmation dialog with context
    const shouldProceed = await showAIImprovementConfirmation(extractedContext);
    if (!shouldProceed) return;
    
    try {
        // Show loading state
        const improveBtn = document.querySelector('[onclick="improveSlideWithAI()"]');
        if (improveBtn) {
            improveBtn.innerHTML = '⚡ Improving...';
            improveBtn.disabled = true;
        }
        
        // Get authentication state
        const authState = await authService.getCurrentAuthState();
        if (!authState.isAuthenticated) {
            throw new Error('User not authenticated');
        }
        
        // Call AI improvement API with context
        const query = `
            mutation ImproveSlideWithAI($presentationId: String!, $slideIndex: Int!, $currentContent: String!, $context: String) {
                improveSlideWithAI(presentationId: $presentationId, slideIndex: $slideIndex, currentContent: $currentContent, context: $context) {
                    success
                    improvedContent
                    originalContent
                    improvementSuggestions
                    message
                }
            }
        `;
        
        const variables = {
            presentationId: window.currentEditingPresentation.id,
            slideIndex: window.currentSlideIndex,
            currentContent: currentContent,
            context: extractedContext
        };
        
        console.log('Calling AI improvement API with:', variables);
        
        const response = await fetch(config.graphqlEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authState.session.tokens.idToken.toString()}`
            },
            body: JSON.stringify({ query, variables })
        });
        
        const result = await response.json();
        console.log('AI improvement API response:', result);
        
        if (result.errors) {
            throw new Error(result.errors[0].message);
        }
        
        const improvementResult = result.data.improveSlideWithAI;
        
        if (improvementResult.success) {
            // Update editor with improved content
            editor.value = improvementResult.improvedContent;
            updateSlidePreview();
            
            // Show success message with suggestions
            const suggestions = improvementResult.improvementSuggestions.join(', ');
            showSuccessNotification(`Slide improved! Changes: ${suggestions}`);
            
            // Auto-save the improvement
            saveSlideChanges();
        } else {
            throw new Error(improvementResult.message || 'Failed to improve slide');
        }
        
    } catch (error) {
        console.error('AI improvement error:', error);
        showErrorNotification(`Failed to improve slide: ${error.message}`);
    } finally {
        // Restore button state
        const improveBtn = document.querySelector('[onclick="improveSlideWithAI()"]');
        if (improveBtn) {
            improveBtn.innerHTML = '✨ Improve with AI';
            improveBtn.disabled = false;
        }
    }
}

function showAIImprovementConfirmation(extractedContext) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'ai-confirmation-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            z-index: 10002;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease-out;
        `;
        
        const contextDisplay = extractedContext 
            ? `<div style="
                background: rgba(139, 92, 246, 0.1);
                border: 1px solid rgba(139, 92, 246, 0.3);
                border-radius: 8px;
                padding: 12px;
                margin: 16px 0;
                color: #c4b5fd;
            ">
                <strong>Context found:</strong> "${extractedContext}"
            </div>`
            : `<div style="
                background: rgba(245, 158, 11, 0.1);
                border: 1px solid rgba(245, 158, 11, 0.3);
                border-radius: 8px;
                padding: 12px;
                margin: 16px 0;
                color: #fbbf24;
            ">
                <strong>No specific context found.</strong> AI will improve based on general best practices.
            </div>`;
        
        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, rgba(30, 30, 30, 0.95), rgba(20, 20, 20, 0.95));
                border-radius: 16px;
                padding: 30px;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(255, 255, 255, 0.1);
                text-align: center;
            ">
                <h3 style="
                    color: white;
                    margin: 0 0 16px 0;
                    font-size: 1.3rem;
                    font-weight: 600;
                ">🤖 AI Slide Improvement</h3>
                
                <p style="
                    color: rgba(255, 255, 255, 0.8);
                    margin: 0 0 16px 0;
                    line-height: 1.5;
                ">AI will analyze and improve your slide content for better clarity, structure, and engagement.</p>
                
                ${contextDisplay}
                
                <div style="
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                    margin-top: 24px;
                ">
                    <button onclick="resolveConfirmation(true)" style="
                        background: linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(22, 163, 74, 0.3));
                        color: #86efac;
                        border: 1px solid rgba(34, 197, 94, 0.5);
                        padding: 12px 24px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                        font-size: 1rem;
                    " onmouseenter="this.style.color='#ffffff'" onmouseleave="this.style.color='#86efac'">
                        ✅ Yes, Improve
                    </button>
                    <button onclick="resolveConfirmation(false)" style="
                        background: linear-gradient(135deg, rgba(156, 163, 175, 0.3), rgba(107, 114, 128, 0.3));
                        color: #d1d5db;
                        border: 1px solid rgba(156, 163, 175, 0.5);
                        padding: 12px 24px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                        font-size: 1rem;
                    " onmouseenter="this.style.color='#ffffff'" onmouseleave="this.style.color='#d1d5db'">
                        ❌ Cancel
                    </button>
                </div>
            </div>
        `;
        
        // Add resolve function to window
        window.resolveConfirmation = (result) => {
            modal.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                modal.remove();
                delete window.resolveConfirmation;
                resolve(result);
            }, 300);
        };
        
        document.body.appendChild(modal);
    });
}

// Save slide changes
function saveSlideChanges() {
    if (!window.currentEditingPresentation || window.currentSlideIndex === undefined) return;
    
    const editor = document.getElementById('slide-content-editor');
    if (!editor) return;
    
    const presentation = window.currentEditingPresentation;
    const slideIndex = window.currentSlideIndex;
    
    // Update slide content
    presentation.slides[slideIndex].content = editor.value;
    
    // Update the presentation in the global array
    const globalPresIndex = generatedPresentations.findIndex(p => p.id === presentation.id);
    if (globalPresIndex !== -1) {
        generatedPresentations[globalPresIndex] = presentation;
    }
    
    // Update navigation preview
    const navItem = document.querySelector(`[data-slide-index="${slideIndex}"] div:last-child`);
    if (navItem) {
        navItem.textContent = editor.value.substring(0, 50) + '...';
    }
    
    showSuccessNotification('Slide saved successfully!');
}

// Close slide editor
function closeSlideEditor() {
    const modal = document.querySelector('.slide-editor-modal');
    if (modal) {
        modal.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            modal.remove();
            window.currentEditingPresentation = null;
            window.currentSlideIndex = null;
            
            // Refresh presentations list to show any changes
            updatePresentationsList();
        }, 300);
    }
}

// Preview presentation function
function previewPresentation(presentationId) {
    const presentation = generatedPresentations.find(p => p.id === presentationId);
    if (!presentation) {
        showErrorNotification('Presentation not found');
        return;
    }
    
    // Create preview modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease-out;
    `;
    
    modal.innerHTML = `
        <div style="
            background: white;
            border-radius: 16px;
            width: 90%;
            max-width: 800px;
            height: 80%;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        ">
            <div style="
                padding: 20px;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <h3 style="margin: 0; color: #333;">${presentation.title}</h3>
                <button onclick="this.closest('.modal').remove()" style="
                    background: #ef4444;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                ">Close</button>
            </div>
            <div style="
                flex: 1;
                padding: 20px;
                overflow-y: auto;
                color: #333;
                line-height: 1.6;
            ">
                ${presentation.slides.map((slide, index) => `
                    <div style="
                        margin-bottom: 40px;
                        padding: 20px;
                        border: 1px solid #eee;
                        border-radius: 12px;
                        background: #f9f9f9;
                    ">
                        <h4 style="
                            color: #667eea;
                            margin: 0 0 16px 0;
                            font-size: 1.1rem;
                        ">Slide ${index + 1}</h4>
                        <div>${formatSlidePreview(slide.content)}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    modal.className = 'modal';
    document.body.appendChild(modal);
}

// Add CSS animations and enhanced styles
const advancedStyle = document.createElement('style');
advancedStyle.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; transform: scale(1); }
        to { opacity: 0; transform: scale(0.95); }
    }
    
    @keyframes slideInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }
    
    @keyframes dragHighlight {
        0%, 100% { box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.3); }
        50% { box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.6); }
    }
    
    .slide-nav-item:hover {
        background: rgba(255, 255, 255, 0.1) !important;
        transform: translateX(4px);
    }
    
    .slide-nav-item.active:hover {
        background: rgba(102, 126, 234, 0.3) !important;
    }
    
    .slide-nav-item.dragging {
        opacity: 0.5;
        transform: rotate(2deg);
        animation: pulse 0.5s ease-in-out infinite;
    }
    
    .slide-nav-item.drag-over {
        animation: dragHighlight 1s ease-in-out infinite;
        border-color: rgba(102, 126, 234, 0.6) !important;
    }
    
    .template-card:hover {
        animation: slideInUp 0.2s ease-out;
    }
    
    .theme-card:hover {
        animation: slideInUp 0.2s ease-out;
    }
    
    .theme-card.active {
        animation: pulse 2s ease-in-out infinite;
    }
    
    /* Scrollbar styling */
    .slide-nav-list::-webkit-scrollbar {
        width: 6px;
    }
    
    .slide-nav-list::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
    }
    
    .slide-nav-list::-webkit-scrollbar-thumb {
        background: rgba(102, 126, 234, 0.5);
        border-radius: 3px;
    }
    
    .slide-nav-list::-webkit-scrollbar-thumb:hover {
        background: rgba(102, 126, 234, 0.7);
    }
    
    /* Enhanced drag handle */
    .drag-handle {
        transition: all 0.2s ease;
    }
    
    .slide-nav-item:hover .drag-handle {
        color: rgba(255, 255, 255, 0.8) !important;
        transform: translateY(-50%) scale(1.2);
    }
`;
document.head.appendChild(advancedStyle);

function handleSlideDragEnd(event) {
    event.target.classList.remove('dragging');
    event.target.style.cursor = 'grab';
    draggedSlideIndex = null;
    
    // Remove all visual feedback
    document.querySelectorAll('.slide-nav-item').forEach(item => {
        item.classList.remove('drag-over');
        item.style.opacity = '1';
    });
}

// Comprehensive testing function for advanced features
function testAdvancedFeatures() {
    console.log('🧪 Testing Advanced Features...');
    
    // Test 1: Drag and Drop Functions
    console.log('✅ Test 1: Drag and Drop Functions');
    console.log('- handleDragStart:', typeof window.handleDragStart === 'function');
    console.log('- handleDragOver:', typeof window.handleDragOver === 'function');
    console.log('- handleDragLeave:', typeof window.handleDragLeave === 'function');
    console.log('- handleDrop:', typeof window.handleDrop === 'function');
    console.log('- handleDragEnd:', typeof window.handleDragEnd === 'function');
    console.log('- refreshSlideNavigation:', typeof window.refreshSlideNavigation === 'function');
    
    // Test 2: Template Functions
    console.log('✅ Test 2: Template Functions');
    console.log('- showTemplateSelector:', typeof window.showTemplateSelector === 'function');
    console.log('- applyTemplate:', typeof window.applyTemplate === 'function');
    console.log('- closeTemplateSelector:', typeof window.closeTemplateSelector === 'function');
    console.log('- slideTemplates available:', Object.keys(slideTemplates).length, 'templates');
    
    // Test 3: Theme Functions
    console.log('✅ Test 3: Theme Functions');
    console.log('- showThemeCustomizer:', typeof window.showThemeCustomizer === 'function');
    console.log('- applyTheme:', typeof window.applyTheme === 'function');
    console.log('- applyThemeToPresentation:', typeof window.applyThemeToPresentation === 'function');
    console.log('- resetToDefaultTheme:', typeof window.resetToDefaultTheme === 'function');
    console.log('- closeThemeCustomizer:', typeof window.closeThemeCustomizer === 'function');
    console.log('- presentationThemes available:', Object.keys(presentationThemes).length, 'themes');
    
    // Test 4: CSS Animations
    console.log('✅ Test 4: CSS Animations');
    const styleSheets = Array.from(document.styleSheets);
    const hasAdvancedStyles = styleSheets.some(sheet => {
        try {
            const rules = Array.from(sheet.cssRules || []);
            return rules.some(rule => rule.selectorText && rule.selectorText.includes('fadeIn'));
        } catch (e) {
            return false;
        }
    });
    console.log('- Advanced CSS animations loaded:', hasAdvancedStyles);
    
    // Test 5: Template Content Validation
    console.log('✅ Test 5: Template Content Validation');
    Object.entries(slideTemplates).forEach(([key, template]) => {
        const isValid = template.name && template.icon && template.content && template.content.length > 50;
        console.log(`- ${key} template valid:`, isValid);
    });
    
    // Test 6: Theme Color Validation
    console.log('✅ Test 6: Theme Color Validation');
    Object.entries(presentationThemes).forEach(([key, theme]) => {
        const hasColors = theme.colors && theme.colors.background && theme.colors.accent;
        const hasFonts = theme.fonts && theme.fonts.heading;
        console.log(`- ${key} theme valid:`, hasColors && hasFonts);
    });
    
    
    return {
        dragDrop: typeof window.handleDragStart === 'function',
        templates: typeof window.showTemplateSelector === 'function',
        themes: typeof window.showThemeCustomizer === 'function',
        animations: hasAdvancedStyles,
        templateCount: Object.keys(slideTemplates).length,
        themeCount: Object.keys(presentationThemes).length
    };
}

// Make testing function globally accessible
window.testAdvancedFeatures = testAdvancedFeatures;

// Initialization will be handled by the main DOMContentLoaded listener below

// Export presentation functionality
function exportPresentation(presentationId, format) {
    const presentation = generatedPresentations.find(p => p.id === presentationId);
    if (!presentation) {
        showErrorNotification('Presentation not found');
        return;
    }
    
    try {
        let exportContent = '';
        const title = presentation.title || 'Untitled Presentation';
        
        switch (format) {
            case 'html':
                exportContent = generateHTMLExport(presentation);
                downloadFile(`${title}.html`, exportContent, 'text/html');
                break;
                
            case 'revealjs':
                exportContent = generateRevealJSExport(presentation);
                downloadFile(`${title}-reveal.html`, exportContent, 'text/html');
                break;
                
            case 'marp':
                exportContent = generateMarpExport(presentation);
                downloadFile(`${title}.md`, exportContent, 'text/markdown');
                break;
                
            case 'pdf':
                generatePDFExport(presentation);
                break;
                
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
        
        showSuccessNotification(`Presentation exported as ${format.toUpperCase()}`);
        
    } catch (error) {
        console.error('Export error:', error);
        showErrorNotification(`Failed to export presentation: ${error.message}`);
    }
}

function generateHTMLExport(presentation) {
    const slides = presentation.slides.map((slide, index) => `
        <div class="slide" id="slide-${index + 1}">
            <div class="slide-header">
                <h1 class="slide-title">${slide.title || `Slide ${index + 1}`}</h1>
                <div class="slide-number">${index + 1} / ${presentation.slides.length}</div>
            </div>
            <div class="slide-content">
                ${formatSlideContentForHTML(slide.content)}
            </div>
        </div>
    `).join('');
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${presentation.title || 'AI Generated Presentation'}</title>
    <style>
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .presentation { 
            max-width: 900px; 
            margin: 0 auto; 
        }
        .presentation-header {
            text-align: center;
            color: white;
            margin-bottom: 30px;
        }
        .presentation-header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .presentation-header p {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        .slide { 
            background: white; 
            margin: 30px 0; 
            padding: 40px; 
            border-radius: 12px; 
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            position: relative;
            page-break-after: always;
        }
        .slide:last-child {
            page-break-after: avoid;
        }
        .slide-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #667eea;
            padding-bottom: 15px;
        }
        .slide-title { 
            color: #1e40af; 
            font-size: 2rem;
            font-weight: 700;
            margin: 0;
            flex-grow: 1;
        }
        .slide-number {
            background: #667eea;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 600;
        }
        .slide-content { 
            line-height: 1.8; 
            color: #374151;
            font-size: 1.1rem;
        }
        .slide-content h1, .slide-content h2, .slide-content h3 { 
            color: #1e40af; 
            margin-top: 25px;
            margin-bottom: 15px;
        }
        .slide-content h1 { font-size: 1.8rem; }
        .slide-content h2 { font-size: 1.5rem; }
        .slide-content h3 { font-size: 1.3rem; }
        .slide-content ul, .slide-content ol { 
            padding-left: 25px; 
            margin: 15px 0;
        }
        .slide-content li { 
            margin: 10px 0; 
            line-height: 1.6;
        }
        .slide-content p {
            margin: 15px 0;
            line-height: 1.7;
        }
        .slide-content strong { 
            color: #667eea; 
            font-weight: 600;
        }
        .slide-content em {
            color: #6b7280;
            font-style: italic;
        }
        @media print {
            body { background: white; }
            .presentation-header { color: #333; }
            .slide { box-shadow: none; border: 1px solid #e5e7eb; }
        }
        @media (max-width: 768px) {
            .presentation { padding: 0 10px; }
            .slide { padding: 25px; margin: 20px 0; }
            .slide-title { font-size: 1.5rem; }
            .slide-header { flex-direction: column; align-items: flex-start; gap: 10px; }
        }
    </style>
</head>
<body>
    <div class="presentation">
        <div class="presentation-header">
            <h1>${presentation.title || 'AI Generated Presentation'}</h1>
            <p>Generated with AI PPT Generator • ${presentation.slides.length} slides</p>
        </div>
        ${slides}
    </div>
</body>
</html>`;
}

function generateRevealJSExport(presentation) {
    const slides = presentation.slides.map(slide => `
        <section>
            ${formatSlideForExport(slide.content)}
        </section>
    `).join('');
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${presentation.title}</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/reveal.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/theme/white.css">
</head>
<body>
    <div class="reveal">
        <div class="slides">
            <section>
                <h1>${presentation.title}</h1>
                <p>Generated with AI PPT Generator</p>
            </section>
            ${slides}
        </div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/reveal.js"></script>
    <script>
        Reveal.initialize({
            hash: true,
            transition: 'slide'
        });
    </script>
</body>
</html>`;
}

function generateMarpExport(presentation) {
    const slides = presentation.slides.map(slide => `
---

${slide.content}
    `).join('');
    
    return `---
marp: true
theme: default
paginate: true
---

# ${presentation.title}

Generated with AI PPT Generator

${slides}`;
}

function generatePDFExport(presentation) {
    const title = presentation.title || 'Untitled Presentation';
    
    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank');
    
    // Generate HTML content optimized for PDF printing
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 1cm;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background: white;
            color: #1f2937;
            line-height: 1.6;
        }
        
        .slide {
            page-break-after: always;
            padding: 2cm;
            min-height: 18cm;
            display: flex;
            flex-direction: column;
            justify-content: center;
            border-bottom: 3px solid #3b82f6;
            position: relative;
        }
        
        .slide:last-child {
            page-break-after: avoid;
        }
        
        .slide-title {
            font-size: 2.5rem;
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 1.5rem;
            text-align: center;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 1rem;
        }
        
        .slide-content {
            font-size: 1.2rem;
            line-height: 1.8;
            text-align: left;
            flex-grow: 1;
        }
        
        .slide-content h1, .slide-content h2, .slide-content h3 {
            color: #1e40af;
            margin-top: 1.5rem;
            margin-bottom: 1rem;
        }
        
        .slide-content ul, .slide-content ol {
            margin: 1rem 0;
            padding-left: 2rem;
        }
        
        .slide-content li {
            margin: 0.5rem 0;
        }
        
        .slide-content p {
            margin: 1rem 0;
        }
        
        .slide-number {
            position: absolute;
            bottom: 1cm;
            right: 1cm;
            font-size: 0.9rem;
            color: #6b7280;
        }
        
        .title-slide {
            text-align: center;
            justify-content: center;
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
        }
        
        .title-slide .slide-title {
            font-size: 3.5rem;
            color: #1e40af;
            border: none;
            margin-bottom: 2rem;
        }
        
        .title-slide .slide-content {
            font-size: 1.5rem;
            color: #4b5563;
            text-align: center;
        }
        
        @media print {
            body { -webkit-print-color-adjust: exact; }
            .slide { box-shadow: none; }
        }
    </style>
</head>
<body>
    ${presentation.slides.map((slide, index) => `
        <div class="slide ${index === 0 ? 'title-slide' : ''}">
            <h1 class="slide-title">${slide.title || `Slide ${index + 1}`}</h1>
            <div class="slide-content">${slide.content.replace(/\n/g, '<br>')}</div>
            <div class="slide-number">${index + 1} / ${presentation.slides.length}</div>
        </div>
    `).join('')}
</body>
</html>`;
    
    // Write content to the new window
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print
    printWindow.onload = function() {
        setTimeout(() => {
            printWindow.print();
            // Close the window after printing (user can cancel)
            printWindow.onafterprint = function() {
                printWindow.close();
            };
        }, 500);
    };
    
    showSuccessNotification('PDF export opened in new window. Use your browser\'s print dialog to save as PDF.');
}

function formatSlideForExport(content) {
    if (!content) return '';
    
    // Convert markdown-like formatting to HTML
    return content
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^\* (.*$)/gm, '<li>$1</li>')
        .replace(/^- (.*$)/gm, '<li>$1</li>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>')
        .replace(/<\/ul>\s*<ul>/g, '')
        .replace(/^(?!<[h|u|p])/gm, '<p>')
        .replace(/(?<!>)$/gm, '</p>')
        .replace(/<p><\/p>/g, '');
}

function formatSlideContentForHTML(content) {
    if (!content) return '';
    
    // Clean the content to remove redundant title information
    let cleanContent = content;
    
    // Remove patterns like "**Title:** Title Name" which are redundant
    cleanContent = cleanContent.replace(/^\*\*[^*]+:\*\*\s*[^\n]*\n?/gm, '');
    
    // Remove patterns like "Title: Title Name" at the beginning of lines
    cleanContent = cleanContent.replace(/^[^:\n]+:\s*[^\n]*\n?/gm, '');
    
    // Remove standalone "**Title:**" lines
    cleanContent = cleanContent.replace(/^\*\*[^*]+:\*\*\s*$/gm, '');
    
    // Clean up multiple newlines
    cleanContent = cleanContent.replace(/\n{3,}/g, '\n\n');
    
    // Convert markdown-like formatting to HTML
    return cleanContent
        .replace(/^# (.*$)/gm, '<h2>$1</h2>')
        .replace(/^## (.*$)/gm, '<h3>$1</h3>')
        .replace(/^### (.*$)/gm, '<h4>$1</h4>')
        .replace(/^\* (.*$)/gm, '<li>$1</li>')
        .replace(/^- (.*$)/gm, '<li>$1</li>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>')
        .replace(/<\/ul>\s*<ul>/g, '')
        .replace(/^(?!<[h|u|p])/gm, '<p>')
        .replace(/(?<!>)$/gm, '</p>')
        .replace(/<p><\/p>/g, '')
        .replace(/<p><br><\/p>/g, '')
        .replace(/^<p><\/p>/gm, '');
}

function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Presentation Persistence Functions
async function savePresentationToDynamoDB(presentation) {
    try {
        const authState = await authService.getCurrentAuthState();
        if (!authState.isAuthenticated) {
            console.warn('User not authenticated, cannot save presentation');
            return false;
        }
        
        const mutation = `
            mutation CreatePresentation($input: CreatePresentationInput!) {
                createPresentation(input: $input) {
                    id
                    title
                    description
                    slides
                    createdAt
                    updatedAt
                }
            }
        `;
        
        const variables = {
            input: {
                title: presentation.title,
                description: `Generated presentation with ${presentation.slides.length} slides`,
                slides: JSON.stringify(presentation.slides),
                theme: presentation.theme || 'default',
                contextUsed: presentation.contextUsed || false,
                sources: JSON.stringify(presentation.sources || []),
                relevantChunksCount: presentation.relevantChunksCount || 0
            }
        };
        
        const response = await fetch(config.graphqlEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authState.session.tokens.idToken.toString()}`
            },
            body: JSON.stringify({ query: mutation, variables })
        });
        
        const result = await response.json();
        
        if (result.errors) {
            console.error('Save presentation errors:', result.errors);
            return false;
        }
        
        // Update presentation with DynamoDB ID
        presentation.dynamoId = result.data.createPresentation.id;
        console.log('Presentation saved to DynamoDB:', presentation.dynamoId);
        return true;
        
    } catch (error) {
        console.error('Failed to save presentation:', error);
        return false;
    }
}

async function loadPresentationsFromDynamoDB() {
    try {
        const authState = await authService.getCurrentAuthState();
        if (!authState.isAuthenticated) {
            return [];
        }
        
        const query = `
            query ListPresentations {
                listPresentations {
                    id
                    title
                    description
                    slides
                    theme
                    contextUsed
                    sources
                    relevantChunksCount
                    createdAt
                    updatedAt
                }
            }
        `;
        
        const response = await fetch(config.graphqlEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authState.session.tokens.idToken.toString()}`
            },
            body: JSON.stringify({ query })
        });
        
        let result;
        try {
            result = await response.json();
        } catch (jsonError) {
            console.error('Failed to parse GraphQL response as JSON:', jsonError);
            console.error('Response status:', response.status);
            console.error('Response headers:', response.headers);
            
            // Try to get the raw response text for debugging
            try {
                const responseText = await response.text();
                console.error('Raw response text:', responseText.substring(0, 500));
            } catch (textError) {
                console.error('Could not get response text:', textError);
            }
            
            return [];
        }
        
        if (result.errors) {
            console.error('Load presentations errors:', result.errors);
            return [];
        }
        
        // Validate response structure
        if (!result.data || !result.data.listPresentations) {
            console.error('Invalid response structure:', result);
            return [];
        }
        
        // Ensure listPresentations is an array
        const presentationsList = Array.isArray(result.data.listPresentations) 
            ? result.data.listPresentations 
            : [];
        
        if (presentationsList.length === 0) {
            console.log('No presentations found in response');
            return [];
        }
        
        // Convert DynamoDB presentations to frontend format
        const presentations = presentationsList.map((dbPres, index) => {
            try {
                // Validate presentation object
                if (!dbPres || typeof dbPres !== 'object') {
                    console.error(`Invalid presentation object at index ${index}:`, dbPres);
                    return null;
                }
                
                let slides = [];
                let sources = [];
                
                try {
                    // Handle different slide data formats
                    if (typeof dbPres.slides === 'string') {
                        // If it's a string, try to parse it as JSON
                        slides = JSON.parse(dbPres.slides);
                    } else if (Array.isArray(dbPres.slides)) {
                        // If it's already an array, use it directly
                        slides = dbPres.slides;
                    } else if (dbPres.slides) {
                        // If it's some other format, try to convert it
                        slides = Array.isArray(dbPres.slides) ? dbPres.slides : [dbPres.slides];
                    }
                    
                    // Ensure slides is always an array
                    if (!Array.isArray(slides)) {
                        slides = [];
                    }
                    
                    // Convert slide format if needed
                    slides = slides.map((slide, slideIndex) => {
                        if (typeof slide === 'string') {
                            // If slide is a string, create a slide object
                            return {
                                id: `slide_${slideIndex + 1}`,
                                title: `Slide ${slideIndex + 1}`,
                                content: slide
                            };
                        } else if (slide && typeof slide === 'object') {
                            // If slide is already an object, ensure it has required fields
                            return {
                                id: slide.id || `slide_${slideIndex + 1}`,
                                title: slide.title || `Slide ${slideIndex + 1}`,
                                content: slide.content || slide.text || ''
                            };
                        }
                        return {
                            id: `slide_${slideIndex + 1}`,
                            title: `Slide ${slideIndex + 1}`,
                            content: ''
                        };
                    });
                    
                } catch (error) {
                    console.error('Error parsing slides for presentation:', dbPres.id, error);
                    slides = []; // Fallback to empty array
                }
                
                try {
                    // Handle different sources data formats
                    if (typeof dbPres.sources === 'string') {
                        sources = JSON.parse(dbPres.sources);
                    } else if (Array.isArray(dbPres.sources)) {
                        sources = dbPres.sources;
                    } else {
                        sources = [];
                    }
                } catch (error) {
                    console.error('Error parsing sources for presentation:', dbPres.id, error);
                    sources = [];
                }
                
                return {
                    id: `pres_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Frontend ID
                    dynamoId: dbPres.id, // DynamoDB ID
                    title: dbPres.title || 'Untitled Presentation',
                    slides: slides,
                    slideCount: slides.length,
                    theme: dbPres.theme || 'default',
                    contextUsed: dbPres.contextUsed || false,
                    ragEnhanced: dbPres.contextUsed || false,
                    sources: sources,
                    relevantChunksCount: dbPres.relevantChunksCount || 0,
                    generatedAt: new Date(dbPres.createdAt || Date.now()),
                    updatedAt: new Date(dbPres.updatedAt || Date.now())
                };
                
            } catch (error) {
                console.error(`Error processing presentation at index ${index}:`, error, dbPres);
                return null; // Return null for failed presentations
            }
        }).filter(presentation => presentation !== null); // Remove failed presentations
        
        console.log(`Successfully loaded ${presentations.length} presentations`);
        return presentations;
        
    } catch (error) {
        console.error('Failed to load presentations:', error);
        return [];
    }
}

async function updatePresentationInDynamoDB(presentation) {
    if (!presentation.dynamoId) {
        // If no DynamoDB ID, save as new
        return await savePresentationToDynamoDB(presentation);
    }
    
    try {
        const authState = await authService.getCurrentAuthState();
        if (!authState.isAuthenticated) {
            return false;
        }
        
        const mutation = `
            mutation UpdatePresentation($id: ID!, $input: UpdatePresentationInput!) {
                updatePresentation(id: $id, input: $input) {
                    id
                    title
                    slides
                    updatedAt
                }
            }
        `;
        
        const variables = {
            id: presentation.dynamoId,
            input: {
                title: presentation.title,
                slides: JSON.stringify(presentation.slides),
                theme: presentation.theme || 'default'
            }
        };
        
        const response = await fetch(config.graphqlEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authState.session.tokens.idToken.toString()}`
            },
            body: JSON.stringify({ query: mutation, variables })
        });
        
        const result = await response.json();
        
        if (result.errors) {
            console.error('Update presentation errors:', result.errors);
            return false;
        }
        
        console.log('Presentation updated in DynamoDB');
        return true;
        
    } catch (error) {
        console.error('Failed to update presentation:', error);
        return false;
    }
}

// Auto-save presentations when they're created or modified
async function autoSavePresentation(presentation) {
    const saved = await savePresentationToDynamoDB(presentation);
    if (saved) {
        showSuccessNotification('Presentation saved automatically');
    }
}

// Load presentations on page load
async function initializePresentations() {
    try {
        // Wait for authentication to be ready
        let authState = await authService.getCurrentAuthState();
        let retries = 0;
        const maxRetries = 5;
        
        // Retry if not authenticated yet
        while (!authState.isAuthenticated && retries < maxRetries) {
            console.log(`Waiting for authentication... (attempt ${retries + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            authState = await authService.getCurrentAuthState();
            retries++;
        }
        
        if (!authState.isAuthenticated) {
            console.log('User not authenticated, skipping presentation loading');
            return;
        }
        
        console.log('Loading presentations from DynamoDB...');
        const savedPresentations = await loadPresentationsFromDynamoDB();
        
        if (savedPresentations.length > 0) {
            // Clear existing presentations to avoid duplicates
            generatedPresentations.length = 0;
            generatedPresentations.push(...savedPresentations);
            updatePresentationsList();
            
            // Hide welcome message if presentations exist
            const welcomeMessage = document.getElementById('welcome-message');
            const presentationsList = document.getElementById('presentations-list');
            if (welcomeMessage && presentationsList) {
                welcomeMessage.style.display = 'none';
                presentationsList.classList.remove('hidden');
            }
            
            console.log(`✅ Loaded ${savedPresentations.length} presentations from DynamoDB`);
            showSuccessNotification(`Loaded ${savedPresentations.length} saved presentations`);
        } else {
            console.log('No saved presentations found');
        }
    } catch (error) {
        console.error('Failed to initialize presentations:', error);
        showErrorNotification('Failed to load saved presentations');
    }
}

// Editable presentation title functionality
function editPresentationTitle() {
    if (!window.currentEditingPresentation) return;
    
    const titleElement = document.querySelector('.editable-title');
    if (!titleElement) return;
    
    const currentTitle = window.currentEditingPresentation.title;
    
    // Create input field
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentTitle;
    input.style.cssText = `
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(102, 126, 234, 0.5);
        border-radius: 4px;
        padding: 4px 8px;
        color: white;
        font-size: 1.2rem;
        font-weight: 600;
        font-family: inherit;
        width: 100%;
        outline: none;
    `;
    
    // Replace title with input
    titleElement.innerHTML = '';
    titleElement.appendChild(input);
    titleElement.style.cursor = 'default';
    
    // Focus and select all text
    input.focus();
    input.select();
    
    // Handle save on Enter or blur
    const saveTitle = () => {
        const newTitle = input.value.trim();
        if (newTitle && newTitle !== currentTitle) {
            // Update presentation title
            window.currentEditingPresentation.title = newTitle;
            
            // Update in global presentations array
            const globalPresIndex = generatedPresentations.findIndex(p => p.id === window.currentEditingPresentation.id);
            if (globalPresIndex !== -1) {
                generatedPresentations[globalPresIndex].title = newTitle;
            }
            
            // Update in DynamoDB
            updatePresentationInDynamoDB(window.currentEditingPresentation);
            
            // Refresh presentations list
            updatePresentationsList();
            
            showSuccessNotification('Presentation title updated');
        }
        
        // Restore title display
        titleElement.innerHTML = `${window.currentEditingPresentation.title} ✏️`;
        titleElement.style.cursor = 'pointer';
    };
    
    // Save on Enter key
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveTitle();
        } else if (e.key === 'Escape') {
            // Cancel editing
            titleElement.innerHTML = `${currentTitle} ✏️`;
            titleElement.style.cursor = 'pointer';
        }
    });
    
    // Save on blur (click outside)
    input.addEventListener('blur', saveTitle);
}

// Make title editing function globally accessible
window.editPresentationTitle = editPresentationTitle;
window.openSlideEditor = openSlideEditor;
window.previewPresentation = previewPresentation;
window.selectSlide = selectSlide;
window.updateSlidePreview = updateSlidePreview;
window.improveSlideWithAI = improveSlideWithAI;
window.saveSlideChanges = saveSlideChanges;
window.closeSlideEditor = closeSlideEditor;

// Make drag functions globally accessible
window.handleSlideDragStart = handleSlideDragStart;
window.handleSlideDragOver = handleSlideDragOver;
window.handleSlideDragLeave = handleSlideDragLeave;
window.handleSlideDrop = handleSlideDrop;
window.handleSlideDragEnd = handleSlideDragEnd;
window.refreshSlideNavigation = refreshSlideNavigation;

// Make template functions globally accessible
window.showTemplateSelector = showTemplateSelector;
window.applyTemplate = applyTemplate;
window.closeTemplateSelector = closeTemplateSelector;

// Make theme functions globally accessible
window.showThemeCustomizer = showThemeCustomizer;
window.applyTheme = applyTheme;
window.applyThemeToPresentation = applyThemeToPresentation;
window.resetToDefaultTheme = resetToDefaultTheme;
window.closeThemeCustomizer = closeThemeCustomizer;

// Drag and Drop functionality for slide reordering
let draggedSlideIndex = null;

function handleSlideDragStart(event, index) {
    draggedSlideIndex = index;
    event.dataTransfer.effectAllowed = 'move';
    event.target.classList.add('dragging');
    event.target.style.cursor = 'grabbing';
    
    // Add visual feedback to other items
    document.querySelectorAll('.slide-nav-item').forEach((item, i) => {
        if (i !== index) {
            item.style.opacity = '0.7';
        }
    });
}

function handleSlideDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    
    const target = event.currentTarget;
    if (target.classList.contains('slide-nav-item') && !target.classList.contains('dragging')) {
        target.classList.add('drag-over');
    }
}

function handleSlideDragLeave(event) {
    const target = event.currentTarget;
    if (target.classList.contains('slide-nav-item')) {
        target.classList.remove('drag-over');
    }
}

function handleSlideDrop(event, targetIndex) {
    event.preventDefault();
    
    // Remove visual feedback
    document.querySelectorAll('.slide-nav-item').forEach(item => {
        item.classList.remove('drag-over');
    });
    
    if (draggedSlideIndex === null || draggedSlideIndex === targetIndex) {
        return;
    }
    
    // Reorder slides in the presentation
    if (window.currentEditingPresentation) {
        const slides = window.currentEditingPresentation.slides;
        const draggedSlide = slides[draggedSlideIndex];
        
        // Remove dragged slide and insert at new position
        slides.splice(draggedSlideIndex, 1);
        slides.splice(targetIndex, 0, draggedSlide);
        
        // Update slide IDs to maintain consistency
        slides.forEach((slide, index) => {
            slide.id = `slide_${index + 1}`;
            slide.title = `Slide ${index + 1}`;
        });
        
        // Update the global presentation
        const globalPresIndex = generatedPresentations.findIndex(p => p.id === window.currentEditingPresentation.id);
        if (globalPresIndex !== -1) {
            generatedPresentations[globalPresIndex] = window.currentEditingPresentation;
        }
        
        // Refresh the slide navigation
        refreshSlideNavigation();
        
        // Update current slide index if needed
        if (window.currentSlideIndex === draggedSlideIndex) {
            window.currentSlideIndex = targetIndex;
        } else if (window.currentSlideIndex > draggedSlideIndex && window.currentSlideIndex <= targetIndex) {
            window.currentSlideIndex--;
        } else if (window.currentSlideIndex < draggedSlideIndex && window.currentSlideIndex >= targetIndex) {
            window.currentSlideIndex++;
        }
        
        // Select the moved slide
        selectSlide(targetIndex);
        
        showSuccessNotification(`Slide moved from position ${draggedSlideIndex + 1} to ${targetIndex + 1}`);
    }
}


function refreshSlideNavigation() {
    if (!window.currentEditingPresentation) return;
    
    const navList = document.getElementById('slide-nav-list');
    if (!navList) return;
    
    const presentation = window.currentEditingPresentation;
    navList.innerHTML = presentation.slides.map((slide, index) => `
        <div class="slide-nav-item ${index === window.currentSlideIndex ? 'active' : ''}" 
             data-slide-index="${index}"
             draggable="true"
             ondragstart="handleSlideDragStart(event, ${index})"
             ondragover="handleSlideDragOver(event)"
             ondragleave="handleSlideDragLeave(event)"
             ondrop="handleSlideDrop(event, ${index})"
             ondragend="handleSlideDragEnd(event)"
             onclick="selectSlide(${index})"
             style="
                background: ${index === window.currentSlideIndex ? 'rgba(102, 126, 234, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
                border: 1px solid ${index === window.currentSlideIndex ? 'rgba(102, 126, 234, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
                border-radius: 12px;
                padding: 12px;
                margin-bottom: 8px;
                cursor: grab;
                transition: all 0.2s ease;
                color: white;
                position: relative;
             ">
            <div class="drag-handle" style="
                position: absolute;
                left: 4px;
                top: 50%;
                transform: translateY(-50%);
                color: rgba(255, 255, 255, 0.4);
                font-size: 0.8rem;
                cursor: grab;
            ">⋮⋮</div>
            <div style="
                margin-left: 16px;
                font-weight: 600;
                font-size: 0.9rem;
                margin-bottom: 4px;
            ">Slide ${index + 1}</div>
            <div style="
                margin-left: 16px;
                font-size: 0.8rem;
                color: rgba(255, 255, 255, 0.7);
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            ">${slide.content.substring(0, 50)}...</div>
        </div>
    `).join('');
}

// Slide Templates
const slideTemplates = {
    title: {
        name: "Title Slide",
        icon: "📋",
        content: `# [Your Title Here]

## [Subtitle or Description]

---

**Presenter:** [Your Name]  
**Date:** [Date]  
**Company/Organization:** [Organization]`
    },
    bulletPoints: {
        name: "Bullet Points",
        icon: "📝",
        content: `## [Section Title]

### Key Points:

• **First Point:** Brief description or explanation
• **Second Point:** Another important detail
• **Third Point:** Additional information
• **Fourth Point:** Supporting evidence or example

### Summary:
[Brief summary or conclusion]`
    },
    comparison: {
        name: "Comparison",
        icon: "⚖️",
        content: `## [Comparison Title]

### Option A | Option B
---|---
**Pros:** | **Pros:**
• Advantage 1 | • Advantage 1
• Advantage 2 | • Advantage 2
• Advantage 3 | • Advantage 3

**Cons:** | **Cons:**
• Disadvantage 1 | • Disadvantage 1
• Disadvantage 2 | • Disadvantage 2

### Recommendation:
[Your recommended choice and reasoning]`
    },
    process: {
        name: "Process Flow",
        icon: "🔄",
        content: `## [Process Title]

### Step-by-Step Process:

**Step 1:** [First Action]
↓
**Step 2:** [Second Action]
↓
**Step 3:** [Third Action]
↓
**Step 4:** [Final Action]

### Expected Outcome:
[Description of the final result or goal]`
    },
    statistics: {
        name: "Statistics",
        icon: "📊",
        content: `## [Statistics Title]

### Key Metrics:

📈 **Growth:** [X]% increase  
👥 **Users:** [X] million active users  
💰 **Revenue:** $[X] million  
🎯 **Success Rate:** [X]%  

### Insights:
• [Key insight 1]
• [Key insight 2]
• [Key insight 3]

### Next Steps:
[Action items based on the data]`
    },
    quote: {
        name: "Quote/Testimonial",
        icon: "💬",
        content: `## [Section Title]

> "[Insert meaningful quote or testimonial here. This should be impactful and relevant to your presentation topic.]"

**— [Author Name]**  
*[Title/Position, Company]*

### Key Takeaway:
[Brief explanation of why this quote is relevant and what it means for your audience]`
    },
    timeline: {
        name: "Timeline",
        icon: "📅",
        content: `## [Timeline Title]

### Project Timeline:

**Q1 2024:** [Milestone 1]
• [Key deliverable]
• [Important event]

**Q2 2024:** [Milestone 2]
• [Key deliverable]
• [Important event]

**Q3 2024:** [Milestone 3]
• [Key deliverable]
• [Important event]

**Q4 2024:** [Milestone 4]
• [Key deliverable]
• [Important event]`
    },
    conclusion: {
        name: "Conclusion",
        icon: "🎯",
        content: `## Key Takeaways

### Summary:
• **Main Point 1:** [Brief summary]
• **Main Point 2:** [Brief summary]
• **Main Point 3:** [Brief summary]

### Next Steps:
1. [Action item 1]
2. [Action item 2]
3. [Action item 3]

### Questions?
**Contact:** [Your contact information]  
**Thank you for your attention!** 🙏`
    }
};

function showTemplateSelector() {
    if (!window.currentEditingPresentation || window.currentSlideIndex === undefined) return;
    
    const modal = document.createElement('div');
    modal.className = 'template-selector-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease-out;
    `;
    
    modal.innerHTML = `
        <div style="
            background: linear-gradient(135deg, rgba(30, 30, 30, 0.95), rgba(20, 20, 20, 0.95));
            border-radius: 20px;
            width: 90%;
            max-width: 800px;
            max-height: 80%;
            overflow-y: auto;
            padding: 30px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.1);
        ">
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 30px;
            ">
                <h2 style="
                    color: white;
                    margin: 0;
                    font-size: 1.5rem;
                    font-weight: 600;
                ">Choose a Template</h2>
                <button onclick="closeTemplateSelector()" style="
                    background: rgba(239, 68, 68, 0.2);
                    color: #fca5a5;
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    padding: 8px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                ">✕ Close</button>
            </div>
            
            <div style="
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
            ">
                ${Object.entries(slideTemplates).map(([key, template]) => `
                    <div class="template-card" onclick="applyTemplate('${key}')" style="
                        background: rgba(255, 255, 255, 0.05);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 12px;
                        padding: 20px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        color: white;
                    " onmouseenter="this.style.background='rgba(255, 255, 255, 0.1)'; this.style.borderColor='rgba(102, 126, 234, 0.3)'; this.style.transform='translateY(-2px)'"
                       onmouseleave="this.style.background='rgba(255, 255, 255, 0.05)'; this.style.borderColor='rgba(255, 255, 255, 0.1)'; this.style.transform='translateY(0)'">
                        <div style="
                            font-size: 2rem;
                            margin-bottom: 10px;
                            text-align: center;
                        ">${template.icon}</div>
                        <h3 style="
                            margin: 0 0 10px 0;
                            font-size: 1.1rem;
                            font-weight: 600;
                            text-align: center;
                        ">${template.name}</h3>
                        <div style="
                            font-size: 0.85rem;
                            color: rgba(255, 255, 255, 0.7);
                            line-height: 1.4;
                            max-height: 60px;
                            overflow: hidden;
                        ">${template.content.substring(0, 100)}...</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function applyTemplate(templateKey) {
    const template = slideTemplates[templateKey];
    if (!template || !window.currentEditingPresentation || window.currentSlideIndex === undefined) return;
    
    const editor = document.getElementById('slide-content-editor');
    if (!editor) return;
    
    const existingContent = editor.value.trim();
    
    // If there's existing content, show proper options
    if (existingContent && existingContent !== template.content) {
        showTemplateApplicationDialog(template, existingContent, editor);
    } else {
        // No existing content, just apply template
        editor.value = template.content;
        updateSlidePreview();
        showSuccessNotification(`Applied "${template.name}" template`);
        closeTemplateSelector();
    }
}

function showTemplateApplicationDialog(template, existingContent, editor) {
    const modal = document.createElement('div');
    modal.className = 'template-application-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
        z-index: 10002;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease-out;
    `;
    
    modal.innerHTML = `
        <div style="
            background: linear-gradient(135deg, rgba(30, 30, 30, 0.95), rgba(20, 20, 20, 0.95));
            border-radius: 16px;
            padding: 30px;
            max-width: 600px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.1);
            text-align: center;
        ">
            <h3 style="
                color: white;
                margin: 0 0 16px 0;
                font-size: 1.3rem;
                font-weight: 600;
            ">📋 Apply Template</h3>
            
            <p style="
                color: rgba(255, 255, 255, 0.8);
                margin: 0 0 24px 0;
                line-height: 1.5;
            ">You have existing content in this slide. How would you like to apply the template?</p>
            
            <div style="
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin-bottom: 24px;
            ">
                <button onclick="handleTemplateChoice('merge')" style="
                    background: linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(22, 163, 74, 0.3));
                    color: #86efac;
                    border: 1px solid rgba(34, 197, 94, 0.5);
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 1rem;
                    transition: all 0.2s ease;
                " onmouseenter="this.style.color='#ffffff'" onmouseleave="this.style.color='#86efac'">
                    🤖 Smart Merge (AI-powered)
                    <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 4px;">
                        Use Nova Canvas to intelligently combine your content with the template
                    </div>
                </button>
                
                <button onclick="handleTemplateChoice('replace')" style="
                    background: linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(217, 119, 6, 0.3));
                    color: #fbbf24;
                    border: 1px solid rgba(245, 158, 11, 0.5);
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 1rem;
                    transition: all 0.2s ease;
                " onmouseenter="this.style.color='#ffffff'" onmouseleave="this.style.color='#fbbf24'">
                    🔄 Replace with Template
                    <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 4px;">
                        Replace existing content with template structure
                    </div>
                </button>
                
                <button onclick="handleTemplateChoice('cancel')" style="
                    background: linear-gradient(135deg, rgba(156, 163, 175, 0.3), rgba(107, 114, 128, 0.3));
                    color: #d1d5db;
                    border: 1px solid rgba(156, 163, 175, 0.5);
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 1rem;
                    transition: all 0.2s ease;
                " onmouseenter="this.style.color='#ffffff'" onmouseleave="this.style.color='#d1d5db'">
                    ❌ Cancel
                    <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 4px;">
                        Keep existing content unchanged
                    </div>
                </button>
            </div>
        </div>
    `;
    
    // Add choice handler to window
    window.handleTemplateChoice = async (choice) => {
        modal.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            modal.remove();
            delete window.handleTemplateChoice;
        }, 300);
        
        if (choice === 'cancel') {
            // Real cancel - do nothing, keep existing content
            closeTemplateSelector();
            return;
        }
        
        if (choice === 'replace') {
            // Simple replace
            editor.value = template.content;
            updateSlidePreview();
            showSuccessNotification(`Applied "${template.name}" template`);
            closeTemplateSelector();
            return;
        }
        
        if (choice === 'merge') {
            // AI-powered smart merge using Nova Canvas
            await performSmartTemplateMerge(template, existingContent, editor);
            closeTemplateSelector();
            return;
        }
    };
    
    document.body.appendChild(modal);
}

async function performSmartTemplateMerge(template, existingContent, editor) {
    try {
        // Show loading state
        showSuccessNotification('🤖 AI is intelligently merging your content...');
        
        // Get authentication state
        const authState = await authService.getCurrentAuthState();
        if (!authState.isAuthenticated) {
            throw new Error('User not authenticated');
        }
        
        // Call Nova Canvas API for intelligent merging
        const query = `
            mutation SmartTemplateMerge($templateContent: String!, $existingContent: String!, $templateName: String!) {
                smartTemplateMerge(templateContent: $templateContent, existingContent: $existingContent, templateName: $templateName) {
                    success
                    mergedContent
                    message
                    improvementSuggestions
                }
            }
        `;
        
        const variables = {
            templateContent: template.content,
            existingContent: existingContent,
            templateName: template.name
        };
        
        const response = await fetch(config.graphqlEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authState.session.tokens.idToken.toString()}`
            },
            body: JSON.stringify({ query, variables })
        });
        
        const result = await response.json();
        
        if (result.errors) {
            throw new Error(result.errors[0].message);
        }
        
        const mergeResult = result.data.smartTemplateMerge;
        
        if (mergeResult.success) {
            // Apply the AI-merged content
            editor.value = mergeResult.mergedContent;
            updateSlidePreview();
            
            const suggestions = mergeResult.improvementSuggestions?.join(', ') || 'content structure and formatting';
            showSuccessNotification(`✨ Smart merge completed! Enhanced: ${suggestions}`);
            
            // Auto-save the merged content
            saveSlideChanges();
        } else {
            throw new Error(mergeResult.message || 'Smart merge failed');
        }
        
    } catch (error) {
        console.error('Smart template merge error:', error);
        showErrorNotification(`Smart merge failed: ${error.message}. Using simple merge instead.`);
        
        // Fallback to simple merge
        const simpleMerged = mergeContentWithTemplate(existingContent, template);
        editor.value = simpleMerged;
        updateSlidePreview();
        showSuccessNotification(`Applied "${template.name}" template with simple merge`);
    }
}

function mergeContentWithTemplate(existingContent, template) {
    try {
        // Extract meaningful content from existing slide
        const existingLines = existingContent.split('\n').filter(line => line.trim());
        const templateLines = template.content.split('\n');
        
        let mergedContent = template.content;
        
        // Try to identify and preserve key content
        const existingTitle = existingLines.find(line => line.startsWith('#'));
        const existingBullets = existingLines.filter(line => line.startsWith('•') || line.startsWith('-') || line.startsWith('*'));
        const existingText = existingLines.filter(line => 
            !line.startsWith('#') && 
            !line.startsWith('•') && 
            !line.startsWith('-') && 
            !line.startsWith('*') &&
            line.length > 10
        );
        
        // Replace template placeholders with existing content
        if (existingTitle) {
            mergedContent = mergedContent.replace(/\[.*?Title.*?\]/gi, existingTitle.replace(/^#+\s*/, ''));
        }
        
        // Replace bullet point placeholders
        if (existingBullets.length > 0) {
            const bulletSection = existingBullets.join('\n');
            mergedContent = mergedContent.replace(
                /• \*\*.*?\*\*:.*?\n(• .*?\n)*/g, 
                bulletSection + '\n'
            );
        }
        
        // Replace description placeholders with existing text
        if (existingText.length > 0) {
            const textContent = existingText.join(' ');
            mergedContent = mergedContent.replace(
                /\[.*?(description|summary|content).*?\]/gi, 
                textContent.substring(0, 100) + (textContent.length > 100 ? '...' : '')
            );
        }
        
        return mergedContent;
        
    } catch (error) {
        console.warn('Failed to merge content, using template only:', error);
        return template.content;
    }
}

function closeTemplateSelector() {
    const modal = document.querySelector('.template-selector-modal');
    if (modal) {
        modal.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => modal.remove(), 300);
    }
}

// Theme Customization
const presentationThemes = {
    default: {
        name: "Default Dark",
        icon: "🌙",
        colors: {
            background: "#1a1a1a",
            cardBackground: "rgba(255, 255, 255, 0.05)",
            text: "#ffffff",
            accent: "#667eea",
            secondary: "#764ba2"
        },
        fonts: {
            heading: "'Inter', sans-serif",
            body: "'Inter', sans-serif"
        }
    },
    professional: {
        name: "Professional Blue",
        icon: "💼",
        colors: {
            background: "#0f172a",
            cardBackground: "rgba(59, 130, 246, 0.1)",
            text: "#f8fafc",
            accent: "#3b82f6",
            secondary: "#1e40af"
        },
        fonts: {
            heading: "'Inter', sans-serif",
            body: "'Inter', sans-serif"
        }
    },
    modern: {
        name: "Modern Purple",
        icon: "🎨",
        colors: {
            background: "#1e1b4b",
            cardBackground: "rgba(139, 92, 246, 0.1)",
            text: "#f1f5f9",
            accent: "#8b5cf6",
            secondary: "#7c3aed"
        },
        fonts: {
            heading: "'Inter', sans-serif",
            body: "'Inter', sans-serif"
        }
    },
    warm: {
        name: "Warm Orange",
        icon: "🔥",
        colors: {
            background: "#431407",
            cardBackground: "rgba(245, 158, 11, 0.1)",
            text: "#fef3c7",
            accent: "#f59e0b",
            secondary: "#d97706"
        },
        fonts: {
            heading: "'Inter', sans-serif",
            body: "'Inter', sans-serif"
        }
    },
    nature: {
        name: "Nature Green",
        icon: "🌿",
        colors: {
            background: "#14532d",
            cardBackground: "rgba(34, 197, 94, 0.1)",
            text: "#dcfce7",
            accent: "#22c55e",
            secondary: "#16a34a"
        },
        fonts: {
            heading: "'Inter', sans-serif",
            body: "'Inter', sans-serif"
        }
    },
    elegant: {
        name: "Elegant Gray",
        icon: "✨",
        colors: {
            background: "#111827",
            cardBackground: "rgba(156, 163, 175, 0.1)",
            text: "#f9fafb",
            accent: "#9ca3af",
            secondary: "#6b7280"
        },
        fonts: {
            heading: "'Inter', sans-serif",
            body: "'Inter', sans-serif"
        }
    }
};

let currentTheme = 'default';

function showThemeCustomizer() {
    const modal = document.createElement('div');
    modal.className = 'theme-customizer-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease-out;
    `;
    
    modal.innerHTML = `
        <div style="
            background: linear-gradient(135deg, rgba(30, 30, 30, 0.95), rgba(20, 20, 20, 0.95));
            border-radius: 20px;
            width: 90%;
            max-width: 900px;
            max-height: 80%;
            overflow-y: auto;
            padding: 30px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.1);
        ">
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 30px;
            ">
                <h2 style="
                    color: white;
                    margin: 0;
                    font-size: 1.5rem;
                    font-weight: 600;
                ">Customize Theme</h2>
                <button onclick="closeThemeCustomizer()" style="
                    background: rgba(239, 68, 68, 0.2);
                    color: #fca5a5;
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    padding: 8px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                ">✕ Close</button>
            </div>
            
            <div style="margin-bottom: 30px;">
                <h3 style="
                    color: white;
                    margin: 0 0 20px 0;
                    font-size: 1.2rem;
                    font-weight: 600;
                ">Choose a Theme</h3>
                <div style="
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                ">
                    ${Object.entries(presentationThemes).map(([key, theme]) => `
                        <div class="theme-card ${currentTheme === key ? 'active' : ''}" 
                             onclick="applyTheme('${key}')" 
                             style="
                                background: ${theme.colors.cardBackground};
                                border: 2px solid ${currentTheme === key ? theme.colors.accent : 'rgba(255, 255, 255, 0.1)'};
                                border-radius: 12px;
                                padding: 20px;
                                cursor: pointer;
                                transition: all 0.2s ease;
                                color: ${theme.colors.text};
                                text-align: center;
                             " onmouseenter="this.style.borderColor='${theme.colors.accent}'; this.style.transform='translateY(-2px)'"
                                onmouseleave="this.style.borderColor='${currentTheme === key ? theme.colors.accent : 'rgba(255, 255, 255, 0.1)'}'; this.style.transform='translateY(0)'">
                            <div style="
                                font-size: 2rem;
                                margin-bottom: 10px;
                            ">${theme.icon}</div>
                            <h4 style="
                                margin: 0 0 10px 0;
                                font-size: 1rem;
                                font-weight: 600;
                            ">${theme.name}</h4>
                            <div style="
                                display: flex;
                                justify-content: center;
                                gap: 5px;
                                margin-top: 10px;
                            ">
                                <div style="
                                    width: 20px;
                                    height: 20px;
                                    border-radius: 50%;
                                    background: ${theme.colors.accent};
                                "></div>
                                <div style="
                                    width: 20px;
                                    height: 20px;
                                    border-radius: 50%;
                                    background: ${theme.colors.secondary};
                                "></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div style="
                display: flex;
                gap: 15px;
                justify-content: center;
                margin-top: 30px;
            ">
                <button onclick="applyThemeToPresentation()" style="
                    background: linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(22, 163, 74, 0.3));
                    color: #86efac;
                    border: 1px solid rgba(34, 197, 94, 0.5);
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 1rem;
                " onmouseenter="this.style.color='#ffffff'" onmouseleave="this.style.color='#86efac'">✅ Apply Theme</button>
                <button onclick="resetToDefaultTheme()" style="
                    background: linear-gradient(135deg, rgba(156, 163, 175, 0.3), rgba(107, 114, 128, 0.3));
                    color: #d1d5db;
                    border: 1px solid rgba(156, 163, 175, 0.5);
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 1rem;
                " onmouseenter="this.style.color='#ffffff'" onmouseleave="this.style.color='#d1d5db'">🔄 Reset</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function applyTheme(themeKey) {
    currentTheme = themeKey;
    const theme = presentationThemes[themeKey];
    
    // Update theme preview in modal
    document.querySelectorAll('.theme-card').forEach(card => {
        card.classList.remove('active');
        card.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    });
    
    const selectedCard = document.querySelector(`[onclick="applyTheme('${themeKey}')"]`);
    if (selectedCard) {
        selectedCard.classList.add('active');
        selectedCard.style.borderColor = theme.colors.accent;
    }
    
    showSuccessNotification(`Selected "${theme.name}" theme`);
}

function applyThemeToPresentation() {
    if (!window.currentEditingPresentation) return;
    
    const theme = presentationThemes[currentTheme];
    
    // Store theme in presentation object
    window.currentEditingPresentation.theme = currentTheme;
    
    // Update the global presentation
    const globalPresIndex = generatedPresentations.findIndex(p => p.id === window.currentEditingPresentation.id);
    if (globalPresIndex !== -1) {
        generatedPresentations[globalPresIndex] = window.currentEditingPresentation;
    }
    
    // Apply theme to slide editor interface
    applyThemeToEditor(theme);
    
    showSuccessNotification(`Applied "${theme.name}" theme to presentation`);
    closeThemeCustomizer();
}

function applyThemeToEditor(theme) {
    // Update slide editor background and colors
    const editorContainer = document.querySelector('.slide-editor-container');
    if (editorContainer) {
        editorContainer.style.background = `linear-gradient(135deg, ${theme.colors.background}f0, ${theme.colors.background}e0)`;
    }
    
    // Update slide navigation panel
    const navPanel = document.querySelector('.slide-nav-panel');
    if (navPanel) {
        navPanel.style.background = `${theme.colors.cardBackground}80`;
    }
    
    // Update preview area
    const preview = document.getElementById('slide-preview-content');
    if (preview) {
        preview.style.background = theme.colors.text;
        preview.style.color = theme.colors.background;
    }
}

function resetToDefaultTheme() {
    applyTheme('default');
}

function closeThemeCustomizer() {
    const modal = document.querySelector('.theme-customizer-modal');
    if (modal) {
        modal.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => modal.remove(), 300);
    }
}

// Make theme functions globally accessible
window.showThemeCustomizer = showThemeCustomizer;
window.applyTheme = applyTheme;
window.applyThemeToPresentation = applyThemeToPresentation;
window.resetToDefaultTheme = resetToDefaultTheme;
window.closeThemeCustomizer = closeThemeCustomizer;

// Legacy edit function for compatibility
function editPresentation(presentationId) {
    const presentation = generatedPresentations.find(p => p.id === presentationId);
    if (!presentation) {
        showErrorNotification('Presentation not found');
        return;
    }
    
    // Create edit modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.8); z-index: 1000; display: flex; 
        align-items: center; justify-content: center;
    `;
    
    const slides = presentation.slides || [];
    const slidesHTML = slides.map((slide, index) => `
        <div class="edit-slide" style="margin: 15px 0; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <h4>Slide ${index + 1}</h4>
            <input type="text" id="slide-title-${index}" value="${slide.title || ''}" 
                   placeholder="Slide title" style="width: 100%; margin: 10px 0; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            <textarea id="slide-content-${index}" placeholder="Slide content" 
                      style="width: 100%; height: 100px; margin: 10px 0; padding: 8px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;">${slide.content || ''}</textarea>
        </div>
    `).join('');
    
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 12px; max-width: 800px; max-height: 80vh; overflow-y: auto; width: 90%;">
            <h2 style="margin-top: 0;">Edit: ${presentation.title}</h2>
            <div style="margin: 20px 0;">
                <label>Presentation Title:</label>
                <input type="text" id="edit-title" value="${presentation.title}" 
                       style="width: 100%; margin: 10px 0; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div id="slides-container">
                ${slidesHTML}
            </div>
            <div style="margin-top: 20px; text-align: right;">
                <button onclick="this.closest('.modal').remove()" 
                        style="margin-right: 10px; padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Cancel
                </button>
                <button onclick="saveEditedPresentation('${presentationId}', this.closest('.modal'))" 
                        style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Save Changes
                </button>
            </div>
        </div>
    `;
    
    modal.className = 'modal';
    document.body.appendChild(modal);
}

function saveEditedPresentation(presentationId, modal) {
    const presentation = generatedPresentations.find(p => p.id === presentationId);
    if (!presentation) {
        showErrorNotification('Presentation not found');
        return;
    }
    
    // Get updated values
    const newTitle = modal.querySelector('#edit-title').value;
    const slides = presentation.slides || [];
    
    // Update slides
    slides.forEach((slide, index) => {
        const titleInput = modal.querySelector(`#slide-title-${index}`);
        const contentInput = modal.querySelector(`#slide-content-${index}`);
        if (titleInput && contentInput) {
            slide.title = titleInput.value;
            slide.content = contentInput.value;
        }
    });
    
    // Update presentation
    presentation.title = newTitle;
    presentation.slides = slides;
    
    // Close modal
    modal.remove();
    
    // Refresh display
    displayPresentations();
    showSuccessNotification('Presentation updated successfully!');
}



// Authentication handlers (keeping the working implementation)
async function handleSignIn() {
    const email = document.getElementById('signin-email')?.value;
    const password = document.getElementById('signin-password')?.value;
    
    if (!email || !password) {
        updateStatus('Please enter both email and password', 'error');
        return;
    }
    
    try {
        updateStatus('🔐 Signing in...', 'info');
        const result = await authService.signIn(email, password);
        
        if (result.success) {
            updateStatus('✅ Signed in successfully!', 'success');
            
            // Get user info and show dashboard
            const authState = await authService.getCurrentAuthState();
            if (authState.isAuthenticated) {
                const userInfoElement = document.getElementById('user-info');
                if (userInfoElement) {
                    userInfoElement.textContent = `Logged in as: ${authState.user.email}`;
                }
                showDashboard(true);
            }
        } else {
            updateStatus(`❌ Sign in failed: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Sign in error:', error);
        updateStatus(`❌ Sign in error: ${error.message}`, 'error');
    }
}

async function handleSignUp() {
    const email = document.getElementById('signup-email')?.value;
    const password = document.getElementById('signup-password')?.value;
    
    if (!email || !password) {
        updateStatus('Please enter both email and password', 'error');
        return;
    }
    
    try {
        updateStatus('📝 Creating account...', 'info');
        const result = await authService.signUp(email, password);
        
        if (result.success) {
            updateStatus('✅ Account created! Please check your email for confirmation code.', 'success');
            showForm('confirm-form');
        } else {
            updateStatus(`❌ Sign up failed: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Sign up error:', error);
        updateStatus(`❌ Sign up error: ${error.message}`, 'error');
    }
}

async function handleConfirmSignUp() {
    const email = document.getElementById('signup-email')?.value;
    const code = document.getElementById('confirm-code')?.value;
    
    if (!email || !code) {
        updateStatus('Please enter confirmation code', 'error');
        return;
    }
    
    try {
        updateStatus('✅ Confirming account...', 'info');
        const result = await authService.confirmSignUp(email, code);
        
        if (result.success) {
            updateStatus('✅ Account confirmed! You can now sign in.', 'success');
            showForm('signin-form');
        } else {
            updateStatus(`❌ Confirmation failed: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Confirmation error:', error);
        updateStatus(`❌ Confirmation error: ${error.message}`, 'error');
    }
}

async function handleSignOut() {
    try {
        updateStatus('🔓 Signing out...', 'info');
        await authService.signOut();
        updateStatus('Signed out successfully', 'success');
        showDashboard(false);
        showForm('signin-form');
        
        // Clear user info and reset data
        const userInfoElement = document.getElementById('user-info');
        if (userInfoElement) {
            userInfoElement.textContent = '';
        }
        
        // Reset dashboard data
        uploadedDocuments = [];
        generatedPresentations = [];
        updateDocumentsList();
        
    } catch (error) {
        console.error('Sign out error:', error);
        updateStatus(`❌ Sign out error: ${error.message}`, 'error');
    }
}

// File preview status management
function updateFilePreviewStatus(status) {
    const previewItems = document.querySelectorAll('.file-preview-item .file-status');
    previewItems.forEach(statusElement => {
        updateFileStatusElement(statusElement, status);
    });
}

function updateIndividualFileStatus(fileIndex, status, message = '') {
    const previewItems = document.querySelectorAll('.file-preview-item');
    if (previewItems[fileIndex]) {
        const statusElement = previewItems[fileIndex].querySelector('.file-status');
        updateFileStatusElement(statusElement, status, message);
    }
}

function updateFileStatusElement(statusElement, status, message = '') {
    if (!statusElement) return;
    
    const statusConfig = {
        ready: {
            text: 'Ready',
            bg: 'rgba(59, 130, 246, 0.2)',
            color: '#60a5fa',
            border: 'rgba(59, 130, 246, 0.3)'
        },
        processing: {
            text: 'Processing...',
            bg: 'rgba(245, 158, 11, 0.2)',
            color: '#fbbf24',
            border: 'rgba(245, 158, 11, 0.3)'
        },
        success: {
            text: 'Complete',
            bg: 'rgba(16, 185, 129, 0.2)',
            color: '#34d399',
            border: 'rgba(16, 185, 129, 0.3)'
        },
        error: {
            text: 'Failed',
            bg: 'rgba(239, 68, 68, 0.2)',
            color: '#f87171',
            border: 'rgba(239, 68, 68, 0.3)'
        }
    };
    
    const config = statusConfig[status] || statusConfig.ready;
    
    statusElement.textContent = message || config.text;
    statusElement.style.background = config.bg;
    statusElement.style.color = config.color;
    statusElement.style.borderColor = config.border;
    
    // Add animation for status changes
    statusElement.style.transform = 'scale(0.9)';
    setTimeout(() => {
        statusElement.style.transition = 'all 0.2s ease';
        statusElement.style.transform = 'scale(1)';
    }, 100);
}

function clearFilePreview() {
    const previewContainer = document.getElementById('file-preview-container');
    if (previewContainer) {
        previewContainer.style.transition = 'all 0.3s ease';
        previewContainer.style.opacity = '0';
        previewContainer.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            previewContainer.style.display = 'none';
            previewContainer.innerHTML = '';
        }, 300);
    }
}





// Global functions for HTML onclick handlers
window.handleSignIn = handleSignIn;
window.handleSignUp = handleSignUp;
window.handleConfirmSignUp = handleConfirmSignUp;
window.handleSignOut = handleSignOut;
window.generateRAGPresentation = generateRAGPresentation;
window.exportPresentation = exportPresentation;
window.editPresentation = editPresentation;
window.deletePresentation = deletePresentation;
window.removeDocument = removeDocument;
window.showForm = showForm;

// Initialize the application
// Early session check to prevent login page flash on refresh
(async function earlySessionCheck() {
    try {
        // Quick check if user might be authenticated
        const authState = await authService.getCurrentAuthState();
        if (authState.isAuthenticated) {
            // Pre-hide auth container to prevent flash
            const authContainer = document.getElementById('auth-container');
            if (authContainer) {
                authContainer.style.display = 'none';
            }
            
            // Pre-show dashboard
            const dashboard = document.getElementById('dashboard');
            if (dashboard) {
                dashboard.classList.remove('hidden');
                dashboard.style.display = 'block';
            }
        }
    } catch (error) {
        // If early check fails, let the main initialization handle it
        console.log('Early session check failed, will retry in main initialization');
    }
})();

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 AI PPT Generator RAG Enhanced initializing...');
    updateStatus('🔄 Initializing application...', 'info');
    
    try {
        // Initialize dashboard metrics
        initializeDashboardMetrics();
        
        // Check if user is already authenticated (more thorough check)
        const authState = await authService.getCurrentAuthState();
        
        if (authState.isAuthenticated) {
            updateStatus('✅ Welcome back! You are already signed in.', 'success');
            const userInfoElement = document.getElementById('user-info');
            if (userInfoElement) {
                userInfoElement.textContent = `Logged in as: ${authState.user.email}`;
            }
            showDashboard(true);
            
            // Load user data after showing dashboard
            setTimeout(async () => {
                // Load documents
                await loadUserDocuments();
                
                // Load presentations
                await initializePresentations();
                
                // Auto-test advanced features (development)
                if (typeof window !== 'undefined') {
                    setTimeout(() => {
                        const testResults = testAdvancedFeatures();
                    }, 1000);
                }
            }, 500); // Small delay to ensure UI is ready
            
        } else {
            updateStatus('Ready to sign in', 'info');
            showForm('signin-form');
        }
    } catch (error) {
        console.error('Initialization error:', error);
        updateStatus('❌ Error initializing application. Please refresh the page.', 'error');
    }
});

console.log('AI PPT Generator RAG Enhanced main.js loaded successfully');

// Professional Dashboard Helper Functions







// Enhanced presentation generation with professional UI
async function generateRAGPresentation() {
    const promptInput = document.getElementById('prompt-input');
    const slideCountSelect = document.getElementById('slide-count-select');
    
    if (!promptInput || !promptInput.value.trim()) {
        updateStatus('Please enter a presentation topic', 'error');
        showErrorNotification('Please enter a presentation topic');
        return;
    }
    
    const topic = promptInput.value.trim();
    const slideCount = slideCountSelect ? parseInt(slideCountSelect.value) : 7; // Default to 7 if not found
    
    try {
        updateStatus(`🤖 Generating ${slideCount}-slide RAG-enhanced presentation with Bedrock...`, 'info');
        updateKnowledgeBaseSyncStatus('processing', `Generating ${slideCount}-slide presentation with Knowledge Base context`);
        
        // Show professional loading state
        showPresentationGenerationProgress(true);
        
        const authState = await authService.getCurrentAuthState();
        if (!authState.isAuthenticated) {
            updateStatus('Please sign in to generate presentations', 'error');
            showErrorNotification('Authentication required');
            return;
        }

        // Get document IDs for RAG context
        const documentIds = uploadedDocuments.map(doc => doc.id);
        
        // Call real Bedrock RAG API
        const query = `
            mutation GeneratePresentationWithRAG($prompt: String!, $title: String!, $documentIds: [String!], $slideCount: Int) {
                generatePresentationWithRAG(prompt: $prompt, title: $title, documentIds: $documentIds, slideCount: $slideCount) {
                    success
                    message
                    presentationId
                    title
                    slides
                    contextUsed
                    sources
                    relevantChunksCount
                    error
                }
            }
        `;

        const variables = {
            prompt: topic,
            title: "", // Let backend generate intelligent title
            documentIds: documentIds,
            slideCount: slideCount
        };

        const response = await fetch(config.graphqlEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authState.session.tokens.idToken.toString()}`
            },
            body: JSON.stringify({
                query: query,
                variables: variables
            })
        });

        const result = await response.json();

        if (result.errors) {
            throw new Error(result.errors[0].message);
        }

        const ragResult = result.data.generatePresentationWithRAG;
        
        // CRITICAL: Check waitingForDocuments FIRST before any other error handling
        if (ragResult && ragResult.waitingForDocuments) {
            updateStatus(`⏳ ${ragResult.message}`, 'info');
            updateKnowledgeBaseSyncStatus('processing', 'Documents are still being indexed in Knowledge Base');
            
            // Show retry option after a delay
            setTimeout(() => {
                // Remove any existing retry buttons first
                const existingRetryButtons = document.querySelectorAll('.retry-button');
                existingRetryButtons.forEach(btn => btn.remove());
                
                const retryButton = document.createElement('button');
                retryButton.textContent = '🔄 Retry Generation';
                retryButton.className = 'retry-button';
                retryButton.style.cssText = `
                    background: #3b82f6;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    margin-left: 10px;
                    font-size: 14px;
                    display: inline-block;
                `;
                retryButton.onclick = () => {
                    retryButton.remove();
                    generateRAGPresentation(); // Retry the generation
                };
                
                // Try multiple possible locations for the retry button
                const statusElement = document.querySelector('.status-message') || 
                                    document.querySelector('.status') || 
                                    document.querySelector('#status') ||
                                    document.querySelector('.presentation-controls');
                
                if (statusElement) {
                    statusElement.appendChild(retryButton);
                } else {
                    // Fallback: add to the main container
                    const mainContainer = document.querySelector('.main-content') || document.body;
                    const retryContainer = document.createElement('div');
                    retryContainer.style.cssText = 'text-align: center; margin: 20px 0;';
                    retryContainer.appendChild(retryButton);
                    mainContainer.appendChild(retryContainer);
                }
            }, 3000); // Show retry button after 3 seconds
            
            showNotification('Documents are still processing. A retry button will appear shortly.', 'info');
            showPresentationGenerationProgress(false);
            return;
        }
        
        // Check for other failure conditions AFTER checking waitingForDocuments
        if (!ragResult || !ragResult.success) {
            // Also check if the message indicates waiting (fallback check)
            if (ragResult && ragResult.message && ragResult.message.includes('still being processed')) {
                updateStatus(`⏳ ${ragResult.message}`, 'info');
                updateKnowledgeBaseSyncStatus('processing', 'Documents are still being indexed in Knowledge Base');
                
                // Show retry option after a delay
                setTimeout(() => {
                    // Remove any existing retry buttons first
                    const existingRetryButtons = document.querySelectorAll('.retry-button');
                    existingRetryButtons.forEach(btn => btn.remove());
                    
                    const retryButton = document.createElement('button');
                    retryButton.textContent = '🔄 Retry Generation';
                    retryButton.className = 'retry-button';
                    retryButton.style.cssText = `
                        background: #3b82f6;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 6px;
                        cursor: pointer;
                        margin-left: 10px;
                        font-size: 14px;
                        display: inline-block;
                    `;
                    retryButton.onclick = () => {
                        retryButton.remove();
                        generateRAGPresentation(); // Retry the generation
                    };
                    
                    // Try multiple possible locations for the retry button
                    const statusElement = document.querySelector('.status-message') || 
                                        document.querySelector('.status') || 
                                        document.querySelector('#status') ||
                                        document.querySelector('.presentation-controls');
                    
                    if (statusElement) {
                        statusElement.appendChild(retryButton);
                    } else {
                        // Fallback: add to the main container
                        const mainContainer = document.querySelector('.main-content') || document.body;
                        const retryContainer = document.createElement('div');
                        retryContainer.style.cssText = 'text-align: center; margin: 20px 0;';
                        retryContainer.appendChild(retryButton);
                        mainContainer.appendChild(retryContainer);
                    }
                }, 3000); // Show retry button after 3 seconds
                
                showNotification('Documents are still processing. A retry button will appear shortly.', 'info');
                showPresentationGenerationProgress(false);
                return;
            }
            
            throw new Error(ragResult?.message || 'Failed to generate presentation');
        }

        // Create presentation object from Bedrock response with full RAG context
        const presentation = {
            id: ragResult.presentationId || `pres_${Date.now()}`,
            title: ragResult.title,
            slideCount: ragResult.slides.length,
            generatedAt: new Date(),
            createdAt: new Date().toISOString(),
            
            // RAG context information
            contextUsed: ragResult.contextUsed,
            ragEnhanced: ragResult.contextUsed,
            relevantChunksCount: ragResult.relevantChunksCount || 0,
            sources: ragResult.sources || [],
            
            // Legacy fields for compatibility
            documentsUsed: ragResult.sources ? ragResult.sources.length : uploadedDocuments.length,
            processingTime: null, // Real processing time not available
            
            // Slides data
            slides: ragResult.slides.map((slideContent, index) => ({
                id: `slide_${index + 1}`,
                title: `Slide ${index + 1}`,
                content: slideContent,
                type: 'content'
            }))
        };
        
        addGeneratedPresentation(presentation);
        
        // Note: Backend already saves the presentation to DynamoDB, so no need to auto-save here
        
        const contextMessage = ragResult.contextUsed 
            ? `using context from ${ragResult.relevantChunksCount || 0} chunks across ${ragResult.sources ? ragResult.sources.length : 0} documents`
            : 'without document context (no documents found)';
            
        updateStatus(`✅ Bedrock RAG presentation generated successfully ${contextMessage}!`, 'success');
        updateKnowledgeBaseSyncStatus('ready', 'Presentation generated with Bedrock Nova Pro');
        showSuccessNotification(`Presentation "${ragResult.title}" generated with Bedrock RAG ${contextMessage}`);
        
        promptInput.value = '';
        showPresentationGenerationProgress(false);
        
    } catch (error) {
        console.error('RAG presentation generation error:', error);
        updateStatus(`❌ Failed to generate presentation: ${error.message}`, 'error');
        updateKnowledgeBaseSyncStatus('error', `Generation failed: ${error.message}`);
        showErrorNotification(`Failed to generate presentation: ${error.message}`);
        showPresentationGenerationProgress(false);
    }
}

// Show presentation generation progress
function showPresentationGenerationProgress(show) {
    const generateBtn = document.getElementById('generate-btn');
    if (!generateBtn) return;
    
    if (show) {
        generateBtn.disabled = true;
        generateBtn.innerHTML = `
            <span style="display: inline-flex; align-items: center; gap: 8px;">
                <span style="animation: spin 1s linear infinite;">⚡</span>
                Generating Presentation...
            </span>
        `;
        generateBtn.style.opacity = '0.7';
        generateBtn.style.cursor = 'not-allowed';
    } else {
        generateBtn.disabled = false;
        generateBtn.innerHTML = '🚀 Generate RAG-Enhanced Presentation';
        generateBtn.style.opacity = '1';
        generateBtn.style.cursor = 'pointer';
    }
}

// Enhanced presentation display with professional styling
function addGeneratedPresentation(presentation) {
    const presentationsList = document.getElementById('presentations-list');
    const presentationsContainer = document.getElementById('presentations-container');
    const welcomeMessage = document.getElementById('welcome-message');
    
    if (!presentationsList || !presentationsContainer) return;
    
    // Hide welcome message and show presentations list
    if (welcomeMessage) {
        welcomeMessage.style.display = 'none';
    }
    presentationsList.classList.remove('hidden');
    
    // Add to generated presentations array
    generatedPresentations.unshift(presentation);
    
    // Use the new updatePresentationsList function to render all presentations
    updatePresentationsList();
}

// Get real S3 Vectors count from AWS
async function getRealVectorsCount() {
    try {
        const authState = await authService.getCurrentAuthState();
        if (!authState.isAuthenticated) {
            return 0;
        }
        
        // Call backend to get S3 Vectors statistics
        const query = `
            query GetS3VectorsStats {
                getS3VectorsStats {
                    totalVectors
                    totalDocuments
                    vectorBucketName
                    indexName
                    knowledgeBaseId
                }
            }
        `;
        
        const response = await fetch(config.graphqlEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authState.session.tokens.idToken.toString()}`
            },
            body: JSON.stringify({ query })
        });
        
        const result = await response.json();
        
        if (result.errors) {
            console.warn('S3 Vectors stats query failed:', result.errors);
            return 0;
        }
        
        return result.data?.getS3VectorsStats?.totalVectors || 0;
        
    } catch (error) {
        console.warn('Failed to get S3 Vectors count:', error);
        return 0;
    }
}

// Get Knowledge Base information
async function getKnowledgeBaseInfo() {
    try {
        const authState = await authService.getCurrentAuthState();
        if (!authState.isAuthenticated) {
            return { count: 0, id: null };
        }
        
        // Call backend to get user's Knowledge Base info
        const query = `
            query GetUserKnowledgeBase {
                getUserKnowledgeBase {
                    knowledgeBaseId
                    dataSourceId
                    vectorBucketName
                    status
                    documentCount
                }
            }
        `;
        
        const response = await fetch(config.graphqlEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authState.session.tokens.idToken.toString()}`
            },
            body: JSON.stringify({ query })
        });
        
        const result = await response.json();
        
        if (result.errors) {
            console.warn('Knowledge Base info query failed:', result.errors);
            return { count: 0, id: null };
        }
        
        const kbInfo = result.data?.getUserKnowledgeBase;
        return {
            count: kbInfo ? 1 : 0,
            id: kbInfo?.knowledgeBaseId || null,
            status: kbInfo?.status || 'none'
        };
        
    } catch (error) {
        console.warn('Failed to get Knowledge Base info:', error);
        return { count: 0, id: null };
    }
}

// Make functions globally accessible
window.getRealVectorsCount = getRealVectorsCount;
window.getKnowledgeBaseInfo = getKnowledgeBaseInfo;