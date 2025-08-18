/**
 * Unit tests for ErrorHandler class
 * Tests error categorization, user feedback, and recovery mechanisms
 */

// Simple test framework
let testCount = 0;
let passedTests = 0;
let failedTests = 0;

function describe(name, fn) {
    console.log(`\n=== ${name} ===`);
    fn();
}

function test(name, fn) {
    testCount++;
    try {
        fn();
        passedTests++;
        console.log(`✓ ${name}`);
    } catch (error) {
        failedTests++;
        console.log(`✗ ${name}`);
        console.log(`  Error: ${error.message}`);
    }
}

function beforeEach(fn) {
    fn();
}

function expect(actual) {
    return {
        toBe: (expected) => {
            if (actual !== expected) {
                throw new Error(`Expected ${expected}, but got ${actual}`);
            }
        },
        toEqual: (expected) => {
            if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
            }
        },
        toContain: (expected) => {
            if (!actual.includes(expected)) {
                throw new Error(`Expected ${actual} to contain ${expected}`);
            }
        },
        toBeNull: () => {
            if (actual !== null) {
                throw new Error(`Expected null, but got ${actual}`);
            }
        },
        toBeTruthy: () => {
            if (!actual) {
                throw new Error(`Expected truthy value, but got ${actual}`);
            }
        },
        toBeFalsy: () => {
            if (actual) {
                throw new Error(`Expected falsy value, but got ${actual}`);
            }
        },
        toBeInstanceOf: (expectedClass) => {
            if (!(actual instanceof expectedClass)) {
                throw new Error(`Expected instance of ${expectedClass.name}, but got ${actual.constructor.name}`);
            }
        },
        toBeGreaterThan: (expected) => {
            if (actual <= expected) {
                throw new Error(`Expected ${actual} to be greater than ${expected}`);
            }
        }
    };
}

// Mock DOM elements for testing
global.document = {
    readyState: 'complete',
    getElementById: (id) => ({
        innerHTML: '',
        appendChild: () => {},
        removeChild: () => {},
        contains: () => true,
        style: {},
        classList: {
            add: () => {},
            remove: () => {},
            contains: () => false
        },
        parentNode: {
            insertBefore: () => {},
            removeChild: () => {}
        },
        parentElement: {
            removeChild: () => {}
        },
        querySelector: () => null,
        querySelectorAll: () => []
    }),
    createElement: (tag) => ({
        className: '',
        innerHTML: '',
        textContent: '',
        style: {},
        onclick: null,
        appendChild: () => {},
        setAttribute: () => {},
        addEventListener: () => {},
        classList: {
            add: () => {},
            remove: () => {},
            contains: () => false
        },
        parentNode: {
            insertBefore: () => {},
            removeChild: () => {}
        },
        parentElement: {
            removeChild: () => {}
        },
        closest: () => null,
        remove: () => {}
    }),
    body: {
        appendChild: () => {},
        removeChild: () => {}
    },
    head: {
        appendChild: () => {}
    },
    addEventListener: () => {}
};

global.window = {
    location: {
        hostname: 'localhost',
        href: 'http://localhost:3000'
    },
    lastFailedOperation: null,
    addEventListener: () => {},
    innerWidth: 1024,
    innerHeight: 768
};

global.navigator = {
    userAgent: 'Test Browser'
};

// Import ErrorHandler
const ErrorHandler = require('./error-handler.js');

