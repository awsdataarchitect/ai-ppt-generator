/**
 * Security Assessment Orchestrator
 * 
 * Main orchestrator that coordinates all security scanners and generates
 * comprehensive security assessment reports with progress tracking and error handling
 */

import { ComprehensiveSecurityReportGenerator, ConsolidatedScanResult, ComprehensiveReportOptions } from './ComprehensiveSecurityReportGenerator';
import { ISecurityScanner, ScanResult, ProgressCallback, ScanProgress } from '../interfaces/ScannerInterface';
import { VulnerabilityFinding, VulnerabilitySeverity } from '../types/VulnerabilityTypes';
import { RiskAssessment } from '../types/RiskAssessmentTypes';
import { ComplianceMapping } from '../types/ComplianceTypes';
import { ConfigurationManager, OrchestrationConfig } from '../config/OrchestrationConfig';
import PerformanceMonitor, { PerformanceReport } from '../utils/PerformanceMonitor';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface OrchestrationOptions {
  readonly projectName: string;
  readonly targetPath: string;
  readonly outputDirectory: string;
  readonly enabledScanners: string[];
  readonly parallelExecution: boolean;
  readonly maxConcurrentScanners: number;
  readonly timeoutPerScanner: number; // milliseconds
  readonly generateIndividualReports: boolean;
  readonly generateComprehensiveReport: boolean;
  readonly reportOptions: Partial<ComprehensiveReportOptions>;
  readonly progressCallback?: OrchestrationProgressCallback;
  readonly errorCallback?: OrchestrationErrorCallback;
}

export interface OrchestrationProgress {
  readonly phase: 'initialization' | 'scanning' | 'analysis' | 'reporting' | 'complete';
  readonly currentScanner?: string;
  readonly completedScanners: string[];
  readonly totalScanners: number;
  readonly overallProgress: number; // 0-100 percentage
  readonly vulnerabilitiesFound: number;
  readonly estimatedTimeRemaining: number; // milliseconds
  readonly currentActivity: string;
}

export interface OrchestrationResult {
  readonly success: boolean;
  readonly consolidatedResult?: ConsolidatedScanResult;
  readonly individualResults: ScanResult[];
  readonly reportPaths: string[];
  readonly errors: OrchestrationError[];
  readonly executionTime: number; // milliseconds
  readonly summary: OrchestrationSummary;
  readonly performanceReport?: PerformanceReport;
}

export interface OrchestrationError {
  readonly scannerName: string;
  readonly errorType: 'timeout' | 'crash' | 'configuration' | 'access' | 'unknown';
  readonly message: string;
  readonly timestamp: Date;
  readonly recoverable: boolean;
}

export interface OrchestrationSummary {
  readonly totalVulnerabilities: number;
  readonly vulnerabilitiesBySeverity: Record<VulnerabilitySeverity, number>;
  readonly scannersExecuted: number;
  readonly scannersSuccessful: number;
  readonly scannersFailed: number;
  readonly totalFilesScanned: number;
  readonly averageConfidence: number;
  readonly overallRiskLevel: string;
}

export type OrchestrationProgressCallback = (progress: OrchestrationProgress) => void;
export type OrchestrationErrorCallback = (error: OrchestrationError) => void;

export class SecurityAssessmentOrchestrator {
  private readonly reportGenerator: ComprehensiveSecurityReportGenerator;
  private readonly registeredScanners: Map<string, ISecurityScanner>;
  private readonly configManager: ConfigurationManager;
  private readonly performanceMonitor: PerformanceMonitor;
  private config: OrchestrationConfig;
  private readonly defaultOptions: OrchestrationOptions = {
    projectName: 'Security Assessment',
    targetPath: '.',
    outputDirectory: './security-reports',
    enabledScanners: [],
    parallelExecution: true,
    maxConcurrentScanners: 3,
    timeoutPerScanner: 300000, // 5 minutes
    generateIndividualReports: true,
    generateComprehensiveReport: true,
    reportOptions: {}
  };

  constructor(configPath?: string) {
    this.reportGenerator = new ComprehensiveSecurityReportGenerator();
    this.registeredScanners = new Map();
    this.configManager = new ConfigurationManager(configPath);
    this.config = this.configManager.getConfig();
    this.performanceMonitor = new PerformanceMonitor();
  }

  /**
   * Register a security scanner with the orchestrator
   */
  public registerScanner(name: string, scanner: ISecurityScanner): void {
    this.registeredScanners.set(name, scanner);
  }

  /**
   * Unregister a security scanner
   */
  public unregisterScanner(name: string): boolean {
    return this.registeredScanners.delete(name);
  }

  /**
   * Get list of registered scanner names
   */
  public getRegisteredScanners(): string[] {
    return Array.from(this.registeredScanners.keys());
  }

  /**
   * Initialize orchestrator with configuration
   */
  public async initialize(): Promise<void> {
    this.config = await this.configManager.loadConfig();
  }

