/**
 * Base scanner interface for all security vulnerability scanners
 * Defines the contract for read-only security assessment tools
 */

import { VulnerabilityFinding } from '../types/VulnerabilityTypes';
import { RiskAssessment } from '../types/RiskAssessmentTypes';
import { ComplianceMapping } from '../types/ComplianceTypes';

export interface ScannerConfiguration {
  readonly targetPath: string;
  readonly includePatterns: string[];
  readonly excludePatterns: string[];
  readonly maxFileSize: number;
  readonly timeout: number;
  readonly verbose: boolean;
  readonly customRules?: CustomRule[];
}

export interface CustomRule {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly pattern: string | RegExp;
  readonly severity: string;
  readonly category: string;
}

export interface ScanResult {
  readonly scannerId: string;
  readonly scannerName: string;
  readonly scannerVersion: string;
  readonly targetPath: string;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly filesScanned: number;
  readonly vulnerabilities: VulnerabilityFinding[];
  readonly riskAssessments: RiskAssessment[];
  readonly complianceMappings: ComplianceMapping[];
  readonly errors: ScanError[];
  readonly metadata: ScanMetadata;
}

export interface ScanError {
  readonly filePath: string;
  readonly errorType: string;
  readonly message: string;
  readonly timestamp: Date;
}

export interface ScanMetadata {
  readonly scanDuration: number; // milliseconds
  readonly memoryUsage: number; // bytes
  readonly rulesApplied: number;
  readonly falsePositiveFiltered: number;
  readonly confidence: number; // 0-100 percentage
}

export interface ProgressCallback {
  (progress: ScanProgress): void;
}

export interface ScanProgress {
  readonly currentFile: string;
  readonly filesProcessed: number;
  readonly totalFiles: number;
  readonly percentage: number;
  readonly estimatedTimeRemaining: number; // milliseconds
  readonly vulnerabilitiesFound: number;
}

/**
 * Base interface that all security scanners must implement
 * Ensures consistent behavior across different scanner types
 */
export interface ISecurityScanner {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly supportedFileTypes: string[];

  /**
   * Configure the scanner with target path and options
   * @param config Scanner configuration options
   */
  configure(config: ScannerConfiguration): Promise<void>;

  /**
   * Validate that the scanner can access the target path
   * @returns Promise resolving to validation result
   */
  validateAccess(): Promise<ValidationResult>;

  /**
   * Execute the security scan with progress reporting
   * @param progressCallback Optional callback for progress updates
   * @returns Promise resolving to scan results
   */
  scan(progressCallback?: ProgressCallback): Promise<ScanResult>;

  /**
   * Get scanner-specific health check information
   * @returns Promise resolving to health status
   */
  getHealthStatus(): Promise<HealthStatus>;

  /**
   * Clean up resources and temporary files
   */
  cleanup(): Promise<void>;
}

export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: string[];
  readonly warnings: string[];
  readonly accessibleFiles: number;
  readonly inaccessibleFiles: string[];
}

export interface HealthStatus {
  readonly isHealthy: boolean;
  readonly version: string;
  readonly lastUpdated: Date;
  readonly dependencies: DependencyStatus[];
  readonly performance: PerformanceMetrics;
}

export interface DependencyStatus {
  readonly name: string;
  readonly version: string;
  readonly status: 'available' | 'unavailable' | 'outdated';
  readonly message?: string;
}

export interface PerformanceMetrics {
  readonly averageScanTime: number; // milliseconds per file
  readonly memoryUsage: number; // bytes
  readonly cpuUsage: number; // percentage
  readonly cacheHitRate: number; // percentage
}

/**
 * Factory interface for creating scanner instances
 */
export interface IScannerFactory {
  /**
   * Create a new scanner instance
   * @param scannerType Type of scanner to create
   * @param config Initial configuration
   * @returns Promise resolving to scanner instance
   */
  createScanner(scannerType: string, config: ScannerConfiguration): Promise<ISecurityScanner>;

  /**
   * Get list of available scanner types
   * @returns Array of supported scanner type names
   */
  getAvailableScanners(): string[];

  /**
   * Get scanner metadata without creating an instance
   * @param scannerType Type of scanner
   * @returns Scanner metadata
   */
  getScannerInfo(scannerType: string): ScannerInfo;
}

export interface ScannerInfo {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly supportedFileTypes: string[];
  readonly capabilities: string[];
  readonly requirements: string[];
}