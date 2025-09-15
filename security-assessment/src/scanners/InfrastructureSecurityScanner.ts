/**
 * Infrastructure Security Scanner for CDK TypeScript configurations
 * Analyzes AWS CDK infrastructure code for security misconfigurations and compliance violations
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
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
  RemediationPlan,
  RemediationStep
} from '../types/VulnerabilityTypes';
import { RiskAssessment, RiskLevel, BusinessImpactType, RiskScore } from '../types/RiskAssessmentTypes';
import { 
  ComplianceMapping, 
  ComplianceFramework, 
  ComplianceStatus, 
  ComplianceControl,
  OwaspTop10Category 
} from '../types/ComplianceTypes';

export interface IAMPolicyAnalysis {
  readonly hasWildcardActions: boolean;
  readonly hasWildcardResources: boolean;
  readonly overprivilegedActions: string[];
  readonly missingPrinciples: string[];
}

export interface S3BucketAnalysis {
  readonly hasPublicAccess: boolean;
  readonly encryptionEnabled: boolean;
  readonly versioningEnabled: boolean;
  readonly corsConfiguration: any;
  readonly bucketPolicy?: any;
}

export interface APIGatewayAnalysis {
  readonly authenticationEnabled: boolean;
  readonly authorizationType: string;
  readonly corsEnabled: boolean;
  readonly throttlingEnabled: boolean;
  readonly loggingEnabled: boolean;
}

export interface DynamoDBAnalysis {
  readonly encryptionAtRest: boolean;
  readonly encryptionInTransit: boolean;
  readonly pointInTimeRecovery: boolean;
  readonly backupEnabled: boolean;
  readonly streamEncryption: boolean;
}

export interface CognitoAnalysis {
  readonly passwordPolicyStrength: string;
  readonly mfaEnabled: boolean;
  readonly accountRecoveryMethods: string[];
  readonly userPoolDomainSecure: boolean;
  readonly tokenValidityPeriods: any;
}

export class InfrastructureSecurityScanner implements ISecurityScanner {
  public readonly name = 'Infrastructure Security Scanner';
  public readonly version = '1.0.0';
  public readonly description = 'Analyzes AWS CDK TypeScript configurations for security vulnerabilities and compliance violations';
  public readonly supportedFileTypes = ['.ts', '.js'];

  private config?: ScannerConfiguration;
  private vulnerabilities: VulnerabilityFinding[] = [];
  private errors: ScanError[] = [];
  private filesScanned = 0;
  private startTime?: Date;

  public async configure(config: ScannerConfiguration): Promise<void> {
    this.config = config;
    this.vulnerabilities = [];
    this.errors = [];
    this.filesScanned = 0;
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

    const errors: string[] = [];
    const warnings: string[] = [];
    const inaccessibleFiles: string[] = [];
    let accessibleFiles = 0;

    try {
      if (!fs.existsSync(this.config.targetPath)) {
        errors.push(`Target path does not exist: ${this.config.targetPath}`);
        return {
          isValid: false,
          errors,
          warnings,
          accessibleFiles: 0,
          inaccessibleFiles: [this.config.targetPath]
        };
      }

      const files = this.getInfrastructureFiles(this.config.targetPath);
      
      for (const file of files) {
        try {
          fs.accessSync(file, fs.constants.R_OK);
          accessibleFiles++;
        } catch (error) {
          inaccessibleFiles.push(file);
          warnings.push(`Cannot read file: ${file}`);
        }
      }

      if (accessibleFiles === 0) {
        errors.push('No accessible infrastructure files found');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        accessibleFiles,
        inaccessibleFiles
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation failed: ${error instanceof Error ? error.message : String(error)}`],
        warnings,
        accessibleFiles: 0,
        inaccessibleFiles: []
      };
    }
  }

  public async scan(progressCallback?: ProgressCallback): Promise<ScanResult> {
    if (!this.config) {
      throw new Error('Scanner not configured');
    }

    this.startTime = new Date();
    this.vulnerabilities = [];
    this.errors = [];
    this.filesScanned = 0;

    const files = this.getInfrastructureFiles(this.config.targetPath);
    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (progressCallback) {
        const progress: ScanProgress = {
          currentFile: file,
          filesProcessed: i,
          totalFiles,
          percentage: (i / totalFiles) * 100,
          estimatedTimeRemaining: this.calculateETA(i, totalFiles),
          vulnerabilitiesFound: this.vulnerabilities.length
        };
        progressCallback(progress);
      }

      try {
        await this.scanFile(file);
        this.filesScanned++;
      } catch (error) {
        this.errors.push({
          filePath: file,
          errorType: 'ScanError',
          message: error instanceof Error ? error.message : String(error),
          timestamp: new Date()
        });
      }
    }

    const endTime = new Date();
    const scanDuration = endTime.getTime() - this.startTime.getTime();

    return {
      scannerId: 'infrastructure-scanner',
      scannerName: this.name,
      scannerVersion: this.version,
      targetPath: this.config.targetPath,
      startTime: this.startTime,
      endTime,
      filesScanned: this.filesScanned,
      vulnerabilities: this.vulnerabilities,
      riskAssessments: this.generateRiskAssessments(),
      complianceMappings: this.generateComplianceMappings(),
      errors: this.errors,
      metadata: {
        scanDuration,
        memoryUsage: process.memoryUsage().heapUsed,
        rulesApplied: this.getRulesAppliedCount(),
        falsePositiveFiltered: 0,
        confidence: this.calculateConfidence()
      }
    };
  }

  public async getHealthStatus(): Promise<HealthStatus> {
    return {
      isHealthy: true,
      version: this.version,
      lastUpdated: new Date(),
      dependencies: [
        {
          name: 'typescript',
          version: ts.version,
          status: 'available'
        }
      ],
      performance: {
        averageScanTime: 500, // ms per file
        memoryUsage: process.memoryUsage().heapUsed,
        cpuUsage: 0,
        cacheHitRate: 0
      }
    };
  }

  public async cleanup(): Promise<void> {
    this.vulnerabilities = [];
    this.errors = [];
    this.filesScanned = 0;
  }

  private getInfrastructureFiles(targetPath: string): string[] {
    const files: string[] = [];
    
    const scanDirectory = (dir: string): void => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            // Skip node_modules and other excluded directories
            if (!this.shouldExcludeDirectory(entry.name)) {
              scanDirectory(fullPath);
            }
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            if (this.supportedFileTypes.includes(ext)) {
              // Focus on infrastructure files
              if (this.isInfrastructureFile(fullPath)) {
                files.push(fullPath);
              }
            }
          }
        }
      } catch (error) {
        this.errors.push({
          filePath: dir,
          errorType: 'DirectoryAccessError',
          message: error instanceof Error ? error.message : String(error),
          timestamp: new Date()
        });
      }
    };

    if (fs.statSync(targetPath).isDirectory()) {
      scanDirectory(targetPath);
    } else if (this.isInfrastructureFile(targetPath)) {
      files.push(targetPath);
    }

    return files;
  }

  private shouldExcludeDirectory(dirName: string): boolean {
    const excludedDirs = ['node_modules', '.git', 'dist', 'build', 'cdk.out', '.aws-sam'];
    return excludedDirs.includes(dirName);
  }

  private isInfrastructureFile(filePath: string): boolean {
    const fileName = path.basename(filePath).toLowerCase();
    const dirName = path.dirname(filePath).toLowerCase();
    
    // CDK infrastructure patterns
    return (
      fileName.includes('stack') ||
      fileName.includes('construct') ||
      fileName.includes('infrastructure') ||
      dirName.includes('infrastructure') ||
      dirName.includes('cdk') ||
      fileName.includes('cdk') ||
      fileName === 'app.ts' ||
      fileName === 'index.ts'
    );
  }

  private async scanFile(filePath: string): Promise<void> {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Parse TypeScript/JavaScript file
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    // Analyze the AST for security issues
    this.analyzeASTNode(sourceFile, filePath, content, 0);
  }

  private analyzeASTNode(node: ts.Node, filePath: string, content: string, depth: number = 0): void {
    // Prevent stack overflow by limiting recursion depth
    if (depth > 50) {
      return;
    }

    // Analyze IAM policies
    this.analyzeIAMPolicies(node, filePath, content);
    
    // Analyze S3 bucket configurations
    this.analyzeS3Buckets(node, filePath, content);
    
    // Analyze API Gateway configurations
    this.analyzeAPIGateway(node, filePath, content);
    
    // Analyze DynamoDB configurations
    this.analyzeDynamoDB(node, filePath, content);
    
    // Analyze Cognito configurations
    this.analyzeCognito(node, filePath, content);
    
    // Analyze Lambda configurations
    this.analyzeLambda(node, filePath, content);

    // Recursively analyze child nodes with depth tracking
    ts.forEachChild(node, (child) => {
      this.analyzeASTNode(child, filePath, content, depth + 1);
    });
  }

  private analyzeIAMPolicies(node: ts.Node, filePath: string, content: string): void {
    if (ts.isNewExpression(node) || ts.isCallExpression(node)) {
      const text = node.getText();
      
      // Check for IAM Role creation
      if (text.includes('iam.Role') || text.includes('Role(')) {
        this.analyzeIAMRole(node, filePath, content);
      }
      
      // Check for IAM Policy creation
      if (text.includes('iam.Policy') || text.includes('PolicyDocument') || text.includes('PolicyStatement')) {
        this.analyzeIAMPolicyStatement(node, filePath, content);
      }
    }
  }

  private analyzeIAMRole(node: ts.Node, filePath: string, content: string): void {
    const nodeText = node.getText();
    const lineNumber = this.getLineNumber(node, content);
    
    // Check for overprivileged roles
    if (nodeText.includes('*') && (nodeText.includes('actions') || nodeText.includes('resources'))) {
      this.addVulnerability({
        id: `iam-overprivileged-${Date.now()}`,
        title: 'Overprivileged IAM Role',
        description: 'IAM role contains wildcard permissions that grant excessive access',
        severity: VulnerabilitySeverity.HIGH,
        category: VulnerabilityCategory.AUTHORIZATION_FAILURE,
        cweId: 'CWE-269',
        location: {
          filePath,
          lineNumber,
          codeSnippet: this.getCodeSnippet(content, lineNumber)
        },
        evidence: ['Wildcard (*) found in IAM policy actions or resources'],
        impact: 'Excessive permissions could lead to privilege escalation and unauthorized access to AWS resources',
        likelihood: 'High - Overprivileged roles are commonly exploited',
        remediation: {
          summary: 'Apply principle of least privilege to IAM roles',
          steps: [
            {
              stepNumber: 1,
              description: 'Review the specific permissions required for this role',
              codeChanges: 'Replace wildcard (*) with specific actions and resources'
            },
            {
              stepNumber: 2,
              description: 'Use AWS IAM Access Analyzer to identify unused permissions',
              testingRequirements: 'Test application functionality with restricted permissions'
            }
          ],
          estimatedEffort: '2-4 hours',
          priority: 1,
          timeline: 'Within 1 week',
          verification: ['Run IAM policy simulator', 'Verify application functionality']
        },
        references: [
          'https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html',
          'https://owasp.org/www-project-top-ten/2017/A5_2017-Broken_Access_Control'
        ],
        discoveredAt: new Date(),
        scannerName: this.name
      });
    }

    // Check for missing assume role policy conditions
    if (!nodeText.includes('conditions') && nodeText.includes('assumedBy')) {
      this.addVulnerability({
        id: `iam-missing-conditions-${Date.now()}`,
        title: 'IAM Role Missing Assume Role Conditions',
        description: 'IAM role lacks conditions in assume role policy, potentially allowing unauthorized access',
        severity: VulnerabilitySeverity.MEDIUM,
        category: VulnerabilityCategory.AUTHORIZATION_FAILURE,
        cweId: 'CWE-284',
        location: {
          filePath,
          lineNumber,
          codeSnippet: this.getCodeSnippet(content, lineNumber)
        },
        evidence: ['No conditions found in assume role policy'],
        impact: 'Role could be assumed by unintended principals',
        likelihood: 'Medium - Depends on role usage and exposure',
        remediation: {
          summary: 'Add appropriate conditions to assume role policy',
          steps: [
            {
              stepNumber: 1,
              description: 'Add conditions to restrict when and how the role can be assumed',
              codeChanges: 'Add conditions like StringEquals, IpAddress, or DateGreaterThan'
            }
          ],
          estimatedEffort: '1-2 hours',
          priority: 2,
          timeline: 'Within 2 weeks',
          verification: ['Test role assumption with and without conditions']
        },
        references: [
          'https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_condition-keys.html'
        ],
        discoveredAt: new Date(),
        scannerName: this.name
      });
    }
  }

  private analyzeIAMPolicyStatement(node: ts.Node, filePath: string, content: string): void {
    const nodeText = node.getText();
    const lineNumber = this.getLineNumber(node, content);
    
    // Check for wildcard actions
    if (nodeText.includes('"*"') && nodeText.includes('actions')) {
      this.addVulnerability({
        id: `iam-wildcard-actions-${Date.now()}`,
        title: 'IAM Policy with Wildcard Actions',
        description: 'IAM policy statement uses wildcard (*) for actions, granting excessive permissions',
        severity: VulnerabilitySeverity.HIGH,
        category: VulnerabilityCategory.AUTHORIZATION_FAILURE,
        cweId: 'CWE-269',
        location: {
          filePath,
          lineNumber,
          codeSnippet: this.getCodeSnippet(content, lineNumber)
        },
        evidence: ['Wildcard (*) found in policy actions'],
        impact: 'Grants all possible actions, violating principle of least privilege',
        likelihood: 'High - Common misconfiguration',
        remediation: {
          summary: 'Replace wildcard actions with specific required actions',
          steps: [
            {
              stepNumber: 1,
              description: 'Identify the minimum required actions for the use case',
              codeChanges: 'Replace "*" with specific action names like "s3:GetObject", "dynamodb:Query"'
            }
          ],
          estimatedEffort: '1-3 hours',
          priority: 1,
          timeline: 'Within 1 week',
          verification: ['Test functionality with restricted permissions']
        },
        references: [
          'https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html#grant-least-privilege'
        ],
        discoveredAt: new Date(),
        scannerName: this.name
      });
    }

    // Check for wildcard resources
    if (nodeText.includes('"*"') && nodeText.includes('resources')) {
      this.addVulnerability({
        id: `iam-wildcard-resources-${Date.now()}`,
        title: 'IAM Policy with Wildcard Resources',
        description: 'IAM policy statement uses wildcard (*) for resources, allowing access to all resources',
        severity: VulnerabilitySeverity.HIGH,
        category: VulnerabilityCategory.AUTHORIZATION_FAILURE,
        cweId: 'CWE-269',
        location: {
          filePath,
          lineNumber,
          codeSnippet: this.getCodeSnippet(content, lineNumber)
        },
        evidence: ['Wildcard (*) found in policy resources'],
        impact: 'Allows access to all resources of the specified type',
        likelihood: 'High - Common misconfiguration',
        remediation: {
          summary: 'Specify exact resource ARNs instead of wildcards',
          steps: [
            {
              stepNumber: 1,
              description: 'Replace wildcard with specific resource ARNs',
              codeChanges: 'Use specific ARNs like "arn:aws:s3:::my-bucket/*" instead of "*"'
            }
          ],
          estimatedEffort: '1-2 hours',
          priority: 1,
          timeline: 'Within 1 week',
          verification: ['Verify access is limited to intended resources']
        },
        references: [
          'https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_resource.html'
        ],
        discoveredAt: new Date(),
        scannerName: this.name
      });
    }
  }

  private analyzeS3Buckets(node: ts.Node, filePath: string, content: string): void {
    if (ts.isNewExpression(node) || ts.isCallExpression(node)) {
      const text = node.getText();
      
      if (text.includes('s3.Bucket') || text.includes('Bucket(')) {
        this.analyzeS3BucketConfiguration(node, filePath, content);
      }
    }
  }

  private analyzeS3BucketConfiguration(node: ts.Node, filePath: string, content: string): void {
    const nodeText = node.getText();
    const lineNumber = this.getLineNumber(node, content);
    
    // Check for public access
    if (nodeText.includes('publicReadAccess: true') || 
        nodeText.includes('publicWriteAccess: true') ||
        nodeText.includes('allowedOrigins: [\'*\']')) {
      this.addVulnerability({
        id: `s3-public-access-${Date.now()}`,
        title: 'S3 Bucket with Public Access',
        description: 'S3 bucket is configured to allow public access, potentially exposing sensitive data',
        severity: VulnerabilitySeverity.CRITICAL,
        category: VulnerabilityCategory.INSECURE_CONFIGURATION,
        cweId: 'CWE-200',
        location: {
          filePath,
          lineNumber,
          codeSnippet: this.getCodeSnippet(content, lineNumber)
        },
        evidence: ['Public access configuration found in S3 bucket'],
        impact: 'Sensitive data could be exposed to unauthorized users',
        likelihood: 'High - Public buckets are actively scanned by attackers',
        remediation: {
          summary: 'Remove public access and implement proper access controls',
          steps: [
            {
              stepNumber: 1,
              description: 'Remove public access settings',
              codeChanges: 'Set publicReadAccess: false and publicWriteAccess: false'
            },
            {
              stepNumber: 2,
              description: 'Implement bucket policies with specific principals',
              configurationChanges: 'Use IAM roles and policies for access control'
            }
          ],
          estimatedEffort: '1-2 hours',
          priority: 1,
          timeline: 'Immediate',
          verification: ['Verify bucket is not publicly accessible', 'Test authorized access still works']
        },
        references: [
          'https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-best-practices.html',
          'https://owasp.org/www-project-top-ten/2017/A6_2017-Security_Misconfiguration'
        ],
        discoveredAt: new Date(),
        scannerName: this.name
      });
    }

    // Check for missing encryption
    if (!nodeText.includes('encryption') && !nodeText.includes('bucketKeyEnabled')) {
      this.addVulnerability({
        id: `s3-no-encryption-${Date.now()}`,
        title: 'S3 Bucket Without Encryption',
        description: 'S3 bucket does not have server-side encryption enabled',
        severity: VulnerabilitySeverity.HIGH,
        category: VulnerabilityCategory.CRYPTOGRAPHIC_FAILURE,
        cweId: 'CWE-311',
        location: {
          filePath,
          lineNumber,
          codeSnippet: this.getCodeSnippet(content, lineNumber)
        },
        evidence: ['No encryption configuration found'],
        impact: 'Data stored in bucket is not encrypted at rest',
        likelihood: 'Medium - Depends on data sensitivity',
        remediation: {
          summary: 'Enable server-side encryption for S3 bucket',
          steps: [
            {
              stepNumber: 1,
              description: 'Add encryption configuration to bucket',
              codeChanges: 'Add encryption: s3.BucketEncryption.S3_MANAGED or KMS_MANAGED'
            }
          ],
          estimatedEffort: '30 minutes',
          priority: 1,
          timeline: 'Within 1 week',
          verification: ['Verify encryption is enabled in AWS console']
        },
        references: [
          'https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucket-encryption.html'
        ],
        discoveredAt: new Date(),
        scannerName: this.name
      });
    }

    // Check for overly permissive CORS
    if (nodeText.includes('allowedOrigins') && nodeText.includes('*')) {
      this.addVulnerability({
        id: `s3-permissive-cors-${Date.now()}`,
        title: 'S3 Bucket with Permissive CORS Policy',
        description: 'S3 bucket CORS policy allows requests from any origin (*)',
        severity: VulnerabilitySeverity.MEDIUM,
        category: VulnerabilityCategory.INSECURE_CONFIGURATION,
        cweId: 'CWE-346',
        location: {
          filePath,
          lineNumber,
          codeSnippet: this.getCodeSnippet(content, lineNumber)
        },
        evidence: ['Wildcard (*) found in CORS allowedOrigins'],
        impact: 'Could enable cross-origin attacks and data theft',
        likelihood: 'Medium - Depends on bucket usage',
        remediation: {
          summary: 'Restrict CORS policy to specific trusted origins',
          steps: [
            {
              stepNumber: 1,
              description: 'Replace wildcard with specific domain names',
              codeChanges: 'Use specific origins like ["https://yourdomain.com"] instead of ["*"]'
            }
          ],
          estimatedEffort: '30 minutes',
          priority: 2,
          timeline: 'Within 2 weeks',
          verification: ['Test CORS functionality with restricted origins']
        },
        references: [
          'https://docs.aws.amazon.com/AmazonS3/latest/userguide/cors.html'
        ],
        discoveredAt: new Date(),
        scannerName: this.name
      });
    }
  }

  private analyzeAPIGateway(node: ts.Node, filePath: string, content: string): void {
    if (ts.isNewExpression(node) || ts.isCallExpression(node)) {
      const text = node.getText();
      
      if (text.includes('appsync.GraphqlApi') || text.includes('apigateway.RestApi')) {
        this.analyzeAPIGatewayConfiguration(node, filePath, content);
      }
    }
  }

  private analyzeAPIGatewayConfiguration(node: ts.Node, filePath: string, content: string): void {
    const nodeText = node.getText();
    const lineNumber = this.getLineNumber(node, content);
    
    // Check for missing authentication
    if (!nodeText.includes('authorizationConfig') && !nodeText.includes('authorizer')) {
      this.addVulnerability({
        id: `api-no-auth-${Date.now()}`,
        title: 'API Gateway Without Authentication',
        description: 'API Gateway does not have authentication configured',
        severity: VulnerabilitySeverity.HIGH,
        category: VulnerabilityCategory.AUTHENTICATION_BYPASS,
        cweId: 'CWE-306',
        location: {
          filePath,
          lineNumber,
          codeSnippet: this.getCodeSnippet(content, lineNumber)
        },
        evidence: ['No authorization configuration found'],
        impact: 'API endpoints are publicly accessible without authentication',
        likelihood: 'High - Unauthenticated APIs are easily exploited',
        remediation: {
          summary: 'Implement authentication for API Gateway',
          steps: [
            {
              stepNumber: 1,
              description: 'Add authorization configuration',
              codeChanges: 'Add authorizationConfig with USER_POOL, IAM, or LAMBDA authorization'
            }
          ],
          estimatedEffort: '2-4 hours',
          priority: 1,
          timeline: 'Within 1 week',
          verification: ['Test API access requires authentication']
        },
        references: [
          'https://docs.aws.amazon.com/appsync/latest/devguide/security-authz.html'
        ],
        discoveredAt: new Date(),
        scannerName: this.name
      });
    }

    // Check for missing logging
    if (!nodeText.includes('logConfig') && !nodeText.includes('logging')) {
      this.addVulnerability({
        id: `api-no-logging-${Date.now()}`,
        title: 'API Gateway Without Logging',
        description: 'API Gateway does not have logging enabled for security monitoring',
        severity: VulnerabilitySeverity.MEDIUM,
        category: VulnerabilityCategory.LOGGING_FAILURE,
        cweId: 'CWE-778',
        location: {
          filePath,
          lineNumber,
          codeSnippet: this.getCodeSnippet(content, lineNumber)
        },
        evidence: ['No logging configuration found'],
        impact: 'Security events and API usage cannot be monitored',
        likelihood: 'Medium - Impacts incident response capabilities',
        remediation: {
          summary: 'Enable logging for API Gateway',
          steps: [
            {
              stepNumber: 1,
              description: 'Add logging configuration',
              codeChanges: 'Add logConfig with appropriate log level (ERROR or ALL)'
            }
          ],
          estimatedEffort: '30 minutes',
          priority: 2,
          timeline: 'Within 2 weeks',
          verification: ['Verify logs are being generated in CloudWatch']
        },
        references: [
          'https://docs.aws.amazon.com/appsync/latest/devguide/monitoring.html'
        ],
        discoveredAt: new Date(),
        scannerName: this.name
      });
    }
  }

  private analyzeDynamoDB(node: ts.Node, filePath: string, content: string): void {
    if (ts.isNewExpression(node) || ts.isCallExpression(node)) {
      const text = node.getText();
      
      if (text.includes('dynamodb.Table') || text.includes('Table(')) {
        this.analyzeDynamoDBConfiguration(node, filePath, content);
      }
    }
  }

  private analyzeDynamoDBConfiguration(node: ts.Node, filePath: string, content: string): void {
    const nodeText = node.getText();
    const lineNumber = this.getLineNumber(node, content);
    
    // Check for missing encryption
    if (!nodeText.includes('encryption') || nodeText.includes('TableEncryption.DEFAULT')) {
      this.addVulnerability({
        id: `dynamodb-no-encryption-${Date.now()}`,
        title: 'DynamoDB Table Without Customer-Managed Encryption',
        description: 'DynamoDB table uses default encryption instead of customer-managed keys',
        severity: VulnerabilitySeverity.MEDIUM,
        category: VulnerabilityCategory.CRYPTOGRAPHIC_FAILURE,
        cweId: 'CWE-311',
        location: {
          filePath,
          lineNumber,
          codeSnippet: this.getCodeSnippet(content, lineNumber)
        },
        evidence: ['No customer-managed encryption configuration found'],
        impact: 'Data is encrypted but with AWS-managed keys, limiting key management control',
        likelihood: 'Low - Default encryption provides basic protection',
        remediation: {
          summary: 'Consider using customer-managed KMS keys for enhanced security',
          steps: [
            {
              stepNumber: 1,
              description: 'Evaluate if customer-managed encryption is required',
              codeChanges: 'Add encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED'
            }
          ],
          estimatedEffort: '1-2 hours',
          priority: 3,
          timeline: 'Within 1 month',
          verification: ['Verify encryption key management meets compliance requirements']
        },
        references: [
          'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/encryption.tutorial.html'
        ],
        discoveredAt: new Date(),
        scannerName: this.name
      });
    }

    // Check for missing point-in-time recovery
    if (!nodeText.includes('pointInTimeRecovery')) {
      this.addVulnerability({
        id: `dynamodb-no-pitr-${Date.now()}`,
        title: 'DynamoDB Table Without Point-in-Time Recovery',
        description: 'DynamoDB table does not have point-in-time recovery enabled',
        severity: VulnerabilitySeverity.LOW,
        category: VulnerabilityCategory.INSECURE_CONFIGURATION,
        cweId: 'CWE-404',
        location: {
          filePath,
          lineNumber,
          codeSnippet: this.getCodeSnippet(content, lineNumber)
        },
        evidence: ['No point-in-time recovery configuration found'],
        impact: 'Data loss risk in case of accidental deletion or corruption',
        likelihood: 'Low - Depends on data criticality',
        remediation: {
          summary: 'Enable point-in-time recovery for critical tables',
          steps: [
            {
              stepNumber: 1,
              description: 'Add point-in-time recovery configuration',
              codeChanges: 'Add pointInTimeRecovery: true'
            }
          ],
          estimatedEffort: '15 minutes',
          priority: 3,
          timeline: 'Within 1 month',
          verification: ['Verify PITR is enabled in AWS console']
        },
        references: [
          'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/PointInTimeRecovery.html'
        ],
        discoveredAt: new Date(),
        scannerName: this.name
      });
    }
  }

  private analyzeCognito(node: ts.Node, filePath: string, content: string): void {
    if (ts.isNewExpression(node) || ts.isCallExpression(node)) {
      const text = node.getText();
      
      if (text.includes('cognito.UserPool') || text.includes('UserPool(')) {
        this.analyzeCognitoConfiguration(node, filePath, content);
      }
    }
  }

  private analyzeCognitoConfiguration(node: ts.Node, filePath: string, content: string): void {
    const nodeText = node.getText();
    const lineNumber = this.getLineNumber(node, content);
    
    // Check for weak password policy
    if (nodeText.includes('passwordPolicy') && 
        (!nodeText.includes('requireSymbols: true') || 
         !nodeText.includes('minLength: 12') ||
         nodeText.includes('minLength: 8'))) {
      this.addVulnerability({
        id: `cognito-weak-password-${Date.now()}`,
        title: 'Cognito User Pool with Weak Password Policy',
        description: 'Cognito User Pool has a weak password policy that may allow easily guessable passwords',
        severity: VulnerabilitySeverity.MEDIUM,
        category: VulnerabilityCategory.AUTHENTICATION_BYPASS,
        cweId: 'CWE-521',
        location: {
          filePath,
          lineNumber,
          codeSnippet: this.getCodeSnippet(content, lineNumber)
        },
        evidence: ['Weak password policy configuration found'],
        impact: 'Users may choose weak passwords that are easily compromised',
        likelihood: 'Medium - Weak passwords are commonly targeted',
        remediation: {
          summary: 'Strengthen password policy requirements',
          steps: [
            {
              stepNumber: 1,
              description: 'Increase minimum password length and complexity',
              codeChanges: 'Set minLength: 12, requireSymbols: true, requireUppercase: true, requireLowercase: true, requireDigits: true'
            }
          ],
          estimatedEffort: '30 minutes',
          priority: 2,
          timeline: 'Within 2 weeks',
          verification: ['Test password creation with new policy']
        },
        references: [
          'https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-policies.html',
          'https://owasp.org/www-project-authentication-cheat-sheet/'
        ],
        discoveredAt: new Date(),
        scannerName: this.name
      });
    }

    // Check for missing MFA
    if (!nodeText.includes('mfa') && !nodeText.includes('enableSmsRole')) {
      this.addVulnerability({
        id: `cognito-no-mfa-${Date.now()}`,
        title: 'Cognito User Pool Without MFA Configuration',
        description: 'Cognito User Pool does not have multi-factor authentication configured',
        severity: VulnerabilitySeverity.MEDIUM,
        category: VulnerabilityCategory.AUTHENTICATION_BYPASS,
        cweId: 'CWE-308',
        location: {
          filePath,
          lineNumber,
          codeSnippet: this.getCodeSnippet(content, lineNumber)
        },
        evidence: ['No MFA configuration found'],
        impact: 'Accounts are vulnerable to credential compromise',
        likelihood: 'Medium - Single-factor authentication is less secure',
        remediation: {
          summary: 'Configure multi-factor authentication options',
          steps: [
            {
              stepNumber: 1,
              description: 'Add MFA configuration to user pool',
              codeChanges: 'Add mfa: cognito.Mfa.OPTIONAL or REQUIRED'
            }
          ],
          estimatedEffort: '1-2 hours',
          priority: 2,
          timeline: 'Within 2 weeks',
          verification: ['Test MFA enrollment and authentication flow']
        },
        references: [
          'https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-mfa.html'
        ],
        discoveredAt: new Date(),
        scannerName: this.name
      });
    }
  }

  private analyzeLambda(node: ts.Node, filePath: string, content: string): void {
    if (ts.isNewExpression(node) || ts.isCallExpression(node)) {
      const text = node.getText();
      
      if (text.includes('lambda.Function') || text.includes('Function(')) {
        this.analyzeLambdaConfiguration(node, filePath, content);
      }
    }
  }

  private analyzeLambdaConfiguration(node: ts.Node, filePath: string, content: string): void {
    const nodeText = node.getText();
    const lineNumber = this.getLineNumber(node, content);
    
    // Check for environment variables with potential secrets
    if (nodeText.includes('environment') && 
        (nodeText.includes('password') || 
         nodeText.includes('secret') || 
         nodeText.includes('key') ||
         nodeText.includes('token'))) {
      this.addVulnerability({
        id: `lambda-env-secrets-${Date.now()}`,
        title: 'Lambda Function with Potential Secrets in Environment Variables',
        description: 'Lambda function environment variables may contain sensitive information',
        severity: VulnerabilitySeverity.HIGH,
        category: VulnerabilityCategory.HARDCODED_SECRETS,
        cweId: 'CWE-798',
        location: {
          filePath,
          lineNumber,
          codeSnippet: this.getCodeSnippet(content, lineNumber)
        },
        evidence: ['Potential secret keywords found in environment variables'],
        impact: 'Sensitive information could be exposed in Lambda configuration',
        likelihood: 'Medium - Depends on actual secret exposure',
        remediation: {
          summary: 'Use AWS Systems Manager Parameter Store or Secrets Manager for sensitive data',
          steps: [
            {
              stepNumber: 1,
              description: 'Move secrets to AWS Secrets Manager or Parameter Store',
              codeChanges: 'Remove sensitive values from environment variables'
            },
            {
              stepNumber: 2,
              description: 'Update Lambda code to retrieve secrets at runtime',
              configurationChanges: 'Grant Lambda permission to access secrets'
            }
          ],
          estimatedEffort: '2-4 hours',
          priority: 1,
          timeline: 'Within 1 week',
          verification: ['Verify secrets are not visible in Lambda configuration']
        },
        references: [
          'https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html#configuration-envvars-encryption',
          'https://docs.aws.amazon.com/secretsmanager/latest/userguide/lambda.html'
        ],
        discoveredAt: new Date(),
        scannerName: this.name
      });
    }

    // Check for excessive timeout
    if (nodeText.includes('timeout') && 
        (nodeText.includes('Duration.minutes(15)') || 
         nodeText.includes('Duration.minutes(10)'))) {
      this.addVulnerability({
        id: `lambda-long-timeout-${Date.now()}`,
        title: 'Lambda Function with Excessive Timeout',
        description: 'Lambda function has a very long timeout that could impact cost and security',
        severity: VulnerabilitySeverity.LOW,
        category: VulnerabilityCategory.INSECURE_CONFIGURATION,
        cweId: 'CWE-400',
        location: {
          filePath,
          lineNumber,
          codeSnippet: this.getCodeSnippet(content, lineNumber)
        },
        evidence: ['Long timeout configuration found'],
        impact: 'Could lead to increased costs and potential DoS if function hangs',
        likelihood: 'Low - Depends on function implementation',
        remediation: {
          summary: 'Review and optimize Lambda timeout settings',
          steps: [
            {
              stepNumber: 1,
              description: 'Analyze actual function execution time and set appropriate timeout',
              codeChanges: 'Reduce timeout to minimum required duration'
            }
          ],
          estimatedEffort: '30 minutes',
          priority: 3,
          timeline: 'Within 1 month',
          verification: ['Monitor function execution times and adjust timeout accordingly']
        },
        references: [
          'https://docs.aws.amazon.com/lambda/latest/dg/configuration-function-common.html#configuration-timeout-console'
        ],
        discoveredAt: new Date(),
        scannerName: this.name
      });
    }
  }

  private addVulnerability(vulnerability: VulnerabilityFinding): void {
    this.vulnerabilities.push(vulnerability);
  }

  private getLineNumber(node: ts.Node, content: string): number {
    const sourceFile = node.getSourceFile();
    const position = node.getStart();
    const lineAndChar = sourceFile.getLineAndCharacterOfPosition(position);
    return lineAndChar.line + 1;
  }

  private getCodeSnippet(content: string, lineNumber: number, contextLines: number = 2): string {
    const lines = content.split('\n');
    const start = Math.max(0, lineNumber - contextLines - 1);
    const end = Math.min(lines.length, lineNumber + contextLines);
    
    return lines.slice(start, end)
      .map((line, index) => {
        const actualLineNumber = start + index + 1;
        const marker = actualLineNumber === lineNumber ? '>>> ' : '    ';
        return `${marker}${actualLineNumber}: ${line}`;
      })
      .join('\n');
  }

  private calculateETA(processed: number, total: number): number {
    if (processed === 0 || !this.startTime) return 0;
    
    const elapsed = Date.now() - this.startTime.getTime();
    const rate = processed / elapsed;
    const remaining = total - processed;
    
    return remaining / rate;
  }

  private generateRiskAssessments(): RiskAssessment[] {
    const riskAssessments: RiskAssessment[] = [];
    
    // Group vulnerabilities by severity
    const criticalVulns = this.vulnerabilities.filter(v => v.severity === VulnerabilitySeverity.CRITICAL);
    const highVulns = this.vulnerabilities.filter(v => v.severity === VulnerabilitySeverity.HIGH);
    
    // Create risk assessment for critical vulnerabilities
    if (criticalVulns.length > 0) {
      const riskScore: RiskScore = {
        likelihood: 5,
        impact: 5,
        overallRisk: 25,
        riskLevel: RiskLevel.CRITICAL,
        confidenceLevel: 4
      };
      
      riskAssessments.push({
        vulnerabilityId: 'infrastructure-critical-group',
        riskScore,
        businessImpact: {
          impactTypes: [
            BusinessImpactType.DATA_BREACH,
            BusinessImpactType.SERVICE_DISRUPTION,
            BusinessImpactType.COMPLIANCE_VIOLATION
          ],
          financialImpact: {
            estimatedCost: {
              minimum: 100000,
              maximum: 1000000,
              currency: 'USD'
            },
            costFactors: ['Incident response', 'Data breach notification', 'Regulatory fines'],
            recoveryTime: '1-4 weeks'
          },
          operationalImpact: {
            affectedSystems: ['AWS Infrastructure', 'Application Services'],
            serviceDowntime: 'Potential complete service outage',
            userImpact: 'All users affected',
            dataIntegrityRisk: true
          },
          complianceImpact: {
            affectedRegulations: ['GDPR', 'SOC2', 'AWS Compliance'],
            potentialFines: '$10M+ for GDPR violations',
            auditImplications: ['Failed compliance audits', 'Certification revocation']
          },
          reputationalImpact: {
            publicityRisk: 'High - Security breach likely to be public',
            customerTrustImpact: 'Severe loss of customer confidence',
            brandDamageAssessment: 'Long-term brand reputation damage'
          }
        },
        threatModel: {
          threatActors: [
            {
              type: 'External Attacker',
              motivation: 'Financial gain, data theft',
              capabilities: ['Advanced persistent threat', 'Automated scanning'],
              likelihood: 4
            }
          ],
          attackVectors: [
            {
              name: 'Privilege Escalation',
              description: 'Exploiting overprivileged IAM roles',
              complexity: 'Low',
              prerequisites: ['Network access', 'Valid credentials']
            }
          ],
          assetValuation: {
            assetName: 'AWS Infrastructure',
            confidentialityValue: 5,
            integrityValue: 5,
            availabilityValue: 5,
            overallValue: 5
          },
          threatScenarios: [
            {
              id: 'scenario-1',
              description: 'Attacker exploits public S3 bucket to access sensitive data',
              threatActor: 'External Attacker',
              attackVector: 'Public Resource Access',
              likelihood: 5,
              impact: 5,
              riskScore
            }
          ]
        },
        mitigationStrategies: [
          'Implement least privilege access controls',
          'Enable comprehensive logging and monitoring',
          'Regular security configuration reviews'
        ],
        residualRisk: {
          likelihood: 2,
          impact: 3,
          overallRisk: 6,
          riskLevel: RiskLevel.MEDIUM,
          confidenceLevel: 4
        },
        assessmentDate: new Date(),
        assessor: this.name
      });
    }
    
    return riskAssessments;
  }

  private generateComplianceMappings(): ComplianceMapping[] {
    const mappings: ComplianceMapping[] = [];
    
    // Group vulnerabilities by category for OWASP mapping
    const vulnsByCategory = new Map<VulnerabilityCategory, VulnerabilityFinding[]>();
    
    this.vulnerabilities.forEach(vuln => {
      if (!vulnsByCategory.has(vuln.category)) {
        vulnsByCategory.set(vuln.category, []);
      }
      vulnsByCategory.get(vuln.category)!.push(vuln);
    });
    
    // Create compliance mappings for each vulnerability
    this.vulnerabilities.forEach(vuln => {
      const owaspControl = this.getOwaspControlForCategory(vuln.category);
      if (owaspControl) {
        mappings.push({
          vulnerabilityId: vuln.id,
          mappedControls: [{
            control: owaspControl,
            status: ComplianceStatus.NON_COMPLIANT,
            evidence: vuln.evidence,
            gaps: [`Vulnerability found: ${vuln.title}`],
            remediation: vuln.remediation.steps.map(step => step.description)
          }],
          overallStatus: ComplianceStatus.NON_COMPLIANT,
          gapAnalysis: [{
            controlId: owaspControl.id,
            framework: ComplianceFramework.OWASP_TOP_10,
            gapDescription: vuln.description,
            severity: vuln.severity,
            remediation: vuln.remediation.summary,
            timeline: vuln.remediation.timeline,
            owner: 'Infrastructure Team'
          }],
          recommendedActions: vuln.remediation.steps.map(step => step.description)
        });
      }
    });
    
    return mappings;
  }

  private getOwaspControlForCategory(category: VulnerabilityCategory): ComplianceControl | null {
    const controlMap: { [key in VulnerabilityCategory]?: ComplianceControl } = {
      [VulnerabilityCategory.AUTHORIZATION_FAILURE]: {
        id: 'OWASP-A01-2021',
        framework: ComplianceFramework.OWASP_TOP_10,
        controlNumber: 'A01',
        title: 'Broken Access Control',
        description: 'Access control enforces policy such that users cannot act outside of their intended permissions',
        category: 'Access Control',
        requirements: [
          'Implement principle of least privilege',
          'Deny by default access controls',
          'Log access control failures'
        ],
        testProcedures: [
          'Review IAM policies for overprivileged access',
          'Test unauthorized access attempts',
          'Verify access control logging'
        ]
      },
      [VulnerabilityCategory.CRYPTOGRAPHIC_FAILURE]: {
        id: 'OWASP-A02-2021',
        framework: ComplianceFramework.OWASP_TOP_10,
        controlNumber: 'A02',
        title: 'Cryptographic Failures',
        description: 'Protect data in transit and at rest with strong cryptography',
        category: 'Cryptography',
        requirements: [
          'Encrypt sensitive data at rest',
          'Encrypt data in transit',
          'Use strong cryptographic algorithms'
        ],
        testProcedures: [
          'Verify encryption implementation',
          'Test key management practices',
          'Review cryptographic standards'
        ]
      },
      [VulnerabilityCategory.INSECURE_CONFIGURATION]: {
        id: 'OWASP-A05-2021',
        framework: ComplianceFramework.OWASP_TOP_10,
        controlNumber: 'A05',
        title: 'Security Misconfiguration',
        description: 'Secure configuration of all components',
        category: 'Configuration',
        requirements: [
          'Implement secure configuration baselines',
          'Regular configuration reviews',
          'Automated configuration compliance'
        ],
        testProcedures: [
          'Review security configurations',
          'Test default configurations',
          'Verify hardening procedures'
        ]
      },
      [VulnerabilityCategory.AUTHENTICATION_BYPASS]: {
        id: 'OWASP-A07-2021',
        framework: ComplianceFramework.OWASP_TOP_10,
        controlNumber: 'A07',
        title: 'Identification and Authentication Failures',
        description: 'Proper authentication and session management',
        category: 'Authentication',
        requirements: [
          'Implement strong authentication',
          'Use multi-factor authentication',
          'Proper session management'
        ],
        testProcedures: [
          'Test authentication mechanisms',
          'Verify MFA implementation',
          'Review session handling'
        ]
      },
      [VulnerabilityCategory.LOGGING_FAILURE]: {
        id: 'OWASP-A09-2021',
        framework: ComplianceFramework.OWASP_TOP_10,
        controlNumber: 'A09',
        title: 'Security Logging and Monitoring Failures',
        description: 'Comprehensive security logging and monitoring',
        category: 'Logging',
        requirements: [
          'Log security events',
          'Monitor for suspicious activity',
          'Implement alerting mechanisms'
        ],
        testProcedures: [
          'Review logging configuration',
          'Test monitoring systems',
          'Verify alert mechanisms'
        ]
      }
    };
    
    return controlMap[category] || null;
  }

  private getRulesAppliedCount(): number {
    // Count the number of different security rules applied
    return 15; // IAM, S3, API Gateway, DynamoDB, Cognito, Lambda rules
  }

  private calculateConfidence(): number {
    // Calculate confidence based on successful scans vs errors
    const totalAttempts = this.filesScanned + this.errors.length;
    if (totalAttempts === 0) return 100;
    
    const successRate = this.filesScanned / totalAttempts;
    return Math.round(successRate * 100);
  }
}