describe('ErrorHandler', () => {
    let errorHandler;

    beforeEach(() => {
        errorHandler = new ErrorHandler();
    });

    describe('Constructor', () => {
        test('should initialize with default configuration', () => {
            expect(errorHandler.maxRetries).toBe(3);
            expect(errorHandler.retryDelay).toBe(1000);
            expect(errorHandler.errorMessages).toBeTruthy();
        });

        test('should have predefined error messages', () => {
            expect(errorHandler.errorMessages.FILE_TOO_LARGE).toContain('5MB limit');
            expect(errorHandler.errorMessages.UNSUPPORTED_FORMAT).toContain('PDF, DOC, DOCX, or TXT');
            expect(errorHandler.errorMessages.CONVERSION_FAILED).toContain('Failed to process');
        });

        test('should have recovery suggestions', () => {
            expect(errorHandler.errorMessages.RECOVERY_SUGGESTIONS.FILE_TOO_LARGE).toBeTruthy();
            expect(errorHandler.errorMessages.RECOVERY_SUGGESTIONS.UNSUPPORTED_FORMAT).toBeTruthy();
        });
    });

    describe('Error Categorization', () => {
        test('should categorize file size errors', () => {
            const error = new Error('File size exceeds the maximum allowed size');
            error.code = 'FILE_VALIDATION_FAILED';
            
            const result = errorHandler.categorizeError(error);
            
            expect(result.type).toBe('FILE_TOO_LARGE');
            expect(result.severity).toBe('warning');
            expect(result.canRetry).toBe(false);
        });

        test('should categorize unsupported format errors', () => {
            const error = new Error('File format not supported');
            error.code = 'FILE_VALIDATION_FAILED';
            
            const result = errorHandler.categorizeError(error);
            
            expect(result.type).toBe('UNSUPPORTED_FORMAT');
            expect(result.severity).toBe('warning');
            expect(result.canRetry).toBe(false);
        });

        test('should categorize empty file errors', () => {
            const error = new Error('File appears to be empty or corrupted');
            error.code = 'FILE_VALIDATION_FAILED';
            
            const result = errorHandler.categorizeError(error);
            
            expect(result.type).toBe('FILE_EMPTY');
            expect(result.severity).toBe('warning');
            expect(result.canRetry).toBe(false);
        });

        test('should categorize no file provided errors', () => {
            const error = new Error('No file provided for validation');
            error.code = 'FILE_VALIDATION_FAILED';
            
            const result = errorHandler.categorizeError(error);
            
            expect(result.type).toBe('NO_FILE_PROVIDED');
            expect(result.severity).toBe('info');
            expect(result.canRetry).toBe(false);
        });

        test('should categorize conversion errors', () => {
            const error = new Error('Failed to convert file to base64');
            error.code = 'CONVERSION_FAILED';
            
            const result = errorHandler.categorizeError(error);
            
            expect(result.type).toBe('CONVERSION_FAILED');
            expect(result.severity).toBe('error');
            expect(result.canRetry).toBe(true);
        });

        test('should categorize network errors', () => {
            const error = new Error('Network connection failed');
            
            const result = errorHandler.categorizeError(error);
            
            expect(result.type).toBe('UPLOAD_FAILED');
            expect(result.severity).toBe('error');
            expect(result.canRetry).toBe(true);
        });

        test('should categorize service errors', () => {
            const error = new Error('Service temporarily unavailable');
            
            const result = errorHandler.categorizeError(error);
            
            expect(result.type).toBe('SERVICE_UNAVAILABLE');
            expect(result.severity).toBe('error');
            expect(result.canRetry).toBe(true);
        });

        test('should categorize authentication errors', () => {
            const error = new Error('Authentication failed - unauthorized');
            
            const result = errorHandler.categorizeError(error);
            
            expect(result.type).toBe('AUTHENTICATION_ERROR');
            expect(result.severity).toBe('error');
            expect(result.canRetry).toBe(false);
        });

        test('should categorize timeout errors', () => {
            const error = new Error('Operation timeout exceeded');
            
            const result = errorHandler.categorizeError(error);
            
            expect(result.type).toBe('PROCESSING_TIMEOUT');
            expect(result.severity).toBe('warning');
            expect(result.canRetry).toBe(true);
        });

        test('should categorize unknown errors', () => {
            const error = new Error('Some unexpected error');
            
            const result = errorHandler.categorizeError(error);
            
            expect(result.type).toBe('UNKNOWN_ERROR');
            expect(result.severity).toBe('error');
            expect(result.canRetry).toBe(true);
        });
    });

    describe('Error Handling', () => {
        test('should handle file validation error', () => {
            const error = new Error('File size exceeds the maximum allowed size');
            error.code = 'FILE_VALIDATION_FAILED';
            
            const result = errorHandler.handleError(error, { filename: 'large.pdf' });
            
            expect(result.type).toBe('FILE_TOO_LARGE');
            expect(result.userMessage).toContain('5MB limit');
            expect(result.recoverySuggestions.length).toBeGreaterThan(0);
            expect(result.canRetry).toBe(false);
            expect(result.context.filename).toBe('large.pdf');
        });

        test('should handle conversion error', () => {
            const error = new Error('FileReader failed to process file');
            error.code = 'CONVERSION_FAILED';
            
            const result = errorHandler.handleError(error);
            
            expect(result.type).toBe('CONVERSION_FAILED');
            expect(result.userMessage).toContain('Failed to process');
            expect(result.canRetry).toBe(true);
            expect(result.shouldShowDetails).toBe(true);
        });

        test('should include timestamp and technical details', () => {
            const error = new Error('Test error');
            
            const result = errorHandler.handleError(error);
            
            expect(result.timestamp).toBeTruthy();
            expect(result.technicalDetails).toBe('Test error');
        });
    });

    describe('User-Friendly Messages', () => {
        test('should return appropriate message for file too large', () => {
            const errorInfo = { type: 'FILE_TOO_LARGE' };
            const message = errorHandler.getUserFriendlyMessage(errorInfo);
            
            expect(message).toContain('5MB limit');
            expect(message).toContain('smaller file');
        });

        test('should return appropriate message for unsupported format', () => {
            const errorInfo = { type: 'UNSUPPORTED_FORMAT' };
            const message = errorHandler.getUserFriendlyMessage(errorInfo);
            
            expect(message).toContain('not supported');
            expect(message).toContain('PDF, DOC, DOCX, or TXT');
        });

        test('should return default message for unknown error type', () => {
            const errorInfo = { type: 'UNKNOWN_TYPE' };
            const message = errorHandler.getUserFriendlyMessage(errorInfo);
            
            expect(message).toBe(errorHandler.errorMessages.UNKNOWN_ERROR);
        });
    });

    describe('Recovery Suggestions', () => {
        test('should return suggestions for file too large', () => {
            const errorInfo = { type: 'FILE_TOO_LARGE' };
            const suggestions = errorHandler.getRecoverySuggestions(errorInfo);
            
            expect(suggestions.length).toBeGreaterThan(0);
            expect(suggestions[0]).toContain('compress');
        });

        test('should return suggestions for unsupported format', () => {
            const errorInfo = { type: 'UNSUPPORTED_FORMAT' };
            const suggestions = errorHandler.getRecoverySuggestions(errorInfo);
            
            expect(suggestions.length).toBeGreaterThan(0);
            expect(suggestions[0]).toContain('Convert');
        });

        test('should return empty array for unknown error type', () => {
            const errorInfo = { type: 'UNKNOWN_TYPE' };
            const suggestions = errorHandler.getRecoverySuggestions(errorInfo);
            
            expect(suggestions).toEqual([]);
        });
    });

    describe('Multiple File Results', () => {
        test('should handle all successful files', () => {
            const results = [
                { filename: 'file1.pdf', success: true },
                { filename: 'file2.txt', success: true }
            ];
            const errors = [];
            
            const result = errorHandler.handleMultipleFileResults(results, errors);
            
            expect(result.type).toBe('success');
            expect(result.message).toContain('Successfully processed 2 files');
        });

        test('should handle all failed files', () => {
            const results = [];
            const errors = [
                { filename: 'file1.jpg', error: 'Unsupported format' },
                { filename: 'file2.exe', error: 'Unsupported format' }
            ];
            
            const result = errorHandler.handleMultipleFileResults(results, errors);
            
            expect(result.type).toBe('error');
            expect(result.message).toContain('Failed to process all 2 files');
            expect(result.suggestions.length).toBeGreaterThan(0);
        });

        test('should handle partial success', () => {
            const results = [
                { filename: 'file1.pdf', success: true }
            ];
            const errors = [
                { filename: 'file2.jpg', error: 'Unsupported format' }
            ];
            
            const result = errorHandler.handleMultipleFileResults(results, errors);
            
            expect(result.type).toBe('warning');
            expect(result.message).toContain('Processed 1 of 2 files');
            expect(result.details.successful).toEqual(results);
            expect(result.details.failed).toEqual(errors);
        });

        test('should handle singular vs plural correctly', () => {
            const results = [{ filename: 'file1.pdf', success: true }];
            const errors = [];
            
            const result = errorHandler.handleMultipleFileResults(results, errors);
            
            expect(result.message).toContain('1 file'); // Should be singular
            // Check that it doesn't contain the plural form
            const containsPlural = result.message.includes('1 files');
            expect(containsPlural).toBe(false);
        });
    });

    describe('Severity Classes', () => {
        test('should return correct CSS class for info severity', () => {
            const className = errorHandler.getSeverityClass('info');
            expect(className).toBe('info');
        });

        test('should return correct CSS class for warning severity', () => {
            const className = errorHandler.getSeverityClass('warning');
            expect(className).toBe('warning');
        });

        test('should return correct CSS class for error severity', () => {
            const className = errorHandler.getSeverityClass('error');
            expect(className).toBe('error');
        });

        test('should default to error class for unknown severity', () => {
            const className = errorHandler.getSeverityClass('unknown');
            expect(className).toBe('error');
        });
    });

    describe('Retry Operation', () => {
        test('should succeed on first attempt', async () => {
            let attempts = 0;
            const operation = async () => {
                attempts++;
                return 'success';
            };
            
            const result = await errorHandler.retryOperation(operation);
            
            expect(result).toBe('success');
            expect(attempts).toBe(1);
        });

        test('should retry on failure and eventually succeed', async () => {
            let attempts = 0;
            const operation = async () => {
                attempts++;
                if (attempts < 3) {
                    throw new Error('Temporary failure');
                }
                return 'success';
            };
            
            const result = await errorHandler.retryOperation(operation, { maxRetries: 3, baseDelay: 10 });
            
            expect(result).toBe('success');
            expect(attempts).toBe(3);
        });

        test('should fail after max retries', async () => {
            let attempts = 0;
            const operation = async () => {
                attempts++;
                throw new Error('Persistent failure');
            };
            
            try {
                await errorHandler.retryOperation(operation, { maxRetries: 2, baseDelay: 10 });
                throw new Error('Should have thrown an error');
            } catch (error) {
                expect(error.message).toBe('Persistent failure');
                expect(attempts).toBe(3); // Initial attempt + 2 retries
            }
        });

        test('should call onRetry callback', async () => {
            let retryCallbacks = [];
            const operation = async () => {
                throw new Error('Always fails');
            };
            
            const onRetry = (attempt, maxAttempts, error) => {
                retryCallbacks.push({ attempt, maxAttempts, error: error.message });
            };
            
            try {
                await errorHandler.retryOperation(operation, { 
                    maxRetries: 2, 
                    baseDelay: 10, 
                    onRetry 
                });
            } catch (error) {
                // Expected to fail
            }
            
            expect(retryCallbacks.length).toBe(2);
            expect(retryCallbacks[0].attempt).toBe(1);
            expect(retryCallbacks[1].attempt).toBe(2);
        });
    });
});

// Run the tests
console.log('Running ErrorHandler tests...\n');

// Print test results
setTimeout(() => {
    console.log(`\n=== Test Results ===`);
    console.log(`Total tests: ${testCount}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);

    if (failedTests === 0) {
        console.log('🎉 All tests passed!');
    } else {
        console.log(`❌ ${failedTests} test(s) failed`);
        process.exit(1);
    }
}, 100);