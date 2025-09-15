/**
 * Backend Lambda Security Scanner
 * 
 * Analyzes Python Lambda functions for server-side security vulnerabilities including:
 * - SQL injection in DynamoDB queries
 * - Command injection in document processing
 * - Path traversal vulnerabilities
 * - Information disclosure in error handling
 * - Input validation issues
 * - Insecure deserialization
 * - Authentication/authorization bypasses
 */

import * as fs from 'fs';
import * as path from 'path';
import { ISecurityScanner } from '../interfaces/ScannerInterface';
import { VulnerabilityFinding, VulnerabilitySeverity, VulnerabilityCategory } from '../types/VulnerabilityTypes';
import { FileSystemConfig } from '../config/FileSystemConfig';

export interface BackendScanResult {
  success: boolean;
  findings: VulnerabilityFinding[];
  scannedFiles: string[];
  summary: {
    totalFiles: number;
    vulnerableFiles: number;
    criticalFindings: number;
    highFindings: number;
    mediumFindings: number;
    lowFindings: number;
  };
}

export class BackendSecurityScanner {
  private config: FileSystemConfig;
  private findings: VulnerabilityFinding[] = [];
  private scannedFiles: string[] = [];

  constructor(config: FileSystemConfig) {
    this.config = config;
  }

  /**
   * Scan all Python Lambda functions for security vulnerabilities
   */
  public async scan(): Promise<BackendScanResult> {
    this.findings = [];
    this.scannedFiles = [];

    try {
      const lambdaDir = path.join(this.config.getProjectRoot(), 'backend', 'lambda_functions');
      
      if (!fs.existsSync(lambdaDir)) {
        throw new Error(`Lambda functions directory not found: ${lambdaDir}`);
      }

      // Get all Python files in the Lambda functions directory
      const pythonFiles = this.getPythonFiles(lambdaDir);
      
      for (const filePath of pythonFiles) {
        await this.scanPythonFile(filePath);
      }

      return this.generateScanResult();
    } catch (error) {
      return {
        success: false,
        findings: [],
        scannedFiles: [],
        summary: {
          totalFiles: 0,
          vulnerableFiles: 0,
          criticalFindings: 0,
          highFindings: 0,
          mediumFindings: 0,
          lowFindings: 0
        }
      };
    }
  }

  /**
   * Get all Python files recursively from a directory
   */
  private getPythonFiles(directory: string): string[] {
    const files: string[] = [];
    
    const items = fs.readdirSync(directory);
    
    for (const item of items) {
      const fullPath = path.join(directory, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...this.getPythonFiles(fullPath));
      } else if (item.endsWith('.py') && !item.startsWith('test_')) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  /**
   * Scan a single Python file for security vulnerabilities
   */
  private async scanPythonFile(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(this.config.getProjectRoot(), filePath);
      
      this.scannedFiles.push(relativePath);
      
      // Run all security checks
      this.checkSqlInjection(content, relativePath);
      this.checkCommandInjection(content, relativePath);
      this.checkPathTraversal(content, relativePath);
      this.checkInformationDisclosure(content, relativePath);
      this.checkInputValidation(content, relativePath);
      this.checkInsecureDeserialization(content, relativePath);
      this.checkAuthenticationBypass(content, relativePath);
      this.checkHardcodedSecrets(content, relativePath);
      this.checkInsecureRandomness(content, relativePath);
      this.checkUnsafeFileOperations(content, relativePath);
      
    } catch (error) {
      console.error(`Error scanning file ${filePath}:`, error);
    }
  }

