// AI PPT Generator - Professional UI Implementation
import './design-system.css';
import './advanced-architecture.css';
import './amplify-config.js';
import { AuthService } from './auth.js';
import config from './config.js';

// Initialize auth service
const authService = new AuthService();

// Global variables
let currentUser = null;
let uploadedDocuments = [];
let generatedPresentations = [];

// Professional notification system
class NotificationSystem {
    constructor() {
        this.container = this.createContainer();
        this.notifications = new Map();
    }

    createContainer() {
        const container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
        return container;
    }

    show(message, type = 'info', duration = 5000) {
        const id = Date.now().toString();
        const notification = this.createNotification(id, message, type);
        
        this.container.appendChild(notification);
        this.notifications.set(id, notification);

        // Auto-dismiss
        if (duration > 0) {
            setTimeout(() => this.dismiss(id), duration);
        }

        return id;
    }

    createNotification(id, message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-header">
                <div class="notification-title">${this.getTypeTitle(type)}</div>
                <button class="notification-close" onclick="window.notificationSystem.dismiss('${id}')">&times;</button>
            </div>
            <div class="notification-message">${message}</div>
        `;
        return notification;
    }

    getTypeTitle(type) {
        const titles = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Information'
        };
        return titles[type] || 'Notification';
    }

    dismiss(id) {
        const notification = this.notifications.get(id);
        if (notification) {
            notification.style.animation = 'slideOutRight 300ms ease-in-out forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                this.notifications.delete(id);
            }, 300);
        }
    }
}

// Initialize notification system
const notificationSystem = new NotificationSystem();

// Professional status management
function updateStatus(message, type = 'info') {
    // Show notification
    notificationSystem.show(message, type);
    
    // Update status elements
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

// Professional form management
function showForm(formId) {
    const forms = ['signin-form', 'signup-form', 'confirm-form'];
    forms.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.add('hidden');
            element.style.animation = 'fadeOut 300ms ease-in-out';
        }
    });
    
    setTimeout(() => {
        const targetForm = document.getElementById(formId);
        if (targetForm) {
            targetForm.classList.remove('hidden');
            targetForm.style.animation = 'fadeIn 300ms ease-in-out';
        }
    }, 150);
}

// Professional dashboard management
function showDashboard() {
    const authContainer = document.getElementById('auth-container');
    const dashboard = document.getElementById('dashboard');
    
    if (authContainer) {
        authContainer.style.animation = 'fadeOut 300ms ease-in-out';
        setTimeout(() => {
            authContainer.classList.add('hidden');
        }, 300);
    }
    
    if (dashboard) {
        setTimeout(() => {
            dashboard.classList.remove('hidden');
            dashboard.style.animation = 'fadeIn 500ms ease-in-out';
            
            // Initialize dashboard components
            initializeDashboard();
        }, 350);
    }
}

function showAuthForms() {
    const authContainer = document.getElementById('auth-container');
    const dashboard = document.getElementById('dashboard');
    
    if (dashboard) {
        dashboard.style.animation = 'fadeOut 300ms ease-in-out';
        setTimeout(() => {
            dashboard.classList.add('hidden');
        }, 300);
    }
    
    if (authContainer) {
        setTimeout(() => {
            authContainer.classList.remove('hidden');
            authContainer.style.animation = 'fadeIn 500ms ease-in-out';
        }, 350);
    }
}

// Initialize dashboard with professional enhancements
function initializeDashboard() {
    // Load documents and presentations
    loadDocuments();
    loadPresentations();
    
    // Initialize upload area
    initializeUploadArea();
    
    // Initialize status monitoring
    initializeStatusMonitoring();
    
    // Apply entrance animations
    applyEntranceAnimations();
}

// Professional upload area initialization
function initializeUploadArea() {
    const uploadArea = document.getElementById('upload-area');
    if (!uploadArea) return;

    // Add professional styling
    uploadArea.className = 'professional-upload-area';
    
    // Enhanced drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        if (!uploadArea.contains(e.relatedTarget)) {
            uploadArea.classList.remove('drag-over');
        }
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileUpload(files);
        }
    });
    
    // Click to upload
    uploadArea.addEventListener('click', () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.multiple = true;
        fileInput.accept = '.pdf,.doc,.docx,.txt';
        fileInput.onchange = (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                handleFileUpload(files);
            }
        };
        fileInput.click();
    });
}

// Professional file upload handling
async function handleFileUpload(files) {
    console.log('=== UPLOAD FUNCTION CALLED ===');
    console.log('Files received:', files.length);
    console.log('Files details:', Array.from(files).map(f => ({
        name: f.name,
        size: f.size,
        type: f.type
    })));
    
    const validFiles = files.filter(file => {
        const validTypes = ['application/pdf', 'application/msword', 
                           'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
                           'text/plain'];
        return validTypes.includes(file.type) && file.size <= 50 * 1024 * 1024; // 50MB limit
    });

    console.log('Valid files after filtering:', validFiles.length);

    if (validFiles.length === 0) {
        updateStatus('Please select valid files (PDF, DOC, DOCX, TXT) under 50MB', 'error');
        return;
    }

    // Show upload progress
    showUploadProgress(validFiles);

    for (const file of validFiles) {
        try {
            await uploadSingleFile(file);
        } catch (error) {
            console.error('Upload failed:', error);
            updateStatus(`Failed to upload ${file.name}: ${error.message}`, 'error');
        }
    }
}

// Professional upload progress display
function showUploadProgress(files) {
    const progressContainer = document.createElement('div');
    progressContainer.className = 'upload-progress-container';
    progressContainer.innerHTML = `
        <div class="glass-card" style="margin: 20px 0; padding: 20px;">
            <h3 class="text-lg font-semibold" style="color: white; margin-bottom: 16px;">
                Uploading ${files.length} file${files.length > 1 ? 's' : ''}...
            </h3>
            <div id="upload-progress-list"></div>
        </div>
    `;
    
    const uploadArea = document.getElementById('upload-area');
    if (uploadArea && uploadArea.parentNode) {
        uploadArea.parentNode.insertBefore(progressContainer, uploadArea.nextSibling);
    }
}

// Upload single file with progress
async function uploadSingleFile(file) {
    const progressItem = document.createElement('div');
    progressItem.className = 'upload-progress-item';
    progressItem.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="color: white; font-size: 14px;">${file.name}</span>
            <span class="upload-status" style="color: rgba(255,255,255,0.7); font-size: 12px;">Uploading...</span>
        </div>
        <div class="progress-container">
            <div class="progress-bar" style="width: 0%"></div>
        </div>
    `;
    
    const progressList = document.getElementById('upload-progress-list');
    if (progressList) {
        progressList.appendChild(progressItem);
    }

    try {
        // Convert file to base64
        const base64Content = await fileToBase64(file);
        
        // Update progress
        const progressBar = progressItem.querySelector('.progress-bar');
        const statusSpan = progressItem.querySelector('.upload-status');
        
        progressBar.style.width = '50%';
        statusSpan.textContent = 'Processing...';

        console.log('Uploading document for user:', currentUser?.userId);
        console.log('File details:', { name: file.name, size: file.size, type: file.type });
        
        // Upload to backend
        const response = await fetch(config.graphqlEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await authService.getAccessToken()}`
            },
            body: JSON.stringify({
                query: `
                    mutation UploadDocument($filename: String!, $fileContent: String!) {
                        uploadDocument(filename: $filename, fileContent: $fileContent) {
                            success
                            message
                            documentId
                            chunkCount
                            textLength
                        }
                    }
                `,
                variables: {
                    filename: file.name,
                    fileContent: base64Content
                }
            })
        });

        const result = await response.json();
        console.log('Upload response:', result);
        
        if (result.data?.uploadDocument?.success) {
            progressBar.style.width = '100%';
            statusSpan.textContent = 'Complete';
            statusSpan.style.color = '#48bb78';
            
            // Add to uploaded documents
            uploadedDocuments.push({
                id: result.data.uploadDocument.documentId,
                filename: file.name,
                uploadDate: new Date().toISOString(),
                status: 'processing'
            });
            
            updateStatus(`Successfully uploaded ${file.name}`, 'success');
            
            // Clear upload progress after 2 seconds
            setTimeout(() => {
                const progressContainer = document.querySelector('.upload-progress-container');
                if (progressContainer) {
                    progressContainer.remove();
                }
            }, 2000);
            
            // Refresh documents list
            setTimeout(() => {
                loadDocuments();
            }, 1000);
            
        } else {
            throw new Error(result.data?.uploadDocument?.message || 'Upload failed');
        }
        
    } catch (error) {
        const progressBar = progressItem.querySelector('.progress-bar');
        const statusSpan = progressItem.querySelector('.upload-status');
        
        progressBar.style.background = 'var(--error-gradient)';
        statusSpan.textContent = 'Failed';
        statusSpan.style.color = '#f56565';
        
        throw error;
    }
}

// Utility function to convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    console.log('AI PPT Generator starting...');
    
    try {
        // Check if user is already authenticated
        try {
            currentUser = await authService.getCurrentUser();
            // AWS Cognito user ID is in the username field or we need to get it from the token
            currentUser.userId = currentUser.username || currentUser.userId;
            console.log('User already authenticated:', currentUser?.username);
        } catch (error) {
            console.log('No authenticated user found');
            currentUser = null;
        }
        
        // Initialize UI
        initializeUI();
        
        // Apply professional enhancements
        setTimeout(applyProfessionalEnhancements, 500);
        
        console.log('AI PPT Generator initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize AI PPT Generator:', error);
        updateStatus('Failed to initialize application. Please refresh the page.', 'error');
    }
});

function initializeUI() {
    if (currentUser) {
        showDashboard();
    } else {
        showAuthForms();
    }
}

// Apply professional enhancements
function applyProfessionalEnhancements() {
    // Add professional classes to existing elements
    const buttons = document.querySelectorAll('button:not(.notification-close):not(.modal-close)');
    buttons.forEach(button => {
        if (!button.className.includes('btn-')) {
            button.className += ' glass-button';
        }
    });
    
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], textarea');
    inputs.forEach(input => {
        input.className += ' professional-input';
    });
    
    // Apply entrance animations
    applyEntranceAnimations();
}

// Apply entrance animations with staggered timing
function applyEntranceAnimations() {
    const animatedElements = document.querySelectorAll('.glass-card, .status-card, .professional-upload-area');
    animatedElements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            element.style.transition = 'all 500ms cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Professional status monitoring
function initializeStatusMonitoring() {
    updateSystemStatus();
    
    // Auto-refresh every 30 seconds
    setInterval(updateSystemStatus, 30000);
}

async function updateSystemStatus() {
    try {
        // Update counts based on loaded data
        updateStatusCards();
        
        // Also fetch S3 vectors stats if available
        const response = await fetch(config.graphqlEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await authService.getAccessToken()}`
            },
            body: JSON.stringify({
                query: `
                    query GetSystemStatus {
                        getUserKnowledgeBase {
                            knowledgeBaseId
                            status
                        }
                        getS3VectorsStats {
                            totalVectors
                            totalDocuments
                            lastUpdated
                        }
                    }
                `
            })
        });

        const result = await response.json();
        
        if (result.data) {
            updateStatusCardsWithServerData(result.data);
        }
        
    } catch (error) {
        console.error('Failed to update system status:', error);
    }
}