  /**
   * Execute comprehensive security assessment
   */
  public async executeAssessment(options: Partial<OrchestrationOptions> = {}): Promise<OrchestrationResult> {
    // Load configuration if not already loaded
    if (!this.config) {
      await this.initialize();
    }

    // Merge options with configuration
    const orchestrationOptions = this.mergeOptionsWithConfig(options);
    const startTime = Date.now();
    const errors: OrchestrationError[] = [];
    const individualResults: ScanResult[] = [];
    const reportPaths: string[] = [];

    try {
      // Start performance monitoring
      this.performanceMonitor.startMonitoring(5000); // 5-second intervals

      // Initialize output directory
      await this.initializeOutputDirectory(orchestrationOptions.outputDirectory);

      // Report initialization progress
      this.reportProgress(orchestrationOptions, {
        phase: 'initialization',
        completedScanners: [],
        totalScanners: orchestrationOptions.enabledScanners.length,
        overallProgress: 0,
        vulnerabilitiesFound: 0,
        estimatedTimeRemaining: 0,
        currentActivity: 'Initializing security assessment'
      });

      // Validate and prepare scanners
      const scannersToExecute = await this.prepareScanners(orchestrationOptions);
      
      if (scannersToExecute.length === 0) {
        throw new Error('No valid scanners available for execution');
      }

      // Execute scanners
      this.reportProgress(orchestrationOptions, {
        phase: 'scanning',
        completedScanners: [],
        totalScanners: scannersToExecute.length,
        overallProgress: 10,
        vulnerabilitiesFound: 0,
        estimatedTimeRemaining: scannersToExecute.length * orchestrationOptions.timeoutPerScanner,
        currentActivity: 'Executing security scanners'
      });

      const scanResults = await this.executeScannersEnhanced(
        scannersToExecute,
        orchestrationOptions,
        errors
      );

      individualResults.push(...scanResults);

      // Generate individual reports if requested
      if (orchestrationOptions.generateIndividualReports) {
        this.reportProgress(orchestrationOptions, {
          phase: 'reporting',
          completedScanners: scannersToExecute.map(s => s.name),
          totalScanners: scannersToExecute.length,
          overallProgress: 70,
          vulnerabilitiesFound: this.countTotalVulnerabilities(scanResults),
          estimatedTimeRemaining: 30000,
          currentActivity: 'Generating individual scanner reports'
        });

        const individualReportPaths = await this.generateIndividualReports(
          scanResults,
          orchestrationOptions.outputDirectory
        );
        reportPaths.push(...individualReportPaths);
      }

      // Generate comprehensive report if requested
      if (orchestrationOptions.generateComprehensiveReport) {
        this.reportProgress(orchestrationOptions, {
          phase: 'analysis',
          completedScanners: scannersToExecute.map(s => s.name),
          totalScanners: scannersToExecute.length,
          overallProgress: 85,
          vulnerabilitiesFound: this.countTotalVulnerabilities(scanResults),
          estimatedTimeRemaining: 15000,
          currentActivity: 'Generating comprehensive security report'
        });

        const consolidatedResult = this.createEnhancedConsolidatedResult(
          orchestrationOptions,
          scanResults,
          Date.now() - startTime
        );

        const comprehensiveReportPath = await this.generateComprehensiveReport(
          consolidatedResult,
          orchestrationOptions
        );
        reportPaths.push(comprehensiveReportPath);

        // Report completion
        this.reportProgress(orchestrationOptions, {
          phase: 'complete',
          completedScanners: scannersToExecute.map(s => s.name),
          totalScanners: scannersToExecute.length,
          overallProgress: 100,
          vulnerabilitiesFound: consolidatedResult.totalVulnerabilities,
          estimatedTimeRemaining: 0,
          currentActivity: 'Security assessment complete'
        });

        const executionTime = Date.now() - startTime;
        const summary = this.generateSummary(scanResults, scannersToExecute.length);
        const performanceReport = this.performanceMonitor.stopMonitoring();

        return {
          success: true,
          consolidatedResult,
          individualResults,
          reportPaths,
          errors,
          executionTime,
          summary,
          performanceReport
        };
      }

      const executionTime = Date.now() - startTime;
      const summary = this.generateSummary(scanResults, scannersToExecute.length);
      const performanceReport = this.performanceMonitor.stopMonitoring();

      return {
        success: true,
        individualResults,
        reportPaths,
        errors,
        executionTime,
        summary,
        performanceReport
      };

    } catch (error) {
      const orchestrationError: OrchestrationError = {
        scannerName: 'Orchestrator',
        errorType: 'unknown',
        message: error instanceof Error ? error.message : 'Unknown orchestration error',
        timestamp: new Date(),
        recoverable: false
      };

      errors.push(orchestrationError);
      this.reportError(orchestrationOptions, orchestrationError);

      const executionTime = Date.now() - startTime;
      const summary = this.generateSummary(individualResults, 0);
      const performanceReport = this.performanceMonitor.stopMonitoring();

      return {
        success: false,
        individualResults,
        reportPaths,
        errors,
        executionTime,
        summary,
        performanceReport
      };
    }
  }

  /**
   * Execute security assessment with specific scanners
   */
  public async executeWithScanners(
    scannerNames: string[],
    options: Partial<OrchestrationOptions> = {}
  ): Promise<OrchestrationResult> {
    const orchestrationOptions = {
      ...this.defaultOptions,
      ...options,
      enabledScanners: scannerNames
    };

    return this.executeAssessment(orchestrationOptions);
  }

