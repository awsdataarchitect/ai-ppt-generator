/**
 * Configuration Management for Security Assessment Orchestration
 * 
 * Provides centralized configuration management for scanner settings,
 * thresholds, and orchestration parameters
 */

import * as fs from 'fs-extra';
import * as path from 'path';

export interface ScannerThresholds {
  readonly maxFileSize: number; // bytes
  readonly maxScanTime: number; // milliseconds
  readonly confidenceThreshold: number; // 0-100 percentage
  readonly maxVulnerabilitiesPerFile: number;
  readonly severityWeights: Record<string, number>;
}

export interface ScannerSettings {
  readonly enabled: boolean;
  readonly priority: number; // 1-10, higher = more important
  readonly timeout: number; // milliseconds
  readonly retryAttempts: number;
  readonly thresholds: ScannerThresholds;
  readonly customRules: CustomRuleConfig[];
  readonly excludePatterns: string[];
  readonly includePatterns: string[];
}

export interface CustomRuleConfig {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly pattern: string;
  readonly severity: string;
  readonly category: string;
  readonly enabled: boolean;
  readonly confidence: number;
}

export interface OrchestrationConfig {
  readonly version: string;
  readonly projectSettings: ProjectSettings;
  readonly executionSettings: ExecutionSettings;
  readonly reportSettings: ReportSettings;
  readonly scannerConfigs: Record<string, ScannerSettings>;
  readonly complianceSettings: ComplianceSettings;
  readonly notificationSettings: NotificationSettings;
}

export interface ProjectSettings {
  readonly name: string;
  readonly description: string;
  readonly targetPath: string;
  readonly outputDirectory: string;
  readonly excludeDirectories: string[];
  readonly includeFileTypes: string[];
  readonly maxProjectSize: number; // bytes
}

export interface ExecutionSettings {
  readonly parallelExecution: boolean;
  readonly maxConcurrentScanners: number;
  readonly globalTimeout: number; // milliseconds
  readonly retryFailedScanners: boolean;
  readonly continueOnError: boolean;
  readonly resourceLimits: ResourceLimits;
}

export interface ResourceLimits {
  readonly maxMemoryUsage: number; // bytes
  readonly maxCpuUsage: number; // percentage
  readonly maxDiskUsage: number; // bytes
  readonly maxNetworkRequests: number;
}

export interface ReportSettings {
  readonly format: 'markdown' | 'json' | 'html' | 'pdf';
  readonly includeIndividualReports: boolean;
  readonly includeExecutiveSummary: boolean;
  readonly includeDetailedFindings: boolean;
  readonly includeRemediationSteps: boolean;
  readonly includeComplianceMapping: boolean;
  readonly customTemplates: Record<string, string>;
}

export interface ComplianceSettings {
  readonly enabledFrameworks: string[];
  readonly customMappings: Record<string, ComplianceMapping>;
  readonly requirementThresholds: Record<string, number>;
}

export interface ComplianceMapping {
  readonly frameworkId: string;
  readonly controlId: string;
  readonly description: string;
  readonly severity: string;
  readonly testProcedures: string[];
}

export interface NotificationSettings {
  readonly enabled: boolean;
  readonly channels: NotificationChannel[];
  readonly triggers: NotificationTrigger[];
  readonly templates: Record<string, string>;
}

export interface NotificationChannel {
  readonly type: 'email' | 'slack' | 'webhook' | 'file';
  readonly endpoint: string;
  readonly credentials?: Record<string, string>;
  readonly enabled: boolean;
}

export interface NotificationTrigger {
  readonly event: 'assessment_start' | 'assessment_complete' | 'critical_vulnerability' | 'scanner_error';
  readonly condition?: string;
  readonly channels: string[];
  readonly enabled: boolean;
}

export class ConfigurationManager {
  private config: OrchestrationConfig;
  private readonly configPath: string;
  private readonly defaultConfig: OrchestrationConfig;

  constructor(configPath?: string) {
    this.configPath = configPath || path.join(process.cwd(), 'security-assessment-config.json');
    this.defaultConfig = this.createDefaultConfig();
    this.config = { ...this.defaultConfig };
  }

