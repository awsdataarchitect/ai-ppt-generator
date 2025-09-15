/**
 * Deployment Security Scanner
 * 
 * Analyzes deployment configurations, CI/CD pipelines, and production settings for security vulnerabilities including:
 * - Hardcoded secrets in deployment scripts
 * - Environment configuration security issues
 * - Build process supply chain vulnerabilities
 * - Monitoring configuration gaps
 * - Backup and recovery security analysis
 * - Network configuration security assessment
 */

import * as fs from 'fs';
import * as path from 'path';
import { VulnerabilityFinding, VulnerabilitySeverity, VulnerabilityCategory } from '../types/VulnerabilityTypes';
import { FileSystemConfig } from '../config/FileSystemConfig';

export interface DeploymentScanResult {
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

export class DeploymentSecurityScanner {
  private config: FileSystemConfig;
  private findings: VulnerabilityFinding[] = [];
  private scannedFiles: string[] = [];

  constructor(config: FileSystemConfig) {
    this.config = config;
  }

  /**
   * Scan deployment configurations for security vulnerabilities
   */
  public async scan(): Promise<DeploymentScanResult> {
    this.findings = [];
    this.scannedFiles = [];

    try {
      const projectRoot = this.config.getProjectRoot();
      
      // Scan deployment scripts and configuration files
      await this.scanDeploymentScripts(projectRoot);
      await this.scanEnvironmentConfigurations(projectRoot);
      await this.scanBuildConfigurations(projectRoot);
      await this.scanMonitoringConfigurations(projectRoot);
      await this.scanNetworkConfigurations(projectRoot);
      await this.scanBackupConfigurations(projectRoot);

      return this.generateScanResult();
    } catch (error) {
      console.error('Deployment security scan failed:', error);
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
   * Scan deployment scripts for hardcoded secrets and security issues
   */
  private async scanDeploymentScripts(projectRoot: string): Promise<void> {
    const deploymentFiles = [
      'deploy.sh',
      'build.sh',
      'package.json',
      'amplify.yml',
      'frontend/deploy.sh',
      'frontend/build.sh',
      'frontend/amplify.yml',
      'infrastructure/bin/*.ts',
      'infrastructure/lib/*.ts',
      '.github/workflows/*.yml',
      '.github/workflows/*.yaml'
    ];

    for (const pattern of deploymentFiles) {
      const files = this.findFiles(projectRoot, pattern);
      for (const filePath of files) {
        await this.scanDeploymentFile(filePath);
      }
    }
  }

  /**
   * Scan environment configuration files
   */
  private async scanEnvironmentConfigurations(projectRoot: string): Promise<void> {
    const envFiles = [
      '.env',
      '.env.local',
      '.env.development',
      '.env.production',
      '.env.staging',
      'frontend/.env',
      'backend/.env',
      'infrastructure/.env'
    ];

    for (const envFile of envFiles) {
      const filePath = path.join(projectRoot, envFile);
      if (fs.existsSync(filePath)) {
        await this.scanEnvironmentFile(filePath);
      }
    }
  }

  /**
   * Scan build configuration files
   */
  private async scanBuildConfigurations(projectRoot: string): Promise<void> {
    const buildFiles = [
      'webpack.config.js',
      'frontend/webpack.config.js',
      'package.json',
      'frontend/package.json',
      'backend/requirements.txt',
      'infrastructure/package.json',
      'Dockerfile',
      'docker-compose.yml'
    ];

    for (const buildFile of buildFiles) {
      const filePath = path.join(projectRoot, buildFile);
      if (fs.existsSync(filePath)) {
        await this.scanBuildFile(filePath);
      }
    }
  }

  /**
   * Scan monitoring and logging configurations
   */
  private async scanMonitoringConfigurations(projectRoot: string): Promise<void> {
    // Check CDK infrastructure for monitoring setup
    const infraDir = path.join(projectRoot, 'infrastructure', 'lib');
    if (fs.existsSync(infraDir)) {
      const cdkFiles = this.findFiles(infraDir, '*.ts');
      for (const filePath of cdkFiles) {
        await this.scanMonitoringInCDK(filePath);
      }
    }

    // Check Lambda functions for logging
    const lambdaDir = path.join(projectRoot, 'backend', 'lambda_functions');
    if (fs.existsSync(lambdaDir)) {
      const lambdaFiles = this.findFiles(lambdaDir, '*.py');
      for (const filePath of lambdaFiles) {
        await this.scanLambdaLogging(filePath);
      }
    }
  }

  /**
   * Scan network configuration in CDK
   */
  private async scanNetworkConfigurations(projectRoot: string): Promise<void> {
    const infraDir = path.join(projectRoot, 'infrastructure', 'lib');
    if (fs.existsSync(infraDir)) {
      const cdkFiles = this.findFiles(infraDir, '*.ts');
      for (const filePath of cdkFiles) {
        await this.scanNetworkInCDK(filePath);
      }
    }
  }

  /**
   * Scan backup and recovery configurations
   */
  private async scanBackupConfigurations(projectRoot: string): Promise<void> {
    const infraDir = path.join(projectRoot, 'infrastructure', 'lib');
    if (fs.existsSync(infraDir)) {
      const cdkFiles = this.findFiles(infraDir, '*.ts');
      for (const filePath of cdkFiles) {
        await this.scanBackupInCDK(filePath);
      }
    }
  }

  /**
   * Scan individual deployment file
   */
  private async scanDeploymentFile(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(this.config.getProjectRoot(), filePath);
      
      this.scannedFiles.push(relativePath);
      
      // Check for hardcoded secrets in deployment scripts
      this.checkHardcodedSecretsInDeployment(content, relativePath);
      this.checkInsecureDeploymentPractices(content, relativePath);
      this.checkSupplyChainSecurity(content, relativePath);
      
    } catch (error) {
      console.error(`Error scanning deployment file ${filePath}:`, error);
    }
  }

  /**
   * Scan environment configuration file
   */
  private async scanEnvironmentFile(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(this.config.getProjectRoot(), filePath);
      
      this.scannedFiles.push(relativePath);
      
      this.checkEnvironmentSecurity(content, relativePath);
      this.checkSecretsInEnvironment(content, relativePath);
      
    } catch (error) {
      console.error(`Error scanning environment file ${filePath}:`, error);
    }
  }