  /**
   * Execute assessment with retry logic for failed scanners
   */
  public async executeWithRetry(
    options: Partial<OrchestrationOptions> = {},
    maxRetries: number = 2
  ): Promise<OrchestrationResult> {
    let lastResult: OrchestrationResult | null = null;
    let attempt = 0;

    while (attempt <= maxRetries) {
      attempt++;
      
      this.reportProgress(options as OrchestrationOptions, {
        phase: 'initialization',
        completedScanners: [],
        totalScanners: (options.enabledScanners || []).length,
        overallProgress: 0,
        vulnerabilitiesFound: 0,
        estimatedTimeRemaining: 0,
        currentActivity: `Assessment attempt ${attempt}/${maxRetries + 1}`
      });

      const result = await this.executeAssessment(options);
      lastResult = result;

      // If successful or no retries left, return result
      if (result.success || attempt > maxRetries) {
        return result;
      }

      // Retry only failed scanners
      const failedScanners = this.identifyFailedScanners(result);
      if (failedScanners.length === 0) {
        return result; // No failed scanners to retry
      }

      console.log(`🔄 Retrying ${failedScanners.length} failed scanners (attempt ${attempt}/${maxRetries + 1})`);
      
      // Update options to retry only failed scanners
      options = {
        ...options,
        enabledScanners: failedScanners
      };

      // Wait before retry
      await this.delay(5000 * attempt); // Exponential backoff
    }

    return lastResult!;
  }

  /**
   * Execute assessment with circuit breaker pattern
   */
  public async executeWithCircuitBreaker(
    options: Partial<OrchestrationOptions> = {},
    failureThreshold: number = 3,
    recoveryTimeout: number = 60000
  ): Promise<OrchestrationResult> {
    const circuitState = this.getCircuitBreakerState();
    
    if (circuitState.isOpen && Date.now() - circuitState.lastFailure < recoveryTimeout) {
      throw new Error(`Circuit breaker is open. Recovery timeout: ${Math.round((recoveryTimeout - (Date.now() - circuitState.lastFailure)) / 1000)}s`);
    }

    try {
      const result = await this.executeAssessment(options);
      
      if (result.success) {
        this.resetCircuitBreaker();
      } else {
        this.recordCircuitBreakerFailure();
      }
      
      return result;
    } catch (error) {
      this.recordCircuitBreakerFailure();
      throw error;
    }
  }

  /**
   * Generate only comprehensive report from existing scan results
   */
  public async generateReportFromResults(
    scanResults: ScanResult[],
    options: Partial<OrchestrationOptions> = {}
  ): Promise<string> {
    const orchestrationOptions = { ...this.defaultOptions, ...options };
    
    await this.initializeOutputDirectory(orchestrationOptions.outputDirectory);
    
    const consolidatedResult = this.createEnhancedConsolidatedResult(
      orchestrationOptions,
      scanResults,
      0
    );

    return this.generateComprehensiveReport(consolidatedResult, orchestrationOptions);
  }

  private async initializeOutputDirectory(outputDirectory: string): Promise<void> {
    await fs.ensureDir(outputDirectory);
    
    // Create subdirectories for different report types
    await fs.ensureDir(path.join(outputDirectory, 'individual-reports'));
    await fs.ensureDir(path.join(outputDirectory, 'comprehensive-reports'));
    await fs.ensureDir(path.join(outputDirectory, 'raw-data'));
  }

  private async prepareScanners(options: OrchestrationOptions): Promise<ISecurityScanner[]> {
    const scannersToExecute: ISecurityScanner[] = [];
    
    for (const scannerName of options.enabledScanners) {
      const scanner = this.registeredScanners.get(scannerName);
      
      if (!scanner) {
        const error: OrchestrationError = {
          scannerName,
          errorType: 'configuration',
          message: `Scanner '${scannerName}' is not registered`,
          timestamp: new Date(),
          recoverable: false
        };
        this.reportError(options, error);
        continue;
      }

      try {
        // Configure scanner
        await scanner.configure({
          targetPath: options.targetPath,
          includePatterns: ['**/*'],
          excludePatterns: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
          maxFileSize: 10 * 1024 * 1024, // 10MB
          timeout: options.timeoutPerScanner,
          verbose: false
        });

        // Validate scanner access
        const validation = await scanner.validateAccess();
        if (!validation.isValid) {
          const error: OrchestrationError = {
            scannerName,
            errorType: 'access',
            message: `Scanner validation failed: ${validation.errors.join(', ')}`,
            timestamp: new Date(),
            recoverable: false
          };
          this.reportError(options, error);
          continue;
        }

        scannersToExecute.push(scanner);
      } catch (error) {
        const orchestrationError: OrchestrationError = {
          scannerName,
          errorType: 'configuration',
          message: error instanceof Error ? error.message : 'Scanner configuration failed',
          timestamp: new Date(),
          recoverable: false
        };
        this.reportError(options, orchestrationError);
      }
    }

    return scannersToExecute;
  }