function updateStatusCards() {
    const documentsCard = document.getElementById('documents-count');
    const vectorsCard = document.getElementById('vectors-count');
    const kbCard = document.getElementById('kb-status');
    
    // Use actual loaded data counts
    if (documentsCard) {
        documentsCard.textContent = uploadedDocuments.length.toString();
    }
    
    if (vectorsCard) {
        // Calculate total chunks from all documents
        const totalChunks = uploadedDocuments.reduce((sum, doc) => sum + (doc.chunkCount || 0), 0);
        vectorsCard.textContent = totalChunks.toString();
    }
    
    if (kbCard) {
        kbCard.textContent = uploadedDocuments.length > 0 ? 'Active' : 'Ready';
    }
}

function updateStatusCardsWithServerData(data) {
    const vectorsCard = document.getElementById('vectors-count');
    const kbCard = document.getElementById('kb-status');
    
    // Override with server data if available
    if (vectorsCard && data.getS3VectorsStats) {
        vectorsCard.textContent = data.getS3VectorsStats.totalVectors || vectorsCard.textContent;
    }
    
    if (kbCard && data.getUserKnowledgeBase) {
        kbCard.textContent = data.getUserKnowledgeBase.status || kbCard.textContent;
    }
    
    if (kbCard && data.getUserKnowledgeBase) {
        const status = data.getUserKnowledgeBase.status || 'Not Created';
        kbCard.textContent = status;
        kbCard.className = `status-indicator ${status.toLowerCase().replace(' ', '-')}`;
    }
}