  /**
   * Scan build configuration file
   */
  private async scanBuildFile(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(this.config.getProjectRoot(), filePath);
      
      this.scannedFiles.push(relativePath);
      
      this.checkBuildSecurity(content, relativePath);
      this.checkDependencyIntegrity(content, relativePath);
      
    } catch (error) {
      console.error(`Error scanning build file ${filePath}:`, error);
    }
  }

  /**
   * Scan CDK file for monitoring configuration
   */
  private async scanMonitoringInCDK(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(this.config.getProjectRoot(), filePath);
      
      if (!this.scannedFiles.includes(relativePath)) {
        this.scannedFiles.push(relativePath);
      }
      
      this.checkCloudWatchConfiguration(content, relativePath);
      this.checkSecurityLogging(content, relativePath);
      
    } catch (error) {
      console.error(`Error scanning CDK monitoring file ${filePath}:`, error);
    }
  }

  /**
   * Scan Lambda function for logging practices
   */
  private async scanLambdaLogging(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(this.config.getProjectRoot(), filePath);
      
      if (!this.scannedFiles.includes(relativePath)) {
        this.scannedFiles.push(relativePath);
      }
      
      this.checkLambdaLoggingPractices(content, relativePath);
      
    } catch (error) {
      console.error(`Error scanning Lambda logging file ${filePath}:`, error);
    }
  }

  /**
   * Scan CDK file for network configuration
   */
  private async scanNetworkInCDK(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(this.config.getProjectRoot(), filePath);
      
      if (!this.scannedFiles.includes(relativePath)) {
        this.scannedFiles.push(relativePath);
      }
      
      this.checkVPCConfiguration(content, relativePath);
      this.checkSecurityGroupConfiguration(content, relativePath);
      this.checkAPIGatewayNetworkSecurity(content, relativePath);
      
    } catch (error) {
      console.error(`Error scanning CDK network file ${filePath}:`, error);
    }
  }

  /**
   * Scan CDK file for backup configuration
   */
  private async scanBackupInCDK(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(this.config.getProjectRoot(), filePath);
      
      if (!this.scannedFiles.includes(relativePath)) {
        this.scannedFiles.push(relativePath);
      }
      
      this.checkBackupConfiguration(content, relativePath);
      this.checkDataRetentionPolicies(content, relativePath);
      
    } catch (error) {
      console.error(`Error scanning CDK backup file ${filePath}:`, error);
    }
  }

  /**
   * Check for hardcoded secrets in deployment scripts
   */
  private checkHardcodedSecretsInDeployment(content: string, filePath: string): void {
    const lines = content.split('\n');
    
    const secretPatterns = [
      // AWS credentials
      {
        pattern: /AWS_ACCESS_KEY_ID\s*=\s*['"]\s*AKIA[0-9A-Z]{16}\s*['"]/g,
        description: 'Hardcoded AWS Access Key ID in deployment script',
        severity: VulnerabilitySeverity.CRITICAL
      },
      {
        pattern: /AWS_SECRET_ACCESS_KEY\s*=\s*['"][^'"]{40}['"]/g,
        description: 'Hardcoded AWS Secret Access Key in deployment script',
        severity: VulnerabilitySeverity.CRITICAL
      },
      // API keys and tokens
      {
        pattern: /(?:API_KEY|STRIPE_SECRET_KEY|GITHUB_TOKEN)\s*=\s*['"][^'"]{20,}['"]/gi,
        description: 'Hardcoded API key or token in deployment script',
        severity: VulnerabilitySeverity.HIGH
      },
      // Database credentials
      {
        pattern: /(?:DB_PASSWORD|DATABASE_URL)\s*=\s*['"][^'"]{8,}['"]/gi,
        description: 'Hardcoded database credentials in deployment script',
        severity: VulnerabilitySeverity.HIGH
      },
      // Private keys
      {
        pattern: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/g,
        description: 'Private key embedded in deployment script',
        severity: VulnerabilitySeverity.CRITICAL
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
          title: 'Hardcoded Secrets in Deployment',
          description,
          file: filePath,
          line: lineNumber,
          column: match.index - content.lastIndexOf('\n', match.index),
          evidence: '[REDACTED]', // Don't expose the actual secret
          recommendation: 'Use environment variables, AWS Secrets Manager, or secure CI/CD variable storage',
          cweId: 'CWE-798',
          owaspCategory: 'A07:2021 – Identification and Authentication Failures'
        });
      }
    });
  }

  /**
   * Check for insecure deployment practices
   */
  private checkInsecureDeploymentPractices(content: string, filePath: string): void {
    const lines = content.split('\n');
    
    const insecurePractices = [
      // Insecure curl/wget usage
      {
        pattern: /curl\s+[^|]*\|\s*(?:bash|sh)/g,
        description: 'Piping curl output directly to shell - potential supply chain attack',
        severity: VulnerabilitySeverity.HIGH
      },
      {
        pattern: /wget\s+[^|]*\|\s*(?:bash|sh)/g,
        description: 'Piping wget output directly to shell - potential supply chain attack',
        severity: VulnerabilitySeverity.HIGH
      },
      // Insecure permissions
      {
        pattern: /chmod\s+777/g,
        description: 'Setting overly permissive file permissions (777)',
        severity: VulnerabilitySeverity.MEDIUM
      },
      // Running as root
      {
        pattern: /sudo\s+(?!.*--user)/g,
        description: 'Running commands with sudo without specific user',
        severity: VulnerabilitySeverity.MEDIUM
      },
      // Insecure npm install
      {
        pattern: /npm\s+install\s+[^-][^\s]*(?!\s+--save)/g,
        description: 'npm install without package-lock.json verification',
        severity: VulnerabilitySeverity.LOW
      }
    ];

    insecurePractices.forEach(({ pattern, description, severity }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = this.getLineNumber(content, match.index);
        const lineContent = lines[lineNumber - 1]?.trim() || '';
        
        this.addFinding({
          type: VulnerabilityCategory.INSECURE_CONFIGURATION,
          severity,
          title: 'Insecure Deployment Practice',
          description,
          file: filePath,
          line: lineNumber,
          column: match.index - content.lastIndexOf('\n', match.index),
          evidence: lineContent,
          recommendation: 'Follow secure deployment practices and avoid risky operations',
          cweId: 'CWE-732',
          owaspCategory: 'A05:2021 – Security Misconfiguration'
        });
      }
    });
  }

  /**
   * Check for supply chain security issues
   */
  private checkSupplyChainSecurity(content: string, filePath: string): void {
    const lines = content.split('\n');
    
    const supplyChainIssues = [
      // Unverified package installations
      {
        pattern: /pip\s+install\s+[^-][^\s]*(?!\s+--trusted-host)/g,
        description: 'pip install without integrity verification',
        severity: VulnerabilitySeverity.MEDIUM
      },
      // Downloading from untrusted sources
      {
        pattern: /(?:curl|wget)\s+http:\/\/[^\s]+/g,
        description: 'Downloading from HTTP (unencrypted) source',
        severity: VulnerabilitySeverity.MEDIUM
      },
      // Using latest tags in production
      {
        pattern: /:latest(?!\s*#.*?pinned)/g,
        description: 'Using :latest tag in deployment - potential supply chain risk',
        severity: VulnerabilitySeverity.LOW
      }
    ];

    supplyChainIssues.forEach(({ pattern, description, severity }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = this.getLineNumber(content, match.index);
        const lineContent = lines[lineNumber - 1]?.trim() || '';
        
        this.addFinding({
          type: VulnerabilityCategory.INSECURE_CONFIGURATION,
          severity,
          title: 'Supply Chain Security Risk',
          description,
          file: filePath,
          line: lineNumber,
          column: match.index - content.lastIndexOf('\n', match.index),
          evidence: lineContent,
          recommendation: 'Use package integrity verification and pin specific versions',
          cweId: 'CWE-494',
          owaspCategory: 'A08:2021 – Software and Data Integrity Failures'
        });
      }
    });
  }

  /**
   * Check environment configuration security
   */
  private checkEnvironmentSecurity(content: string, filePath: string): void {
    const lines = content.split('\n');
    
    // Check for production secrets in non-production files
    if (filePath.includes('.env.development') || filePath.includes('.env.local')) {
      const productionSecrets = [
        {
          pattern: /STRIPE_SECRET_KEY\s*=\s*sk_live_/g,
          description: 'Production Stripe secret key in development environment file',
          severity: VulnerabilitySeverity.HIGH
        },
        {
          pattern: /AWS_ACCESS_KEY_ID\s*=\s*AKIA/g,
          description: 'AWS credentials in development environment file',
          severity: VulnerabilitySeverity.MEDIUM
        }
      ];

      productionSecrets.forEach(({ pattern, description, severity }) => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const lineNumber = this.getLineNumber(content, match.index);
          
          this.addFinding({
            type: VulnerabilityCategory.INSECURE_CONFIGURATION,
            severity,
            title: 'Production Secrets in Development Environment',
            description,
            file: filePath,
            line: lineNumber,
            column: match.index - content.lastIndexOf('\n', match.index),
            evidence: '[REDACTED]',
            recommendation: 'Use separate credentials for development and production environments',
            cweId: 'CWE-200',
            owaspCategory: 'A05:2021 – Security Misconfiguration'
          });
        }
      });
    }
  }

  /**
   * Check for secrets in environment files
   */
  private checkSecretsInEnvironment(content: string, filePath: string): void {
    // Check if .env files are properly gitignored
    const projectRoot = this.config.getProjectRoot();
    const gitignorePath = path.join(projectRoot, '.gitignore');
    
    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
      if (!gitignoreContent.includes('.env') && !gitignoreContent.includes('*.env')) {
        this.addFinding({
          type: VulnerabilityCategory.INFORMATION_DISCLOSURE,
          severity: VulnerabilitySeverity.HIGH,
          title: 'Environment Files Not Gitignored',
          description: 'Environment files containing secrets may be committed to version control',
          file: '.gitignore',
          line: 1,
          column: 1,
          evidence: 'Missing .env patterns in .gitignore',
          recommendation: 'Add .env* patterns to .gitignore to prevent committing secrets',
          cweId: 'CWE-200',
          owaspCategory: 'A09:2021 – Security Logging and Monitoring Failures'
        });
      }
    } else {
      // No .gitignore file exists
      this.addFinding({
        type: VulnerabilityCategory.INFORMATION_DISCLOSURE,
        severity: VulnerabilitySeverity.HIGH,
        title: 'Environment Files Not Gitignored',
        description: 'Environment files containing secrets may be committed to version control - no .gitignore file found',
        file: filePath,
        line: 1,
        column: 1,
        evidence: 'No .gitignore file found',
        recommendation: 'Create .gitignore file and add .env* patterns to prevent committing secrets',
        cweId: 'CWE-200',
        owaspCategory: 'A09:2021 – Security Logging and Monitoring Failures'
      });
    }
  }

  /**
   * Check build security configuration
   */
  private checkBuildSecurity(content: string, filePath: string): void {
    const lines = content.split('\n');
    
    if (filePath.includes('webpack.config.js')) {
      // Check for source map exposure in production
      if (content.includes('devtool') && content.includes('source-map')) {
        // Check if it's explicitly for production or doesn't have production check
        if (content.includes("mode: 'production'") || !content.includes('NODE_ENV')) {
          this.addFinding({
            type: VulnerabilityCategory.INFORMATION_DISCLOSURE,
            severity: VulnerabilitySeverity.MEDIUM,
            title: 'Source Maps Enabled in Production',
            description: 'Source maps may expose source code in production builds',
            file: filePath,
            line: 1,
            column: 1,
            evidence: 'devtool configuration found in production mode',
            recommendation: 'Disable source maps in production builds or use hidden-source-map',
            cweId: 'CWE-200',
            owaspCategory: 'A05:2021 – Security Misconfiguration'
          });
        }
      }
    }

    if (filePath.includes('package.json')) {
      try {
        const packageJson = JSON.parse(content);
        
        // Check for npm scripts with security issues
        if (packageJson.scripts) {
          Object.entries(packageJson.scripts).forEach(([scriptName, scriptContent]) => {
            if (typeof scriptContent === 'string') {
              // Check for dangerous npm script patterns
              if (scriptContent.includes('rm -rf') && !scriptContent.includes('node_modules')) {
                this.addFinding({
                  type: VulnerabilityCategory.INSECURE_CONFIGURATION,
                  severity: VulnerabilitySeverity.MEDIUM,
                  title: 'Dangerous npm Script Command',
                  description: `npm script "${scriptName}" contains potentially dangerous rm -rf command`,
                  file: filePath,
                  line: 1,
                  column: 1,
                  evidence: `"${scriptName}": "${scriptContent}"`,
                  recommendation: 'Review and restrict dangerous file operations in npm scripts',
                  cweId: 'CWE-78',
                  owaspCategory: 'A03:2021 – Injection'
                });
              }
            }
          });
        }
      } catch (error) {
        // Invalid JSON, skip parsing
      }
    }
  }

  /**
   * Check dependency integrity
   */
  private checkDependencyIntegrity(content: string, filePath: string): void {
    if (filePath.includes('package.json')) {
      const lockFilePath = path.join(path.dirname(path.join(this.config.getProjectRoot(), filePath)), 'package-lock.json');
      
      if (!fs.existsSync(lockFilePath)) {
        this.addFinding({
          type: VulnerabilityCategory.INSECURE_CONFIGURATION,
          severity: VulnerabilitySeverity.MEDIUM,
          title: 'Missing Package Lock File',
          description: 'package-lock.json missing - dependency versions not locked',
          file: filePath,
          line: 1,
          column: 1,
          evidence: 'No package-lock.json found',
          recommendation: 'Generate and commit package-lock.json to ensure consistent dependency versions',
          cweId: 'CWE-494',
          owaspCategory: 'A08:2021 – Software and Data Integrity Failures'
        });
      }
    }
  }

  /**
   * Check CloudWatch configuration
   */
  private checkCloudWatchConfiguration(content: string, filePath: string): void {
    const lines = content.split('\n');
    
    // Check if CloudWatch logging is configured for Lambda functions
    if (content.includes('aws-lambda') && !content.includes('logRetention')) {
      this.addFinding({
        type: VulnerabilityCategory.LOGGING_FAILURE,
        severity: VulnerabilitySeverity.MEDIUM,
        title: 'Missing Lambda Log Retention Configuration',
        description: 'Lambda functions without explicit log retention may accumulate logs indefinitely',
        file: filePath,
        line: 1,
        column: 1,
        evidence: 'Lambda function without logRetention configuration',
        recommendation: 'Configure explicit log retention periods for Lambda functions',
        cweId: 'CWE-778',
        owaspCategory: 'A09:2021 – Security Logging and Monitoring Failures'
      });
    }

    // Check for CloudTrail configuration
    if (content.includes('aws-cloudtrail') || content.includes('CloudTrail')) {
      if (!content.includes('includeGlobalServiceEvents') || !content.includes('isMultiRegionTrail')) {
        this.addFinding({
          type: VulnerabilityCategory.LOGGING_FAILURE,
          severity: VulnerabilitySeverity.MEDIUM,
          title: 'Incomplete CloudTrail Configuration',
          description: 'CloudTrail may not be capturing all security-relevant events',
          file: filePath,
          line: 1,
          column: 1,
          evidence: 'CloudTrail configuration found but may be incomplete',
          recommendation: 'Enable global service events and multi-region trail for comprehensive logging',
          cweId: 'CWE-778',
          owaspCategory: 'A09:2021 – Security Logging and Monitoring Failures'
        });
      }
    }
  }

  /**
   * Check security logging configuration
   */
  private checkSecurityLogging(content: string, filePath: string): void {
    // Check if security events are being logged
    const securityLoggingPatterns = [
      {
        pattern: /aws-apigateway.*accessLogging/g,
        description: 'API Gateway access logging configured',
        isGood: true
      },
      {
        pattern: /aws-s3.*serverAccessLogsPrefix/g,
        description: 'S3 server access logging configured',
        isGood: true
      }
    ];

    let hasSecurityLogging = false;
    securityLoggingPatterns.forEach(({ pattern, isGood }) => {
      if (pattern.test(content) && isGood) {
        hasSecurityLogging = true;
      }
    });

    // If CDK file contains AWS resources but no security logging
    if ((content.includes('aws-') || content.includes('Construct')) && !hasSecurityLogging) {
      this.addFinding({
        type: VulnerabilityCategory.LOGGING_FAILURE,
        severity: VulnerabilitySeverity.LOW,
        title: 'Limited Security Logging Configuration',
        description: 'Infrastructure may lack comprehensive security event logging',
        file: filePath,
        line: 1,
        column: 1,
        evidence: 'AWS resources found without explicit security logging configuration',
        recommendation: 'Enable access logging for API Gateway, S3, and other security-relevant services',
        cweId: 'CWE-778',
        owaspCategory: 'A09:2021 – Security Logging and Monitoring Failures'
      });
    }
  }

  /**
   * Check Lambda logging practices
   */
  private checkLambdaLoggingPractices(content: string, filePath: string): void {
    const lines = content.split('\n');
    
    // Check for sensitive data in logs
    const sensitiveLoggingPatterns = [
      {
        pattern: /logger\.(info|debug|warning)\([^)]*(?:password|secret|key|token)/gi,
        description: 'Potentially sensitive information in log statements',
        severity: VulnerabilitySeverity.MEDIUM
      },
      {
        pattern: /print\([^)]*(?:password|secret|key|token)/gi,
        description: 'Potentially sensitive information in print statements',
        severity: VulnerabilitySeverity.MEDIUM
      }
    ];

    sensitiveLoggingPatterns.forEach(({ pattern, description, severity }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = this.getLineNumber(content, match.index);
        const lineContent = lines[lineNumber - 1]?.trim() || '';
        
        this.addFinding({
          type: VulnerabilityCategory.INFORMATION_DISCLOSURE,
          severity,
          title: 'Sensitive Data in Logs',
          description,
          file: filePath,
          line: lineNumber,
          column: match.index - content.lastIndexOf('\n', match.index),
          evidence: lineContent,
          recommendation: 'Avoid logging sensitive information or implement log sanitization',
          cweId: 'CWE-532',
          owaspCategory: 'A09:2021 – Security Logging and Monitoring Failures'
        });
      }
    });
  }

  /**
   * Check VPC configuration
   */
  private checkVPCConfiguration(content: string, filePath: string): void {
    // Check if resources are deployed in VPC
    if (content.includes('aws-lambda') && !content.includes('vpc')) {
      this.addFinding({
        type: VulnerabilityCategory.INSECURE_CONFIGURATION,
        severity: VulnerabilitySeverity.LOW,
        title: 'Lambda Functions Not in VPC',
        description: 'Lambda functions not deployed in VPC may lack network isolation',
        file: filePath,
        line: 1,
        column: 1,
        evidence: 'Lambda functions without VPC configuration',
        recommendation: 'Consider deploying Lambda functions in VPC for network isolation when accessing private resources',
        cweId: 'CWE-923',
        owaspCategory: 'A05:2021 – Security Misconfiguration'
      });
    }
  }

  /**
   * Check Security Group configuration
   */
  private checkSecurityGroupConfiguration(content: string, filePath: string): void {
    const lines = content.split('\n');
    
    // Check for overly permissive security groups
    const permissivePatterns = [
      {
        pattern: /0\.0\.0\.0\/0/g,
        description: 'Security group allows access from anywhere (0.0.0.0/0)',
        severity: VulnerabilitySeverity.HIGH
      },
      {
        pattern: /::\/0/g,
        description: 'Security group allows IPv6 access from anywhere (::0)',
        severity: VulnerabilitySeverity.HIGH
      }
    ];

    permissivePatterns.forEach(({ pattern, description, severity }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = this.getLineNumber(content, match.index);
        const lineContent = lines[lineNumber - 1]?.trim() || '';
        
        // Check if it's in a security group context or has security-related keywords
        if (lineContent.includes('SecurityGroup') || 
            lineContent.includes('ingress') || 
            lineContent.includes('egress') ||
            lineContent.includes('addIngressRule') ||
            lineContent.includes('Peer.anyIpv4') ||
            lineContent.includes('Peer.ipv6')) {
          this.addFinding({
            type: VulnerabilityCategory.INSECURE_CONFIGURATION,
            severity,
            title: 'Overly Permissive Security Group',
            description,
            file: filePath,
            line: lineNumber,
            column: match.index - content.lastIndexOf('\n', match.index),
            evidence: lineContent,
            recommendation: 'Restrict security group access to specific IP ranges or security groups',
            cweId: 'CWE-284',
            owaspCategory: 'A01:2021 – Broken Access Control'
          });
        }
      }
    });
  }

  /**
   * Check API Gateway network security
   */
  private checkAPIGatewayNetworkSecurity(content: string, filePath: string): void {
    // Check if API Gateway has throttling configured
    if ((content.includes('aws-apigateway') || content.includes('RestApi')) && 
        !content.includes('throttle') && !content.includes('ThrottleSettings')) {
      this.addFinding({
        type: VulnerabilityCategory.INSECURE_CONFIGURATION,
        severity: VulnerabilitySeverity.MEDIUM,
        title: 'API Gateway Without Throttling',
        description: 'API Gateway may be vulnerable to DoS attacks without rate limiting',
        file: filePath,
        line: 1,
        column: 1,
        evidence: 'API Gateway configuration without throttling',
        recommendation: 'Configure throttling and rate limiting for API Gateway endpoints',
        cweId: 'CWE-770',
        owaspCategory: 'A05:2021 – Security Misconfiguration'
      });
    }

    // Check for CORS configuration
    if ((content.includes('aws-apigateway') || content.includes('RestApi')) && 
        content.includes('cors')) {
      if (content.includes('allowOrigins') && content.includes("'*'")) {
        this.addFinding({
          type: VulnerabilityCategory.INSECURE_CONFIGURATION,
          severity: VulnerabilitySeverity.MEDIUM,
          title: 'Overly Permissive CORS Configuration',
          description: 'API Gateway CORS allows requests from any origin (*)',
          file: filePath,
          line: 1,
          column: 1,
          evidence: 'CORS allowOrigins set to *',
          recommendation: 'Restrict CORS to specific trusted origins',
          cweId: 'CWE-942',
          owaspCategory: 'A05:2021 – Security Misconfiguration'
        });
      }
    }
  }

  /**
   * Check backup configuration
   */
  private checkBackupConfiguration(content: string, filePath: string): void {
    // Check if DynamoDB has point-in-time recovery
    if (content.includes('aws-dynamodb') && !content.includes('pointInTimeRecovery')) {
      this.addFinding({
        type: VulnerabilityCategory.INSECURE_CONFIGURATION,
        severity: VulnerabilitySeverity.MEDIUM,
        title: 'DynamoDB Without Point-in-Time Recovery',
        description: 'DynamoDB tables without point-in-time recovery may lose data',
        file: filePath,
        line: 1,
        column: 1,
        evidence: 'DynamoDB table without pointInTimeRecovery configuration',
        recommendation: 'Enable point-in-time recovery for DynamoDB tables containing important data',
        cweId: 'CWE-404',
        owaspCategory: 'A05:2021 – Security Misconfiguration'
      });
    }

    // Check if S3 has versioning enabled
    if (content.includes('aws-s3') && !content.includes('versioned')) {
      this.addFinding({
        type: VulnerabilityCategory.INSECURE_CONFIGURATION,
        severity: VulnerabilitySeverity.LOW,
        title: 'S3 Bucket Without Versioning',
        description: 'S3 buckets without versioning may lose data on accidental deletion',
        file: filePath,
        line: 1,
        column: 1,
        evidence: 'S3 bucket without versioning configuration',
        recommendation: 'Enable versioning for S3 buckets containing important data',
        cweId: 'CWE-404',
        owaspCategory: 'A05:2021 – Security Misconfiguration'
      });
    }
  }

  /**
   * Check data retention policies
   */
  private checkDataRetentionPolicies(content: string, filePath: string): void {
    // Check if lifecycle policies are configured for S3
    if (content.includes('aws-s3') && !content.includes('lifecycle')) {
      this.addFinding({
        type: VulnerabilityCategory.INSECURE_CONFIGURATION,
        severity: VulnerabilitySeverity.LOW,
        title: 'S3 Bucket Without Lifecycle Policy',
        description: 'S3 buckets without lifecycle policies may accumulate data indefinitely',
        file: filePath,
        line: 1,
        column: 1,
        evidence: 'S3 bucket without lifecycle configuration',
        recommendation: 'Configure lifecycle policies to manage data retention and costs',
        cweId: 'CWE-404',
        owaspCategory: 'A05:2021 – Security Misconfiguration'
      });
    }
  }

  /**
   * Find files matching a pattern
   */
  private findFiles(directory: string, pattern: string): string[] {
    const files: string[] = [];
    
    try {
      if (pattern.includes('*')) {
        // Handle glob patterns
        const baseDir = pattern.includes('/') ? path.join(directory, path.dirname(pattern)) : directory;
        const filePattern = path.basename(pattern);
        
        if (fs.existsSync(baseDir)) {
          const items = fs.readdirSync(baseDir);
          for (const item of items) {
            const fullPath = path.join(baseDir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isFile() && this.matchesPattern(item, filePattern)) {
              files.push(fullPath);
            }
          }
        }
      } else {
        // Handle direct file paths
        const fullPath = path.join(directory, pattern);
        if (fs.existsSync(fullPath)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Ignore errors for non-existent directories
    }
    
    return files;
  }

  /**
   * Check if filename matches pattern
   */
  private matchesPattern(filename: string, pattern: string): boolean {
    if (pattern === '*') return true;
    if (pattern.startsWith('*.')) {
      return filename.endsWith(pattern.substring(1));
    }
    return filename === pattern;
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
      id: `deployment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
        verification: ['Configuration review', 'Security testing']
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
      case VulnerabilityCategory.HARDCODED_SECRETS:
        return 'High likelihood if secrets are exposed';
      case VulnerabilityCategory.INSECURE_CONFIGURATION:
        return 'Medium likelihood depending on exposure';
      case VulnerabilityCategory.LOGGING_FAILURE:
        return 'Low likelihood but high impact for incident response';
      default:
        return 'Variable likelihood depending on configuration';
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
  private generateScanResult(): DeploymentScanResult {
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
    return 'Deployment Security Scanner';
  }

  /**
   * Get scanner version
   */
  public getVersion(): string {
    return '1.0.0';
  }
}