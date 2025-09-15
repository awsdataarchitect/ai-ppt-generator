#!/usr/bin/env node

/**
 * Security Assessment CLI Tool
 * 
 * Command-line interface for executing comprehensive security assessments
 * Provides interactive and batch modes for security vulnerability scanning
 */

import { SecurityAssessmentOrchestrator, OrchestrationOptions, OrchestrationProgress, OrchestrationError } from '../reports/SecurityAssessmentOrchestrator';
import { BackendSecurityScanner } from '../scanners/BackendSecurityScanner';
import { FrontendSecurityScanner } from '../scanners/FrontendSecurityScanner';
import { InfrastructureSecurityScanner } from '../scanners/InfrastructureSecurityScanner';
import { DependencyVulnerabilityScanner } from '../scanners/DependencyVulnerabilityScanner';
import { DataFlowSecurityScanner } from '../scanners/DataFlowSecurityScanner';
import { DeploymentSecurityScanner } from '../scanners/DeploymentSecurityScanner';
import { FileSystemConfig } from '../config/FileSystemConfig';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as readline from 'readline';

export interface CLIOptions {
  projectName?: string;
  targetPath?: string;
  outputDir?: string;
  scanners?: string[];
  parallel?: boolean;
  timeout?: number;
  verbose?: boolean;
  debug?: boolean;
  quiet?: boolean;
  interactive?: boolean;
  configFile?: string;
  format?: 'markdown' | 'json' | 'html';
  includeIndividual?: boolean;
  logFile?: string;
  dryRun?: boolean;
  continueOnError?: boolean;
  maxConcurrent?: number;
  help?: boolean;
  version?: boolean;
}

export interface CLIConfig {
  readonly projectName: string;
  readonly targetPath: string;
  readonly outputDirectory: string;
  readonly enabledScanners: string[];
  readonly parallelExecution: boolean;
  readonly timeoutPerScanner: number;
  readonly reportFormat: 'markdown' | 'json' | 'html';
  readonly generateIndividualReports: boolean;
  readonly verboseOutput: boolean;
  readonly debugMode: boolean;
  readonly quietMode: boolean;
  readonly logFile?: string;
  readonly dryRun: boolean;
  readonly continueOnError: boolean;
  readonly maxConcurrentScanners: number;
}

export class SecurityAssessmentCLI {
  private readonly orchestrator: SecurityAssessmentOrchestrator;
  private readonly availableScanners: Map<string, string>;
  private readonly rl: readline.Interface;
  private logStream?: fs.WriteStream;
  private debugMode: boolean = false;
  private quietMode: boolean = false;

  constructor() {
    this.orchestrator = new SecurityAssessmentOrchestrator();
    this.availableScanners = new Map([
      ['frontend', 'Frontend Security Scanner - React/Next.js vulnerability analysis'],
      ['backend', 'Backend Security Scanner - Python/Lambda security assessment'],
      ['infrastructure', 'Infrastructure Security Scanner - AWS CDK configuration review'],
      ['dependencies', 'Dependency Vulnerability Scanner - Third-party library analysis'],
      ['dataflow', 'Data Flow Security Scanner - Privacy and compliance analysis'],
      ['deployment', 'Deployment Security Scanner - CI/CD and deployment configuration']
    ]);

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    this.initializeScanners();
  }

  /**
   * Main CLI entry point
   */
  public async run(args: string[] = process.argv.slice(2)): Promise<void> {
    try {
      this.log('debug', 'Starting CLI with arguments', args);
      
      const options = this.parseArguments(args);

      if (options.help) {
        this.displayHelp();
        return;
      }

      if (options.version) {
        this.displayVersion();
        return;
      }

      if (options.interactive) {
        await this.runInteractiveMode();
      } else {
        await this.runBatchMode(options);
      }

    } catch (error) {
      this.log('error', 'CLI Error', error);
      console.error('❌ CLI Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    } finally {
      this.cleanup();
    }
  }

  /**
   * Run interactive mode with user prompts
   */
  private async runInteractiveMode(): Promise<void> {
    console.log('🔒 Security Assessment Tool - Interactive Mode\n');

    const config = await this.collectInteractiveConfig();
    
    console.log('\n📋 Configuration Summary:');
    console.log(`Project: ${config.projectName}`);
    console.log(`Target: ${config.targetPath}`);
    console.log(`Output: ${config.outputDirectory}`);
    console.log(`Scanners: ${config.enabledScanners.join(', ')}`);
    console.log(`Format: ${config.reportFormat}`);

    const confirm = await this.askQuestion('\n🚀 Start security assessment? (y/N): ');
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log('Assessment cancelled.');
      return;
    }

    await this.executeAssessment(config);
  }