// Professional document loading
async function loadDocuments() {
    try {
        console.log('Loading documents for user:', currentUser?.userId);
        const response = await fetch(config.graphqlEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await authService.getAccessToken()}`
            },
            body: JSON.stringify({
                query: `
                    query GetUserDocuments {
                        getUserDocuments {
                            id
                            filename
                            uploadDate
                            syncStatus
                            status
                            chunkCount
                            textLength
                            fileSize
                            contentType
                            lastModified
                        }
                    }
                `
            })
        });

        console.log('Documents API response status:', response.status);
        const result = await response.json();
        console.log('Documents API response:', result);
        
        if (result.data?.getUserDocuments) {
            uploadedDocuments = result.data.getUserDocuments;
            console.log('Loaded documents:', uploadedDocuments.length);
            console.log('Document status values:', uploadedDocuments.map(doc => ({
                filename: doc.filename,
                status: doc.status,
                syncStatus: doc.syncStatus,
                id: doc.id
            })));
            renderDocumentsList();
            updateStatusCards(); // Update status cards with real counts
            
            // Check for processing documents and poll their status
            const processingDocs = uploadedDocuments.filter(doc => {
                const status = (doc.syncStatus || doc.status || '').toLowerCase();
                const isProcessing = status === 'syncing' || 
                       status === 'processing' || 
                       status === 'indexing' ||
                       status === 'pending' ||
                       status === '' ||
                       (!status && (doc.chunkCount === 0 || doc.chunkCount === null)); // New uploads with no chunks yet
                
                console.log('Document processing check:', {
                    filename: doc.filename,
                    status: doc.status,
                    syncStatus: doc.syncStatus,
                    chunkCount: doc.chunkCount,
                    isProcessing: isProcessing
                });
                
                return isProcessing;
            });
            
            if (processingDocs.length > 0) {
                console.log('Found processing documents, will poll status in 5 seconds:', processingDocs.map(d => d.filename));
                // More frequent polling - every 5 seconds for processing documents
                setTimeout(() => {
                    console.log('Polling document status...');
                    loadDocuments(); // Reload to check status updates
                }, 5000);
            } else {
                console.log('✅ ALL DOCUMENTS PROCESSED - STOPPING POLLING');
                // STOP POLLING - all documents are processed
            }
        } else {
            console.error('Documents API error:', result.errors);
            updateStatus('Failed to load documents', 'error');
        }
        
    } catch (error) {
        console.error('Failed to load documents:', error);
        updateStatus('Failed to load documents', 'error');
    }
}

// Dropdown toggle function for export options
function toggleExportDropdown(presentationId) {
    const dropdown = document.getElementById(`export-dropdown-${presentationId}`);
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(event) {
    if (!event.target.matches('.dropdown-toggle')) {
        const dropdowns = document.getElementsByClassName('dropdown-menu');
        for (let dropdown of dropdowns) {
            dropdown.style.display = 'none';
        }
    }
});

function renderDocumentsList() {
    const container = document.getElementById('documents-list');
    if (!container) return;

    if (uploadedDocuments.length === 0) {
        container.innerHTML = `
            <div class="glass-card" style="padding: 40px; text-align: center;">
                <div style="color: rgba(255,255,255,0.7); font-size: 16px;">
                    No documents uploaded yet. Upload your first document to get started!
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = uploadedDocuments.map(doc => `
        <div class="glass-card document-card" style="padding: 20px; margin-bottom: 16px; border-radius: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1;">
                    <h3 style="color: white; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">
                        📄 ${doc.filename}
                    </h3>
                    <div style="color: rgba(255,255,255,0.7); font-size: 14px; margin-bottom: 4px;">
                        📅 Uploaded: ${new Date(doc.uploadDate).toLocaleDateString()} ${new Date(doc.uploadDate).toLocaleTimeString()}
                    </div>
                    <div style="color: rgba(255,255,255,0.7); font-size: 14px; margin-bottom: 4px;">
                        📊 Size: ${formatFileSize(doc.fileSize || 0)} • Chunks: ${doc.chunkCount || 0}
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="color: #4ade80; font-size: 14px; font-weight: 500;">
                        ${getDocumentStatus(doc.status, doc.syncStatus)}
                    </span>
                    <button class="btn-secondary" onclick="deleteDocument('${doc.id}')" 
                            style="padding: 8px 12px; font-size: 14px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        </div>
        </div>
    `).join('');
}

// Professional presentation loading
async function loadPresentations() {
    try {
        console.log('Loading presentations for user:', currentUser?.userId);
        const response = await fetch(config.graphqlEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await authService.getAccessToken()}`
            },
            body: JSON.stringify({
                query: `
                    query ListPresentations {
                        listPresentations {
                            id
                            title
                            description
                            content
                            contextUsed
                            sources
                            relevantChunksCount
                            createdAt
                            updatedAt
                            status
                        }
                    }
                `
            })
        });

        console.log('Presentations API response status:', response.status);
        const result = await response.json();
        console.log('Presentations API response:', result);
        
        if (result.data?.listPresentations) {
            // Clean and simple - use only content field
            generatedPresentations = result.data.listPresentations.map(presentation => {
                // Use content field directly - should already be an array from GraphQL
                let contentData = presentation.content || [];
                
                if (!Array.isArray(contentData)) {
                    console.warn(`Presentation "${presentation.title}" content is not an array, converting:`, typeof contentData);
                    // Fallback parsing if needed
                    if (typeof contentData === 'string') {
                        try {
                            contentData = JSON.parse(contentData);
                        } catch (e) {
                            contentData = contentData.split('---').filter(slide => slide.trim());
                        }
                    }
                    if (!Array.isArray(contentData)) {
                        contentData = [];
                    }
                }
                
                // Set clean content field
                presentation.content = contentData;
                return presentation;
            });
            
            console.log('Loaded presentations:', generatedPresentations.length);
            renderPresentationsList();
        }
        
    } catch (error) {
        console.error('Failed to load presentations:', error);
        updateStatus('Failed to load presentations', 'error');
    }
}

function renderPresentationsList() {
    const container = document.getElementById('presentations-list');
    if (!container) return;

    if (generatedPresentations.length === 0) {
        container.innerHTML = `
            <div class="glass-card" style="padding: 40px; text-align: center;">
                <div style="color: rgba(255,255,255,0.7); font-size: 16px;">
                    No presentations generated yet. Create your first presentation!
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = generatedPresentations.map(presentation => {
        // Fixed slide parsing logic for card display
        let slideCount = 0;
        if (presentation.content) {
            if (Array.isArray(presentation.content)) {
                // Backend returns array - each element is a complete slide
                const allSlides = presentation.content
                    .map(slide => {
                        // Don't split on ### - these are markdown headers within slides
                        return slide;
                    })
                    .flat()
                    .filter(slide => {
                        if (!slide || typeof slide !== 'string') return false;
                        const trimmed = slide.trim();
                        if (trimmed.length === 0) return false;
                        
                        // Enhanced filtering for summary content
                        const lower = trimmed.toLowerCase();
                        
                        // Filter out summary statements
                        if (lower.startsWith('this presentation provides') || 
                            lower.startsWith('the presentation provides') ||
                            lower.startsWith('this presentation covers') ||
                            lower.startsWith('this presentation offers') ||
                            lower.includes('provides a thorough overview') ||
                            lower.includes('provides a detailed overview') ||
                            lower.includes('provides a comprehensive') ||
                            lower.includes('provides a clear') ||
                            lower.includes('step-by-step guide') ||
                            lower.includes('covering its history') ||
                            lower.includes('covering the history') ||
                            // Check if it's just a summary without actual slide content
                            (trimmed.length < 200 && !trimmed.includes('- **') && !trimmed.includes('##'))) {
                            return false;
                        }
                        
                        return true;
                    });
                slideCount = allSlides.length;
            } else {
                // String format
                const slides = presentation.content
                    .split(/---+|\n\s*slide\s+\d+\s*:?\s*\n/i)
                    .map(slide => slide.trim())
                    .filter(slide => slide.length > 0);
                slideCount = slides.length;
            }
            
            console.log('Card display parsing:', {
                title: presentation.title,
                rawContentType: typeof presentation.content,
                isArray: Array.isArray(presentation.content),
                parsedSlideCount: slideCount
            });
        }
        
        return `
        <div class="glass-card presentation-card" style="padding: 24px; margin-bottom: 20px; border-radius: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                <div style="flex: 1;">
                    <h3 style="color: white; font-size: 18px; font-weight: 600; margin: 0 0 8px 0; line-height: 1.3;">
                        ${presentation.title || 'Untitled Presentation'}
                    </h3>
                    <div style="color: rgba(255,255,255,0.7); font-size: 14px; margin-bottom: 4px;">
                        📅 Created: ${new Date(presentation.createdAt).toLocaleDateString()} ${new Date(presentation.createdAt).toLocaleTimeString()}
                    </div>
                    <div style="color: rgba(255,255,255,0.7); font-size: 14px; margin-bottom: 4px;">
                        📊 ${slideCount} slides • ${presentation.relevantChunksCount || 0} context chunks
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button class="btn-secondary" onclick="deletePresentation('${presentation.id}')" 
                            style="padding: 6px 8px; font-size: 12px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);">
                        🗑️
                    </button>
                </div>
            </div>
            
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
                <button class="btn-primary" onclick="viewPresentation('${presentation.id}')" 
                        style="padding: 8px 12px; font-size: 13px; font-weight: 500;">
                    👁️ Preview
                </button>
                <button class="btn-secondary" onclick="editSlides('${presentation.id}')" 
                        style="padding: 8px 12px; font-size: 13px;">
                    ✏️ Edit Slides
                </button>
            </div>
            
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <button class="btn-secondary" onclick="exportPresentation('${presentation.id}', 'html')" 
                        style="padding: 6px 10px; font-size: 12px; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3);">
                    📄 HTML
                </button>
                <button class="btn-secondary" onclick="exportPresentation('${presentation.id}', 'reveal')" 
                        style="padding: 6px 10px; font-size: 12px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3);">
                    🎯 Reveal.js
                </button>
                <button class="btn-secondary" onclick="exportPresentation('${presentation.id}', 'marp')" 
                        style="padding: 6px 10px; font-size: 12px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3);">
                    📊 Marp
                </button>
                <button class="btn-secondary" onclick="exportPresentation('${presentation.id}', 'pdf')" 
                        style="padding: 6px 10px; font-size: 12px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3);">
                    📑 PDF
                </button>
            </div>
        </div>
        `;
    }).join('');
}

// Helper functions for document display
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getDocumentStatus(status, syncStatus) {
    // Log the actual status values for debugging
    console.log('Document status check:', { status, syncStatus });
    
    // FIXED LOGIC: If syncStatus is "completed", show as Processed regardless of chunkCount
    if (syncStatus) {
        const sync = syncStatus.toLowerCase();
        if (sync === 'completed') {
            return '✅ Processed';
        }
        if (sync === 'available' || sync === 'ready' || sync === 'active') {
            return '✅ Processed';
        }
        if (sync === 'syncing' || sync === 'processing' || sync === 'indexing' || sync === 'pending') {
            return '⏳ Processing';
        }
        if (sync === 'failed' || sync === 'error') {
            return '❌ Failed';
        }
    }
    
    // Check status field (from document processor)
    if (status) {
        const stat = status.toLowerCase();
        if (stat === 'completed') {
            return '✅ Processed';
        }
        if (stat === 'processed' || stat === 'active' || stat === 'available' || stat === 'ready') {
            return '✅ Processed';
        }
        if (stat === 'processing' || stat === 'syncing' || stat === 'indexing' || stat === 'pending') {
            return '⏳ Processing';
        }
        if (stat === 'failed' || stat === 'error') {
            return '❌ Failed';
        }
    }
    
    // Default to processing for unclear status
    return '⏳ Processing';
}

// Authentication functions
async function handleSignIn(event) {
    event.preventDefault();
    
    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;
    
    if (!email || !password) {
        updateStatus('Please fill in all fields', 'error');
        return;
    }
    
    try {
        updateStatus('Signing in...', 'info');
        
        const result = await authService.signIn(email, password);
        
        if (result.success) {
            currentUser = await authService.getCurrentUser();
            // AWS Cognito user ID is in the username field or we need to get it from the token
            currentUser.userId = currentUser.username || currentUser.userId;
            console.log('Current user:', currentUser);
            console.log('User ID for API calls:', currentUser.userId);
            updateStatus('Successfully signed in!', 'success');
            showDashboard();
        } else {
            updateStatus(result.error || 'Sign in failed', 'error');
        }
        
    } catch (error) {
        console.error('Sign in error:', error);
        updateStatus('Sign in failed. Please try again.', 'error');
    }
}

async function handleSignUp(event) {
    event.preventDefault();
    
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    
    if (!email || !password || !confirmPassword) {
        updateStatus('Please fill in all fields', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        updateStatus('Passwords do not match', 'error');
        return;
    }
    
    try {
        updateStatus('Creating account...', 'info');
        
        const result = await authService.signUp(email, password);
        
        if (result.success) {
            updateStatus('Account created! Please check your email for verification code.', 'success');
            showForm('confirm-form');
            document.getElementById('confirm-email').value = email;
        } else {
            updateStatus(result.error || 'Sign up failed', 'error');
        }
        
    } catch (error) {
        console.error('Sign up error:', error);
        updateStatus('Sign up failed. Please try again.', 'error');
    }
}

async function handleConfirmSignUp(event) {
    event.preventDefault();
    
    const email = document.getElementById('confirm-email').value;
    const code = document.getElementById('confirm-code').value;
    
    if (!email || !code) {
        updateStatus('Please fill in all fields', 'error');
        return;
    }
    
    try {
        updateStatus('Confirming account...', 'info');
        
        const result = await authService.confirmSignUp(email, code);
        
        if (result.success) {
            updateStatus('Account confirmed! You can now sign in.', 'success');
            showForm('signin-form');
        } else {
            updateStatus(result.error || 'Confirmation failed', 'error');
        }
        
    } catch (error) {
        console.error('Confirmation error:', error);
        updateStatus('Confirmation failed. Please try again.', 'error');
    }
}

async function handleSignOut() {
    try {
        await authService.signOut();
        currentUser = null;
        updateStatus('Successfully signed out', 'success');
        showAuthForms();
    } catch (error) {
        console.error('Sign out error:', error);
        updateStatus('Sign out failed', 'error');
    }
}

// Presentation generation
async function generatePresentation() {
    const topic = document.getElementById('presentation-topic').value;
    const slideCountElement = document.getElementById('slide-count');
    const slideCount = slideCountElement ? slideCountElement.value : 7;
    
    console.log('=== GENERATE PRESENTATION CALLED ===');
    console.log('Topic:', topic);
    console.log('Slide count element:', slideCountElement);
    console.log('Slide count value:', slideCount);
    console.log('Slide count type:', typeof slideCount);
    
    if (!topic) {
        updateStatus('Please enter a presentation topic', 'error');
        return;
    }
    
    if (uploadedDocuments.length === 0) {
        updateStatus('Please upload documents first', 'error');
        return;
    }
    
    // Check if we have ANY ready documents for generation (don't wait for ALL)
    console.log('=== GENERATION READINESS CHECK ===');
    console.log('Total uploaded documents:', uploadedDocuments.length);
    
    const readyDocuments = uploadedDocuments.filter(doc => {
        const status = (doc.syncStatus || doc.status || '').toLowerCase();
        
        // Document is ready if syncStatus/status is completed
        const isReady = status === 'completed' || 
                       status === 'available' || 
                       status === 'ready' || 
                       status === 'active' ||
                       (doc.chunkCount > 0);
        
        console.log('Document readiness check:', {
            filename: doc.filename,
            status: doc.status,
            syncStatus: doc.syncStatus,
            chunkCount: doc.chunkCount,
            isReady: isReady
        });
        
        return isReady; // Return documents that ARE ready
    });
    
    console.log('Ready documents found:', readyDocuments.length);
    
    if (readyDocuments.length === 0) {
        updateStatus('No processed documents available for generation. Please wait for documents to complete processing.', 'error');
        return;
    }
    
    // Proceed with generation using ready documents
    console.log('=== PROCEEDING WITH GENERATION USING READY DOCUMENTS ===');
    
    try {
        console.log('=== STARTING PRESENTATION GENERATION API CALL ===');
        updateStatus('Generating presentation...', 'info');
        
        // Use the ready documents we already found above
        console.log('Using ready documents for generation:', readyDocuments.length);
        console.log('Ready documents details:', readyDocuments.map(d => ({
            id: d.id,
            filename: d.filename,
            status: d.status,
            syncStatus: d.syncStatus,
            chunkCount: d.chunkCount
        })));
        
        const documentIds = readyDocuments.map(doc => doc.id);
        console.log('Document IDs for API call:', documentIds);
        
        console.log('Making GraphQL API call with:', {
            prompt: topic,
            title: topic,
            documentIds: documentIds,
            slideCount: parseInt(slideCount),
            slideCountOriginal: slideCount,
            slideCountType: typeof parseInt(slideCount),
            slideCountDropdownElement: document.getElementById('slide-count'),
            slideCountDropdownValue: document.getElementById('slide-count')?.value,
            slideCountDropdownSelectedIndex: document.getElementById('slide-count')?.selectedIndex
        });
        
        const response = await fetch(config.graphqlEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await authService.getAccessToken()}`
            },
            body: JSON.stringify({
                query: `
                    mutation GeneratePresentationWithRAG($prompt: String!, $title: String!, $documentIds: [String!]!, $slideCount: Int) {
                        generatePresentationWithRAG(prompt: $prompt, title: $title, documentIds: $documentIds, slideCount: $slideCount) {
                            success
                            message
                            presentationId
                            title
                            content
                            relevantChunksCount
                        }
                    }
                `,
                variables: {
                    prompt: topic,
                    title: topic,
                    documentIds: documentIds,
                    slideCount: parseInt(slideCount) // Ensure it's integer
                }
            })
        });

        const result = await response.json();
        console.log('Generate presentation response:', result);
        
        if (result.data?.generatePresentationWithRAG?.success) {
            updateStatus('Presentation generated successfully!', 'success');
            
            // Clear form
            document.getElementById('presentation-topic').value = '';
            
            // Refresh presentations list
            setTimeout(() => {
                loadPresentations();
            }, 1000);
            
        } else {
            const errorMessage = result.data?.generatePresentationWithRAG?.message || 
                               result.errors?.[0]?.message || 
                               'Generation failed';
            throw new Error(errorMessage);
        }
        
    } catch (error) {
        console.error('Generation error:', error);
        updateStatus('Failed to generate presentation: ' + error.message, 'error');
    }
}

// Document deletion
async function deleteDocument(documentId) {
    if (!confirm('Are you sure you want to delete this document?')) {
        return;
    }
    
    try {
        updateStatus('Deleting document...', 'info');
        
        const response = await fetch(config.graphqlEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await authService.getAccessToken()}`
            },
            body: JSON.stringify({
                query: `
                    mutation DeleteDocument($documentId: ID!) {
                        deleteDocument(documentId: $documentId)
                    }
                `,
                variables: {
                    documentId: documentId
                }
            })
        });

        const result = await response.json();
        
        if (result.data?.deleteDocument) {
            updateStatus('Document deleted successfully', 'success');
            loadDocuments();
        } else {
            updateStatus(result.errors?.[0]?.message || 'Deletion failed', 'error');
        }
        
    } catch (error) {
        console.error('Deletion error:', error);
        updateStatus('Failed to delete document', 'error');
    }
}

