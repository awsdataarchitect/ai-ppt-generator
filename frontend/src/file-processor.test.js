/**
 * Unit tests for FileProcessor class
 * Tests base64 conversion with multiple MIME types and error handling
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
        toMatch: (pattern) => {
            if (!pattern.test(actual)) {
                throw new Error(`Expected ${actual} to match pattern ${pattern}`);
            }
        }
    };
}

// Mock File constructor for testing
class MockFile {
    constructor(name, size, type, content = 'test content', lastModified = Date.now()) {
        this.name = name;
        this.size = size;
        this.type = type;
        this.lastModified = lastModified;
        this._content = content;
    }
}

// Mock FileReader for testing
class MockFileReader {
    constructor() {
        this.result = null;
        this.error = null;
        this.onload = null;
        this.onerror = null;
        this.onabort = null;
    }

    readAsDataURL(file) {
        setTimeout(() => {
            if (file && file._content) {
                // Create a simple base64 representation
                const base64Content = btoa(file._content);
                const mimeType = file.type || 'application/octet-stream';
                this.result = `data:${mimeType};base64,${base64Content}`;
                if (this.onload) this.onload();
            } else {
                this.error = { message: 'Invalid file' };
                if (this.onerror) this.onerror();
            }
        }, 10);
    }
}

// Mock validator
class MockValidator {
    validateFile(file) {
        if (!file) {
            return { isValid: false, errorMessage: 'No file provided' };
        }
        if (file.size > 5 * 1024 * 1024) {
            return { isValid: false, errorMessage: 'File too large' };
        }
        if (!['application/pdf', 'application/msword', 'text/plain'].includes(file.type)) {
            return { isValid: false, errorMessage: 'Unsupported file type' };
        }
        return { isValid: true };
    }

    detectMimeType(file) {
        return file.type || 'application/octet-stream';
    }

    getFileMetadata(file) {
        return {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            formattedSize: `${file.size} B`,
            extension: file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : ''
        };
    }
}

// Import FileProcessor
const { FileProcessor, FileProcessingError } = require('./file-processor.js');

// Mock global FileReader
global.FileReader = MockFileReader;
global.btoa = (str) => Buffer.from(str).toString('base64');

describe('FileProcessor', () => {
    let processor;
    let validator;

    beforeEach(() => {
        validator = new MockValidator();
        processor = new FileProcessor(validator);
    });

    describe('Constructor', () => {
        test('should initialize with validator', () => {
            expect(processor.validator).toBe(validator);
        });

        test('should initialize without validator', () => {
            const processorWithoutValidator = new FileProcessor();
            expect(processorWithoutValidator.validator).toBeNull();
        });

        test('should have MIME type prefixes configured', () => {
            expect(processor.mimeTypePrefixes['application/pdf']).toBe('data:application/pdf;base64,');
            expect(processor.mimeTypePrefixes['application/msword']).toBe('data:application/msword;base64,');
            expect(processor.mimeTypePrefixes['text/plain']).toBe('data:text/plain;base64,');
        });
    });

    describe('MIME Type Detection', () => {
        test('should use validator MIME type detection when available', () => {
            const file = new MockFile('test.pdf', 1024, 'application/pdf');
            const mimeType = processor.detectMimeType(file);
            expect(mimeType).toBe('application/pdf');
        });

        test('should fallback to file type when validator not available', () => {
            const processorWithoutValidator = new FileProcessor();
            const file = new MockFile('test.pdf', 1024, 'application/pdf');
            const mimeType = processorWithoutValidator.detectMimeType(file);
            expect(mimeType).toBe('application/pdf');
        });

        test('should use extension-based detection for PDF', () => {
            const processorWithoutValidator = new FileProcessor();
            const file = new MockFile('test.pdf', 1024, '');
            const mimeType = processorWithoutValidator.detectMimeType(file);
            expect(mimeType).toBe('application/pdf');
        });

        test('should use extension-based detection for DOC', () => {
            const processorWithoutValidator = new FileProcessor();
            const file = new MockFile('test.doc', 1024, '');
            const mimeType = processorWithoutValidator.detectMimeType(file);
            expect(mimeType).toBe('application/msword');
        });

        test('should use extension-based detection for DOCX', () => {
            const processorWithoutValidator = new FileProcessor();
            const file = new MockFile('test.docx', 1024, '');
            const mimeType = processorWithoutValidator.detectMimeType(file);
            expect(mimeType).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        });

        test('should use extension-based detection for TXT', () => {
            const processorWithoutValidator = new FileProcessor();
            const file = new MockFile('test.txt', 1024, '');
            const mimeType = processorWithoutValidator.detectMimeType(file);
            expect(mimeType).toBe('text/plain');
        });
    });

    describe('Base64 Conversion', () => {
        test('should convert file to base64 without data URL prefix', async () => {
            const file = new MockFile('test.pdf', 1024, 'application/pdf', 'test content');
            const base64 = await processor.convertToBase64(file);
            
            expect(base64).toBe(btoa('test content'));
        });

        test('should handle FileReader errors', async () => {
            const file = new MockFile('test.pdf', 1024, 'application/pdf');
            file._content = null; // This will cause an error in our mock
            
            try {
                await processor.convertToBase64(file);
                throw new Error('Should have thrown an error');
            } catch (error) {
                expect(error.message).toContain('FileReader error');
            }
        });

        test('should handle null file', async () => {
            try {
                await processor.convertToBase64(null);
                throw new Error('Should have thrown an error');
            } catch (error) {
                expect(error.message).toContain('No file provided');
            }
        });
    });

    describe('File to Base64 with Options', () => {
        test('should convert PDF file to base64 without data URL', async () => {
            const file = new MockFile('test.pdf', 1024, 'application/pdf', 'test content');
            const result = await processor.fileToBase64(file);
            
            expect(result.success).toBe(true);
            expect(result.base64Data).toBe(btoa('test content'));
            expect(result.mimeType).toBe('application/pdf');
            expect(result.filename).toBe('test.pdf');
            expect(result.size).toBe(1024);
        });

        test('should convert PDF file to base64 with data URL', async () => {
            const file = new MockFile('test.pdf', 1024, 'application/pdf', 'test content');
            const result = await processor.fileToBase64(file, { includeDataUrl: true });
            
            expect(result.success).toBe(true);
            expect(result.base64Data).toBe(`data:application/pdf;base64,${btoa('test content')}`);
            expect(result.mimeType).toBe('application/pdf');
        });

        test('should convert DOC file with correct MIME type', async () => {
            const file = new MockFile('test.doc', 1024, 'application/msword', 'test content');
            const result = await processor.fileToBase64(file, { includeDataUrl: true });
            
            expect(result.success).toBe(true);
            expect(result.base64Data).toBe(`data:application/msword;base64,${btoa('test content')}`);
            expect(result.mimeType).toBe('application/msword');
        });

        test('should convert TXT file with correct MIME type', async () => {
            const file = new MockFile('test.txt', 1024, 'text/plain', 'test content');
            const result = await processor.fileToBase64(file, { includeDataUrl: true });
            
            expect(result.success).toBe(true);
            expect(result.base64Data).toBe(`data:text/plain;base64,${btoa('test content')}`);
            expect(result.mimeType).toBe('text/plain');
        });

        test('should skip validation when disabled', async () => {
            const file = new MockFile('test.jpg', 1024, 'image/jpeg', 'test content');
            const result = await processor.fileToBase64(file, { validateFile: false });
            
            expect(result.success).toBe(true);
            expect(result.mimeType).toBe('image/jpeg');
        });

        test('should fail validation for unsupported file type', async () => {
            const file = new MockFile('test.jpg', 1024, 'image/jpeg', 'test content');
            
            try {
                await processor.fileToBase64(file);
                throw new Error('Should have thrown an error');
            } catch (error) {
                expect(error).toBeInstanceOf(FileProcessingError);
                expect(error.code).toBe('FILE_VALIDATION_FAILED');
            }
        });

        test('should fail validation for file too large', async () => {
            const file = new MockFile('large.pdf', 10 * 1024 * 1024, 'application/pdf', 'test content');
            
            try {
                await processor.fileToBase64(file);
                throw new Error('Should have thrown an error');
            } catch (error) {
                expect(error).toBeInstanceOf(FileProcessingError);
                expect(error.code).toBe('FILE_VALIDATION_FAILED');
            }
        });
    });

    describe('Multiple File Processing', () => {
        test('should process multiple valid files', async () => {
            const files = [
                new MockFile('test1.pdf', 1024, 'application/pdf', 'content1'),
                new MockFile('test2.txt', 512, 'text/plain', 'content2')
            ];
            
            const result = await processor.processMultipleFiles(files);
            
            expect(result.totalProcessed).toBe(2);
            expect(result.successCount).toBe(2);
            expect(result.errorCount).toBe(0);
            expect(result.results.length).toBe(2);
        });

        test('should handle mixed valid and invalid files', async () => {
            const files = [
                new MockFile('test1.pdf', 1024, 'application/pdf', 'content1'),
                new MockFile('test2.jpg', 512, 'image/jpeg', 'content2'), // Invalid
                new MockFile('test3.txt', 256, 'text/plain', 'content3')
            ];
            
            const result = await processor.processMultipleFiles(files);
            
            expect(result.totalProcessed).toBe(3);
            expect(result.successCount).toBe(2);
            expect(result.errorCount).toBe(1);
            expect(result.errors[0].filename).toBe('test2.jpg');
        });

        test('should stop on first error when continueOnError is false', async () => {
            const files = [
                new MockFile('test1.jpg', 1024, 'image/jpeg', 'content1'), // Invalid
                new MockFile('test2.pdf', 512, 'application/pdf', 'content2')
            ];
            
            try {
                await processor.processMultipleFiles(files, { continueOnError: false });
                throw new Error('Should have thrown an error');
            } catch (error) {
                expect(error).toBeInstanceOf(FileProcessingError);
            }
        });
    });

    describe('File Metadata', () => {
        test('should get file metadata using validator', () => {
            const file = new MockFile('test.pdf', 1024, 'application/pdf');
            const metadata = processor.getFileMetadata(file);
            
            expect(metadata.name).toBe('test.pdf');
            expect(metadata.size).toBe(1024);
            expect(metadata.type).toBe('application/pdf');
        });

        test('should get file metadata without validator', () => {
            const processorWithoutValidator = new FileProcessor();
            const file = new MockFile('test.pdf', 1024, 'application/pdf');
            const metadata = processorWithoutValidator.getFileMetadata(file);
            
            expect(metadata.name).toBe('test.pdf');
            expect(metadata.size).toBe(1024);
            expect(metadata.type).toBe('application/pdf');
        });
    });

    describe('Utility Methods', () => {
        test('should format file size correctly', () => {
            expect(processor.formatFileSize(0)).toBe('0 B');
            expect(processor.formatFileSize(1024)).toBe('1.0 KB');
            expect(processor.formatFileSize(1024 * 1024)).toBe('1.0 MB');
        });

        test('should handle invalid file sizes', () => {
            expect(processor.formatFileSize(-1)).toBe('0 B');
            expect(processor.formatFileSize(null)).toBe('0 B');
            expect(processor.formatFileSize(undefined)).toBe('0 B');
            expect(processor.formatFileSize(NaN)).toBe('0 B');
        });

        test('should extract file extension', () => {
            expect(processor.getFileExtension('test.pdf')).toBe('.pdf');
            expect(processor.getFileExtension('document.test.docx')).toBe('.docx');
            expect(processor.getFileExtension('noextension')).toBe('');
        });
    });

    describe('Error Handling', () => {
        test('should create FileProcessingError with correct properties', () => {
            const error = new FileProcessingError('TEST_CODE', 'Test message', { detail: 'test' });
            
            expect(error.name).toBe('FileProcessingError');
            expect(error.code).toBe('TEST_CODE');
            expect(error.message).toBe('Test message');
            expect(error.details.detail).toBe('test');
            expect(error.timestamp).toBeTruthy();
        });

        test('should wrap conversion errors in FileProcessingError', async () => {
            // Create a file that will cause FileReader to fail
            const file = new MockFile('test.pdf', 1024, 'application/pdf');
            file._content = null;
            
            try {
                await processor.fileToBase64(file, { validateFile: false });
                throw new Error('Should have thrown an error');
            } catch (error) {
                expect(error).toBeInstanceOf(FileProcessingError);
                expect(error.code).toBe('CONVERSION_FAILED');
            }
        });
    });
});

// Run the tests
console.log('Running FileProcessor tests...\n');

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
}, 100);d
escribe('Enhanced Error Handling and Edge Cases', () => {
    let processor;
    let validator;

    beforeEach(() => {
        validator = new MockValidator();
        processor = new FileProcessor(validator);
    });

    test('should provide specific error for security errors', async () => {
        const file = new MockFile('test.pdf', 1024, 'application/pdf', 'content');
        
        // Mock FileReader to throw SecurityError
        const originalFileReader = global.FileReader;
        global.FileReader = class extends MockFileReader {
            readAsDataURL(file) {
                setTimeout(() => {
                    const error = new Error('Security error');
                    error.name = 'SecurityError';
                    this.error = error;
                    if (this.onerror) this.onerror();
                }, 10);
            }
        };

        try {
            await processor.fileToBase64(file, { validateFile: false });
            throw new Error('Should have thrown an error');
        } catch (error) {
            expect(error).toBeInstanceOf(FileProcessingError);
            expect(error.code).toBe('SECURITY_ERROR');
            expect(error.message).toContain('security restrictions');
        } finally {
            global.FileReader = originalFileReader;
        }
    });

    test('should provide specific error for not readable files', async () => {
        const file = new MockFile('test.pdf', 1024, 'application/pdf', 'content');
        
        // Mock FileReader to throw NotReadableError
        const originalFileReader = global.FileReader;
        global.FileReader = class extends MockFileReader {
            readAsDataURL(file) {
                setTimeout(() => {
                    const error = new Error('File not readable');
                    error.name = 'NotReadableError';
                    this.error = error;
                    if (this.onerror) this.onerror();
                }, 10);
            }
        };

        try {
            await processor.fileToBase64(file, { validateFile: false });
            throw new Error('Should have thrown an error');
        } catch (error) {
            expect(error).toBeInstanceOf(FileProcessingError);
            expect(error.code).toBe('FILE_NOT_READABLE');
            expect(error.message).toContain('corrupted or in use');
        } finally {
            global.FileReader = originalFileReader;
        }
    });

    test('should handle file reading abortion gracefully', async () => {
        const file = new MockFile('test.pdf', 1024, 'application/pdf', 'content');
        
        // Mock FileReader to simulate abortion
        const originalFileReader = global.FileReader;
        global.FileReader = class extends MockFileReader {
            readAsDataURL(file) {
                setTimeout(() => {
                    if (this.onabort) this.onabort();
                }, 10);
            }
        };

        try {
            await processor.fileToBase64(file, { validateFile: false });
            throw new Error('Should have thrown an error');
        } catch (error) {
            expect(error).toBeInstanceOf(FileProcessingError);
            expect(error.message).toContain('cancelled');
        } finally {
            global.FileReader = originalFileReader;
        }
    });

    test('should include file metadata in error details', async () => {
        const file = new MockFile('test.pdf', 1024, 'application/pdf');
        file._content = null; // This will cause an error

        try {
            await processor.fileToBase64(file, { validateFile: false });
            throw new Error('Should have thrown an error');
        } catch (error) {
            expect(error).toBeInstanceOf(FileProcessingError);
            expect(error.details.filename).toBe('test.pdf');
            expect(error.details.fileSize).toBe(1024);
            expect(error.details.mimeType).toBe('application/pdf');
        }
    });

    test('should handle concurrent file processing with mixed results', async () => {
        const files = [
            new MockFile('valid1.pdf', 1024, 'application/pdf', 'content1'),
            new MockFile('invalid.jpg', 512, 'image/jpeg', 'content2'), // Invalid
            new MockFile('valid2.txt', 256, 'text/plain', 'content3'),
            new MockFile('toolarge.pdf', 10 * 1024 * 1024, 'application/pdf', 'content4'), // Too large
        ];
        
        const result = await processor.processMultipleFiles(files, { maxConcurrent: 2 });
        
        expect(result.totalProcessed).toBe(4);
        expect(result.successCount).toBe(2);
        expect(result.errorCount).toBe(2);
        
        // Check that errors contain helpful information
        const errors = result.errors;
        expect(errors.some(e => e.filename === 'invalid.jpg')).toBe(true);
        expect(errors.some(e => e.filename === 'toolarge.pdf')).toBe(true);
    });

    test('should respect maxConcurrent setting', async () => {
        const files = Array.from({ length: 10 }, (_, i) => 
            new MockFile(`file${i}.pdf`, 1024, 'application/pdf', `content${i}`)
        );
        
        const startTime = Date.now();
        const result = await processor.processMultipleFiles(files, { maxConcurrent: 2 });
        const endTime = Date.now();
        
        expect(result.successCount).toBe(10);
        // With maxConcurrent=2, processing should take longer than if all were processed simultaneously
        // This is a rough test - in real scenarios the timing would be more predictable
        expect(endTime - startTime).toBeGreaterThan(40); // At least 40ms for batched processing
    });
});