  /**
   * Run batch mode with command-line options
   */
  private async runBatchMode(options: CLIOptions): Promise<void> {
    const config = await this.buildConfigFromOptions(options);
    
    // Validate configuration
    this.validateConfig(config);
    
    if (config.dryRun) {
      this.log('info', '🧪 DRY RUN MODE - No actual scanning will be performed');
      this.displayConfigSummary(config);
      return;
    }
    
    if (config.verboseOutput && !config.quietMode) {
      this.log('info', '🔒 Security Assessment Tool - Batch Mode\n');
      this.displayConfigSummary(config);
    }

    await this.executeAssessment(config);
  }

  /**
   * Display configuration summary
   */
  private displayConfigSummary(config: CLIConfig): void {
    this.log('info', '📋 Configuration:');
    this.log('info', `  Project: ${config.projectName}`);
    this.log('info', `  Target: ${config.targetPath}`);
    this.log('info', `  Output: ${config.outputDirectory}`);
    this.log('info', `  Scanners: ${config.enabledScanners.join(', ')}`);
    this.log('info', `  Parallel: ${config.parallelExecution}`);
    this.log('info', `  Max Concurrent: ${config.maxConcurrentScanners}`);
    this.log('info', `  Timeout: ${config.timeoutPerScanner / 1000}s per scanner`);
    this.log('info', `  Format: ${config.reportFormat}`);
    this.log('info', `  Individual Reports: ${config.generateIndividualReports}`);
    this.log('info', `  Continue on Error: ${config.continueOnError}`);
    if (config.logFile) {
      this.log('info', `  Log File: ${config.logFile}`);
    }
    this.log('info', '');
  }