  /**
   * Check for SQL injection vulnerabilities in DynamoDB queries
   */
  private checkSqlInjection(content: string, filePath: string): void {
    const lines = content.split('\n');
    
    // Patterns that indicate potential SQL injection in DynamoDB
    const sqlInjectionPatterns = [
      // Direct string concatenation in DynamoDB queries
      {
        pattern: /\.query\([^)]*\+[^)]*\)/g,
        description: 'DynamoDB query with string concatenation - potential injection',
        severity: VulnerabilitySeverity.HIGH
      },
      {
        pattern: /\.scan\([^)]*\+[^)]*\)/g,
        description: 'DynamoDB scan with string concatenation - potential injection',
        severity: VulnerabilitySeverity.HIGH
      },
      // Unsafe FilterExpression construction
      {
        pattern: /FilterExpression\s*=\s*[^:][^,}]*/g,
        description: 'DynamoDB FilterExpression without parameterization',
        severity: VulnerabilitySeverity.MEDIUM
      },
      // Unsafe KeyConditionExpression
      {
        pattern: /KeyConditionExpression\s*=\s*[^:][^,}]*/g,
        description: 'DynamoDB KeyConditionExpression without parameterization',
        severity: VulnerabilitySeverity.MEDIUM
      },
      // Direct user input in query parameters
      {
        pattern: /event\s*\[\s*['"].*?['"]\s*\].*?(?:query|scan|get_item)/g,
        description: 'Direct event parameter used in DynamoDB operation',
        severity: VulnerabilitySeverity.HIGH
      }
    ];

    sqlInjectionPatterns.forEach(({ pattern, description, severity }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = this.getLineNumber(content, match.index);
        const lineContent = lines[lineNumber - 1]?.trim() || '';
        
        this.addFinding({
          type: VulnerabilityCategory.SQL_INJECTION,
          severity,
          title: 'Potential SQL Injection in DynamoDB Query',
          description,
          file: filePath,
          line: lineNumber,
          column: match.index - content.lastIndexOf('\n', match.index),
          evidence: lineContent,
          recommendation: 'Use parameterized queries with ExpressionAttributeValues and ExpressionAttributeNames',
          cweId: 'CWE-89',
          owaspCategory: 'A03:2021 – Injection'
        });
      }
    });
  }

  /**
   * Check for command injection vulnerabilities
   */
  private checkCommandInjection(content: string, filePath: string): void {
    const lines = content.split('\n');
    
    const commandInjectionPatterns = [
      // subprocess with shell=True
      {
        pattern: /subprocess\.(call|run|Popen|check_call|check_output)\([^)]*shell\s*=\s*True/g,
        description: 'subprocess call with shell=True - potential command injection',
        severity: VulnerabilitySeverity.CRITICAL
      },
      // os.system calls
      {
        pattern: /os\.system\s*\(/g,
        description: 'os.system() call - potential command injection',
        severity: VulnerabilitySeverity.CRITICAL
      },
      // eval() calls
      {
        pattern: /\beval\s*\(/g,
        description: 'eval() call - potential code injection',
        severity: VulnerabilitySeverity.CRITICAL
      },
      // exec() calls
      {
        pattern: /\bexec\s*\(/g,
        description: 'exec() call - potential code injection',
        severity: VulnerabilitySeverity.CRITICAL
      },
      // String formatting in subprocess
      {
        pattern: /subprocess\.[^(]*\([^)]*[%{}][^)]*\)/g,
        description: 'subprocess with string formatting - potential injection',
        severity: VulnerabilitySeverity.HIGH
      }
    ];

    commandInjectionPatterns.forEach(({ pattern, description, severity }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = this.getLineNumber(content, match.index);
        const lineContent = lines[lineNumber - 1]?.trim() || '';
        
        this.addFinding({
          type: VulnerabilityCategory.COMMAND_INJECTION,
          severity,
          title: 'Potential Command Injection',
          description,
          file: filePath,
          line: lineNumber,
          column: match.index - content.lastIndexOf('\n', match.index),
          evidence: lineContent,
          recommendation: 'Use subprocess with shell=False and validate all inputs. Avoid os.system, eval, and exec.',
          cweId: 'CWE-78',
          owaspCategory: 'A03:2021 – Injection'
        });
      }
    });
  }

  /**
   * Check for path traversal vulnerabilities
   */
  private checkPathTraversal(content: string, filePath: string): void {
    const lines = content.split('\n');
    
    const pathTraversalPatterns = [
      // Direct file operations with user input
      {
        pattern: /open\s*\([^)]*(?:event\s*\[|filename)/g,
        description: 'File open with direct user input - potential path traversal',
        severity: VulnerabilitySeverity.HIGH
      },
      // S3 key construction with user input
      {
        pattern: /s3.*?Key\s*=\s*[^,}]*event\s*\[[^]]*\]/g,
        description: 'S3 key constructed with user input - potential path traversal',
        severity: VulnerabilitySeverity.MEDIUM
      },
      // File path operations without validation
      {
        pattern: /os\.path\.join\([^)]*event\s*\[[^]]*\]/g,
        description: 'Path join with user input - potential path traversal',
        severity: VulnerabilitySeverity.HIGH
      },
      // Direct file system operations
      {
        pattern: /(?:os\.remove|os\.unlink|shutil\.rmtree)\([^)]*event\s*\[[^]]*\]/g,
        description: 'File deletion with user input - potential path traversal',
        severity: VulnerabilitySeverity.CRITICAL
      }
    ];

    pathTraversalPatterns.forEach(({ pattern, description, severity }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = this.getLineNumber(content, match.index);
        const lineContent = lines[lineNumber - 1]?.trim() || '';
        
        this.addFinding({
          type: VulnerabilityCategory.PATH_TRAVERSAL,
          severity,
          title: 'Potential Path Traversal',
          description,
          file: filePath,
          line: lineNumber,
          column: match.index - content.lastIndexOf('\n', match.index),
          evidence: lineContent,
          recommendation: 'Validate and sanitize file paths. Use allowlists for permitted paths.',
          cweId: 'CWE-22',
          owaspCategory: 'A01:2021 – Broken Access Control'
        });
      }
    });
  }

  /**
   * Check for information disclosure in error handling
   */
  private checkInformationDisclosure(content: string, filePath: string): void {
    const lines = content.split('\n');
    
    const infoDisclosurePatterns = [
      // Exception details in responses
      {
        pattern: /return\s*{[^}]*str\s*\(\s*e\s*\)/g,
        description: 'Exception details returned to client - information disclosure',
        severity: VulnerabilitySeverity.MEDIUM
      },
      // Traceback in responses
      {
        pattern: /traceback\.format_exc\(\)/g,
        description: 'Traceback included in response - information disclosure',
        severity: VulnerabilitySeverity.MEDIUM
      },
      // Debug information in production
      {
        pattern: /logger\.debug\([^)]*(?:password|secret|key|token)/gi,
        description: 'Sensitive information in debug logs',
        severity: VulnerabilitySeverity.LOW
      },
      // Print statements with sensitive data
      {
        pattern: /print\([^)]*(?:password|secret|key|token)/gi,
        description: 'Sensitive information in print statements',
        severity: VulnerabilitySeverity.MEDIUM
      }
    ];

    infoDisclosurePatterns.forEach(({ pattern, description, severity }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = this.getLineNumber(content, match.index);
        const lineContent = lines[lineNumber - 1]?.trim() || '';
        
        this.addFinding({
          type: VulnerabilityCategory.INFORMATION_DISCLOSURE,
          severity,
          title: 'Information Disclosure',
          description,
          file: filePath,
          line: lineNumber,
          column: match.index - content.lastIndexOf('\n', match.index),
          evidence: lineContent,
          recommendation: 'Sanitize error messages and avoid exposing sensitive information in logs or responses',
          cweId: 'CWE-200',
          owaspCategory: 'A09:2021 – Security Logging and Monitoring Failures'
        });
      }
    });
  }

  /**
   * Check for input validation issues
   */
  private checkInputValidation(content: string, filePath: string): void {
    const lines = content.split('\n');
    
    const inputValidationPatterns = [
      // Direct use of event parameters without validation
      {
        pattern: /event\s*\.\s*get\s*\(\s*['"][^'"]*['"]\s*\)(?!\s*(?:or|and|\|\||&&))/g,
        description: 'Event parameter used without validation',
        severity: VulnerabilitySeverity.MEDIUM
      },
      // Missing input sanitization for file uploads
      {
        pattern: /base64\.b64decode\([^)]*\)(?!\s*#.*?validated)/g,
        description: 'Base64 decode without validation - potential malicious input',
        severity: VulnerabilitySeverity.MEDIUM
      },
      // JSON loads without validation
      {
        pattern: /json\.loads\([^)]*event/g,
        description: 'JSON parsing of user input without validation',
        severity: VulnerabilitySeverity.MEDIUM
      },
      // Direct integer conversion without validation
      {
        pattern: /int\s*\(\s*event\s*\[[^]]*\]\s*\)/g,
        description: 'Integer conversion without validation - potential DoS',
        severity: VulnerabilitySeverity.LOW
      }
    ];

    inputValidationPatterns.forEach(({ pattern, description, severity }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = this.getLineNumber(content, match.index);
        const lineContent = lines[lineNumber - 1]?.trim() || '';
        
        this.addFinding({
          type: VulnerabilityCategory.INPUT_VALIDATION,
          severity,
          title: 'Insufficient Input Validation',
          description,
          file: filePath,
          line: lineNumber,
          column: match.index - content.lastIndexOf('\n', match.index),
          evidence: lineContent,
          recommendation: 'Implement proper input validation, sanitization, and type checking',
          cweId: 'CWE-20',
          owaspCategory: 'A03:2021 – Injection'
        });
      }
    });
  }

  /**
   * Check for insecure deserialization
   */
  private checkInsecureDeserialization(content: string, filePath: string): void {
    const lines = content.split('\n');
    
    const deserializationPatterns = [
      // pickle.loads
      {
        pattern: /pickle\.loads?\s*\(/g,
        description: 'pickle deserialization - potential code execution',
        severity: VulnerabilitySeverity.CRITICAL
      },
      // yaml.load without safe_load
      {
        pattern: /yaml\.load\s*\(/g,
        description: 'yaml.load() without safe_load - potential code execution',
        severity: VulnerabilitySeverity.HIGH
      },
      // marshal.loads
      {
        pattern: /marshal\.loads?\s*\(/g,
        description: 'marshal deserialization - potential code execution',
        severity: VulnerabilitySeverity.HIGH
      }
    ];

    deserializationPatterns.forEach(({ pattern, description, severity }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = this.getLineNumber(content, match.index);
        const lineContent = lines[lineNumber - 1]?.trim() || '';
        
        this.addFinding({
          type: VulnerabilityCategory.INSECURE_DESERIALIZATION,
          severity,
          title: 'Insecure Deserialization',
          description,
          file: filePath,
          line: lineNumber,
          column: match.index - content.lastIndexOf('\n', match.index),
          evidence: lineContent,
          recommendation: 'Use safe deserialization methods like json.loads or yaml.safe_load',
          cweId: 'CWE-502',
          owaspCategory: 'A08:2021 – Software and Data Integrity Failures'
        });
      }
    });
  }

  /**
   * Check for authentication bypass vulnerabilities
   */
  private checkAuthenticationBypass(content: string, filePath: string): void {
    const lines = content.split('\n');
    
    const authBypassPatterns = [
      // Missing user ID validation
      {
        pattern: /user_id\s*=\s*event\s*\.\s*get\s*\(\s*['"].*?['"]\s*\)(?!\s*(?:\n.*?if\s+not\s+user_id|.*?and\s+user_id))/g,
        description: 'User ID extracted without validation',
        severity: VulnerabilitySeverity.HIGH
      },
      // Direct access without authentication check
      {
        pattern: /def\s+lambda_handler\s*\([^)]*\):[^{]*(?!.*?user_id.*?if\s+not)/g,
        description: 'Lambda handler without authentication check',
        severity: VulnerabilitySeverity.MEDIUM
      },
      // Hardcoded bypass conditions
      {
        pattern: /if\s+.*?==\s*['"](?:admin|test|debug)['"]/gi,
        description: 'Hardcoded bypass condition',
        severity: VulnerabilitySeverity.HIGH
      }
    ];

    authBypassPatterns.forEach(({ pattern, description, severity }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = this.getLineNumber(content, match.index);
        const lineContent = lines[lineNumber - 1]?.trim() || '';
        
        this.addFinding({
          type: VulnerabilityCategory.AUTHENTICATION_BYPASS,
          severity,
          title: 'Authentication Bypass',
          description,
          file: filePath,
          line: lineNumber,
          column: match.index - content.lastIndexOf('\n', match.index),
          evidence: lineContent,
          recommendation: 'Implement proper authentication and authorization checks',
          cweId: 'CWE-287',
          owaspCategory: 'A07:2021 – Identification and Authentication Failures'
        });
      }
    });
  }

  /**
   * Check for hardcoded secrets and credentials
   */
  private checkHardcodedSecrets(content: string, filePath: string): void {
    const lines = content.split('\n');
    
    const secretPatterns = [
      // AWS keys
      {
        pattern: /AKIA[0-9A-Z]{16}/g,
        description: 'Hardcoded AWS Access Key ID',
        severity: VulnerabilitySeverity.CRITICAL
      },
      // API keys
      {
        pattern: /(?:api_key|apikey|api-key)\s*=\s*['"][^'"]{20,}['"]/gi,
        description: 'Hardcoded API key',
        severity: VulnerabilitySeverity.HIGH
      },
      // Database passwords
      {
        pattern: /(?:password|passwd|pwd)\s*=\s*['"][^'"]{8,}['"]/gi,
        description: 'Hardcoded password',
        severity: VulnerabilitySeverity.HIGH
      },
      // JWT secrets
      {
        pattern: /(?:jwt_secret|secret_key)\s*=\s*['"][^'"]{16,}['"]/gi,
        description: 'Hardcoded JWT secret',
        severity: VulnerabilitySeverity.HIGH
      }
    ];

    secretPatterns.forEach(({ pattern, description, severity }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = this.getLineNumber(content, match.index);
        const lineContent = lines[lineNumber - 1]?.trim() || '';
        
        this.addFinding({
          type: VulnerabilityCategory.HARDCODED_SECRETS,
          severity,
          title: 'Hardcoded Secrets',
          description,
          file: filePath,
          line: lineNumber,
          column: match.index - content.lastIndexOf('\n', match.index),
          evidence: '[REDACTED]', // Don't expose the actual secret
          recommendation: 'Use environment variables or AWS Secrets Manager for sensitive data',
          cweId: 'CWE-798',
          owaspCategory: 'A07:2021 – Identification and Authentication Failures'
        });
      }
    });
  }

  /**
   * Check for insecure randomness
   */
  private checkInsecureRandomness(content: string, filePath: string): void {
    const lines = content.split('\n');
    
    const randomnessPatterns = [
      // Use of random instead of secrets
      {
        pattern: /import\s+random(?!\s*#.*?secure)/g,
        description: 'Use of random module for security purposes',
        severity: VulnerabilitySeverity.MEDIUM
      },
      // time-based seeds
      {
        pattern: /random\.seed\s*\(\s*time\./g,
        description: 'Predictable random seed based on time',
        severity: VulnerabilitySeverity.MEDIUM
      }
    ];

    randomnessPatterns.forEach(({ pattern, description, severity }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = this.getLineNumber(content, match.index);
        const lineContent = lines[lineNumber - 1]?.trim() || '';
        
        this.addFinding({
          type: VulnerabilityCategory.WEAK_CRYPTOGRAPHY,
          severity,
          title: 'Insecure Randomness',
          description,
          file: filePath,
          line: lineNumber,
          column: match.index - content.lastIndexOf('\n', match.index),
          evidence: lineContent,
          recommendation: 'Use secrets module for cryptographically secure random numbers',
          cweId: 'CWE-338',
          owaspCategory: 'A02:2021 – Cryptographic Failures'
        });
      }
    });
  }

  /**
   * Check for unsafe file operations
   */
  private checkUnsafeFileOperations(content: string, filePath: string): void {
    const lines = content.split('\n');
    
    const fileOpPatterns = [
      // Temporary file creation without secure permissions
      {
        pattern: /tempfile\.(?:mktemp|NamedTemporaryFile)\s*\([^)]*(?!.*?mode\s*=)/g,
        description: 'Temporary file created without secure permissions',
        severity: VulnerabilitySeverity.LOW
      },
      // File operations with overly permissive modes
      {
        pattern: /open\s*\([^)]*mode\s*=\s*['"].*?[wa]\+/g,
        description: 'File opened with potentially unsafe write permissions',
        severity: VulnerabilitySeverity.LOW
      }
    ];

    fileOpPatterns.forEach(({ pattern, description, severity }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = this.getLineNumber(content, match.index);
        const lineContent = lines[lineNumber - 1]?.trim() || '';
        
        this.addFinding({
          type: VulnerabilityCategory.INSECURE_FILE_HANDLING,
          severity,
          title: 'Unsafe File Operations',
          description,
          file: filePath,
          line: lineNumber,
          column: match.index - content.lastIndexOf('\n', match.index),
          evidence: lineContent,
          recommendation: 'Use secure file permissions and validate file operations',
          cweId: 'CWE-732',
          owaspCategory: 'A01:2021 – Broken Access Control'
        });
      }
    });
  }

  /**
   * Add a vulnerability finding
   */
  private addFinding(findingData: {
    type: VulnerabilityCategory;
    severity: VulnerabilitySeverity;
    title: string;
    description: string;
    file: string;
    line: number;
    column: number;
    evidence: string;
    recommendation: string;
    cweId?: string;
    owaspCategory?: string;
  }): void {
    const finding: VulnerabilityFinding = {
      id: `backend-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: findingData.title,
      description: findingData.description,
      severity: findingData.severity,
      category: findingData.type,
      cweId: findingData.cweId,
      location: {
        filePath: findingData.file,
        lineNumber: findingData.line,
        columnNumber: findingData.column,
        codeSnippet: findingData.evidence
      },
      evidence: [findingData.evidence],
      impact: this.getImpactForSeverity(findingData.severity),
      likelihood: this.getLikelihoodForCategory(findingData.type),
      remediation: {
        summary: findingData.recommendation,
        steps: [{
          stepNumber: 1,
          description: findingData.recommendation
        }],
        estimatedEffort: this.getEffortForSeverity(findingData.severity),
        priority: this.getPriorityForSeverity(findingData.severity),
        timeline: this.getTimelineForSeverity(findingData.severity),
        verification: ['Code review', 'Security testing']
      },
      references: findingData.owaspCategory ? [findingData.owaspCategory] : [],
      discoveredAt: new Date(),
      scannerName: this.getName()
    };

    this.findings.push(finding);
  }

  private getImpactForSeverity(severity: VulnerabilitySeverity): string {
    switch (severity) {
      case VulnerabilitySeverity.CRITICAL:
        return 'Critical impact - potential for complete system compromise';
      case VulnerabilitySeverity.HIGH:
        return 'High impact - significant security risk';
      case VulnerabilitySeverity.MEDIUM:
        return 'Medium impact - moderate security risk';
      case VulnerabilitySeverity.LOW:
        return 'Low impact - minor security concern';
      default:
        return 'Unknown impact';
    }
  }

  private getLikelihoodForCategory(category: VulnerabilityCategory): string {
    switch (category) {
      case VulnerabilityCategory.COMMAND_INJECTION:
      case VulnerabilityCategory.SQL_INJECTION:
        return 'High likelihood if user input is not validated';
      case VulnerabilityCategory.PATH_TRAVERSAL:
        return 'Medium likelihood with file operations';
      case VulnerabilityCategory.INFORMATION_DISCLOSURE:
        return 'Medium likelihood in error conditions';
      default:
        return 'Variable likelihood depending on usage';
    }
  }

  private getEffortForSeverity(severity: VulnerabilitySeverity): string {
    switch (severity) {
      case VulnerabilitySeverity.CRITICAL:
        return 'High effort - requires immediate attention';
      case VulnerabilitySeverity.HIGH:
        return 'Medium effort - should be prioritized';
      case VulnerabilitySeverity.MEDIUM:
        return 'Medium effort - plan for next sprint';
      case VulnerabilitySeverity.LOW:
        return 'Low effort - can be addressed in maintenance';
      default:
        return 'Unknown effort';
    }
  }

  private getPriorityForSeverity(severity: VulnerabilitySeverity): number {
    switch (severity) {
      case VulnerabilitySeverity.CRITICAL:
        return 1;
      case VulnerabilitySeverity.HIGH:
        return 2;
      case VulnerabilitySeverity.MEDIUM:
        return 3;
      case VulnerabilitySeverity.LOW:
        return 4;
      default:
        return 5;
    }
  }

  private getTimelineForSeverity(severity: VulnerabilitySeverity): string {
    switch (severity) {
      case VulnerabilitySeverity.CRITICAL:
        return 'Immediate (within 24 hours)';
      case VulnerabilitySeverity.HIGH:
        return 'Urgent (within 1 week)';
      case VulnerabilitySeverity.MEDIUM:
        return 'Medium term (within 1 month)';
      case VulnerabilitySeverity.LOW:
        return 'Long term (within 3 months)';
      default:
        return 'To be determined';
    }
  }

  /**
   * Get line number from character index
   */
  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
  }

  /**
   * Generate scan result summary
   */
  private generateScanResult(): BackendScanResult {
    const summary = {
      totalFiles: this.scannedFiles.length,
      vulnerableFiles: new Set(this.findings.map(f => f.location.filePath)).size,
      criticalFindings: this.findings.filter(f => f.severity === VulnerabilitySeverity.CRITICAL).length,
      highFindings: this.findings.filter(f => f.severity === VulnerabilitySeverity.HIGH).length,
      mediumFindings: this.findings.filter(f => f.severity === VulnerabilitySeverity.MEDIUM).length,
      lowFindings: this.findings.filter(f => f.severity === VulnerabilitySeverity.LOW).length
    };

    return {
      success: true,
      findings: this.findings,
      scannedFiles: this.scannedFiles,
      summary
    };
  }

  /**
   * Get scanner name for reporting
   */
  public getName(): string {
    return 'Backend Lambda Security Scanner';
  }

  /**
   * Get scanner version
   */
  public getVersion(): string {
    return '1.0.0';
  }
}