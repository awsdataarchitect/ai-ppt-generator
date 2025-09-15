/**
 * Data Flow Security Scanner for Privacy and Compliance Analysis
 * 
 * This scanner analyzes data flows throughout the application to identify:
 * - PII handling patterns and privacy risks
 * - Document processing security and content isolation
 * - Authentication token flow security
 * - API communication encryption requirements
 * - Data storage patterns for GDPR/CCPA compliance
 * - Multi-tenant isolation security verification
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { 
  ISecurityScanner, 
  ScannerConfiguration, 
  ScanResult, 
  ValidationResult, 
  HealthStatus, 
  ProgressCallback,
  ScanProgress,
  ScanError,
  ScanMetadata
} from '../interfaces/ScannerInterface';
import { 
  VulnerabilityFinding, 
  VulnerabilitySeverity, 
  VulnerabilityCategory,
  VulnerabilityLocation,
  RemediationPlan
} from '../types/VulnerabilityTypes';
import { 
  RiskAssessment, 
  RiskLevel, 
  BusinessImpactType 
} from '../types/RiskAssessmentTypes';
import { 
  ComplianceMapping, 
  ComplianceFramework, 
  ComplianceStatus, 
  OwaspTop10Category 
} from '../types/ComplianceTypes';

export interface PIIPattern {
  readonly name: string;
  readonly pattern: RegExp;
  readonly severity: VulnerabilitySeverity;
  readonly description: string;
  readonly gdprRelevant: boolean;
  readonly ccpaRelevant: boolean;
}

export interface DataFlowAnalysis {
  readonly sourceLocation: VulnerabilityLocation;
  readonly dataType: string;
  readonly flowPath: string[];
  readonly storageLocations: string[];
  readonly encryptionStatus: 'encrypted' | 'unencrypted' | 'unknown';
  readonly accessControls: string[];
  readonly retentionPolicy?: string;
}

export interface AuthTokenFlow {
  readonly tokenType: string;
  readonly generationLocation: VulnerabilityLocation;
  readonly storageMethod: string;
  readonly transmissionMethod: string;
  readonly expirationHandling: string;
  readonly securityIssues: string[];
}

export interface MultiTenantIsolation {
  readonly resourceType: string;
  readonly isolationMethod: string;
  readonly location: VulnerabilityLocation;
  readonly isolationStrength: 'strong' | 'weak' | 'none';
  readonly vulnerabilities: string[];
}

export class DataFlowSecurityScanner implements ISecurityScanner {
  public readonly name = 'DataFlowSecurityScanner';
  public readonly version = '1.0.0';
  public readonly description = 'Analyzes data flows for privacy and compliance security issues';
  public readonly supportedFileTypes = ['.js', '.ts', '.jsx', '.tsx', '.py', '.json', '.yaml', '.yml'];

  private config?: ScannerConfiguration;
  private readonly piiPatterns: PIIPattern[] = [
    {
      name: 'Email Address',
      pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      severity: VulnerabilitySeverity.MEDIUM,
      description: 'Email addresses are PII under GDPR and CCPA',
      gdprRelevant: true,
      ccpaRelevant: true
    },
    {
      name: 'Phone Number',
      pattern: /(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g,
      severity: VulnerabilitySeverity.MEDIUM,
      description: 'Phone numbers are personal identifiers',
      gdprRelevant: true,
      ccpaRelevant: true
    },
    {
      name: 'Social Security Number',
      pattern: /\b\d{3}-?\d{2}-?\d{4}\b/g,
      severity: VulnerabilitySeverity.HIGH,
      description: 'SSN is highly sensitive PII',
      gdprRelevant: true,
      ccpaRelevant: true
    },
    {
      name: 'Credit Card Number',
      pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
      severity: VulnerabilitySeverity.CRITICAL,
      description: 'Credit card numbers require PCI DSS compliance',
      gdprRelevant: true,
      ccpaRelevant: true
    },
    {
      name: 'IP Address',
      pattern: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
      severity: VulnerabilitySeverity.LOW,
      description: 'IP addresses can be personal identifiers under GDPR',
      gdprRelevant: true,
      ccpaRelevant: false
    }
  ];

  private readonly authTokenPatterns = [
    /(?:bearer|token|jwt|auth)[\s]*[:=][\s]*['"]*([a-zA-Z0-9._-]+)['"]*$/gim,
    /localStorage\.setItem\(['"]([^'"]*token[^'"]*)['"]/gi,
    /sessionStorage\.setItem\(['"]([^'"]*token[^'"]*)['"]/gi,
    /document\.cookie\s*=\s*['"]([^'"]*token[^'"]*)/gi
  ];

  private readonly encryptionPatterns = [
    /\.encrypt\(/gi,
    /\.decrypt\(/gi,
    /crypto\./gi,
    /bcrypt\./gi,
    /scrypt\./gi,
    /pbkdf2\./gi,
    /AES|RSA|SHA256|SHA512/gi
  ];

  public async configure(config: ScannerConfiguration): Promise<void> {
    this.config = config;
  }

  public async validateAccess(): Promise<ValidationResult> {
    if (!this.config) {
      return {
        isValid: false,
        errors: ['Scanner not configured'],
        warnings: [],
        accessibleFiles: 0,
        inaccessibleFiles: []
      };
    }

    try {
      const stats = await fs.stat(this.config.targetPath);
      if (!stats.isDirectory()) {
        return {
          isValid: false,
          errors: ['Target path is not a directory'],
          warnings: [],
          accessibleFiles: 0,
          inaccessibleFiles: [this.config.targetPath]
        };
      }

      return {
        isValid: true,
        errors: [],
        warnings: [],
        accessibleFiles: 1,
        inaccessibleFiles: []
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Cannot access target path: ${error}`],
        warnings: [],
        accessibleFiles: 0,
        inaccessibleFiles: [this.config.targetPath]
      };
    }
  }

  public async scan(progressCallback?: ProgressCallback): Promise<ScanResult> {
    if (!this.config) {
      throw new Error('Scanner not configured');
    }

    const startTime = new Date();
    const vulnerabilities: VulnerabilityFinding[] = [];
    const riskAssessments: RiskAssessment[] = [];
    const complianceMappings: ComplianceMapping[] = [];
    const errors: ScanError[] = [];
    let filesScanned = 0;

    try {
      const files = await this.getFilesToScan(this.config.targetPath);
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (progressCallback) {
          progressCallback({
            currentFile: file,
            filesProcessed: i,
            totalFiles: files.length,
            percentage: (i / files.length) * 100,
            estimatedTimeRemaining: 0,
            vulnerabilitiesFound: vulnerabilities.length
          });
        }

        try {
          const fileVulnerabilities = await this.scanFile(file);
          vulnerabilities.push(...fileVulnerabilities);
          filesScanned++;
        } catch (error) {
          errors.push({
            filePath: file,
            errorType: 'ScanError',
            message: `Failed to scan file: ${error}`,
            timestamp: new Date()
          });
        }
      }

      // Generate risk assessments and compliance mappings
      riskAssessments.push(...this.generateRiskAssessments(vulnerabilities));
      complianceMappings.push(...this.generateComplianceMappings(vulnerabilities));

    } catch (error) {
      errors.push({
        filePath: this.config.targetPath,
        errorType: 'GeneralError',
        message: `Scan failed: ${error}`,
        timestamp: new Date()
      });
    }

    const endTime = new Date();
    const scanDuration = endTime.getTime() - startTime.getTime();

    return {
      scannerId: 'data-flow-security-scanner',
      scannerName: this.name,
      scannerVersion: this.version,
      targetPath: this.config.targetPath,
      startTime,
      endTime,
      filesScanned,
      vulnerabilities,
      riskAssessments,
      complianceMappings,
      errors,
      metadata: {
        scanDuration,
        memoryUsage: process.memoryUsage().heapUsed,
        rulesApplied: this.piiPatterns.length + this.authTokenPatterns.length,
        falsePositiveFiltered: 0,
        confidence: 85
      }
    };
  }

  private async getFilesToScan(targetPath: string): Promise<string[]> {
    const files: string[] = [];
    
    const scanDirectory = async (dirPath: string): Promise<void> => {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          // Skip node_modules and other common directories
          if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(entry.name)) {
            await scanDirectory(fullPath);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (this.supportedFileTypes.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    };

    await scanDirectory(targetPath);
    return files;
  }

  private async scanFile(filePath: string): Promise<VulnerabilityFinding[]> {
    const vulnerabilities: VulnerabilityFinding[] = [];
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      // Scan for PII patterns
      vulnerabilities.push(...this.scanForPII(filePath, content, lines));
      
      // Scan for authentication token issues
      vulnerabilities.push(...this.scanForAuthTokenIssues(filePath, content, lines));
      
      // Scan for encryption and data protection
      vulnerabilities.push(...this.scanForEncryptionIssues(filePath, content, lines));
      
      // Scan for document processing security
      vulnerabilities.push(...this.scanForDocumentProcessingSecurity(filePath, content, lines));
      
      // Scan for multi-tenant isolation issues
      vulnerabilities.push(...this.scanForMultiTenantIssues(filePath, content, lines));
      
      // Scan for API communication security
      vulnerabilities.push(...this.scanForAPICommunicationSecurity(filePath, content, lines));

    } catch (error) {
      // File reading error handled by caller
      throw error;
    }

    return vulnerabilities;
  }

  private scanForPII(filePath: string, content: string, lines: string[]): VulnerabilityFinding[] {
    const vulnerabilities: VulnerabilityFinding[] = [];

    for (const piiPattern of this.piiPatterns) {
      const matches = content.matchAll(piiPattern.pattern);
      
      for (const match of matches) {
        const lineNumber = this.getLineNumber(content, match.index || 0);
        
        vulnerabilities.push({
          id: `pii-${piiPattern.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          title: `Potential PII Exposure: ${piiPattern.name}`,
          description: `${piiPattern.description}. Found pattern that may contain ${piiPattern.name.toLowerCase()}.`,
          severity: piiPattern.severity,
          category: VulnerabilityCategory.INFORMATION_DISCLOSURE,
          location: {
            filePath,
            lineNumber,
            codeSnippet: lines[lineNumber - 1]?.trim()
          },
          evidence: [match[0]],
          impact: `Potential privacy violation and regulatory compliance risk (GDPR: ${piiPattern.gdprRelevant}, CCPA: ${piiPattern.ccpaRelevant})`,
          likelihood: 'Medium',
          remediation: {
            summary: `Implement proper data protection for ${piiPattern.name.toLowerCase()}`,
            steps: [
              {
                stepNumber: 1,
                description: 'Review if this data is actually PII or a false positive',
                testingRequirements: 'Manual review of the detected pattern'
              },
              {
                stepNumber: 2,
                description: 'If PII, implement encryption at rest and in transit',
                codeChanges: 'Add encryption/decryption functions for sensitive data'
              },
              {
                stepNumber: 3,
                description: 'Implement access controls and audit logging',
                configurationChanges: 'Configure IAM policies and CloudWatch logging'
              },
              {
                stepNumber: 4,
                description: 'Add data retention and deletion policies',
                configurationChanges: 'Implement automated data lifecycle management'
              }
            ],
            estimatedEffort: '2-4 hours',
            priority: piiPattern.severity === VulnerabilitySeverity.CRITICAL ? 1 : 2,
            timeline: 'Within 1 week',
            verification: [
              'Verify encryption is applied to sensitive data',
              'Test access controls are working',
              'Confirm audit logging is capturing data access'
            ]
          },
          references: [
            'https://gdpr.eu/what-is-personal-data/',
            'https://oag.ca.gov/privacy/ccpa',
            'https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure'
          ],
          discoveredAt: new Date(),
          scannerName: this.name
        });
      }
    }

    return vulnerabilities;
  }

  private scanForAuthTokenIssues(filePath: string, content: string, lines: string[]): VulnerabilityFinding[] {
    const vulnerabilities: VulnerabilityFinding[] = [];

    // Check for insecure token storage
    const insecureStoragePatterns = [
      {
        pattern: /localStorage\.setItem\(['"]([^'"]*token[^'"]*)['"]/gi,
        issue: 'Token stored in localStorage',
        severity: VulnerabilitySeverity.HIGH
      },
      {
        pattern: /sessionStorage\.setItem\(['"]([^'"]*token[^'"]*)['"]/gi,
        issue: 'Token stored in sessionStorage',
        severity: VulnerabilitySeverity.MEDIUM
      },
      {
        pattern: /document\.cookie\s*=\s*['"]([^'"]*token[^'"]*)/gi,
        issue: 'Token stored in cookie without security flags',
        severity: VulnerabilitySeverity.HIGH
      }
    ];

    for (const storagePattern of insecureStoragePatterns) {
      const matches = content.matchAll(storagePattern.pattern);
      
      for (const match of matches) {
        const lineNumber = this.getLineNumber(content, match.index || 0);
        
        vulnerabilities.push({
          id: `auth-token-storage-${Date.now()}`,
          title: 'Insecure Authentication Token Storage',
          description: `${storagePattern.issue}. This may expose authentication tokens to XSS attacks.`,
          severity: storagePattern.severity,
          category: VulnerabilityCategory.AUTHENTICATION_BYPASS,
          location: {
            filePath,
            lineNumber,
            codeSnippet: lines[lineNumber - 1]?.trim()
          },
          evidence: [match[0]],
          impact: 'Authentication tokens could be stolen via XSS attacks, leading to account takeover',
          likelihood: 'High',
          remediation: {
            summary: 'Implement secure token storage mechanisms',
            steps: [
              {
                stepNumber: 1,
                description: 'Use httpOnly cookies for token storage',
                codeChanges: 'Set cookies with httpOnly and secure flags'
              },
              {
                stepNumber: 2,
                description: 'Implement proper CSRF protection',
                codeChanges: 'Add CSRF tokens to forms and API calls'
              },
              {
                stepNumber: 3,
                description: 'Use short-lived tokens with refresh mechanism',
                codeChanges: 'Implement token refresh logic'
              }
            ],
            estimatedEffort: '4-6 hours',
            priority: 1,
            timeline: 'Within 3 days',
            verification: [
              'Verify tokens are not accessible via JavaScript',
              'Test CSRF protection is working',
              'Confirm token expiration and refresh works'
            ]
          },
          references: [
            'https://owasp.org/www-community/vulnerabilities/Improper_Authentication',
            'https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html'
          ],
          discoveredAt: new Date(),
          scannerName: this.name
        });
      }
    }

    return vulnerabilities;
  }

  private scanForEncryptionIssues(filePath: string, content: string, lines: string[]): VulnerabilityFinding[] {
    const vulnerabilities: VulnerabilityFinding[] = [];

    // Check for unencrypted sensitive data transmission
    const httpPatterns = [
      /http:\/\/[^\s'"]+/gi,
      /fetch\(['"]http:\/\/[^'"]+['"]/gi,
      /axios\.get\(['"]http:\/\/[^'"]+['"]/gi
    ];

    for (const httpPattern of httpPatterns) {
      const matches = content.matchAll(httpPattern);
      
      for (const match of matches) {
        const lineNumber = this.getLineNumber(content, match.index || 0);
        
        vulnerabilities.push({
          id: `unencrypted-transmission-${Date.now()}`,
          title: 'Unencrypted Data Transmission',
          description: 'HTTP URLs detected. Sensitive data should be transmitted over HTTPS only.',
          severity: VulnerabilitySeverity.HIGH,
          category: VulnerabilityCategory.CRYPTOGRAPHIC_FAILURE,
          location: {
            filePath,
            lineNumber,
            codeSnippet: lines[lineNumber - 1]?.trim()
          },
          evidence: [match[0]],
          impact: 'Sensitive data transmitted in plaintext could be intercepted',
          likelihood: 'Medium',
          remediation: {
            summary: 'Replace HTTP URLs with HTTPS',
            steps: [
              {
                stepNumber: 1,
                description: 'Replace all HTTP URLs with HTTPS equivalents',
                codeChanges: 'Update URL schemes from http:// to https://'
              },
              {
                stepNumber: 2,
                description: 'Implement HSTS headers',
                configurationChanges: 'Configure Strict-Transport-Security headers'
              }
            ],
            estimatedEffort: '1-2 hours',
            priority: 2,
            timeline: 'Within 1 week',
            verification: [
              'Verify all external communications use HTTPS',
              'Test HSTS headers are present'
            ]
          },
          references: [
            'https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure'
          ],
          discoveredAt: new Date(),
          scannerName: this.name
        });
      }
    }

    return vulnerabilities;
  }

  private scanForDocumentProcessingSecurity(filePath: string, content: string, lines: string[]): VulnerabilityFinding[] {
    const vulnerabilities: VulnerabilityFinding[] = [];

    // Check for insecure file processing
    const fileProcessingPatterns = [
      {
        pattern: /eval\(/gi,
        issue: 'Use of eval() function',
        severity: VulnerabilitySeverity.CRITICAL
      },
      {
        pattern: /exec\(/gi,
        issue: 'Use of exec() function',
        severity: VulnerabilitySeverity.HIGH
      },
      {
        pattern: /subprocess\./gi,
        issue: 'Use of subprocess module',
        severity: VulnerabilitySeverity.MEDIUM
      }
    ];

    for (const pattern of fileProcessingPatterns) {
      const matches = content.matchAll(pattern.pattern);
      
      for (const match of matches) {
        const lineNumber = this.getLineNumber(content, match.index || 0);
        
        vulnerabilities.push({
          id: `document-processing-${Date.now()}`,
          title: 'Insecure Document Processing',
          description: `${pattern.issue} detected in document processing code. This could lead to code injection.`,
          severity: pattern.severity,
          category: VulnerabilityCategory.COMMAND_INJECTION,
          location: {
            filePath,
            lineNumber,
            codeSnippet: lines[lineNumber - 1]?.trim()
          },
          evidence: [match[0]],
          impact: 'Malicious documents could execute arbitrary code on the server',
          likelihood: 'Medium',
          remediation: {
            summary: 'Implement secure document processing',
            steps: [
              {
                stepNumber: 1,
                description: 'Replace dangerous functions with safe alternatives',
                codeChanges: 'Use safe parsing libraries instead of eval/exec'
              },
              {
                stepNumber: 2,
                description: 'Implement input validation and sanitization',
                codeChanges: 'Add content validation before processing'
              },
              {
                stepNumber: 3,
                description: 'Run document processing in sandboxed environment',
                configurationChanges: 'Configure Lambda with restricted permissions'
              }
            ],
            estimatedEffort: '6-8 hours',
            priority: 1,
            timeline: 'Within 2 days',
            verification: [
              'Test with malicious document samples',
              'Verify sandboxing is effective'
            ]
          },
          references: [
            'https://owasp.org/www-project-top-ten/2017/A1_2017-Injection'
          ],
          discoveredAt: new Date(),
          scannerName: this.name
        });
      }
    }

    return vulnerabilities;
  }

  private scanForMultiTenantIssues(filePath: string, content: string, lines: string[]): VulnerabilityFinding[] {
    const vulnerabilities: VulnerabilityFinding[] = [];

    // Check for potential tenant isolation issues
    const isolationPatterns = [
      {
        pattern: /SELECT\s+\*\s+FROM\s+\w+(?!\s+WHERE)/gi,
        issue: 'SQL query without WHERE clause',
        severity: VulnerabilitySeverity.HIGH
      },
      {
        pattern: /dynamodb\.scan\(/gi,
        issue: 'DynamoDB scan operation',
        severity: VulnerabilitySeverity.MEDIUM
      },
      {
        pattern: /s3\.listObjects/gi,
        issue: 'S3 listObjects without prefix',
        severity: VulnerabilitySeverity.MEDIUM
      }
    ];

    for (const pattern of isolationPatterns) {
      const matches = content.matchAll(pattern.pattern);
      
      for (const match of matches) {
        const lineNumber = this.getLineNumber(content, match.index || 0);
        
        vulnerabilities.push({
          id: `multi-tenant-isolation-${Date.now()}`,
          title: 'Multi-Tenant Isolation Risk',
          description: `${pattern.issue} detected. This could allow access to other tenants' data.`,
          severity: pattern.severity,
          category: VulnerabilityCategory.AUTHORIZATION_FAILURE,
          location: {
            filePath,
            lineNumber,
            codeSnippet: lines[lineNumber - 1]?.trim()
          },
          evidence: [match[0]],
          impact: 'Users could potentially access data belonging to other tenants',
          likelihood: 'Medium',
          remediation: {
            summary: 'Implement proper tenant isolation',
            steps: [
              {
                stepNumber: 1,
                description: 'Add tenant ID filtering to all data queries',
                codeChanges: 'Include tenant ID in WHERE clauses and filters'
              },
              {
                stepNumber: 2,
                description: 'Implement row-level security',
                configurationChanges: 'Configure database-level tenant isolation'
              },
              {
                stepNumber: 3,
                description: 'Add tenant validation middleware',
                codeChanges: 'Verify user belongs to requested tenant'
              }
            ],
            estimatedEffort: '4-6 hours',
            priority: 1,
            timeline: 'Within 1 week',
            verification: [
              'Test cross-tenant access attempts',
              'Verify all queries include tenant filtering'
            ]
          },
          references: [
            'https://owasp.org/www-project-top-ten/2017/A5_2017-Broken_Access_Control'
          ],
          discoveredAt: new Date(),
          scannerName: this.name
        });
      }
    }

    return vulnerabilities;
  }

  private scanForAPICommunicationSecurity(filePath: string, content: string, lines: string[]): VulnerabilityFinding[] {
    const vulnerabilities: VulnerabilityFinding[] = [];

    // Check for API security issues
    const apiSecurityPatterns = [
      {
        pattern: /fetch\([^)]*\)\.then/gi,
        issue: 'API call without error handling',
        severity: VulnerabilitySeverity.LOW
      },
      {
        pattern: /Authorization:\s*['"]Bearer\s+[^'"]*['"]/gi,
        issue: 'Hardcoded authorization token',
        severity: VulnerabilitySeverity.HIGH
      }
    ];

    for (const pattern of apiSecurityPatterns) {
      const matches = content.matchAll(pattern.pattern);
      
      for (const match of matches) {
        const lineNumber = this.getLineNumber(content, match.index || 0);
        
        vulnerabilities.push({
          id: `api-security-${Date.now()}`,
          title: 'API Communication Security Issue',
          description: `${pattern.issue} detected in API communication code.`,
          severity: pattern.severity,
          category: VulnerabilityCategory.INSECURE_CONFIGURATION,
          location: {
            filePath,
            lineNumber,
            codeSnippet: lines[lineNumber - 1]?.trim()
          },
          evidence: [match[0]],
          impact: 'API communication may be vulnerable to various attacks',
          likelihood: 'Low',
          remediation: {
            summary: 'Implement secure API communication practices',
            steps: [
              {
                stepNumber: 1,
                description: 'Add proper error handling to API calls',
                codeChanges: 'Implement try-catch blocks and error responses'
              },
              {
                stepNumber: 2,
                description: 'Use environment variables for API credentials',
                codeChanges: 'Replace hardcoded tokens with environment variables'
              }
            ],
            estimatedEffort: '2-3 hours',
            priority: 3,
            timeline: 'Within 2 weeks',
            verification: [
              'Test API error handling',
              'Verify no hardcoded credentials remain'
            ]
          },
          references: [
            'https://owasp.org/www-project-api-security/'
          ],
          discoveredAt: new Date(),
          scannerName: this.name
        });
      }
    }

    return vulnerabilities;
  }

  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
  }

  private generateRiskAssessments(vulnerabilities: VulnerabilityFinding[]): RiskAssessment[] {
    const riskAssessments: RiskAssessment[] = [];

    // Group vulnerabilities by category for risk assessment
    const categoryGroups = vulnerabilities.reduce((groups, vuln) => {
      if (!groups[vuln.category]) {
        groups[vuln.category] = [];
      }
      groups[vuln.category].push(vuln);
      return groups;
    }, {} as Record<string, VulnerabilityFinding[]>);

    for (const [category, vulns] of Object.entries(categoryGroups)) {
      const criticalCount = vulns.filter(v => v.severity === VulnerabilitySeverity.CRITICAL).length;
      const highCount = vulns.filter(v => v.severity === VulnerabilitySeverity.HIGH).length;
      
      let likelihood = 3; // Medium likelihood
      let impact = 2; // Low impact
      
      if (criticalCount > 0) {
        likelihood = 4;
        impact = 5;
      } else if (highCount > 2) {
        likelihood = 4;
        impact = 4;
      } else if (highCount > 0) {
        likelihood = 3;
        impact = 3;
      }

      const riskScore = {
        likelihood,
        impact,
        overallRisk: likelihood * impact,
        riskLevel: this.calculateRiskLevel(likelihood * impact),
        confidenceLevel: 4
      };

      const residualRiskScore = {
        likelihood: Math.max(1, likelihood - 1),
        impact: Math.max(1, impact - 1),
        overallRisk: Math.max(1, (likelihood - 1) * (impact - 1)),
        riskLevel: this.calculateRiskLevel(Math.max(1, (likelihood - 1) * (impact - 1))),
        confidenceLevel: 3
      };

      riskAssessments.push({
        vulnerabilityId: `risk-${category.toLowerCase().replace(/\s+/g, '-')}`,
        riskScore,
        businessImpact: {
          impactTypes: [this.getBusinessImpactType(category)],
          financialImpact: {
            estimatedCost: {
              minimum: 1000,
              maximum: 50000,
              currency: 'USD'
            },
            costFactors: ['Remediation effort', 'Potential breach costs', 'Compliance penalties'],
            recoveryTime: '1-4 weeks'
          },
          operationalImpact: {
            affectedSystems: vulns.map(v => path.basename(v.location.filePath)),
            serviceDowntime: 'Minimal',
            userImpact: 'Low to Medium',
            dataIntegrityRisk: category.includes('Injection') || category.includes('Processing')
          },
          complianceImpact: {
            affectedRegulations: this.getAffectedRegulations(category),
            potentialFines: 'Up to 4% of annual revenue (GDPR)',
            auditImplications: ['Increased scrutiny', 'Additional testing requirements']
          },
          reputationalImpact: {
            publicityRisk: 'Medium',
            customerTrustImpact: 'Moderate concern',
            brandDamageAssessment: 'Manageable with proper response'
          }
        },
        threatModel: {
          threatActors: [{
            type: 'External Attacker',
            motivation: 'Data theft or system compromise',
            capabilities: ['Basic to intermediate technical skills'],
            likelihood: 3
          }],
          attackVectors: [{
            name: 'Web Application Attack',
            description: `Exploitation of ${category.toLowerCase()} vulnerabilities`,
            complexity: 'Medium',
            prerequisites: ['Network access', 'Basic knowledge of vulnerabilities']
          }],
          assetValuation: {
            assetName: 'Application Data and Systems',
            confidentialityValue: 4,
            integrityValue: 4,
            availabilityValue: 3,
            overallValue: 4
          },
          threatScenarios: [{
            id: `scenario-${category.toLowerCase().replace(/\s+/g, '-')}`,
            description: `Attacker exploits ${category.toLowerCase()} to gain unauthorized access`,
            threatActor: 'External Attacker',
            attackVector: 'Web Application Attack',
            likelihood: likelihood,
            impact: impact,
            riskScore: riskScore
          }]
        },
        mitigationStrategies: [
          'Implement security controls for this category',
          'Regular security testing and code review',
          'Security training for development team'
        ],
        residualRisk: residualRiskScore,
        assessmentDate: new Date(),
        assessor: 'DataFlowSecurityScanner'
      });
    }

    return riskAssessments;
  }

  private generateComplianceMappings(vulnerabilities: VulnerabilityFinding[]): ComplianceMapping[] {
    const complianceMappings: ComplianceMapping[] = [];

    // GDPR compliance mapping
    const gdprRelevantVulns = vulnerabilities.filter(v => 
      v.category === VulnerabilityCategory.INFORMATION_DISCLOSURE ||
      v.title.includes('PII')
    );

    if (gdprRelevantVulns.length > 0) {
      const gdprControl = {
        id: 'gdpr-article-32',
        framework: ComplianceFramework.GDPR,
        controlNumber: 'Article 32',
        title: 'Security of Processing',
        description: 'Personal data must be processed securely using appropriate technical and organizational measures',
        category: 'Data Protection',
        requirements: [
          'Implement appropriate technical measures',
          'Ensure confidentiality, integrity, availability',
          'Regular testing and evaluation of measures'
        ],
        testProcedures: [
          'Review encryption implementation',
          'Test access controls',
          'Verify audit logging'
        ]
      };

      complianceMappings.push({
        vulnerabilityId: gdprRelevantVulns[0].id,
        mappedControls: [{
          control: gdprControl,
          status: gdprRelevantVulns.some(v => v.severity === VulnerabilitySeverity.CRITICAL) ? 
            ComplianceStatus.NON_COMPLIANT : ComplianceStatus.PARTIALLY_COMPLIANT,
          evidence: ['Security scan results', 'Code review findings'],
          gaps: [
            'Missing encryption for PII',
            'Insufficient access controls',
            'Inadequate audit logging'
          ],
          remediation: [
            'Implement encryption for personal data',
            'Add access controls and audit logging',
            'Establish data retention policies'
          ]
        }],
        overallStatus: gdprRelevantVulns.some(v => v.severity === VulnerabilitySeverity.CRITICAL) ? 
          ComplianceStatus.NON_COMPLIANT : ComplianceStatus.PARTIALLY_COMPLIANT,
        gapAnalysis: [{
          controlId: 'gdpr-article-32',
          framework: ComplianceFramework.GDPR,
          gapDescription: 'Insufficient technical measures for PII protection',
          severity: 'High',
          remediation: 'Implement comprehensive data protection measures',
          timeline: '30 days',
          owner: 'Security Team'
        }],
        recommendedActions: [
          'Implement encryption for personal data',
          'Add access controls and audit logging',
          'Establish data retention policies'
        ]
      });
    }

    // OWASP Top 10 mapping
    const owaspMappings = [
      { category: VulnerabilityCategory.AUTHORIZATION_FAILURE, owaspCategory: OwaspTop10Category.A01_BROKEN_ACCESS_CONTROL },
      { category: VulnerabilityCategory.CRYPTOGRAPHIC_FAILURE, owaspCategory: OwaspTop10Category.A02_CRYPTOGRAPHIC_FAILURES },
      { category: VulnerabilityCategory.SQL_INJECTION, owaspCategory: OwaspTop10Category.A03_INJECTION },
      { category: VulnerabilityCategory.INSECURE_DESIGN, owaspCategory: OwaspTop10Category.A04_INSECURE_DESIGN },
      { category: VulnerabilityCategory.INSECURE_CONFIGURATION, owaspCategory: OwaspTop10Category.A05_SECURITY_MISCONFIGURATION }
    ];

    for (const mapping of owaspMappings) {
      const relevantVulns = vulnerabilities.filter(v => v.category === mapping.category);
      
      if (relevantVulns.length > 0) {
        const owaspControl = {
          id: `owasp-${mapping.owaspCategory.split(':')[0].toLowerCase()}`,
          framework: ComplianceFramework.OWASP_TOP_10,
          controlNumber: mapping.owaspCategory.split(':')[0],
          title: mapping.owaspCategory.split('–')[1]?.trim() || mapping.owaspCategory,
          description: `Security control for ${mapping.owaspCategory}`,
          category: 'Application Security',
          requirements: [
            'Implement secure coding practices',
            'Regular security testing',
            'Security controls validation'
          ],
          testProcedures: [
            'Static code analysis',
            'Dynamic security testing',
            'Penetration testing'
          ]
        };

        complianceMappings.push({
          vulnerabilityId: relevantVulns[0].id,
          mappedControls: [{
            control: owaspControl,
            status: relevantVulns.some(v => v.severity === VulnerabilitySeverity.CRITICAL) ? 
              ComplianceStatus.NON_COMPLIANT : ComplianceStatus.PARTIALLY_COMPLIANT,
            evidence: ['Security scan results'],
            gaps: [`${mapping.category} vulnerabilities present`],
            remediation: [
              `Address ${mapping.category.toLowerCase()} vulnerabilities`,
              'Implement security controls and testing',
              'Regular security assessments'
            ]
          }],
          overallStatus: relevantVulns.some(v => v.severity === VulnerabilitySeverity.CRITICAL) ? 
            ComplianceStatus.NON_COMPLIANT : ComplianceStatus.PARTIALLY_COMPLIANT,
          gapAnalysis: [{
            controlId: owaspControl.id,
            framework: ComplianceFramework.OWASP_TOP_10,
            gapDescription: `${mapping.category} vulnerabilities identified`,
            severity: relevantVulns.some(v => v.severity === VulnerabilitySeverity.CRITICAL) ? 'Critical' : 'High',
            remediation: `Implement controls for ${mapping.category.toLowerCase()}`,
            timeline: '14 days',
            owner: 'Development Team'
          }],
          recommendedActions: [
            `Address ${mapping.category.toLowerCase()} vulnerabilities`,
            'Implement security controls and testing',
            'Regular security assessments'
          ]
        });
      }
    }

    return complianceMappings;
  }

  public async getHealthStatus(): Promise<HealthStatus> {
    return {
      isHealthy: true,
      version: this.version,
      lastUpdated: new Date(),
      dependencies: [
        {
          name: 'fs/promises',
          version: 'built-in',
          status: 'available'
        },
        {
          name: 'path',
          version: 'built-in',
          status: 'available'
        }
      ],
      performance: {
        averageScanTime: 50, // ms per file
        memoryUsage: process.memoryUsage().heapUsed,
        cpuUsage: 0,
        cacheHitRate: 0
      }
    };
  }

  public async cleanup(): Promise<void> {
    // No cleanup needed for this scanner
  }

  // Helper methods for risk assessment and compliance mapping

  private calculateRiskLevel(riskScore: number): RiskLevel {
    if (riskScore >= 20) return RiskLevel.CRITICAL;
    if (riskScore >= 15) return RiskLevel.HIGH;
    if (riskScore >= 10) return RiskLevel.MEDIUM;
    if (riskScore >= 5) return RiskLevel.LOW;
    return RiskLevel.NEGLIGIBLE;
  }

  private getBusinessImpactType(category: string): BusinessImpactType {
    if (category.includes('Information Disclosure') || category.includes('PII')) {
      return BusinessImpactType.DATA_BREACH;
    }
    if (category.includes('Authentication') || category.includes('Authorization')) {
      return BusinessImpactType.DATA_BREACH;
    }
    if (category.includes('Injection') || category.includes('Command')) {
      return BusinessImpactType.SERVICE_DISRUPTION;
    }
    if (category.includes('Cryptographic')) {
      return BusinessImpactType.COMPLIANCE_VIOLATION;
    }
    return BusinessImpactType.REPUTATION_DAMAGE;
  }

  private getAffectedRegulations(category: string): string[] {
    const regulations = [];
    
    if (category.includes('Information Disclosure') || category.includes('PII')) {
      regulations.push('GDPR', 'CCPA');
    }
    if (category.includes('Cryptographic') || category.includes('Authentication')) {
      regulations.push('SOX', 'HIPAA');
    }
    if (category.includes('Payment') || category.includes('Credit Card')) {
      regulations.push('PCI DSS');
    }
    
    return regulations.length > 0 ? regulations : ['General Data Protection'];
  }
}