// Presentation deletion
async function deletePresentation(presentationId) {
    if (!confirm('Are you sure you want to delete this presentation?')) {
        return;
    }
    
    try {
        updateStatus('Deleting presentation...', 'info');
        
        const response = await fetch(config.graphqlEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await authService.getAccessToken()}`
            },
            body: JSON.stringify({
                query: `
                    mutation DeletePresentation($id: ID!) {
                        deletePresentation(id: $id)
                    }
                `,
                variables: {
                    id: presentationId
                }
            })
        });

        const result = await response.json();
        
        if (result.data?.deletePresentation) {
            updateStatus('Presentation deleted successfully', 'success');
            loadPresentations();
        } else {
            updateStatus(result.errors?.[0]?.message || 'Deletion failed', 'error');
        }
        
    } catch (error) {
        console.error('Deletion error:', error);
        updateStatus('Failed to delete presentation', 'error');
    }
}

// Edit slides function - professional modal with full editing capabilities
function editSlides(presentationId) {
    console.log('=== EDIT SLIDES CALLED ===');
    console.log('Received presentationId:', presentationId);
    console.log('Type:', typeof presentationId);
    console.log('Available presentations:', generatedPresentations.map(p => ({id: p.id, title: p.title})));
    
    const presentation = generatedPresentations.find(p => p.id === presentationId);
    
    if (!presentation) {
        console.error('Presentation not found for ID:', presentationId);
        updateStatus('Presentation not found', 'error');
        return;
    }
    
    if (!presentation.id) {
        console.error('Presentation found but has no ID:', presentation);
        updateStatus('Error: Presentation has no ID', 'error');
        return;
    }
    
    console.log('Found presentation:', {
        id: presentation.id,
        title: presentation.title,
        hasContent: !!presentation.content
    });
    
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    
    // Fixed slide parsing logic - handle backend array format properly
    let slides = [];
    if (presentation.content) {
        console.log('Edit modal - Raw content data:', {
            type: typeof presentation.content,
            isArray: Array.isArray(presentation.content),
            length: presentation.content.length,
            firstElement: presentation.content[0] ? presentation.content[0].substring(0, 100) + '...' : 'none'
        });
        
        if (Array.isArray(presentation.content)) {
            // Backend returns array of slides - each element is a complete slide
            slides = presentation.content
                .map(slide => {
                    // Don't split on ### - these are markdown headers within slides
                    return slide;
                })
                .flat() // Flatten in case we split any slides
                .filter(slide => {
                    if (!slide || typeof slide !== 'string') return false;
                    const trimmed = slide.trim();
                    if (trimmed.length === 0) return false;
                    
                    // Enhanced filtering for summary content
                    const lower = trimmed.toLowerCase();
                    
                    // Filter out summary statements
                    if (lower.startsWith('this presentation provides') || 
                        lower.startsWith('the presentation provides') ||
                        lower.startsWith('this presentation covers') ||
                        lower.startsWith('this presentation offers') ||
                        lower.includes('provides a thorough overview') ||
                        lower.includes('provides a detailed overview') ||
                        lower.includes('provides a comprehensive') ||
                        lower.includes('provides a clear') ||
                        lower.includes('step-by-step guide') ||
                        lower.includes('covering its history') ||
                        lower.includes('covering the history') ||
                        // Check if it's just a summary without actual slide content
                        (trimmed.length < 200 && !trimmed.includes('- **') && !trimmed.includes('##'))) {
                        console.log('Edit modal - Filtering out summary content:', trimmed.substring(0, 100) + '...');
                        return false;
                    }
                    
                    return true;
                });
        } else {
            // Backend returns string - parse as before
            const rawContent = presentation.content.toString();
            slides = rawContent
                .split(/---+|\n\s*slide\s+\d+\s*:?\s*\n/i)
                .map(slide => slide.trim())
                .filter(slide => slide.length > 0);
        }
            
        console.log('Edit modal - Parsed slides:', {
            count: slides.length,
            slides: slides.map((slide, i) => `Slide ${i + 1}: ${slide.substring(0, 50)}...`)
        });
    }
    
    modal.innerHTML = `
        <div class="modal professional-modal" style="max-width: 1400px; max-height: 95vh; background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95)); border: 1px solid rgba(148, 163, 184, 0.2); backdrop-filter: blur(20px);">
            <div class="modal-header" style="background: linear-gradient(90deg, rgba(245, 158, 11, 0.1), rgba(59, 130, 246, 0.1)); border-bottom: 1px solid rgba(148, 163, 184, 0.2); padding: 24px; display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1;">
                    <div class="modal-title" style="font-size: 24px; font-weight: 700; color: white; margin-bottom: 8px;">✏️ Edit Slides</div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <label style="color: rgba(148, 163, 184, 0.8); font-size: 14px;">Title:</label>
                        <input 
                            id="presentation-title-edit" 
                            type="text" 
                            value="${presentation.title || 'Untitled Presentation'}"
                            style="
                                background: rgba(15, 23, 42, 0.8); 
                                border: 1px solid rgba(148, 163, 184, 0.3); 
                                border-radius: 6px; 
                                padding: 8px 12px; 
                                color: white; 
                                font-size: 14px; 
                                min-width: 300px;
                            "
                            placeholder="Enter presentation title..."
                        >
                        <span style="color: rgba(148, 163, 184, 0.6); font-size: 12px;">• ${slides.length} slides</span>
                    </div>
                </div>
                <button class="modal-close" onclick="this.closest('.modal-backdrop').remove()" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; width: 40px; height: 40px; border-radius: 8px; font-size: 20px; cursor: pointer; transition: all 0.2s;">&times;</button>
            </div>
            
            <div class="modal-body" style="padding: 0; display: flex; height: calc(95vh - 180px);">
                <!-- Slides List Sidebar -->
                <div style="width: 320px; background: rgba(15, 23, 42, 0.8); border-right: 1px solid rgba(148, 163, 184, 0.2); display: flex; flex-direction: column;">
                    <div style="padding: 20px; border-bottom: 1px solid rgba(148, 163, 184, 0.2); display: flex; justify-content: space-between; align-items: center;">
                        <h4 style="color: white; font-size: 16px; font-weight: 600; margin: 0;">Slides</h4>
                        <button onclick="addNewSlide()" style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); color: #10b981; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">+ Add Slide</button>
                    </div>
                    <div id="slides-list" style="flex: 1; overflow-y: auto; padding: 16px;">
                        ${slides.map((slide, index) => `
                            <div class="slide-item" onclick="selectSlideForEdit(${index})" style="
                                background: ${index === 0 ? 'rgba(59, 130, 246, 0.1)' : 'rgba(30, 41, 59, 0.6)'}; 
                                border: 2px solid ${index === 0 ? 'rgba(59, 130, 246, 0.5)' : 'rgba(148, 163, 184, 0.2)'}; 
                                border-radius: 8px; 
                                padding: 12px; 
                                margin-bottom: 12px; 
                                cursor: pointer; 
                                transition: all 0.2s;
                                position: relative;
                            " data-slide="${index}">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                    <div style="color: rgba(59, 130, 246, 0.8); font-size: 12px; font-weight: 600;">Slide ${index + 1}</div>
                                    <div style="display: flex; gap: 4px;">
                                        <button onclick="event.stopPropagation(); moveSlide(${index}, -1)" style="background: rgba(148, 163, 184, 0.1); border: 1px solid rgba(148, 163, 184, 0.3); color: #94a3b8; width: 20px; height: 20px; border-radius: 4px; cursor: pointer; font-size: 10px;" ${index === 0 ? 'disabled' : ''}>↑</button>
                                        <button onclick="event.stopPropagation(); moveSlide(${index}, 1)" style="background: rgba(148, 163, 184, 0.1); border: 1px solid rgba(148, 163, 184, 0.3); color: #94a3b8; width: 20px; height: 20px; border-radius: 4px; cursor: pointer; font-size: 10px;" ${index === slides.length - 1 ? 'disabled' : ''}>↓</button>
                                        <button onclick="event.stopPropagation(); deleteSlide(${index})" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; width: 20px; height: 20px; border-radius: 4px; cursor: pointer; font-size: 10px;">×</button>
                                    </div>
                                </div>
                                <div style="color: rgba(148, 163, 184, 0.9); font-size: 11px; line-height: 1.4; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;">
                                    ${slide.trim().substring(0, 80)}${slide.trim().length > 80 ? '...' : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Main Editor -->
                <div style="flex: 1; display: flex; flex-direction: column;">
                    <!-- Editor Toolbar -->
                    <div style="padding: 16px; background: rgba(15, 23, 42, 0.8); border-bottom: 1px solid rgba(148, 163, 184, 0.2); display: flex; gap: 12px; align-items: center;">
                        <div style="color: rgba(148, 163, 184, 0.8); font-size: 14px; font-weight: 600;">
                            Editing Slide <span id="current-edit-slide">1</span>
                        </div>
                        <div style="flex: 1;"></div>
                        <button onclick="improveSlideWithAI()" style="background: rgba(147, 51, 234, 0.1); border: 1px solid rgba(147, 51, 234, 0.3); color: #9333ea; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 12px;">
                            ✨ AI Improve
                        </button>
                        <button onclick="previewCurrentSlide()" style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); color: #3b82f6; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 12px;">
                            👁️ Preview
                        </button>
                    </div>
                    
                    <!-- Text Editor -->
                    <div style="flex: 1; padding: 20px; background: rgba(30, 41, 59, 0.3);">
                        <textarea id="slide-editor" style="
                            width: 100%; 
                            height: 100%; 
                            background: rgba(15, 23, 42, 0.8); 
                            border: 1px solid rgba(148, 163, 184, 0.2); 
                            border-radius: 8px; 
                            padding: 20px; 
                            color: white; 
                            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; 
                            font-size: 14px; 
                            line-height: 1.6; 
                            resize: none; 
                            outline: none;
                        " placeholder="Enter slide content here...">${slides.length > 0 ? slides[0].trim() : ''}</textarea>
                    </div>
                </div>
                
                <!-- Live Preview Panel -->
                <div style="width: 400px; background: rgba(15, 23, 42, 0.8); border-left: 1px solid rgba(148, 163, 184, 0.2); display: flex; flex-direction: column;">
                    <div style="padding: 16px; border-bottom: 1px solid rgba(148, 163, 184, 0.2);">
                        <h4 style="color: white; font-size: 14px; font-weight: 600; margin: 0;">Live Preview</h4>
                    </div>
                    <div style="flex: 1; padding: 20px; overflow-y: auto;">
                        <div id="slide-preview" style="background: white; border-radius: 8px; padding: 24px; min-height: 300px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                            <div style="color: #1e293b; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.7; font-size: 14px;">
                                ${slides.length > 0 ? slides[0].trim().replace(/\n/g, '<br>') : 'No content'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Action Buttons -->
            <div style="padding: 24px; background: rgba(15, 23, 42, 0.8); border-top: 1px solid rgba(148, 163, 184, 0.2); display: flex; gap: 12px; justify-content: space-between;">
                <div style="display: flex; gap: 12px;">
                    <button onclick="this.closest('.modal-backdrop').remove()" style="background: rgba(148, 163, 184, 0.1); border: 1px solid rgba(148, 163, 184, 0.3); color: #94a3b8; padding: 12px 24px; border-radius: 8px; cursor: pointer;">
                        Cancel
                    </button>
                </div>
                <div style="display: flex; gap: 12px;">
                    <button onclick="saveSlideChanges()" style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); color: #10b981; padding: 12px 24px; border-radius: 8px; cursor: pointer;">
                        💾 Save Changes
                    </button>
                    <button onclick="saveAndPreview()" style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); color: #3b82f6; padding: 12px 24px; border-radius: 8px; cursor: pointer;">
                        💾 Save & Preview
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Initialize editor functionality
    let currentEditSlide = 0;
    let editableSlides = [...slides];
    
    // Real-time preview update
    const editor = document.getElementById('slide-editor');
    const preview = document.getElementById('slide-preview');
    
    if (editor && preview) {
        editor.addEventListener('input', function() {
            const content = this.value.trim();
            preview.innerHTML = `
                <div style="color: #1e293b; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.7; font-size: 14px;">
                    ${content.replace(/\n/g, '<br>') || 'No content'}
                </div>
            `;
            // Update the slide in memory
            editableSlides[currentEditSlide] = content;
        });
    }
    
    // Global functions for slide editing
    window.selectSlideForEdit = function(index) {
        // Save current slide content
        if (editor) {
            editableSlides[currentEditSlide] = editor.value;
        }
        
        currentEditSlide = index;
        
        // Update editor content
        if (editor) {
            editor.value = editableSlides[index] || '';
        }
        
        // Update preview
        if (preview) {
            const content = editableSlides[index] || '';
            preview.innerHTML = `
                <div style="color: #1e293b; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.7; font-size: 14px;">
                    ${content.replace(/\n/g, '<br>') || 'No content'}
                </div>
            `;
        }
        
        // Update slide number
        const slideNumber = document.getElementById('current-edit-slide');
        if (slideNumber) {
            slideNumber.textContent = index + 1;
        }
        
        // Update slide selection in sidebar
        document.querySelectorAll('.slide-item').forEach((item, i) => {
            if (i === index) {
                item.style.background = 'rgba(59, 130, 246, 0.1)';
                item.style.border = '2px solid rgba(59, 130, 246, 0.5)';
            } else {
                item.style.background = 'rgba(30, 41, 59, 0.6)';
                item.style.border = '2px solid rgba(148, 163, 184, 0.2)';
            }
        });
    };
    
    window.addNewSlide = function() {
        editableSlides.push('# New Slide\n\nEnter your content here...');
        updateSlidesList();
        selectSlideForEdit(editableSlides.length - 1);
    };
    
    window.deleteSlide = function(index) {
        if (editableSlides.length <= 1) {
            updateStatus('Cannot delete the last slide', 'error');
            return;
        }
        
        if (confirm('Are you sure you want to delete this slide?')) {
            editableSlides.splice(index, 1);
            if (currentEditSlide >= editableSlides.length) {
                currentEditSlide = editableSlides.length - 1;
            }
            updateSlidesList();
            selectSlideForEdit(currentEditSlide);
        }
    };
    
    window.moveSlide = function(index, direction) {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= editableSlides.length) return;
        
        // Swap slides
        [editableSlides[index], editableSlides[newIndex]] = [editableSlides[newIndex], editableSlides[index]];
        
        // Update current edit slide if needed
        if (currentEditSlide === index) {
            currentEditSlide = newIndex;
        } else if (currentEditSlide === newIndex) {
            currentEditSlide = index;
        }
        
        updateSlidesList();
        selectSlideForEdit(currentEditSlide);
    };
    
    window.saveSlideChanges = async function() {
        try {
            // CRITICAL: Validate presentationId first
            if (!presentationId) {
                console.error('SAVE ERROR: presentationId is null/undefined');
                console.error('Presentation object:', presentation);
                console.error('Available presentations:', generatedPresentations.map(p => ({id: p.id, title: p.title})));
                updateStatus('Error: Cannot save - presentation ID is missing. Please try refreshing and editing again.', 'error');
                return;
            }
            
            // Save current editor content
            if (editor) {
                editableSlides[currentEditSlide] = editor.value;
            }
            
            // Save presentation title
            const titleInput = document.getElementById('presentation-title-edit');
            if (titleInput) {
                presentation.title = titleInput.value.trim() || 'Untitled Presentation';
            }
            
            // Properly format slides content for backend as array
            const slidesArray = editableSlides
                .filter(slide => slide.trim().length > 0) // Remove empty slides
                .map(slide => slide.trim()); // Clean up each slide
            
            updateStatus('Saving presentation...', 'info');
            
            console.log('Attempting to save presentation:', {
                presentationId: presentationId,
                presentationIdType: typeof presentationId,
                presentationIdLength: presentationId ? presentationId.length : 'null',
                presentationExists: !!presentation,
                presentationObjectId: presentation?.id,
                title: presentation.title,
                slidesCount: slidesArray.length,
                slidesPreview: slidesArray.map((slide, i) => `Slide ${i + 1}: ${slide.substring(0, 50)}...`)
            });
            
            // CRITICAL FIX: Handle malformed JSON-encoded array strings
            console.log('Slides array before conversion:', {
                arrayLength: slidesArray.length,
                firstSlideType: typeof slidesArray[0],
                firstSlideContent: slidesArray[0],
                fullArray: slidesArray
            });
            
            // Check if the first element looks like a JSON fragment
            let processedSlides = [];
            
            if (slidesArray.length > 0 && slidesArray[0].startsWith('[\"')) {
                // This is a malformed JSON array that was split incorrectly
                // Reconstruct the original JSON string and parse it properly
                const reconstructedJson = slidesArray.join('');
                console.log('Reconstructed JSON string:', reconstructedJson.substring(0, 200) + '...');
                
                try {
                    processedSlides = JSON.parse(reconstructedJson);
                    console.log('Successfully parsed JSON array:', processedSlides.length, 'slides');
                } catch (e) {
                    console.error('Failed to parse reconstructed JSON:', e);
                    // Fallback: try to clean up the fragments manually
                    processedSlides = slidesArray.map(slide => {
                        return slide
                            .replace(/^\[?"/, '')  // Remove opening bracket and quote
                            .replace(/",?\s*$/, '') // Remove closing quote and comma
                            .replace(/\\n/g, '\n')  // Unescape newlines
                            .replace(/\\"/g, '"');  // Unescape quotes
                    }).filter(slide => slide.trim().length > 0);
                }
            } else {
                // Normal array processing
                processedSlides = slidesArray.map((slide, index) => {
                    if (typeof slide === 'string') {
                        console.log(`Slide ${index + 1} is plain string:`, slide.substring(0, 100) + '...');
                        return slide;
                    } else {
                        console.log(`Slide ${index + 1} is not a string:`, typeof slide, slide);
                        return String(slide);
                    }
                });
            }
            
            console.log('Sending slides array to backend:', {
                originalArrayLength: slidesArray.length,
                processedArrayLength: processedSlides.length,
                slidesPreview: processedSlides.map((slide, i) => `Slide ${i + 1}: ${slide.substring(0, 50)}...`)
            });
            
            // Call backend GraphQL mutation to save changes
            const response = await fetch(config.graphqlEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await authService.getAccessToken()}`
                },
                body: JSON.stringify({
                    query: `
                        mutation UpdatePresentation($id: ID!, $input: UpdatePresentationInput!) {
                            updatePresentation(id: $id, input: $input) {
                                id
                                title
                                content
                                updatedAt
                            }
                        }
                    `,
                    variables: {
                        id: presentationId,
                        input: {
                            title: presentation.title,
                            content: processedSlides  // Send as array of individual slide strings
                        }
                    }
                })
            });

            const result = await response.json();
            console.log('Save presentation response:', result);
            
            if (result.data?.updatePresentation) {
                // Use content field directly - clean and simple
                const savedData = result.data.updatePresentation.content;
                let updatedSlides = [];
                
                if (Array.isArray(savedData)) {
                    // Already an array
                    updatedSlides = savedData;
                } else if (typeof savedData === 'string') {
                    // Convert string to array
                    updatedSlides = savedData.split('\n---\n').map(slide => slide.trim()).filter(slide => slide.length > 0);
                }
                
                console.log('Converting response back to array:', {
                    savedDataType: typeof savedData,
                    isArray: Array.isArray(savedData),
                    convertedArrayLength: updatedSlides.length,
                    hasContent: !!result.data.updatePresentation.content
                });
                
                // Update local presentation object with clean content field
                presentation.content = updatedSlides;
                presentation.title = result.data.updatePresentation.title;
                
                // Update the presentation in the generatedPresentations array
                const presentationIndex = generatedPresentations.findIndex(p => p.id === presentationId);
                if (presentationIndex !== -1) {
                    generatedPresentations[presentationIndex] = {
                        ...generatedPresentations[presentationIndex],
                        content: updatedSlides, // Clean content field
                        title: presentation.title,
                        updatedAt: result.data.updatePresentation.updatedAt
                    };
                }
                
                updateStatus('Presentation saved successfully!', 'success');
                
                // Reload presentations from backend to ensure data consistency
                setTimeout(() => {
                    loadPresentations();
                }, 500);
                
            } else if (result.errors) {
                // Handle GraphQL errors
                const errorMessage = result.errors.map(e => e.message).join(', ');
                console.error('GraphQL errors:', result.errors);
                throw new Error(`GraphQL Error: ${errorMessage}`);
            } else {
                throw new Error('No data returned from updatePresentation mutation');
            }
            
        } catch (error) {
            console.error('Save error:', error);
            updateStatus('Failed to save presentation: ' + error.message, 'error');
            
            // Still update local state as fallback - keep array format for consistency
            presentation.content = editableSlides; // Keep as array, not string
            presentation.content = editableSlides; // Also set content field
            
            const presentationIndex = generatedPresentations.findIndex(p => p.id === presentationId);
            if (presentationIndex !== -1) {
                generatedPresentations[presentationIndex].slides = editableSlides; // Keep as array
                generatedPresentations[presentationIndex].content = editableSlides; // Also set content
                generatedPresentations[presentationIndex].title = presentation.title;
            }
            
            setTimeout(() => {
                loadPresentations();
            }, 500);
        }
        
        // Close modal
        modal.remove();
    };
    
    window.saveAndPreview = function() {
        saveSlideChanges();
        setTimeout(() => {
            viewPresentation(presentationId);
        }, 500);
    };
    
    window.improveSlideWithAI = async function() {
        const editor = document.getElementById('slide-editor');
        if (!editor) return;
        
        const currentContent = editor.value.trim();
        if (!currentContent) {
            updateStatus('Please enter some content first', 'error');
            return;
        }
        
        try {
            updateStatus('AI is improving your slide...', 'info');
            
            // Call the real GraphQL mutation for AI improvement
            const response = await fetch(config.graphqlEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await authService.getAccessToken()}`
                },
                body: JSON.stringify({
                    query: `
                        mutation ImproveSlideWithAI($presentationId: String!, $slideIndex: Int!, $currentContent: String!, $context: String!) {
                            improveSlideWithAI(presentationId: $presentationId, slideIndex: $slideIndex, currentContent: $currentContent, context: $context) {
                                success
                                message
                                improvedContent
                            }
                        }
                    `,
                    variables: {
                        presentationId: presentationId,
                        slideIndex: currentEditSlide,
                        currentContent: currentContent,
                        context: "Improve this slide content for better clarity, structure, and professional presentation. Make it more engaging and well-organized."
                    }
                })
            });

            const result = await response.json();
            console.log('AI improvement response:', result);
            
            if (result.data?.improveSlideWithAI?.success) {
                const improvedContent = result.data.improveSlideWithAI.improvedContent;
                
                // Update editor with improved content
                editor.value = improvedContent;
                editableSlides[currentEditSlide] = improvedContent;
                
                // Update preview
                const preview = document.getElementById('slide-preview');
                if (preview) {
                    preview.innerHTML = `
                        <div style="color: #1e293b; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.7; font-size: 14px;">
                            ${improvedContent.replace(/\n/g, '<br>')}
                        </div>
                    `;
                }
                
                updateStatus('Slide improved with AI suggestions!', 'success');
            } else {
                throw new Error(result.data?.improveSlideWithAI?.message || result.errors?.[0]?.message || 'AI improvement failed');
            }
            
        } catch (error) {
            console.error('AI improvement error:', error);
            updateStatus('AI improvement failed: ' + error.message, 'error');
            
            // DO NOT show mock content - just show error and keep original content
            // The editor retains the original content that the user entered
        }
    };
    
    window.previewCurrentSlide = function() {
        const editor = document.getElementById('slide-editor');
        if (!editor) return;
        
        const content = editor.value.trim();
        if (!content) {
            updateStatus('No content to preview', 'error');
            return;
        }
        
        // Create a mini preview modal
        const previewModal = document.createElement('div');
        previewModal.className = 'modal-backdrop';
        previewModal.innerHTML = `
            <div class="modal" style="max-width: 800px;">
                <div class="modal-header">
                    <div class="modal-title">Slide ${currentEditSlide + 1} Preview</div>
                    <button class="modal-close" onclick="this.closest('.modal-backdrop').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="background: white; border-radius: 12px; padding: 40px; min-height: 400px;">
                        <div style="color: #1e293b; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.7; font-size: 16px;">
                            ${content.replace(/\n/g, '<br>')}
                        </div>
                    </div>
                    <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
                        <button class="btn-secondary" onclick="this.closest('.modal-backdrop').remove()">Close</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(previewModal);
    };
    
    function updateSlidesList() {
        const slidesList = document.getElementById('slides-list');
        if (slidesList) {
            slidesList.innerHTML = editableSlides.map((slide, index) => `
                <div class="slide-item" onclick="selectSlideForEdit(${index})" style="
                    background: ${index === currentEditSlide ? 'rgba(59, 130, 246, 0.1)' : 'rgba(30, 41, 59, 0.6)'}; 
                    border: 2px solid ${index === currentEditSlide ? 'rgba(59, 130, 246, 0.5)' : 'rgba(148, 163, 184, 0.2)'}; 
                    border-radius: 8px; 
                    padding: 12px; 
                    margin-bottom: 12px; 
                    cursor: pointer; 
                    transition: all 0.2s;
                    position: relative;
                " data-slide="${index}">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <div style="color: rgba(59, 130, 246, 0.8); font-size: 12px; font-weight: 600;">Slide ${index + 1}</div>
                        <div style="display: flex; gap: 4px;">
                            <button onclick="event.stopPropagation(); moveSlide(${index}, -1)" style="background: rgba(148, 163, 184, 0.1); border: 1px solid rgba(148, 163, 184, 0.3); color: #94a3b8; width: 20px; height: 20px; border-radius: 4px; cursor: pointer; font-size: 10px;" ${index === 0 ? 'disabled' : ''}>↑</button>
                            <button onclick="event.stopPropagation(); moveSlide(${index}, 1)" style="background: rgba(148, 163, 184, 0.1); border: 1px solid rgba(148, 163, 184, 0.3); color: #94a3b8; width: 20px; height: 20px; border-radius: 4px; cursor: pointer; font-size: 10px;" ${index === editableSlides.length - 1 ? 'disabled' : ''}>↓</button>
                            <button onclick="event.stopPropagation(); deleteSlide(${index})" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; width: 20px; height: 20px; border-radius: 4px; cursor: pointer; font-size: 10px;">×</button>
                        </div>
                    </div>
                    <div style="color: rgba(148, 163, 184, 0.9); font-size: 11px; line-height: 1.4; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;">
                        ${slide.trim().substring(0, 80)}${slide.trim().length > 80 ? '...' : ''}
                    </div>
                </div>
            `).join('');
        }
    }
}

