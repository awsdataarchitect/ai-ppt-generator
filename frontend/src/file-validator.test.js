/**
 * Unit tests for FileValidator class
 * Tests file type validation, MIME type handling, and size validation
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
    // Simple implementation - just call the function
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
        }
    };
}

// Mock File constructor for testing
class MockFile {
    constructor(name, size, type, lastModified = Date.now()) {
        this.name = name;
        this.size = size;
        this.type = type;
        this.lastModified = lastModified;
    }
}

// Import FileValidator (adjust path as needed)
const FileValidator = require('./file-validator.js');

describe('FileValidator', () => {
    let validator;

    beforeEach(() => {
        validator = new FileValidator();
    });

    describe('Constructor and Configuration', () => {
        test('should initialize with default configuration', () => {
            expect(validator.config.maxFileSize).toBe(5 * 1024 * 1024); // 5MB
            expect(validator.config.supportedFormats).toContain('application/pdf');
            expect(validator.config.supportedFormats).toContain('application/msword');
            expect(validator.config.supportedFormats).toContain('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            expect(validator.config.supportedFormats).toContain('text/plain');
        });

        test('should accept custom configuration', () => {
            const customValidator = new FileValidator({
                maxFileSize: 10 * 1024 * 1024, // 10MB
                supportedFormats: ['application/pdf']
            });
            
            expect(customValidator.config.maxFileSize).toBe(10 * 1024 * 1024);
            expect(customValidator.config.supportedFormats).toEqual(['application/pdf']);
        });
    });

    describe('File Size Validation', () => {
        test('should validate file size within limits', () => {
            const file = new MockFile('test.pdf', 1024 * 1024, 'application/pdf'); // 1MB
            const result = validator.validateFileSize(file);
            
            expect(result.isValid).toBe(true);
        });

        test('should reject files exceeding size limit', () => {
            const file = new MockFile('large.pdf', 10 * 1024 * 1024, 'application/pdf'); // 10MB
            const result = validator.validateFileSize(file);
            
            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain('exceeds the maximum allowed size');
        });

        test('should reject empty files', () => {
            const file = new MockFile('empty.pdf', 0, 'application/pdf');
            const result = validator.validateFileSize(file);
            
            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain('empty or corrupted');
        });

        test('should reject files with negative size', () => {
            const file = new MockFile('invalid.pdf', -1, 'application/pdf');
            const result = validator.validateFileSize(file);
            
            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain('empty or corrupted');
        });
    });

    describe('MIME Type Validation', () => {
        test('should validate supported PDF MIME type', () => {
            const file = new MockFile('document.pdf', 1024, 'application/pdf');
            const result = validator.validateMimeType(file);
            
            expect(result.isValid).toBe(true);
        });

        test('should validate supported DOC MIME type', () => {
            const file = new MockFile('document.doc', 1024, 'application/msword');
            const result = validator.validateMimeType(file);
            
            expect(result.isValid).toBe(true);
        });

        test('should validate supported DOCX MIME type', () => {
            const file = new MockFile('document.docx', 1024, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            const result = validator.validateMimeType(file);
            
            expect(result.isValid).toBe(true);
        });

        test('should validate supported TXT MIME type', () => {
            const file = new MockFile('document.txt', 1024, 'text/plain');
            const result = validator.validateMimeType(file);
            
            expect(result.isValid).toBe(true);
        });

        test('should reject unsupported MIME type', () => {
            const file = new MockFile('image.jpg', 1024, 'image/jpeg');
            const result = validator.validateMimeType(file);
            
            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain('not supported');
        });

        test('should handle generic MIME type gracefully', () => {
            const file = new MockFile('document.pdf', 1024, 'application/octet-stream');
            const result = validator.validateMimeType(file);
            
            expect(result.isValid).toBe(true); // Should fallback to extension validation
        });

        test('should handle missing MIME type', () => {
            const file = new MockFile('document.pdf', 1024, '');
            const result = validator.validateMimeType(file);
            
            expect(result.isValid).toBe(true); // Should fallback to extension validation
        });
    });

    describe('File Extension Validation', () => {
        test('should validate supported PDF extension', () => {
            const file = new MockFile('document.pdf', 1024, '');
            const result = validator.validateFileExtension(file);
            
            expect(result.isValid).toBe(true);
        });

        test('should validate supported DOC extension', () => {
            const file = new MockFile('document.doc', 1024, '');
            const result = validator.validateFileExtension(file);
            
            expect(result.isValid).toBe(true);
        });

        test('should validate supported DOCX extension', () => {
            const file = new MockFile('document.docx', 1024, '');
            const result = validator.validateFileExtension(file);
            
            expect(result.isValid).toBe(true);
        });

        test('should validate supported TXT extension', () => {
            const file = new MockFile('document.txt', 1024, '');
            const result = validator.validateFileExtension(file);
            
            expect(result.isValid).toBe(true);
        });

        test('should be case insensitive', () => {
            const file = new MockFile('DOCUMENT.PDF', 1024, '');
            const result = validator.validateFileExtension(file);
            
            expect(result.isValid).toBe(true);
        });

        test('should reject unsupported extension', () => {
            const file = new MockFile('image.jpg', 1024, '');
            const result = validator.validateFileExtension(file);
            
            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain('not supported');
        });

        test('should reject files without extension', () => {
            const file = new MockFile('document', 1024, '');
            const result = validator.validateFileExtension(file);
            
            expect(result.isValid).toBe(false);
        });
    });

    describe('MIME Type Detection', () => {
        test('should use browser-provided MIME type when available', () => {
            const file = new MockFile('document.pdf', 1024, 'application/pdf');
            const mimeType = validator.detectMimeType(file);
            
            expect(mimeType).toBe('application/pdf');
        });

        test('should fallback to extension-based detection for PDF', () => {
            const file = new MockFile('document.pdf', 1024, '');
            const mimeType = validator.detectMimeType(file);
            
            expect(mimeType).toBe('application/pdf');
        });

        test('should fallback to extension-based detection for DOC', () => {
            const file = new MockFile('document.doc', 1024, '');
            const mimeType = validator.detectMimeType(file);
            
            expect(mimeType).toBe('application/msword');
        });

        test('should fallback to extension-based detection for DOCX', () => {
            const file = new MockFile('document.docx', 1024, '');
            const mimeType = validator.detectMimeType(file);
            
            expect(mimeType).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        });

        test('should fallback to extension-based detection for TXT', () => {
            const file = new MockFile('document.txt', 1024, '');
            const mimeType = validator.detectMimeType(file);
            
            expect(mimeType).toBe('text/plain');
        });

        test('should handle generic MIME type with extension fallback', () => {
            const file = new MockFile('document.pdf', 1024, 'application/octet-stream');
            const mimeType = validator.detectMimeType(file);
            
            expect(mimeType).toBe('application/pdf');
        });
    });

    describe('Complete File Validation', () => {
        test('should validate a valid PDF file', () => {
            const file = new MockFile('document.pdf', 1024 * 1024, 'application/pdf');
            const result = validator.validateFile(file);
            
            expect(result.isValid).toBe(true);
            expect(result.mimeType).toBe('application/pdf');
            expect(result.errorMessage).toBeNull();
        });

        test('should validate a valid DOC file', () => {
            const file = new MockFile('document.doc', 1024 * 1024, 'application/msword');
            const result = validator.validateFile(file);
            
            expect(result.isValid).toBe(true);
            expect(result.mimeType).toBe('application/msword');
        });

        test('should validate a valid DOCX file', () => {
            const file = new MockFile('document.docx', 1024 * 1024, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            const result = validator.validateFile(file);
            
            expect(result.isValid).toBe(true);
            expect(result.mimeType).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        });

        test('should validate a valid TXT file', () => {
            const file = new MockFile('document.txt', 1024, 'text/plain');
            const result = validator.validateFile(file);
            
            expect(result.isValid).toBe(true);
            expect(result.mimeType).toBe('text/plain');
        });

        test('should reject null file', () => {
            const result = validator.validateFile(null);
            
            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain('No file provided');
        });

        test('should reject file that is too large', () => {
            const file = new MockFile('large.pdf', 10 * 1024 * 1024, 'application/pdf');
            const result = validator.validateFile(file);
            
            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain('exceeds the maximum allowed size');
        });

        test('should reject unsupported file type', () => {
            const file = new MockFile('image.jpg', 1024, 'image/jpeg');
            const result = validator.validateFile(file);
            
            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain('not supported');
        });
    });

    describe('File Size Formatting', () => {
        test('should format bytes correctly', () => {
            expect(validator.formatFileSize(0)).toBe('0 B');
            expect(validator.formatFileSize(512)).toBe('512.0 B');
            expect(validator.formatFileSize(1024)).toBe('1.0 KB');
            expect(validator.formatFileSize(1536)).toBe('1.5 KB');
            expect(validator.formatFileSize(1024 * 1024)).toBe('1.0 MB');
            expect(validator.formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB');
        });

        test('should handle edge cases in file size formatting', () => {
            expect(validator.formatFileSize(-1)).toBe('0 B');
            expect(validator.formatFileSize(null)).toBe('0 B');
            expect(validator.formatFileSize(undefined)).toBe('0 B');
            expect(validator.formatFileSize(NaN)).toBe('0 B');
            expect(validator.formatFileSize('invalid')).toBe('0 B');
        });
    });

    describe('File Metadata', () => {
        test('should extract complete file metadata', () => {
            const file = new MockFile('document.pdf', 1024 * 1024, 'application/pdf', 1640995200000);
            const metadata = validator.getFileMetadata(file);
            
            expect(metadata.name).toBe('document.pdf');
            expect(metadata.size).toBe(1024 * 1024);
            expect(metadata.type).toBe('application/pdf');
            expect(metadata.lastModified).toBe(1640995200000);
            expect(metadata.formattedSize).toBe('1.0 MB');
            expect(metadata.extension).toBe('.pdf');
        });

        test('should handle files without extension', () => {
            const file = new MockFile('document', 1024, 'text/plain');
            const metadata = validator.getFileMetadata(file);
            
            expect(metadata.extension).toBe('');
        });
    });

    describe('Utility Methods', () => {
        test('should get supported formats display names', () => {
            const formats = validator.getSupportedFormatsDisplay();
            
            expect(formats).toContain('PDF');
            expect(formats).toContain('DOC');
            expect(formats).toContain('DOCX');
            expect(formats).toContain('TXT');
        });

        test('should extract file extension correctly', () => {
            expect(validator.getFileExtension('document.pdf')).toBe('.pdf');
            expect(validator.getFileExtension('document.test.docx')).toBe('.docx');
            expect(validator.getFileExtension('document')).toBe('');
            expect(validator.getFileExtension('.hidden')).toBe('.hidden');
        });
    });
});

// Run the tests
console.log('Running FileValidator tests...\n');

// Initialize validator for tests
let validator;

describe('FileValidator', () => {
    beforeEach(() => {
        validator = new FileValidator();
    });

    describe('Constructor and Configuration', () => {
        test('should initialize with default configuration', () => {
            expect(validator.config.maxFileSize).toBe(5 * 1024 * 1024); // 5MB
            expect(validator.config.supportedFormats).toContain('application/pdf');
            expect(validator.config.supportedFormats).toContain('application/msword');
            expect(validator.config.supportedFormats).toContain('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            expect(validator.config.supportedFormats).toContain('text/plain');
        });

        test('should accept custom configuration', () => {
            const customValidator = new FileValidator({
                maxFileSize: 10 * 1024 * 1024, // 10MB
                supportedFormats: ['application/pdf']
            });
            
            expect(customValidator.config.maxFileSize).toBe(10 * 1024 * 1024);
            expect(customValidator.config.supportedFormats).toEqual(['application/pdf']);
        });
    });

    describe('File Size Validation', () => {
        test('should validate file size within limits', () => {
            const file = new MockFile('test.pdf', 1024 * 1024, 'application/pdf'); // 1MB
            const result = validator.validateFileSize(file);
            
            expect(result.isValid).toBe(true);
        });

        test('should reject files exceeding size limit', () => {
            const file = new MockFile('large.pdf', 10 * 1024 * 1024, 'application/pdf'); // 10MB
            const result = validator.validateFileSize(file);
            
            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain('exceeds the maximum allowed size');
        });

        test('should reject empty files', () => {
            const file = new MockFile('empty.pdf', 0, 'application/pdf');
            const result = validator.validateFileSize(file);
            
            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain('empty or corrupted');
        });

        test('should reject files with negative size', () => {
            const file = new MockFile('invalid.pdf', -1, 'application/pdf');
            const result = validator.validateFileSize(file);
            
            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain('empty or corrupted');
        });
    });

    describe('MIME Type Validation', () => {
        test('should validate supported PDF MIME type', () => {
            const file = new MockFile('document.pdf', 1024, 'application/pdf');
            const result = validator.validateMimeType(file);
            
            expect(result.isValid).toBe(true);
        });

        test('should validate supported DOC MIME type', () => {
            const file = new MockFile('document.doc', 1024, 'application/msword');
            const result = validator.validateMimeType(file);
            
            expect(result.isValid).toBe(true);
        });

        test('should validate supported DOCX MIME type', () => {
            const file = new MockFile('document.docx', 1024, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            const result = validator.validateMimeType(file);
            
            expect(result.isValid).toBe(true);
        });

        test('should validate supported TXT MIME type', () => {
            const file = new MockFile('document.txt', 1024, 'text/plain');
            const result = validator.validateMimeType(file);
            
            expect(result.isValid).toBe(true);
        });

        test('should reject unsupported MIME type', () => {
            const file = new MockFile('image.jpg', 1024, 'image/jpeg');
            const result = validator.validateMimeType(file);
            
            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain('not supported');
        });

        test('should handle generic MIME type gracefully', () => {
            const file = new MockFile('document.pdf', 1024, 'application/octet-stream');
            const result = validator.validateMimeType(file);
            
            expect(result.isValid).toBe(true); // Should fallback to extension validation
        });

        test('should handle missing MIME type', () => {
            const file = new MockFile('document.pdf', 1024, '');
            const result = validator.validateMimeType(file);
            
            expect(result.isValid).toBe(true); // Should fallback to extension validation
        });
    });

    describe('File Extension Validation', () => {
        test('should validate supported PDF extension', () => {
            const file = new MockFile('document.pdf', 1024, '');
            const result = validator.validateFileExtension(file);
            
            expect(result.isValid).toBe(true);
        });

        test('should validate supported DOC extension', () => {
            const file = new MockFile('document.doc', 1024, '');
            const result = validator.validateFileExtension(file);
            
            expect(result.isValid).toBe(true);
        });

        test('should validate supported DOCX extension', () => {
            const file = new MockFile('document.docx', 1024, '');
            const result = validator.validateFileExtension(file);
            
            expect(result.isValid).toBe(true);
        });

        test('should validate supported TXT extension', () => {
            const file = new MockFile('document.txt', 1024, '');
            const result = validator.validateFileExtension(file);
            
            expect(result.isValid).toBe(true);
        });

        test('should be case insensitive', () => {
            const file = new MockFile('DOCUMENT.PDF', 1024, '');
            const result = validator.validateFileExtension(file);
            
            expect(result.isValid).toBe(true);
        });

        test('should reject unsupported extension', () => {
            const file = new MockFile('image.jpg', 1024, '');
            const result = validator.validateFileExtension(file);
            
            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain('not supported');
        });

        test('should reject files without extension', () => {
            const file = new MockFile('document', 1024, '');
            const result = validator.validateFileExtension(file);
            
            expect(result.isValid).toBe(false);
        });
    });

    describe('MIME Type Detection', () => {
        test('should use browser-provided MIME type when available', () => {
            const file = new MockFile('document.pdf', 1024, 'application/pdf');
            const mimeType = validator.detectMimeType(file);
            
            expect(mimeType).toBe('application/pdf');
        });

        test('should fallback to extension-based detection for PDF', () => {
            const file = new MockFile('document.pdf', 1024, '');
            const mimeType = validator.detectMimeType(file);
            
            expect(mimeType).toBe('application/pdf');
        });

        test('should fallback to extension-based detection for DOC', () => {
            const file = new MockFile('document.doc', 1024, '');
            const mimeType = validator.detectMimeType(file);
            
            expect(mimeType).toBe('application/msword');
        });

        test('should fallback to extension-based detection for DOCX', () => {
            const file = new MockFile('document.docx', 1024, '');
            const mimeType = validator.detectMimeType(file);
            
            expect(mimeType).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        });

        test('should fallback to extension-based detection for TXT', () => {
            const file = new MockFile('document.txt', 1024, '');
            const mimeType = validator.detectMimeType(file);
            
            expect(mimeType).toBe('text/plain');
        });

        test('should handle generic MIME type with extension fallback', () => {
            const file = new MockFile('document.pdf', 1024, 'application/octet-stream');
            const mimeType = validator.detectMimeType(file);
            
            expect(mimeType).toBe('application/pdf');
        });
    });

    describe('Complete File Validation', () => {
        test('should validate a valid PDF file', () => {
            const file = new MockFile('document.pdf', 1024 * 1024, 'application/pdf');
            const result = validator.validateFile(file);
            
            expect(result.isValid).toBe(true);
            expect(result.mimeType).toBe('application/pdf');
            expect(result.errorMessage).toBeNull();
        });

        test('should validate a valid DOC file', () => {
            const file = new MockFile('document.doc', 1024 * 1024, 'application/msword');
            const result = validator.validateFile(file);
            
            expect(result.isValid).toBe(true);
            expect(result.mimeType).toBe('application/msword');
        });

        test('should validate a valid DOCX file', () => {
            const file = new MockFile('document.docx', 1024 * 1024, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            const result = validator.validateFile(file);
            
            expect(result.isValid).toBe(true);
            expect(result.mimeType).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        });

        test('should validate a valid TXT file', () => {
            const file = new MockFile('document.txt', 1024, 'text/plain');
            const result = validator.validateFile(file);
            
            expect(result.isValid).toBe(true);
            expect(result.mimeType).toBe('text/plain');
        });

        test('should reject null file', () => {
            const result = validator.validateFile(null);
            
            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain('No file provided');
        });

        test('should reject file that is too large', () => {
            const file = new MockFile('large.pdf', 10 * 1024 * 1024, 'application/pdf');
            const result = validator.validateFile(file);
            
            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain('exceeds the maximum allowed size');
        });

        test('should reject unsupported file type', () => {
            const file = new MockFile('image.jpg', 1024, 'image/jpeg');
            const result = validator.validateFile(file);
            
            expect(result.isValid).toBe(false);
            expect(result.errorMessage).toContain('not supported');
        });
    });

    describe('File Size Formatting', () => {
        test('should format bytes correctly', () => {
            expect(validator.formatFileSize(0)).toBe('0 B');
            expect(validator.formatFileSize(512)).toBe('512.0 B');
            expect(validator.formatFileSize(1024)).toBe('1.0 KB');
            expect(validator.formatFileSize(1536)).toBe('1.5 KB');
            expect(validator.formatFileSize(1024 * 1024)).toBe('1.0 MB');
            expect(validator.formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB');
        });

        test('should handle edge cases in file size formatting', () => {
            expect(validator.formatFileSize(-1)).toBe('0 B');
            expect(validator.formatFileSize(null)).toBe('0 B');
            expect(validator.formatFileSize(undefined)).toBe('0 B');
            expect(validator.formatFileSize(NaN)).toBe('0 B');
            expect(validator.formatFileSize('invalid')).toBe('0 B');
        });
    });

    describe('File Metadata', () => {
        test('should extract complete file metadata', () => {
            const file = new MockFile('document.pdf', 1024 * 1024, 'application/pdf', 1640995200000);
            const metadata = validator.getFileMetadata(file);
            
            expect(metadata.name).toBe('document.pdf');
            expect(metadata.size).toBe(1024 * 1024);
            expect(metadata.type).toBe('application/pdf');
            expect(metadata.lastModified).toBe(1640995200000);
            expect(metadata.formattedSize).toBe('1.0 MB');
            expect(metadata.extension).toBe('.pdf');
        });

        test('should handle files without extension', () => {
            const file = new MockFile('document', 1024, 'text/plain');
            const metadata = validator.getFileMetadata(file);
            
            expect(metadata.extension).toBe('');
        });
    });

    describe('Utility Methods', () => {
        test('should get supported formats display names', () => {
            const formats = validator.getSupportedFormatsDisplay();
            
            expect(formats).toContain('PDF');
            expect(formats).toContain('DOC');
            expect(formats).toContain('DOCX');
            expect(formats).toContain('TXT');
        });

        test('should extract file extension correctly', () => {
            expect(validator.getFileExtension('document.pdf')).toBe('.pdf');
            expect(validator.getFileExtension('document.test.docx')).toBe('.docx');
            expect(validator.getFileExtension('document')).toBe('');
            expect(validator.getFileExtension('.hidden')).toBe('.hidden');
        });
    });
});

// Print test results
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

describe('Enhanced Error Handling and Edge Cases', () => {
    let validator;

    beforeEach(() => {
        validator = new FileValidator();
    });

    test('should handle invalid file object', () => {
        const invalidFile = { name: null, size: 'invalid' };
        const result = validator.validateFile(invalidFile);
        
        expect(result.isValid).toBe(false);
        expect(result.errorCode).toBe('INVALID_FILE_OBJECT');
        expect(result.errorMessage).toContain('Invalid file object');
    });

    test('should provide helpful size limit suggestions for extremely large files', () => {
        const hugeFile = new MockFile('huge.pdf', 50 * 1024 * 1024, 'application/pdf'); // 50MB
        const result = validator.validateFile(hugeFile);
        
        expect(result.isValid).toBe(false);
        expect(result.errorCode).toBe('FILE_TOO_LARGE');
        expect(result.errorMessage).toContain('compressing');
    });

    test('should provide format conversion suggestions for images', () => {
        const imageFile = new MockFile('scan.jpg', 1024, 'image/jpeg');
        const result = validator.validateFile(imageFile);
        
        expect(result.isValid).toBe(false);
        expect(result.errorCode).toBe('UNSUPPORTED_MIME_TYPE');
        expect(result.errorMessage).toContain('converting it to PDF');
    });

    test('should detect suspicious filenames with executable extensions', () => {
        const suspiciousFile = new MockFile('document.exe', 1024, 'application/octet-stream');
        const result = validator.validateFile(suspiciousFile);
        
        expect(result.isValid).toBe(false);
        // Could be either SUSPICIOUS_FILENAME or UNSUPPORTED_EXTENSION depending on validation order
        expect(result.errorCode === 'SUSPICIOUS_FILENAME' || result.errorCode === 'UNSUPPORTED_EXTENSION').toBe(true);
    });

    test('should detect multiple extensions security risk', () => {
        const multiExtFile = new MockFile('document.pdf.exe', 1024, 'application/pdf');
        const result = validator.validateFile(multiExtFile);
        
        expect(result.isValid).toBe(false);
        // Could be either MULTIPLE_EXTENSIONS or UNSUPPORTED_EXTENSION depending on validation order
        expect(result.errorCode === 'MULTIPLE_EXTENSIONS' || result.errorCode === 'UNSUPPORTED_EXTENSION').toBe(true);
    });

    test('should reject files with very long names', () => {
        const longName = 'a'.repeat(300) + '.pdf';
        const longNameFile = new MockFile(longName, 1024, 'application/pdf');
        const result = validator.validateFile(longNameFile);
        
        expect(result.isValid).toBe(false);
        expect(result.errorCode).toBe('FILENAME_TOO_LONG');
        expect(result.errorMessage).toContain('too long');
    });

    test('should handle files with invalid characters in name', () => {
        const invalidCharFile = new MockFile('document<test>.pdf', 1024, 'application/pdf');
        const result = validator.validateFile(invalidCharFile);
        
        expect(result.isValid).toBe(false);
        expect(result.errorCode).toBe('SUSPICIOUS_FILENAME');
    });

    test('should provide extension-specific conversion suggestions', () => {
        const rtfFile = new MockFile('document.rtf', 1024, 'application/rtf');
        const result = validator.validateFile(rtfFile);
        
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toContain('convert your file');
    });

    test('should warn about very small files', () => {
        const tinyFile = new MockFile('tiny.txt', 50, 'text/plain'); // 50 bytes
        const originalWarn = console.warn;
        let warnCalled = false;
        console.warn = (message) => {
            if (message.includes('very small')) {
                warnCalled = true;
            }
        };
        
        const result = validator.validateFile(tinyFile);
        
        expect(result.isValid).toBe(true); // Should still be valid
        expect(warnCalled).toBe(true);
        
        console.warn = originalWarn;
    });
});