  /**
   * Load configuration from file or use defaults
   */
  public async loadConfig(): Promise<OrchestrationConfig> {
    try {
      if (await fs.pathExists(this.configPath)) {
        const configData = await fs.readFile(this.configPath, 'utf-8');
        const loadedConfig = JSON.parse(configData) as Partial<OrchestrationConfig>;
        
        // Merge with defaults to ensure all required fields are present
        this.config = this.mergeWithDefaults(loadedConfig);
        
        // Validate configuration
        this.validateConfig(this.config);
        
        console.log(`✅ Configuration loaded from ${this.configPath}`);
      } else {
        console.log('📋 Using default configuration (no config file found)');
        this.config = { ...this.defaultConfig };
      }
    } catch (error) {
      console.warn(`⚠️  Failed to load configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.log('📋 Using default configuration');
      this.config = { ...this.defaultConfig };
    }

    return this.config;
  }

  /**
   * Save current configuration to file
   */
  public async saveConfig(config?: OrchestrationConfig): Promise<void> {
    const configToSave = config || this.config;
    
    try {
      await fs.ensureDir(path.dirname(this.configPath));
      await fs.writeFile(this.configPath, JSON.stringify(configToSave, null, 2), 'utf-8');
      console.log(`✅ Configuration saved to ${this.configPath}`);
    } catch (error) {
      throw new Error(`Failed to save configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): OrchestrationConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(updates: Partial<OrchestrationConfig>): void {
    this.config = this.mergeWithDefaults(updates, this.config);
    this.validateConfig(this.config);
  }

  /**
   * Get scanner-specific configuration
   */
  public getScannerConfig(scannerName: string): ScannerSettings {
    return this.config.scannerConfigs[scannerName] || this.createDefaultScannerSettings();
  }

  /**
   * Update scanner-specific configuration
   */
  public updateScannerConfig(scannerName: string, settings: Partial<ScannerSettings>): void {
    const currentSettings = this.getScannerConfig(scannerName);
    this.config.scannerConfigs[scannerName] = { ...currentSettings, ...settings };
  }

  /**
   * Get execution settings optimized for current environment
   */
  public getOptimizedExecutionSettings(): ExecutionSettings {
    const settings = { ...this.config.executionSettings };
    
    // Adjust based on system resources
    const totalMemory = this.getSystemMemory();
    const cpuCount = this.getCpuCount();
    
    // Create optimized settings object
    const optimizedSettings: ExecutionSettings = {
      ...settings,
      maxConcurrentScanners: settings.maxConcurrentScanners > cpuCount 
        ? Math.max(1, cpuCount - 1) 
        : settings.maxConcurrentScanners,
      resourceLimits: {
        ...settings.resourceLimits,
        maxMemoryUsage: settings.resourceLimits.maxMemoryUsage > totalMemory * 0.8
          ? Math.floor(totalMemory * 0.6)
          : settings.resourceLimits.maxMemoryUsage
      }
    };
    
    return optimizedSettings;
  }

  /**
   * Validate vulnerability against configured thresholds
   */
  public shouldReportVulnerability(
    scannerName: string,
    severity: string,
    confidence: number
  ): boolean {
    const scannerConfig = this.getScannerConfig(scannerName);
    
    // Check confidence threshold
    if (confidence < scannerConfig.thresholds.confidenceThreshold) {
      return false;
    }
    
    // Check severity weight
    const severityWeight = scannerConfig.thresholds.severityWeights[severity] || 0;
    return severityWeight > 0;
  }

  /**
   * Get notification settings for specific event
   */
  public getNotificationSettings(event: string): NotificationTrigger[] {
    return this.config.notificationSettings.triggers.filter(
      trigger => trigger.event === event && trigger.enabled
    );
  }

  /**
   * Create default configuration
   */
  private createDefaultConfig(): OrchestrationConfig {
    return {
      version: '1.0.0',
      projectSettings: {
        name: 'Security Assessment',
        description: 'Comprehensive security vulnerability assessment',
        targetPath: '.',
        outputDirectory: './security-reports',
        excludeDirectories: ['node_modules', 'dist', 'build', '.git', '.vscode'],
        includeFileTypes: ['.js', '.jsx', '.ts', '.tsx', '.py', '.json', '.yaml', '.yml', '.md'],
        maxProjectSize: 1024 * 1024 * 1024 // 1GB
      },
      executionSettings: {
        parallelExecution: true,
        maxConcurrentScanners: 3,
        globalTimeout: 1800000, // 30 minutes
        retryFailedScanners: true,
        continueOnError: true,
        resourceLimits: {
          maxMemoryUsage: 512 * 1024 * 1024, // 512MB
          maxCpuUsage: 80, // 80%
          maxDiskUsage: 100 * 1024 * 1024, // 100MB
          maxNetworkRequests: 1000
        }
      },
      reportSettings: {
        format: 'markdown',
        includeIndividualReports: true,
        includeExecutiveSummary: true,
        includeDetailedFindings: true,
        includeRemediationSteps: true,
        includeComplianceMapping: true,
        customTemplates: {}
      },
      scannerConfigs: {
        frontend: this.createDefaultScannerSettings(),
        backend: this.createDefaultScannerSettings(),
        infrastructure: this.createDefaultScannerSettings(),
        dependencies: this.createDefaultScannerSettings(),
        dataflow: this.createDefaultScannerSettings(),
        deployment: this.createDefaultScannerSettings()
      },
      complianceSettings: {
        enabledFrameworks: ['OWASP', 'NIST', 'AWS-WAF'],
        customMappings: {},
        requirementThresholds: {
          'OWASP': 80,
          'NIST': 75,
          'AWS-WAF': 85
        }
      },
      notificationSettings: {
        enabled: false,
        channels: [],
        triggers: [],
        templates: {}
      }
    };
  }

  /**
   * Create default scanner settings
   */
  private createDefaultScannerSettings(): ScannerSettings {
    return {
      enabled: true,
      priority: 5,
      timeout: 300000, // 5 minutes
      retryAttempts: 2,
      thresholds: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxScanTime: 60000, // 1 minute per file
        confidenceThreshold: 70, // 70% confidence minimum
        maxVulnerabilitiesPerFile: 50,
        severityWeights: {
          'Critical': 10,
          'High': 8,
          'Medium': 5,
          'Low': 2,
          'Info': 1
        }
      },
      customRules: [],
      excludePatterns: ['**/*.min.js', '**/*.map', '**/test/**', '**/tests/**'],
      includePatterns: ['**/*']
    };
  }

  /**
   * Merge configuration with defaults
   */
  private mergeWithDefaults(
    updates: Partial<OrchestrationConfig>,
    base: OrchestrationConfig = this.defaultConfig
  ): OrchestrationConfig {
    return {
      version: updates.version || base.version,
      projectSettings: { ...base.projectSettings, ...updates.projectSettings },
      executionSettings: { ...base.executionSettings, ...updates.executionSettings },
      reportSettings: { ...base.reportSettings, ...updates.reportSettings },
      scannerConfigs: { ...base.scannerConfigs, ...updates.scannerConfigs },
      complianceSettings: { ...base.complianceSettings, ...updates.complianceSettings },
      notificationSettings: { ...base.notificationSettings, ...updates.notificationSettings }
    };
  }

  /**
   * Validate configuration
   */
  private validateConfig(config: OrchestrationConfig): void {
    // Validate project settings
    if (!config.projectSettings.name || config.projectSettings.name.trim() === '') {
      throw new Error('Project name is required');
    }

    if (!config.projectSettings.targetPath) {
      throw new Error('Target path is required');
    }

    // Validate execution settings
    if (config.executionSettings.maxConcurrentScanners < 1) {
      throw new Error('Maximum concurrent scanners must be at least 1');
    }

    if (config.executionSettings.globalTimeout < 60000) {
      throw new Error('Global timeout must be at least 60 seconds');
    }

    // Validate scanner configs
    for (const [scannerName, scannerConfig] of Object.entries(config.scannerConfigs)) {
      if (scannerConfig.timeout < 10000) {
        throw new Error(`Scanner ${scannerName} timeout must be at least 10 seconds`);
      }

      if (scannerConfig.thresholds.confidenceThreshold < 0 || scannerConfig.thresholds.confidenceThreshold > 100) {
        throw new Error(`Scanner ${scannerName} confidence threshold must be between 0 and 100`);
      }
    }

    console.log('✅ Configuration validation passed');
  }

  /**
   * Get system memory in bytes
   */
  private getSystemMemory(): number {
    try {
      const os = require('os');
      return os.totalmem();
    } catch {
      return 8 * 1024 * 1024 * 1024; // Default to 8GB
    }
  }

  /**
   * Get CPU count
   */
  private getCpuCount(): number {
    try {
      const os = require('os');
      return os.cpus().length;
    } catch {
      return 4; // Default to 4 cores
    }
  }

  /**
   * Create configuration template file
   */
  public static async createTemplate(templatePath: string): Promise<void> {
    const manager = new ConfigurationManager();
    const template = manager.createDefaultConfig();
    
    // Add comments to template
    const templateWithComments = {
      "_comment": "Security Assessment Configuration Template",
      "_version": template.version,
      "_description": "Customize this configuration file to match your project requirements",
      ...template
    };

    await fs.ensureDir(path.dirname(templatePath));
    await fs.writeFile(templatePath, JSON.stringify(templateWithComments, null, 2), 'utf-8');
    
    console.log(`📋 Configuration template created at ${templatePath}`);
  }

  /**
   * Validate configuration file
   */
  public static async validateConfigFile(configPath: string): Promise<boolean> {
    try {
      const manager = new ConfigurationManager(configPath);
      await manager.loadConfig();
      return true;
    } catch (error) {
      console.error(`❌ Configuration validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }
}

export default ConfigurationManager;