// Edit presentation function
function editPresentation(presentationId) {
    // For now, redirect to view mode - can be enhanced later
    viewPresentation(presentationId);
}

// View presentation - using cached data instead of additional query
async function viewPresentation(presentationId) {
    try {
        // Find presentation in already loaded data
        const presentation = generatedPresentations.find(p => p.id === presentationId);
        
        if (!presentation) {
            updateStatus('Presentation not found', 'error');
            return;
        }
        
        showPresentationModal(presentation);
        
    } catch (error) {
        console.error('View presentation error:', error);
        updateStatus('Failed to load presentation', 'error');
    }
}

function showPresentationModal(presentation) {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    
    // COMPLETELY REWRITTEN slide parsing logic
    let slides = [];
    if (presentation.content) {
        console.log('Raw slides data:', {
            type: typeof presentation.content,
            isArray: Array.isArray(presentation.content),
            length: presentation.content.length,
            rawContent: presentation.content
        });
        
        if (Array.isArray(presentation.content)) {
            // Backend returns array - use slides directly without splitting
            slides = presentation.content.filter(slide => slide && slide.trim().length > 0);
        } else {
            // String format - split by separators (but not ###)
            slides = presentation.content
                .split(/---+|\n\s*slide\s+\d+\s*:?\s*\n/i)
                .map(slide => slide.trim())
                .filter(slide => slide.length > 0);
        }
            
        console.log('FINAL PARSED SLIDES:', {
            count: slides.length,
            slides: slides.map((slide, i) => `Slide ${i + 1}: ${slide.substring(0, 50)}...`)
        });
    }
    const slideCount = slides.length;
    
    modal.innerHTML = `
        <div class="modal professional-modal" style="max-width: 1200px; max-height: 90vh; background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95)); border: 1px solid rgba(148, 163, 184, 0.2); backdrop-filter: blur(20px);">
            <div class="modal-header" style="background: linear-gradient(90deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1)); border-bottom: 1px solid rgba(148, 163, 184, 0.2); padding: 24px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div class="modal-title" style="font-size: 24px; font-weight: 700; color: white; margin-bottom: 8px;">${presentation.title || 'Untitled Presentation'}</div>
                    <div style="color: rgba(148, 163, 184, 0.8); font-size: 14px;">
                        📊 ${slideCount} slides • Created: ${new Date(presentation.createdAt).toLocaleDateString()}
                        ${presentation.relevantChunksCount ? ` • ${presentation.relevantChunksCount} context chunks` : ''}
                    </div>
                </div>
                <button class="modal-close" onclick="this.closest('.modal-backdrop').remove()" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; width: 40px; height: 40px; border-radius: 8px; font-size: 20px; cursor: pointer; transition: all 0.2s;">&times;</button>
            </div>
            
            <div class="modal-body" style="padding: 0; display: flex; height: calc(90vh - 140px);">
                <!-- Slide Navigation Sidebar -->
                <div style="width: 280px; background: rgba(15, 23, 42, 0.8); border-right: 1px solid rgba(148, 163, 184, 0.2); overflow-y: auto;">
                    <div style="padding: 20px; border-bottom: 1px solid rgba(148, 163, 184, 0.2);">
                        <h4 style="color: white; font-size: 16px; font-weight: 600; margin: 0;">Slides Overview</h4>
                    </div>
                    <div id="slide-thumbnails" style="padding: 16px;">
                        ${slides.map((slide, index) => `
                            <div class="slide-thumbnail" onclick="showSlide(${index})" style="
                                background: rgba(30, 41, 59, 0.6); 
                                border: 2px solid ${index === 0 ? 'rgba(59, 130, 246, 0.5)' : 'rgba(148, 163, 184, 0.2)'}; 
                                border-radius: 8px; 
                                padding: 12px; 
                                margin-bottom: 12px; 
                                cursor: pointer; 
                                transition: all 0.2s;
                                ${index === 0 ? 'background: rgba(59, 130, 246, 0.1);' : ''}
                            " data-slide="${index}">
                                <div style="color: rgba(59, 130, 246, 0.8); font-size: 12px; font-weight: 600; margin-bottom: 6px;">Slide ${index + 1}</div>
                                <div style="color: rgba(148, 163, 184, 0.9); font-size: 11px; line-height: 1.4; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;">
                                    ${slide.trim().substring(0, 100)}${slide.trim().length > 100 ? '...' : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Main Slide Display -->
                <div style="flex: 1; display: flex; flex-direction: column;">
                    <!-- Slide Content -->
                    <div style="flex: 1; padding: 40px; overflow-y: auto; background: linear-gradient(135deg, rgba(30, 41, 59, 0.3), rgba(15, 23, 42, 0.3));">
                        <div id="current-slide-content" style="background: white; border-radius: 12px; padding: 40px; min-height: 400px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);">
                            ${slides.length > 0 ? `
                                <div style="color: #1e293b; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.7; font-size: 16px;">
                                    ${slides[0].trim().replace(/\n/g, '<br>')}
                                </div>
                            ` : '<div style="color: #64748b; text-align: center; padding: 60px;">No slides content available</div>'}
                        </div>
                    </div>
                    
                    <!-- Slide Navigation Controls -->
                    <div style="padding: 20px; background: rgba(15, 23, 42, 0.8); border-top: 1px solid rgba(148, 163, 184, 0.2); display: flex; justify-content: space-between; align-items: center;">
                        <button id="prev-slide" onclick="navigateSlide(-1)" style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); color: #3b82f6; padding: 10px 20px; border-radius: 8px; cursor: pointer; transition: all 0.2s;" ${slides.length <= 1 ? 'disabled' : ''}>
                            ← Previous
                        </button>
                        
                        <div style="color: rgba(148, 163, 184, 0.8); font-size: 14px;">
                            <span id="current-slide-number">1</span> of ${slideCount}
                        </div>
                        
                        <button id="next-slide" onclick="navigateSlide(1)" style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); color: #3b82f6; padding: 10px 20px; border-radius: 8px; cursor: pointer; transition: all 0.2s;" ${slides.length <= 1 ? 'disabled' : ''}>
                            Next →
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Action Buttons -->
            <div style="padding: 24px; background: rgba(15, 23, 42, 0.8); border-top: 1px solid rgba(148, 163, 184, 0.2); display: flex; gap: 12px; justify-content: flex-end;">
                <button onclick="this.closest('.modal-backdrop').remove()" style="background: rgba(148, 163, 184, 0.1); border: 1px solid rgba(148, 163, 184, 0.3); color: #94a3b8; padding: 12px 24px; border-radius: 8px; cursor: pointer; transition: all 0.2s;">
                    Close
                </button>
                <button onclick="editSlides('${presentation.id}')" style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); color: #f59e0b; padding: 12px 24px; border-radius: 8px; cursor: pointer; transition: all 0.2s;">
                    ✏️ Edit Slides
                </button>
                <button onclick="exportPresentation('${presentation.id}', 'html')" style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); color: #10b981; padding: 12px 24px; border-radius: 8px; cursor: pointer; transition: all 0.2s;">
                    📄 Export HTML
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add slide navigation functionality
    let currentSlideIndex = 0;
    const totalSlides = slides.length;
    
    window.showSlide = function(index) {
        if (index < 0 || index >= totalSlides) return;
        
        currentSlideIndex = index;
        
        // Update slide content
        const slideContent = document.getElementById('current-slide-content');
        if (slideContent) {
            slideContent.innerHTML = `
                <div style="color: #1e293b; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.7; font-size: 16px;">
                    ${slides[index].trim().replace(/\n/g, '<br>')}
                </div>
            `;
        }
        
        // Update slide number
        const slideNumber = document.getElementById('current-slide-number');
        if (slideNumber) {
            slideNumber.textContent = index + 1;
        }
        
        // Update thumbnail selection
        document.querySelectorAll('.slide-thumbnail').forEach((thumb, i) => {
            if (i === index) {
                thumb.style.border = '2px solid rgba(59, 130, 246, 0.5)';
                thumb.style.background = 'rgba(59, 130, 246, 0.1)';
            } else {
                thumb.style.border = '2px solid rgba(148, 163, 184, 0.2)';
                thumb.style.background = 'rgba(30, 41, 59, 0.6)';
            }
        });
        
        // Update navigation buttons
        const prevBtn = document.getElementById('prev-slide');
        const nextBtn = document.getElementById('next-slide');
        if (prevBtn) prevBtn.disabled = index === 0;
        if (nextBtn) nextBtn.disabled = index === totalSlides - 1;
    };
    
    window.navigateSlide = function(direction) {
        const newIndex = currentSlideIndex + direction;
        if (newIndex >= 0 && newIndex < totalSlides) {
            showSlide(newIndex);
        }
    };
}