  private async executeScanners(
    scanners: ISecurityScanner[],
    options: OrchestrationOptions,
    errors: OrchestrationError[]
  ): Promise<ScanResult[]> {
    const results: ScanResult[] = [];
    
    if (options.parallelExecution) {
      // Execute scanners in parallel with concurrency limit
      const chunks = this.chunkArray(scanners, options.maxConcurrentScanners);
      
      for (const chunk of chunks) {
        const chunkPromises = chunk.map(scanner => 
          this.executeSingleScanner(scanner, options, errors)
        );
        
        const chunkResults = await Promise.allSettled(chunkPromises);
        
        chunkResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            results.push(result.value);
          }
        });
      }
    } else {
      // Execute scanners sequentially
      for (const scanner of scanners) {
        try {
          const result = await this.executeSingleScanner(scanner, options, errors);
          if (result) {
            results.push(result);
          }
        } catch (error) {
          // Error already handled in executeSingleScanner
        }
      }
    }

    return results;
  }

  private async executeSingleScanner(
    scanner: ISecurityScanner,
    options: OrchestrationOptions,
    errors: OrchestrationError[]
  ): Promise<ScanResult | null> {
    const scannerName = scanner.name;
    
    try {
      // Create progress callback for individual scanner
      const progressCallback: ProgressCallback = (progress: ScanProgress) => {
        // Update performance monitoring counters
        this.performanceMonitor.updateCounters({
          filesProcessed: 1,
          vulnerabilitiesFound: progress.vulnerabilitiesFound
        });

        this.reportProgress(options, {
          phase: 'scanning',
          currentScanner: scannerName,
          completedScanners: [],
          totalScanners: options.enabledScanners.length,
          overallProgress: 20 + (progress.percentage * 0.5), // 20-70% range for scanning
          vulnerabilitiesFound: progress.vulnerabilitiesFound,
          estimatedTimeRemaining: progress.estimatedTimeRemaining,
          currentActivity: `Scanning with ${scannerName}: ${progress.currentFile}`
        });
      };

      // Execute scanner with timeout
      const scanPromise = scanner.scan(progressCallback);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Scanner timeout')), options.timeoutPerScanner);
      });

      const result = await Promise.race([scanPromise, timeoutPromise]);
      
      // Save raw scan result
      await this.saveRawScanResult(result, options.outputDirectory);
      
      return result;

    } catch (error) {
      const orchestrationError: OrchestrationError = {
        scannerName,
        errorType: error instanceof Error && error.message === 'Scanner timeout' ? 'timeout' : 'crash',
        message: error instanceof Error ? error.message : 'Unknown scanner error',
        timestamp: new Date(),
        recoverable: true
      };

      errors.push(orchestrationError);
      this.reportError(options, orchestrationError);
      
      return null;
    } finally {
      // Cleanup scanner resources
      try {
        await scanner.cleanup();
      } catch (cleanupError) {
        // Log cleanup error but don't fail the orchestration
        console.warn(`Cleanup failed for scanner ${scannerName}:`, cleanupError);
      }
    }
  }

  private async generateIndividualReports(
    scanResults: ScanResult[],
    outputDirectory: string
  ): Promise<string[]> {
    const reportPaths: string[] = [];
    
    for (const result of scanResults) {
      try {
        const reportFileName = `${result.scannerName.toLowerCase().replace(/\s+/g, '-')}-report.md`;
        const reportPath = path.join(outputDirectory, 'individual-reports', reportFileName);
        
        // Generate basic markdown report for individual scanner
        const report = this.generateIndividualScannerReport(result);
        await fs.writeFile(reportPath, report, 'utf-8');
        
        reportPaths.push(reportPath);
      } catch (error) {
        console.warn(`Failed to generate individual report for ${result.scannerName}:`, error);
      }
    }
    
    return reportPaths;
  }

  private async generateComprehensiveReport(
    consolidatedResult: ConsolidatedScanResult,
    options: OrchestrationOptions
  ): Promise<string> {
    const reportFileName = `SECURITY-ASSESSMENT-REPORT.md`;
    const reportPath = path.join(options.outputDirectory, reportFileName);
    
    const reportOptions: Partial<ComprehensiveReportOptions> = {
      ...options.reportOptions,
      outputPath: reportPath
    };

    await this.reportGenerator.generateComprehensiveReport(consolidatedResult, reportOptions);
    
    return reportPath;
  }

  private createConsolidatedResult(
    options: OrchestrationOptions,
    scanResults: ScanResult[],
    scanDuration: number
  ): ConsolidatedScanResult {
    // Filter vulnerabilities based on configuration thresholds
    const filteredResults = scanResults.map(result => this.filterVulnerabilities(result));
    
    // Deduplicate vulnerabilities across all scanners
    const uniqueVulnerabilities = this.deduplicateVulnerabilities(filteredResults);

    const totalFiles = filteredResults.reduce((sum, result) => sum + result.filesScanned, 0);
    
    const scannerVersions = filteredResults.reduce((versions, result) => {
      versions[result.scannerName] = result.scannerVersion;
      return versions;
    }, {} as Record<string, string>);

    return {
      projectName: options.projectName,
      assessmentDate: new Date(),
      scanResults: filteredResults,
      totalVulnerabilities: uniqueVulnerabilities.length,
      totalFiles,
      scanDuration,
      scannerVersions
    };
  }

  private generateSummary(scanResults: ScanResult[], totalScanners: number): OrchestrationSummary {
    const allVulnerabilities = scanResults.flatMap(result => result.vulnerabilities);
    
    const vulnerabilitiesBySeverity = allVulnerabilities.reduce((counts, vuln) => {
      counts[vuln.severity] = (counts[vuln.severity] || 0) + 1;
      return counts;
    }, {} as Record<VulnerabilitySeverity, number>);

    const totalFilesScanned = scanResults.reduce((sum, result) => sum + result.filesScanned, 0);
    const averageConfidence = scanResults.length > 0 
      ? scanResults.reduce((sum, result) => sum + result.metadata.confidence, 0) / scanResults.length
      : 0;

    // Determine overall risk level
    let overallRiskLevel = 'Low';
    const criticalCount = vulnerabilitiesBySeverity[VulnerabilitySeverity.CRITICAL] || 0;
    const highCount = vulnerabilitiesBySeverity[VulnerabilitySeverity.HIGH] || 0;
    
    if (criticalCount > 0) overallRiskLevel = 'Critical';
    else if (highCount > 2) overallRiskLevel = 'High';
    else if (highCount > 0) overallRiskLevel = 'Medium';

    return {
      totalVulnerabilities: allVulnerabilities.length,
      vulnerabilitiesBySeverity,
      scannersExecuted: totalScanners,
      scannersSuccessful: scanResults.length,
      scannersFailed: totalScanners - scanResults.length,
      totalFilesScanned,
      averageConfidence,
      overallRiskLevel
    };
  }

  private generateIndividualScannerReport(scanResult: ScanResult): string {
    const date = new Date().toLocaleDateString();
    
    return `# ${scanResult.scannerName} Security Report

**Generated:** ${date}  
**Scanner Version:** ${scanResult.scannerVersion}  
**Files Scanned:** ${scanResult.filesScanned}  
**Vulnerabilities Found:** ${scanResult.vulnerabilities.length}  
**Scan Duration:** ${Math.round(scanResult.metadata.scanDuration / 1000)}s  
**Confidence:** ${scanResult.metadata.confidence}%

## Vulnerability Summary

${scanResult.vulnerabilities.length === 0 ? 'No vulnerabilities found.' : ''}

${scanResult.vulnerabilities.map((vuln, index) => `
### ${index + 1}. ${vuln.title}

**Severity:** ${vuln.severity}  
**Category:** ${vuln.category}  
**File:** \`${vuln.location.filePath}\`  
**Line:** ${vuln.location.lineNumber || 'N/A'}  

**Description:** ${vuln.description}

**Remediation:** ${vuln.remediation.summary}

---
`).join('')}