  /**
   * Execute the security assessment with progress tracking
   */
  private async executeAssessment(config: CLIConfig): Promise<void> {
    const startTime = Date.now();
    
    // Progress tracking
    let lastProgress = 0;
    const progressCallback = (progress: OrchestrationProgress) => {
      if (config.verboseOutput || progress.overallProgress - lastProgress >= 10) {
        this.displayProgress(progress);
        lastProgress = progress.overallProgress;
      }
    };

    // Error tracking
    const errorCallback = (error: OrchestrationError) => {
      console.warn(`⚠️  Scanner Error [${error.scannerName}]: ${error.message}`);
    };

    const orchestrationOptions: OrchestrationOptions = {
      projectName: config.projectName,
      targetPath: config.targetPath,
      outputDirectory: config.outputDirectory,
      enabledScanners: config.enabledScanners,
      parallelExecution: config.parallelExecution,
      maxConcurrentScanners: 3,
      timeoutPerScanner: config.timeoutPerScanner,
      generateIndividualReports: config.generateIndividualReports,
      generateComprehensiveReport: true,
      reportOptions: {
        outputFormat: config.reportFormat
      },
      progressCallback,
      errorCallback
    };

    try {
      console.log('🚀 Starting security assessment...\n');
      
      const result = await this.orchestrator.executeAssessment(orchestrationOptions);
      
      const executionTime = Date.now() - startTime;
      
      if (result.success) {
        console.log('\n✅ Security assessment completed successfully!\n');
        
        console.log('📊 Assessment Summary:');
        console.log(`  Total Vulnerabilities: ${result.summary.totalVulnerabilities}`);
        console.log(`  Files Scanned: ${result.summary.totalFilesScanned.toLocaleString()}`);
        console.log(`  Scanners Executed: ${result.summary.scannersExecuted}`);
        console.log(`  Success Rate: ${result.summary.scannersSuccessful}/${result.summary.scannersExecuted}`);
        console.log(`  Overall Risk Level: ${result.summary.overallRiskLevel}`);
        console.log(`  Execution Time: ${Math.round(executionTime / 1000)}s`);
        
        if (result.summary.totalVulnerabilities > 0) {
          console.log('\n🔍 Vulnerability Breakdown:');
          Object.entries(result.summary.vulnerabilitiesBySeverity).forEach(([severity, count]) => {
            if (count > 0) {
              const icon = this.getSeverityIcon(severity);
              console.log(`  ${icon} ${severity}: ${count}`);
            }
          });
        }
        
        console.log('\n📄 Generated Reports:');
        result.reportPaths.forEach(reportPath => {
          console.log(`  📋 ${path.basename(reportPath)}`);
          console.log(`     ${reportPath}`);
        });
        
        if (result.errors.length > 0) {
          console.log(`\n⚠️  ${result.errors.length} scanner errors encountered (see individual reports for details)`);
        }
        
        // Provide next steps based on findings
        this.displayNextSteps(result.summary);
        
      } else {
        console.log('\n❌ Security assessment failed!\n');
        
        console.log('🔍 Error Summary:');
        result.errors.forEach(error => {
          console.log(`  ❌ ${error.scannerName}: ${error.message}`);
        });
        
        if (result.reportPaths.length > 0) {
          console.log('\n📄 Partial Reports Generated:');
          result.reportPaths.forEach(reportPath => {
            console.log(`  📋 ${path.basename(reportPath)}: ${reportPath}`);
          });
        }
        
        process.exit(1);
      }
      
    } catch (error) {
      console.error('\n💥 Assessment execution failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Initialize and register all available scanners
   */
  private initializeScanners(): void {
    try {
      const fsConfig = new FileSystemConfig();
      
      // Initialize scanners with proper error handling
      try {
        this.orchestrator.registerScanner('frontend', new FrontendSecurityScanner() as any);
      } catch (error) {
        this.log('warn', 'Failed to initialize frontend scanner', error);
      }
      
      try {
        this.orchestrator.registerScanner('backend', new BackendSecurityScanner(fsConfig) as any);
      } catch (error) {
        this.log('warn', 'Failed to initialize backend scanner', error);
      }
      
      try {
        this.orchestrator.registerScanner('infrastructure', new InfrastructureSecurityScanner() as any);
      } catch (error) {
        this.log('warn', 'Failed to initialize infrastructure scanner', error);
      }
      
      try {
        this.orchestrator.registerScanner('dependencies', new DependencyVulnerabilityScanner() as any);
      } catch (error) {
        this.log('warn', 'Failed to initialize dependencies scanner', error);
      }
      
      try {
        this.orchestrator.registerScanner('dataflow', new DataFlowSecurityScanner() as any);
      } catch (error) {
        this.log('warn', 'Failed to initialize dataflow scanner', error);
      }
      
      try {
        this.orchestrator.registerScanner('deployment', new DeploymentSecurityScanner(fsConfig) as any);
      } catch (error) {
        this.log('warn', 'Failed to initialize deployment scanner', error);
      }
    } catch (error) {
      this.log('warn', 'Some scanners failed to initialize', error);
    }
  }

  /**
   * Parse command-line arguments
   */
  private parseArguments(args: string[]): CLIOptions {
    const options: CLIOptions = {};
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      const nextArg = args[i + 1];
      
      switch (arg) {
        case '--project':
        case '-p':
          options.projectName = nextArg;
          i++;
          break;
        case '--target':
        case '-t':
          options.targetPath = nextArg;
          i++;
          break;
        case '--output':
        case '-o':
          options.outputDir = nextArg;
          i++;
          break;
        case '--scanners':
        case '-s':
          options.scanners = nextArg?.split(',').map(s => s.trim());
          i++;
          break;
        case '--timeout':
          options.timeout = parseInt(nextArg, 10) * 1000; // Convert to milliseconds
          i++;
          break;
        case '--format':
        case '-f':
          options.format = nextArg as 'markdown' | 'json' | 'html';
          i++;
          break;
        case '--config':
        case '-c':
          options.configFile = nextArg;
          i++;
          break;
        case '--parallel':
          options.parallel = true;
          break;
        case '--sequential':
          options.parallel = false;
          break;
        case '--individual':
          options.includeIndividual = true;
          break;
        case '--verbose':
        case '-v':
          options.verbose = true;
          break;
        case '--debug':
        case '-d':
          options.debug = true;
          break;
        case '--quiet':
        case '-q':
          options.quiet = true;
          break;
        case '--interactive':
        case '-i':
          options.interactive = true;
          break;
        case '--log-file':
        case '-l':
          options.logFile = nextArg;
          i++;
          break;
        case '--dry-run':
          options.dryRun = true;
          break;
        case '--continue-on-error':
          options.continueOnError = true;
          break;
        case '--max-concurrent':
          options.maxConcurrent = parseInt(nextArg, 10);
          i++;
          break;
        case '--help':
        case '-h':
          options.help = true;
          break;
        case '--version':
          options.version = true;
          break;
        default:
          if (arg.startsWith('-')) {
            throw new Error(`Unknown option: ${arg}`);
          }
          break;
      }
    }
    
    return options;
  }

  /**
   * Collect configuration through interactive prompts
   */
  private async collectInteractiveConfig(): Promise<CLIConfig> {
    const projectName = await this.askQuestion('📝 Project name (default: Security Assessment): ') || 'Security Assessment';
    const targetPath = await this.askQuestion('📁 Target path (default: current directory): ') || '.';
    const outputDirectory = await this.askQuestion('📂 Output directory (default: ./security-reports): ') || './security-reports';
    
    // Scanner selection
    console.log('\n🔍 Available scanners:');
    Array.from(this.availableScanners.entries()).forEach(([key, description], index) => {
      console.log(`  ${index + 1}. ${key} - ${description}`);
    });
    
    const scannerInput = await this.askQuestion('\n🎯 Select scanners (comma-separated numbers or names, default: all): ');
    const enabledScanners = this.parseScannerSelection(scannerInput);
    
    const parallelInput = await this.askQuestion('⚡ Run scanners in parallel? (Y/n): ');
    const parallelExecution = parallelInput.toLowerCase() !== 'n' && parallelInput.toLowerCase() !== 'no';
    
    const timeoutInput = await this.askQuestion('⏱️  Timeout per scanner in seconds (default: 300): ');
    const timeoutPerScanner = (parseInt(timeoutInput, 10) || 300) * 1000;
    
    const formatInput = await this.askQuestion('📄 Report format (markdown/json/html, default: markdown): ');
    const reportFormat = (['markdown', 'json', 'html'].includes(formatInput) ? formatInput : 'markdown') as 'markdown' | 'json' | 'html';
    
    const individualInput = await this.askQuestion('📋 Generate individual scanner reports? (Y/n): ');
    const generateIndividualReports = individualInput.toLowerCase() !== 'n' && individualInput.toLowerCase() !== 'no';
    
    return {
      projectName,
      targetPath,
      outputDirectory,
      enabledScanners,
      parallelExecution,
      timeoutPerScanner,
      reportFormat,
      generateIndividualReports,
      verboseOutput: true,
      debugMode: false,
      quietMode: false,
      dryRun: false,
      continueOnError: false,
      maxConcurrentScanners: 3
    };
  }

  /**
   * Build configuration from command-line options
   */
  private async buildConfigFromOptions(options: CLIOptions): Promise<CLIConfig> {
    let config: Partial<CLIConfig> = {};
    
    // Load from config file if specified
    if (options.configFile) {
      config = await this.loadConfigFile(options.configFile);
    }
    
    // Set up logging
    this.debugMode = options.debug || config.debugMode || false;
    this.quietMode = options.quiet || config.quietMode || false;
    
    if (options.logFile || config.logFile) {
      await this.setupLogging(options.logFile || config.logFile!);
    }
    
    // Override with command-line options
    return {
      projectName: options.projectName || config.projectName || 'Security Assessment',
      targetPath: options.targetPath || config.targetPath || '.',
      outputDirectory: options.outputDir || config.outputDirectory || './security-reports',
      enabledScanners: options.scanners || config.enabledScanners || Array.from(this.availableScanners.keys()),
      parallelExecution: options.parallel !== undefined ? options.parallel : (config.parallelExecution !== undefined ? config.parallelExecution : true),
      timeoutPerScanner: options.timeout || config.timeoutPerScanner || 300000,
      reportFormat: options.format || config.reportFormat || 'markdown',
      generateIndividualReports: options.includeIndividual !== undefined ? options.includeIndividual : (config.generateIndividualReports !== undefined ? config.generateIndividualReports : true),
      verboseOutput: options.verbose !== undefined ? options.verbose : (config.verboseOutput !== undefined ? config.verboseOutput : false),
      debugMode: this.debugMode,
      quietMode: this.quietMode,
      logFile: options.logFile || config.logFile,
      dryRun: options.dryRun || config.dryRun || false,
      continueOnError: options.continueOnError || config.continueOnError || false,
      maxConcurrentScanners: options.maxConcurrent || config.maxConcurrentScanners || 3
    };
  }

  /**
   * Load configuration from JSON file
   */
  private async loadConfigFile(configPath: string): Promise<Partial<CLIConfig>> {
    try {
      const configContent = await fs.readFile(configPath, 'utf-8');
      return JSON.parse(configContent);
    } catch (error) {
      throw new Error(`Failed to load config file ${configPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse scanner selection from user input
   */
  private parseScannerSelection(input: string): string[] {
    if (!input.trim()) {
      return Array.from(this.availableScanners.keys());
    }
    
    const selections = input.split(',').map(s => s.trim());
    const scanners: string[] = [];
    
    for (const selection of selections) {
      // Check if it's a number (1-based index)
      const index = parseInt(selection, 10);
      if (!isNaN(index) && index >= 1 && index <= this.availableScanners.size) {
        const scannerName = Array.from(this.availableScanners.keys())[index - 1];
        scanners.push(scannerName);
      }
      // Check if it's a scanner name
      else if (this.availableScanners.has(selection)) {
        scanners.push(selection);
      }
      else {
        console.warn(`⚠️  Unknown scanner: ${selection}`);
      }
    }
    
    return scanners.length > 0 ? scanners : Array.from(this.availableScanners.keys());
  }

  /**
   * Display progress information
   */
  private displayProgress(progress: OrchestrationProgress): void {
    const progressBar = this.createProgressBar(progress.overallProgress);
    const phase = progress.phase.charAt(0).toUpperCase() + progress.phase.slice(1);
    
    process.stdout.write(`\r${progressBar} ${progress.overallProgress.toFixed(0)}% | ${phase}: ${progress.currentActivity}`);
    
    if (progress.phase === 'complete') {
      console.log(''); // New line after completion
    }
  }

  /**
   * Create ASCII progress bar
   */
  private createProgressBar(percentage: number, width: number = 20): string {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    return `[${'█'.repeat(filled)}${' '.repeat(empty)}]`;
  }

  /**
   * Get severity icon for display
   */
  private getSeverityIcon(severity: string): string {
    const icons: Record<string, string> = {
      'Critical': '🔴',
      'High': '🟠',
      'Medium': '🟡',
      'Low': '🟢',
      'Info': '⚪'
    };
    return icons[severity] || '⚪';
  }

  /**
   * Display next steps based on assessment results
   */
  private displayNextSteps(summary: any): void {
    console.log('\n🎯 Recommended Next Steps:');
    
    if (summary.totalVulnerabilities === 0) {
      console.log('  ✅ No vulnerabilities found - maintain current security practices');
      console.log('  🔄 Schedule regular security assessments');
      console.log('  📚 Consider security training for development team');
    } else {
      const criticalCount = summary.vulnerabilitiesBySeverity['Critical'] || 0;
      const highCount = summary.vulnerabilitiesBySeverity['High'] || 0;
      
      if (criticalCount > 0) {
        console.log(`  🚨 URGENT: Address ${criticalCount} critical vulnerabilities within 24 hours`);
      }
      
      if (highCount > 0) {
        console.log(`  ⚡ HIGH PRIORITY: Remediate ${highCount} high-severity issues within 1 week`);
      }
      
      console.log('  📋 Review comprehensive report for detailed remediation steps');
      console.log('  🔧 Implement security fixes based on priority recommendations');
      console.log('  🧪 Set up automated security testing in CI/CD pipeline');
      console.log('  📊 Schedule follow-up assessment after remediation');
    }
    
    console.log('\n💡 For detailed remediation guidance, see the comprehensive report.');
  }

  /**
   * Display help information
   */
  private displayHelp(): void {
    console.log(`
🔒 Security Assessment Tool

USAGE:
  security-assessment [OPTIONS]

OPTIONS:
  -p, --project <name>        Project name for the assessment
  -t, --target <path>         Target directory to scan (default: current directory)
  -o, --output <dir>          Output directory for reports (default: ./security-reports)
  -s, --scanners <list>       Comma-separated list of scanners to run
  -f, --format <format>       Report format: markdown, json, html (default: markdown)
  -c, --config <file>         Load configuration from JSON file
      --timeout <seconds>     Timeout per scanner in seconds (default: 300)
      --max-concurrent <num>  Maximum concurrent scanners (default: 3, max: 10)
      --parallel              Run scanners in parallel (default)
      --sequential            Run scanners sequentially
      --individual            Generate individual scanner reports
      --continue-on-error     Continue execution even if some scanners fail
      --dry-run               Validate configuration without running assessment
  -v, --verbose               Enable verbose output
  -d, --debug                 Enable debug mode with detailed logging
  -q, --quiet                 Suppress non-essential output
  -l, --log-file <path>       Write logs to specified file
  -i, --interactive           Run in interactive mode
  -h, --help                  Show this help message
      --version               Show version information

AVAILABLE SCANNERS:
  frontend                    React/Next.js security analysis
  backend                     Python/Lambda security assessment
  infrastructure              AWS CDK configuration review
  dependencies                Third-party library vulnerability scan
  dataflow                    Privacy and compliance analysis
  deployment                  CI/CD and deployment security

CONFIGURATION FILES:
  Use JSON configuration files to define complex assessment parameters.
  Example configurations are available in the config/ directory:
  - security-assessment.config.json    Full comprehensive assessment
  - quick-scan.config.json             Fast security scan
  - compliance-focused.config.json     Compliance-oriented assessment

EXAMPLES:
  # Interactive mode
  security-assessment --interactive

  # Quick scan with verbose output
  security-assessment --scanners frontend,backend --verbose --debug

  # Custom project with specific output and logging
  security-assessment --project "My App" --target ./src --output ./reports --log-file ./logs/security.log

  # Use configuration file with overrides
  security-assessment --config ./config/quick-scan.config.json --verbose

  # Generate JSON report with parallel execution
  security-assessment --format json --parallel --max-concurrent 5

  # Dry run to validate configuration
  security-assessment --config ./config/security-assessment.config.json --dry-run

  # Compliance-focused assessment
  security-assessment --config ./config/compliance-focused.config.json --continue-on-error

  # Debug mode with detailed logging
  security-assessment --debug --log-file ./debug.log --verbose

EXIT CODES:
  0    Assessment completed successfully
  1    CLI error or assessment failed
  2    Configuration validation failed
  3    Scanner initialization failed

For more information and documentation, visit:
https://github.com/your-org/security-assessment
`);
  }

  /**
   * Display version information
   */
  private displayVersion(): void {
    console.log('Security Assessment Tool v1.0.0');
  }

  /**
   * Ask user a question and return the response
   */
  private askQuestion(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  /**
   * Setup logging to file
   */
  private async setupLogging(logFile: string): Promise<void> {
    try {
      const logDir = path.dirname(logFile);
      await fs.ensureDir(logDir);
      
      this.logStream = fs.createWriteStream(logFile, { flags: 'a' });
      this.log('info', `Logging initialized: ${logFile}`);
    } catch (error) {
      console.warn(`⚠️  Failed to setup logging: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Log message with level and timestamp
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}${data ? ' ' + JSON.stringify(data) : ''}`;
    
    // Write to log file if available
    if (this.logStream) {
      this.logStream.write(logEntry + '\n');
    }
    
    // Console output based on mode
    if (level === 'debug' && this.debugMode) {
      console.debug(`🐛 ${message}`, data || '');
    } else if (level === 'info' && !this.quietMode) {
      console.log(message);
    } else if (level === 'warn') {
      console.warn(`⚠️  ${message}`);
    } else if (level === 'error') {
      console.error(`❌ ${message}`);
    }
  }

  /**
   * Validate configuration before execution
   */
  private validateConfig(config: CLIConfig): void {
    this.log('debug', 'Validating configuration', config);
    
    // Check target path exists
    if (!fs.existsSync(config.targetPath)) {
      throw new Error(`Target path does not exist: ${config.targetPath}`);
    }
    
    // Validate scanners
    const invalidScanners = config.enabledScanners.filter(scanner => !this.availableScanners.has(scanner));
    if (invalidScanners.length > 0) {
      throw new Error(`Invalid scanners: ${invalidScanners.join(', ')}`);
    }
    
    // Validate timeout
    if (config.timeoutPerScanner < 10000) {
      throw new Error('Timeout per scanner must be at least 10 seconds');
    }
    
    // Validate max concurrent scanners
    if (config.maxConcurrentScanners < 1 || config.maxConcurrentScanners > 10) {
      throw new Error('Max concurrent scanners must be between 1 and 10');
    }
    
    this.log('debug', 'Configuration validation passed');
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    if (this.logStream) {
      this.logStream.end();
    }
    this.rl.close();
  }
}

// CLI entry point
if (require.main === module) {
  const cli = new SecurityAssessmentCLI();
  cli.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default SecurityAssessmentCLI;