// Export presentation - using cached data instead of additional query
async function exportPresentation(presentationId, format) {
    try {
        // Special handling for PDF - show message immediately without "Exporting..." notification
        if (format.toLowerCase() === 'pdf') {
            updateStatus('PDF export requires server-side processing. Use HTML export instead and export as PDF.', 'info');
            return;
        }
        
        updateStatus(`Exporting presentation as ${format.toUpperCase()}...`, 'info');
        
        // Find presentation in already loaded data
        const presentation = generatedPresentations.find(p => p.id === presentationId);
        
        if (!presentation) {
            throw new Error('Presentation not found in loaded data');
        }
        
        // Create export content based on format
        let exportContent = '';
        let filename = '';
        let mimeType = '';
        
        switch(format.toLowerCase()) {
            case 'html':
                exportContent = createHTMLExport(presentation);
                filename = `${presentation.title || 'presentation'}.html`;
                mimeType = 'text/html';
                break;
            case 'reveal':
                exportContent = createRevealJSExport(presentation);
                filename = `${presentation.title || 'presentation'}-reveal.html`;
                mimeType = 'text/html';
                break;
            case 'marp':
                exportContent = createMarpExport(presentation);
                filename = `${presentation.title || 'presentation'}.md`;
                mimeType = 'text/markdown';
                break;
            default:
                throw new Error('Unsupported format');
        }
        
        // Create and trigger download
        const blob = new Blob([exportContent], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        
        updateStatus('Export completed successfully!', 'success');
        
    } catch (error) {
        console.error('Export error:', error);
        updateStatus('Export failed', 'error');
    }
}

// Helper functions for different export formats
function createHTMLExport(presentation) {
    // Handle both array and string formats for slides
    let slides = [];
    if (presentation.content) {
        if (Array.isArray(presentation.content)) {
            // Already an array - use directly
            slides = presentation.content.filter(slide => slide && slide.trim());
        } else {
            // String format - split by separators
            slides = presentation.content.split('---').filter(slide => slide.trim());
        }
    }
    
    return `<!DOCTYPE html>
<html>
<head>
    <title>${presentation.title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .slide { page-break-after: always; margin-bottom: 40px; padding: 20px; border: 1px solid #ccc; }
        h1, h2, h3 { color: #333; }
    </style>
</head>
<body>
    <h1>${presentation.title}</h1>
    <p>Created: ${new Date(presentation.createdAt).toLocaleDateString()}</p>
    ${slides.map((slide, index) => `
        <div class="slide">
            <h2>Slide ${index + 1}</h2>
            <div>${slide.trim().replace(/\n/g, '<br>')}</div>
        </div>
    `).join('')}
</body>
</html>`;
}

function createRevealJSExport(presentation) {
    // Handle both array and string formats for slides
    let slides = [];
    if (presentation.content) {
        if (Array.isArray(presentation.content)) {
            // Already an array - use directly
            slides = presentation.content.filter(slide => slide && slide.trim());
        } else {
            // String format - split by separators
            slides = presentation.content.split('---').filter(slide => slide.trim());
        }
    }
    
    return `<!DOCTYPE html>
<html>
<head>
    <title>${presentation.title}</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/reveal.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/theme/white.css">
</head>
<body>
    <div class="reveal">
        <div class="slides">
            ${slides.map(slide => `<section>${slide.trim().replace(/\n/g, '<br>')}</section>`).join('')}
        </div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/reveal.js"></script>
    <script>Reveal.initialize();</script>
</body>
</html>`;
}

function createMarpExport(presentation) {
    // Handle both array and string formats for slides
    let slides = [];
    if (presentation.content) {
        if (Array.isArray(presentation.content)) {
            // Already an array - use directly
            slides = presentation.content.filter(slide => slide && slide.trim());
        } else {
            // String format - split by separators
            slides = presentation.content.split('---').filter(slide => slide.trim());
        }
    }
    
    return `---
marp: true
title: ${presentation.title}
---

# ${presentation.title}

Created: ${new Date(presentation.createdAt).toLocaleDateString()}

---

${slides.join('\n\n---\n\n')}`;
}

// Make functions globally available
window.handleSignIn = handleSignIn;
window.handleSignUp = handleSignUp;
window.handleConfirmSignUp = handleConfirmSignUp;
window.handleSignOut = handleSignOut;
window.generatePresentation = generatePresentation;
window.deleteDocument = deleteDocument;
window.deletePresentation = deletePresentation;
window.editSlides = editSlides;
window.viewPresentation = viewPresentation;
window.exportPresentation = exportPresentation;
window.notificationSystem = notificationSystem;