## Scan Errors

${scanResult.errors.length === 0 ? 'No errors encountered.' : ''}

${scanResult.errors.map(error => `- **${error.errorType}:** ${error.message} (${error.filePath})`).join('\n')}

---

*Report generated by ${scanResult.scannerName} v${scanResult.scannerVersion}*
`;
  }

  private async saveRawScanResult(result: ScanResult, outputDirectory: string): Promise<void> {
    const fileName = `${result.scannerName.toLowerCase().replace(/\s+/g, '-')}-raw-data.json`;
    const filePath = path.join(outputDirectory, 'raw-data', fileName);
    
    await fs.writeFile(filePath, JSON.stringify(result, null, 2), 'utf-8');
  }

  private countTotalVulnerabilities(scanResults: ScanResult[]): number {
    return scanResults.reduce((sum, result) => sum + result.vulnerabilities.length, 0);
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private reportProgress(options: OrchestrationOptions, progress: OrchestrationProgress): void {
    if (options.progressCallback) {
      options.progressCallback(progress);
    }
  }

  private reportError(options: OrchestrationOptions, error: OrchestrationError): void {
    if (options.errorCallback) {
      options.errorCallback(error);
    }
  }

  /**
   * Merge orchestration options with configuration
   */
  private mergeOptionsWithConfig(options: Partial<OrchestrationOptions>): OrchestrationOptions {
    const executionSettings = this.configManager.getOptimizedExecutionSettings();
    
    return {
      ...this.defaultOptions,
      projectName: options.projectName || this.config.projectSettings.name,
      targetPath: options.targetPath || this.config.projectSettings.targetPath,
      outputDirectory: options.outputDirectory || this.config.projectSettings.outputDirectory,
      enabledScanners: options.enabledScanners || Object.keys(this.config.scannerConfigs).filter(
        name => this.config.scannerConfigs[name].enabled
      ),
      parallelExecution: options.parallelExecution !== undefined ? options.parallelExecution : executionSettings.parallelExecution,
      maxConcurrentScanners: options.maxConcurrentScanners || executionSettings.maxConcurrentScanners,
      timeoutPerScanner: options.timeoutPerScanner || this.getAverageTimeout(),
      generateIndividualReports: options.generateIndividualReports !== undefined ? options.generateIndividualReports : this.config.reportSettings.includeIndividualReports,
      generateComprehensiveReport: options.generateComprehensiveReport !== undefined ? options.generateComprehensiveReport : true,
      reportOptions: {
        ...options.reportOptions,
        outputFormat: this.config.reportSettings.format
      },
      progressCallback: options.progressCallback,
      errorCallback: options.errorCallback
    };
  }

  /**
   * Get average timeout from scanner configurations
   */
  private getAverageTimeout(): number {
    const timeouts = Object.values(this.config.scannerConfigs)
      .filter(config => config.enabled)
      .map(config => config.timeout);
    
    return timeouts.length > 0 
      ? Math.round(timeouts.reduce((sum, timeout) => sum + timeout, 0) / timeouts.length)
      : 300000; // Default 5 minutes
  }

  /**
   * Deduplicate vulnerabilities across scan results
   */
  private deduplicateVulnerabilities(scanResults: ScanResult[]): VulnerabilityFinding[] {
    const allVulnerabilities = scanResults.flatMap(result => result.vulnerabilities);
    const uniqueVulnerabilities = new Map<string, VulnerabilityFinding>();

    for (const vulnerability of allVulnerabilities) {
      // Create unique key based on location, category, and description
      const key = `${vulnerability.location.filePath}:${vulnerability.location.lineNumber}:${vulnerability.category}:${vulnerability.title}`;
      
      if (!uniqueVulnerabilities.has(key)) {
        uniqueVulnerabilities.set(key, vulnerability);
      } else {
        // If duplicate found, keep the one with higher confidence
        const existing = uniqueVulnerabilities.get(key)!;
        if (vulnerability.confidence > existing.confidence) {
          uniqueVulnerabilities.set(key, vulnerability);
        }
      }
    }

    return Array.from(uniqueVulnerabilities.values());
  }

  /**
   * Filter vulnerabilities based on configuration thresholds
   */
  private filterVulnerabilities(scanResult: ScanResult): ScanResult {
    const scannerConfig = this.configManager.getScannerConfig(scanResult.scannerName);
    
    const filteredVulnerabilities = scanResult.vulnerabilities.filter(vulnerability => 
      this.configManager.shouldReportVulnerability(
        scanResult.scannerName,
        vulnerability.severity,
        vulnerability.confidence
      )
    );

    return {
      ...scanResult,
      vulnerabilities: filteredVulnerabilities
    };
  }

  /**
   * Get configuration manager instance
   */
  public getConfigurationManager(): ConfigurationManager {
    return this.configManager;
  }

  /**
   * Update orchestrator configuration
   */
  public async updateConfiguration(updates: Partial<OrchestrationConfig>): Promise<void> {
    this.configManager.updateConfig(updates);
    this.config = this.configManager.getConfig();
    await this.configManager.saveConfig();
  }

  /**
   * Get current configuration
   */
  public getConfiguration(): OrchestrationConfig {
    return this.config;
  }

  /**
   * Validate scanner health before execution
   */
  private async validateScannerHealth(scanner: ISecurityScanner): Promise<boolean> {
    try {
      const health = await scanner.getHealthStatus();
      return health.isHealthy;
    } catch (error) {
      console.warn(`Health check failed for scanner ${scanner.name}:`, error);
      return false;
    }
  }

  /**
   * Monitor resource usage during execution
   */
  private monitorResourceUsage(): { memory: number; cpu: number } {
    const memoryUsage = process.memoryUsage();
    
    // Simple CPU usage estimation (not precise, but useful for monitoring)
    const cpuUsage = process.cpuUsage();
    const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
    
    return {
      memory: memoryUsage.heapUsed,
      cpu: cpuPercent
    };
  }

  /**
   * Check if resource limits are exceeded
   */
  private checkResourceLimits(): boolean {
    const usage = this.monitorResourceUsage();
    const limits = this.config.executionSettings.resourceLimits;
    
    if (usage.memory > limits.maxMemoryUsage) {
      console.warn(`⚠️  Memory usage (${Math.round(usage.memory / 1024 / 1024)}MB) exceeds limit (${Math.round(limits.maxMemoryUsage / 1024 / 1024)}MB)`);
      return false;
    }
    
    return true;
  }

  /**
   * Enhanced parallel scanner execution with better resource management
   */
  private async executeScannersEnhanced(
    scanners: ISecurityScanner[],
    options: OrchestrationOptions,
    errors: OrchestrationError[]
  ): Promise<ScanResult[]> {
    const results: ScanResult[] = [];
    const semaphore = new Semaphore(options.maxConcurrentScanners);
    
    if (options.parallelExecution) {
      // Execute with semaphore-controlled concurrency
      const promises = scanners.map(async (scanner) => {
        await semaphore.acquire();
        try {
          const result = await this.executeSingleScannerWithHealthCheck(scanner, options, errors);
          if (result) {
            results.push(result);
          }
        } finally {
          semaphore.release();
        }
      });
      
      await Promise.allSettled(promises);
    } else {
      // Sequential execution with progress tracking
      for (let i = 0; i < scanners.length; i++) {
        const scanner = scanners[i];
        
        this.reportProgress(options, {
          phase: 'scanning',
          currentScanner: scanner.name,
          completedScanners: results.map(r => r.scannerName),
          totalScanners: scanners.length,
          overallProgress: 20 + ((i / scanners.length) * 50), // 20-70% range
          vulnerabilitiesFound: this.countTotalVulnerabilities(results),
          estimatedTimeRemaining: (scanners.length - i) * (options.timeoutPerScanner / 1000),
          currentActivity: `Executing ${scanner.name} (${i + 1}/${scanners.length})`
        });

        const result = await this.executeSingleScannerWithHealthCheck(scanner, options, errors);
        if (result) {
          results.push(result);
        }
      }
    }

    return results;
  }

  /**
   * Execute single scanner with health checks and recovery
   */
  private async executeSingleScannerWithHealthCheck(
    scanner: ISecurityScanner,
    options: OrchestrationOptions,
    errors: OrchestrationError[]
  ): Promise<ScanResult | null> {
    const scannerName = scanner.name;
    
    try {
      // Pre-execution health check
      const isHealthy = await this.validateScannerHealth(scanner);
      if (!isHealthy) {
        const error: OrchestrationError = {
          scannerName,
          errorType: 'configuration',
          message: 'Scanner failed health check',
          timestamp: new Date(),
          recoverable: true
        };
        errors.push(error);
        return null;
      }

      // Check resource limits before execution
      if (!this.checkResourceLimits()) {
        const error: OrchestrationError = {
          scannerName,
          errorType: 'configuration',
          message: 'Resource limits exceeded, skipping scanner',
          timestamp: new Date(),
          recoverable: true
        };
        errors.push(error);
        return null;
      }

      return await this.executeSingleScanner(scanner, options, errors);
    } catch (error) {
      const orchestrationError: OrchestrationError = {
        scannerName,
        errorType: 'crash',
        message: error instanceof Error ? error.message : 'Unknown scanner error',
        timestamp: new Date(),
        recoverable: true
      };
      errors.push(orchestrationError);
      return null;
    }
  }

  /**
   * Advanced result aggregation with smart deduplication
   */
  private createEnhancedConsolidatedResult(
    options: OrchestrationOptions,
    scanResults: ScanResult[],
    scanDuration: number
  ): ConsolidatedScanResult {
    // Apply configuration-based filtering
    const filteredResults = scanResults.map(result => this.filterVulnerabilities(result));
    
    // Advanced deduplication with similarity scoring
    const uniqueVulnerabilities = this.advancedDeduplication(filteredResults);
    
    // Calculate enhanced metrics
    const totalFiles = filteredResults.reduce((sum, result) => sum + result.filesScanned, 0);
    const scannerVersions = filteredResults.reduce((versions, result) => {
      versions[result.scannerName] = result.scannerVersion;
      return versions;
    }, {} as Record<string, string>);

    // Add quality metrics
    const qualityMetrics = this.calculateQualityMetrics(filteredResults, uniqueVulnerabilities);

    return {
      projectName: options.projectName,
      assessmentDate: new Date(),
      scanResults: filteredResults,
      totalVulnerabilities: uniqueVulnerabilities.length,
      totalFiles,
      scanDuration,
      scannerVersions,
      qualityMetrics
    };
  }

  /**
   * Advanced vulnerability deduplication with similarity scoring
   */
  private advancedDeduplication(scanResults: ScanResult[]): VulnerabilityFinding[] {
    const allVulnerabilities = scanResults.flatMap(result => result.vulnerabilities);
    const clusters = new Map<string, VulnerabilityFinding[]>();

    // Group similar vulnerabilities
    for (const vulnerability of allVulnerabilities) {
      const signature = this.createVulnerabilitySignature(vulnerability);
      
      if (!clusters.has(signature)) {
        clusters.set(signature, []);
      }
      clusters.get(signature)!.push(vulnerability);
    }

    // Select best representative from each cluster
    const uniqueVulnerabilities: VulnerabilityFinding[] = [];
    
    for (const [signature, similarVulns] of clusters) {
      if (similarVulns.length === 1) {
        uniqueVulnerabilities.push(similarVulns[0]);
      } else {
        // Select vulnerability with highest confidence and most complete information
        const best = similarVulns.reduce((best, current) => {
          const bestScore = this.calculateVulnerabilityScore(best);
          const currentScore = this.calculateVulnerabilityScore(current);
          return currentScore > bestScore ? current : best;
        });
        
        // Merge information from similar vulnerabilities
        const merged = this.mergeVulnerabilityInformation(similarVulns, best);
        uniqueVulnerabilities.push(merged);
      }
    }

    return uniqueVulnerabilities;
  }

  /**
   * Create vulnerability signature for deduplication
   */
  private createVulnerabilitySignature(vulnerability: VulnerabilityFinding): string {
    const location = `${vulnerability.location.filePath}:${vulnerability.location.lineNumber || 0}`;
    const content = `${vulnerability.category}:${vulnerability.title}`;
    const context = vulnerability.location.codeSnippet?.substring(0, 100) || '';
    
    return `${location}|${content}|${this.normalizeString(context)}`;
  }

  /**
   * Calculate vulnerability quality score for deduplication
   */
  private calculateVulnerabilityScore(vulnerability: VulnerabilityFinding): number {
    let score = vulnerability.confidence;
    
    // Bonus for detailed information
    if (vulnerability.remediation.steps.length > 0) score += 10;
    if (vulnerability.location.codeSnippet) score += 5;
    if (vulnerability.references.length > 0) score += 5;
    if (vulnerability.cweId) score += 5;
    
    return score;
  }

  /**
   * Merge information from similar vulnerabilities
   */
  private mergeVulnerabilityInformation(
    similarVulns: VulnerabilityFinding[],
    best: VulnerabilityFinding
  ): VulnerabilityFinding {
    // Collect all unique references
    const allReferences = Array.from(new Set(
      similarVulns.flatMap(v => v.references)
    ));

    // Collect all remediation steps
    const allSteps = Array.from(new Set(
      similarVulns.flatMap(v => v.remediation.steps)
    ));

    // Use highest confidence
    const maxConfidence = Math.max(...similarVulns.map(v => v.confidence));

    return {
      ...best,
      confidence: maxConfidence,
      references: allReferences,
      remediation: {
        ...best.remediation,
        steps: allSteps
      },
      metadata: {
        ...best.metadata,
        detectedBy: Array.from(new Set(
          similarVulns.map(v => v.metadata?.detectedBy).filter(Boolean)
        )).join(', '),
        duplicateCount: similarVulns.length
      }
    };
  }

  /**
   * Calculate quality metrics for assessment
   */
  private calculateQualityMetrics(
    scanResults: ScanResult[],
    uniqueVulnerabilities: VulnerabilityFinding[]
  ): any {
    const totalVulnerabilities = scanResults.reduce((sum, result) => sum + result.vulnerabilities.length, 0);
    const deduplicationRate = totalVulnerabilities > 0 
      ? ((totalVulnerabilities - uniqueVulnerabilities.length) / totalVulnerabilities) * 100 
      : 0;

    const averageConfidence = uniqueVulnerabilities.length > 0
      ? uniqueVulnerabilities.reduce((sum, v) => sum + v.confidence, 0) / uniqueVulnerabilities.length
      : 0;

    const coverageMetrics = this.calculateCoverageMetrics(scanResults);

    return {
      deduplicationRate,
      averageConfidence,
      coverageMetrics,
      qualityScore: this.calculateOverallQualityScore(scanResults, uniqueVulnerabilities)
    };
  }

  /**
   * Calculate coverage metrics
   */
  private calculateCoverageMetrics(scanResults: ScanResult[]): any {
    const fileTypes = new Set<string>();
    const scannerTypes = new Set<string>();
    
    scanResults.forEach(result => {
      scannerTypes.add(result.scannerName);
      // Extract file types from scanned files (simplified)
      result.vulnerabilities.forEach(vuln => {
        const ext = vuln.location.filePath.split('.').pop();
        if (ext) fileTypes.add(ext);
      });
    });

    return {
      fileTypesCovered: fileTypes.size,
      scannerTypesCovered: scannerTypes.size,
      totalScanners: this.registeredScanners.size
    };
  }

  /**
   * Calculate overall quality score
   */
  private calculateOverallQualityScore(
    scanResults: ScanResult[],
    uniqueVulnerabilities: VulnerabilityFinding[]
  ): number {
    const completenessScore = (scanResults.length / this.registeredScanners.size) * 100;
    const confidenceScore = uniqueVulnerabilities.length > 0
      ? uniqueVulnerabilities.reduce((sum, v) => sum + v.confidence, 0) / uniqueVulnerabilities.length
      : 100;
    
    const errorRate = scanResults.reduce((sum, result) => sum + result.errors.length, 0) / scanResults.length;
    const reliabilityScore = Math.max(0, 100 - (errorRate * 10));

    return (completenessScore + confidenceScore + reliabilityScore) / 3;
  }

  /**
   * Utility methods for enhanced functionality
   */
  private normalizeString(str: string): string {
    return str.toLowerCase().replace(/\s+/g, ' ').trim();
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private identifyFailedScanners(result: OrchestrationResult): string[] {
    const successfulScanners = new Set(result.individualResults.map(r => r.scannerName));
    return result.errors
      .filter(error => error.recoverable)
      .map(error => error.scannerName)
      .filter(name => !successfulScanners.has(name));
  }

  private circuitBreakerState = {
    failures: 0,
    lastFailure: 0,
    isOpen: false
  };

  private getCircuitBreakerState() {
    return this.circuitBreakerState;
  }

  private recordCircuitBreakerFailure(): void {
    this.circuitBreakerState.failures++;
    this.circuitBreakerState.lastFailure = Date.now();
    
    if (this.circuitBreakerState.failures >= 3) {
      this.circuitBreakerState.isOpen = true;
      console.warn('🔴 Circuit breaker opened due to repeated failures');
    }
  }

  private resetCircuitBreaker(): void {
    this.circuitBreakerState.failures = 0;
    this.circuitBreakerState.isOpen = false;
    console.log('🟢 Circuit breaker reset');
  }
}

/**
 * Semaphore for controlling concurrent execution
 */
class Semaphore {
  private permits: number;
  private waitQueue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      this.waitQueue.push(resolve);
    });
  }

  release(): void {
    this.permits++;
    
    if (this.waitQueue.length > 0) {
      const next = this.waitQueue.shift();
      if (next) {
        this.permits--;
        next();
      }
    }
  }
}