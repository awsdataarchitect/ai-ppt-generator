/**
 * Performance Monitoring Utility for Security Assessment Orchestration
 * 
 * Provides real-time monitoring of resource usage, execution metrics,
 * and performance optimization recommendations
 */

export interface PerformanceMetrics {
  readonly timestamp: Date;
  readonly memoryUsage: MemoryUsage;
  readonly cpuUsage: CpuUsage;
  readonly executionTime: number; // milliseconds
  readonly throughput: ThroughputMetrics;
  readonly resourceUtilization: ResourceUtilization;
}

export interface MemoryUsage {
  readonly heapUsed: number; // bytes
  readonly heapTotal: number; // bytes
  readonly external: number; // bytes
  readonly rss: number; // bytes (Resident Set Size)
  readonly arrayBuffers: number; // bytes
}

export interface CpuUsage {
  readonly user: number; // microseconds
  readonly system: number; // microseconds
  readonly percentage: number; // 0-100
}

export interface ThroughputMetrics {
  readonly filesPerSecond: number;
  readonly vulnerabilitiesPerSecond: number;
  readonly scannersPerSecond: number;
  readonly bytesProcessedPerSecond: number;
}

export interface ResourceUtilization {
  readonly memoryUtilization: number; // 0-100 percentage
  readonly cpuUtilization: number; // 0-100 percentage
  readonly diskUtilization: number; // 0-100 percentage
  readonly networkUtilization: number; // 0-100 percentage
}

export interface PerformanceAlert {
  readonly type: 'memory' | 'cpu' | 'disk' | 'network' | 'timeout' | 'throughput';
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly message: string;
  readonly threshold: number;
  readonly currentValue: number;
  readonly timestamp: Date;
  readonly recommendation: string;
}

export interface PerformanceReport {
  readonly startTime: Date;
  readonly endTime: Date;
  readonly duration: number; // milliseconds
  readonly averageMetrics: PerformanceMetrics;
  readonly peakMetrics: PerformanceMetrics;
  readonly alerts: PerformanceAlert[];
  readonly recommendations: string[];
  readonly efficiency: EfficiencyMetrics;
}

export interface EfficiencyMetrics {
  readonly memoryEfficiency: number; // 0-100 percentage
  readonly cpuEfficiency: number; // 0-100 percentage
  readonly timeEfficiency: number; // 0-100 percentage
  readonly overallEfficiency: number; // 0-100 percentage
}

export class PerformanceMonitor {
  private readonly metrics: PerformanceMetrics[] = [];
  private readonly alerts: PerformanceAlert[] = [];
  private startTime: Date | null = null;
  private endTime: Date | null = null;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly thresholds: PerformanceThresholds;

  // Counters for throughput calculation
  private filesProcessed = 0;
  private vulnerabilitiesFound = 0;
  private scannersCompleted = 0;
  private bytesProcessed = 0;

  constructor(thresholds?: Partial<PerformanceThresholds>) {
    this.thresholds = {
      maxMemoryUsage: 512 * 1024 * 1024, // 512MB
      maxCpuUsage: 80, // 80%
      maxExecutionTime: 1800000, // 30 minutes
      minThroughput: 10, // files per second
      alertThreshold: 90, // 90% of limit
      ...thresholds
    };
  }

  /**
   * Start performance monitoring
   */
  public startMonitoring(intervalMs: number = 5000): void {
    this.startTime = new Date();
    this.endTime = null;
    this.metrics.length = 0;
    this.alerts.length = 0;

    // Reset counters
    this.filesProcessed = 0;
    this.vulnerabilitiesFound = 0;
    this.scannersCompleted = 0;
    this.bytesProcessed = 0;

    // Start periodic monitoring
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);

    console.log(`📊 Performance monitoring started (interval: ${intervalMs}ms)`);
  }

  /**
   * Stop performance monitoring
   */
  public stopMonitoring(): PerformanceReport {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.endTime = new Date();
    
    const report = this.generateReport();
    console.log(`📊 Performance monitoring stopped. Duration: ${Math.round(report.duration / 1000)}s`);
    
    return report;
  }

  /**
   * Update throughput counters
   */
  public updateCounters(update: {
    filesProcessed?: number;
    vulnerabilitiesFound?: number;
    scannersCompleted?: number;
    bytesProcessed?: number;
  }): void {
    if (update.filesProcessed !== undefined) {
      this.filesProcessed += update.filesProcessed;
    }
    if (update.vulnerabilitiesFound !== undefined) {
      this.vulnerabilitiesFound += update.vulnerabilitiesFound;
    }
    if (update.scannersCompleted !== undefined) {
      this.scannersCompleted += update.scannersCompleted;
    }
    if (update.bytesProcessed !== undefined) {
      this.bytesProcessed += update.bytesProcessed;
    }
  }

  /**
   * Get current performance metrics
   */
  public getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  /**
   * Get all collected metrics
   */
  public getAllMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get current alerts
   */
  public getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  /**
   * Check if performance is within acceptable limits
   */
  public isPerformanceHealthy(): boolean {
    const currentMetrics = this.getCurrentMetrics();
    if (!currentMetrics) return true;

    const memoryOk = currentMetrics.memoryUsage.heapUsed < this.thresholds.maxMemoryUsage;
    const cpuOk = currentMetrics.cpuUsage.percentage < this.thresholds.maxCpuUsage;
    const timeOk = currentMetrics.executionTime < this.thresholds.maxExecutionTime;

    return memoryOk && cpuOk && timeOk;
  }

  /**
   * Get performance optimization recommendations
   */
  public getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const currentMetrics = this.getCurrentMetrics();
    
    if (!currentMetrics) return recommendations;

    // Memory recommendations
    if (currentMetrics.resourceUtilization.memoryUtilization > 80) {
      recommendations.push('Consider reducing concurrent scanners to lower memory usage');
      recommendations.push('Enable garbage collection optimization for large projects');
    }

    // CPU recommendations
    if (currentMetrics.resourceUtilization.cpuUtilization > 85) {
      recommendations.push('Reduce parallel execution or lower maxConcurrentScanners');
      recommendations.push('Consider running assessment during off-peak hours');
    }

    // Throughput recommendations
    if (currentMetrics.throughput.filesPerSecond < this.thresholds.minThroughput) {
      recommendations.push('Optimize file filtering to exclude unnecessary files');
      recommendations.push('Consider increasing scanner timeouts for complex files');
    }

    // General recommendations
    if (this.alerts.length > 5) {
      recommendations.push('Review and adjust performance thresholds');
      recommendations.push('Consider breaking large assessments into smaller chunks');
    }

    return recommendations;
  }

  /**
   * Collect current performance metrics
   */
  private collectMetrics(): void {
    const timestamp = new Date();
    const memoryUsage = this.getMemoryUsage();
    const cpuUsage = this.getCpuUsage();
    const executionTime = this.startTime ? timestamp.getTime() - this.startTime.getTime() : 0;
    const throughput = this.calculateThroughput(executionTime);
    const resourceUtilization = this.calculateResourceUtilization(memoryUsage, cpuUsage);

    const metrics: PerformanceMetrics = {
      timestamp,
      memoryUsage,
      cpuUsage,
      executionTime,
      throughput,
      resourceUtilization
    };

    this.metrics.push(metrics);

    // Check for alerts
    this.checkForAlerts(metrics);

    // Limit metrics history to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics.splice(0, this.metrics.length - 1000);
    }
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): MemoryUsage {
    const usage = process.memoryUsage();
    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss,
      arrayBuffers: usage.arrayBuffers || 0
    };
  }

  /**
   * Get current CPU usage
   */
  private getCpuUsage(): CpuUsage {
    const usage = process.cpuUsage();
    const totalUsage = usage.user + usage.system;
    
    // Simple percentage calculation (not precise, but useful for monitoring)
    const percentage = Math.min(100, (totalUsage / 1000000) * 10); // Rough estimation
    
    return {
      user: usage.user,
      system: usage.system,
      percentage
    };
  }

  /**
   * Calculate throughput metrics
   */
  private calculateThroughput(executionTimeMs: number): ThroughputMetrics {
    const executionTimeSeconds = executionTimeMs / 1000;
    
    if (executionTimeSeconds === 0) {
      return {
        filesPerSecond: 0,
        vulnerabilitiesPerSecond: 0,
        scannersPerSecond: 0,
        bytesProcessedPerSecond: 0
      };
    }

    return {
      filesPerSecond: this.filesProcessed / executionTimeSeconds,
      vulnerabilitiesPerSecond: this.vulnerabilitiesFound / executionTimeSeconds,
      scannersPerSecond: this.scannersCompleted / executionTimeSeconds,
      bytesProcessedPerSecond: this.bytesProcessed / executionTimeSeconds
    };
  }

  /**
   * Calculate resource utilization percentages
   */
  private calculateResourceUtilization(memoryUsage: MemoryUsage, cpuUsage: CpuUsage): ResourceUtilization {
    const memoryUtilization = (memoryUsage.heapUsed / this.thresholds.maxMemoryUsage) * 100;
    const cpuUtilization = cpuUsage.percentage;
    
    // Simplified disk and network utilization (would need OS-specific implementation for accuracy)
    const diskUtilization = Math.min(100, (this.bytesProcessed / (100 * 1024 * 1024)) * 100); // Rough estimate
    const networkUtilization = 0; // Not applicable for local scanning

    return {
      memoryUtilization: Math.min(100, memoryUtilization),
      cpuUtilization: Math.min(100, cpuUtilization),
      diskUtilization: Math.min(100, diskUtilization),
      networkUtilization
    };
  }

  /**
   * Check for performance alerts
   */
  private checkForAlerts(metrics: PerformanceMetrics): void {
    // Memory alerts
    if (metrics.resourceUtilization.memoryUtilization > this.thresholds.alertThreshold) {
      this.addAlert({
        type: 'memory',
        severity: metrics.resourceUtilization.memoryUtilization > 95 ? 'critical' : 'high',
        message: `High memory usage: ${metrics.resourceUtilization.memoryUtilization.toFixed(1)}%`,
        threshold: this.thresholds.alertThreshold,
        currentValue: metrics.resourceUtilization.memoryUtilization,
        timestamp: metrics.timestamp,
        recommendation: 'Consider reducing concurrent scanners or increasing memory limits'
      });
    }

    // CPU alerts
    if (metrics.resourceUtilization.cpuUtilization > this.thresholds.alertThreshold) {
      this.addAlert({
        type: 'cpu',
        severity: metrics.resourceUtilization.cpuUtilization > 95 ? 'critical' : 'high',
        message: `High CPU usage: ${metrics.resourceUtilization.cpuUtilization.toFixed(1)}%`,
        threshold: this.thresholds.alertThreshold,
        currentValue: metrics.resourceUtilization.cpuUtilization,
        timestamp: metrics.timestamp,
        recommendation: 'Consider reducing parallel execution or scanner complexity'
      });
    }

    // Execution time alerts
    if (metrics.executionTime > this.thresholds.maxExecutionTime * 0.8) {
      this.addAlert({
        type: 'timeout',
        severity: metrics.executionTime > this.thresholds.maxExecutionTime * 0.95 ? 'critical' : 'medium',
        message: `Long execution time: ${Math.round(metrics.executionTime / 1000)}s`,
        threshold: this.thresholds.maxExecutionTime,
        currentValue: metrics.executionTime,
        timestamp: metrics.timestamp,
        recommendation: 'Consider breaking assessment into smaller chunks or increasing timeout limits'
      });
    }

    // Throughput alerts
    if (metrics.throughput.filesPerSecond < this.thresholds.minThroughput) {
      this.addAlert({
        type: 'throughput',
        severity: 'medium',
        message: `Low throughput: ${metrics.throughput.filesPerSecond.toFixed(2)} files/sec`,
        threshold: this.thresholds.minThroughput,
        currentValue: metrics.throughput.filesPerSecond,
        timestamp: metrics.timestamp,
        recommendation: 'Optimize file filtering or increase scanner performance'
      });
    }
  }

  /**
   * Add performance alert
   */
  private addAlert(alert: PerformanceAlert): void {
    // Avoid duplicate alerts within short time window
    const recentAlert = this.alerts.find(a => 
      a.type === alert.type && 
      alert.timestamp.getTime() - a.timestamp.getTime() < 30000 // 30 seconds
    );

    if (!recentAlert) {
      this.alerts.push(alert);
      
      // Limit alerts history
      if (this.alerts.length > 100) {
        this.alerts.splice(0, this.alerts.length - 100);
      }
    }
  }

  /**
   * Generate comprehensive performance report
   */
  private generateReport(): PerformanceReport {
    const duration = this.endTime && this.startTime 
      ? this.endTime.getTime() - this.startTime.getTime()
      : 0;

    const averageMetrics = this.calculateAverageMetrics();
    const peakMetrics = this.calculatePeakMetrics();
    const efficiency = this.calculateEfficiency();
    const recommendations = this.getOptimizationRecommendations();

    return {
      startTime: this.startTime || new Date(),
      endTime: this.endTime || new Date(),
      duration,
      averageMetrics,
      peakMetrics,
      alerts: [...this.alerts],
      recommendations,
      efficiency
    };
  }

  /**
   * Calculate average metrics across all measurements
   */
  private calculateAverageMetrics(): PerformanceMetrics {
    if (this.metrics.length === 0) {
      return this.createEmptyMetrics();
    }

    const sums = this.metrics.reduce((acc, metric) => ({
      heapUsed: acc.heapUsed + metric.memoryUsage.heapUsed,
      cpuPercentage: acc.cpuPercentage + metric.cpuUsage.percentage,
      filesPerSecond: acc.filesPerSecond + metric.throughput.filesPerSecond,
      memoryUtilization: acc.memoryUtilization + metric.resourceUtilization.memoryUtilization
    }), { heapUsed: 0, cpuPercentage: 0, filesPerSecond: 0, memoryUtilization: 0 });

    const count = this.metrics.length;
    const lastMetric = this.metrics[this.metrics.length - 1];

    return {
      ...lastMetric,
      memoryUsage: {
        ...lastMetric.memoryUsage,
        heapUsed: sums.heapUsed / count
      },
      cpuUsage: {
        ...lastMetric.cpuUsage,
        percentage: sums.cpuPercentage / count
      },
      throughput: {
        ...lastMetric.throughput,
        filesPerSecond: sums.filesPerSecond / count
      },
      resourceUtilization: {
        ...lastMetric.resourceUtilization,
        memoryUtilization: sums.memoryUtilization / count
      }
    };
  }

  /**
   * Calculate peak metrics across all measurements
   */
  private calculatePeakMetrics(): PerformanceMetrics {
    if (this.metrics.length === 0) {
      return this.createEmptyMetrics();
    }

    return this.metrics.reduce((peak, current) => ({
      ...current,
      memoryUsage: {
        ...current.memoryUsage,
        heapUsed: Math.max(peak.memoryUsage.heapUsed, current.memoryUsage.heapUsed)
      },
      cpuUsage: {
        ...current.cpuUsage,
        percentage: Math.max(peak.cpuUsage.percentage, current.cpuUsage.percentage)
      },
      throughput: {
        ...current.throughput,
        filesPerSecond: Math.max(peak.throughput.filesPerSecond, current.throughput.filesPerSecond)
      },
      resourceUtilization: {
        ...current.resourceUtilization,
        memoryUtilization: Math.max(peak.resourceUtilization.memoryUtilization, current.resourceUtilization.memoryUtilization)
      }
    }));
  }

  /**
   * Calculate efficiency metrics
   */
  private calculateEfficiency(): EfficiencyMetrics {
    const averageMetrics = this.calculateAverageMetrics();
    
    // Efficiency is inverse of utilization (lower utilization = higher efficiency)
    const memoryEfficiency = Math.max(0, 100 - averageMetrics.resourceUtilization.memoryUtilization);
    const cpuEfficiency = Math.max(0, 100 - averageMetrics.resourceUtilization.cpuUtilization);
    
    // Time efficiency based on throughput vs expected throughput
    const timeEfficiency = Math.min(100, (averageMetrics.throughput.filesPerSecond / this.thresholds.minThroughput) * 100);
    
    const overallEfficiency = (memoryEfficiency + cpuEfficiency + timeEfficiency) / 3;

    return {
      memoryEfficiency,
      cpuEfficiency,
      timeEfficiency,
      overallEfficiency
    };
  }

  /**
   * Create empty metrics for initialization
   */
  private createEmptyMetrics(): PerformanceMetrics {
    return {
      timestamp: new Date(),
      memoryUsage: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        rss: 0,
        arrayBuffers: 0
      },
      cpuUsage: {
        user: 0,
        system: 0,
        percentage: 0
      },
      executionTime: 0,
      throughput: {
        filesPerSecond: 0,
        vulnerabilitiesPerSecond: 0,
        scannersPerSecond: 0,
        bytesProcessedPerSecond: 0
      },
      resourceUtilization: {
        memoryUtilization: 0,
        cpuUtilization: 0,
        diskUtilization: 0,
        networkUtilization: 0
      }
    };
  }
}

interface PerformanceThresholds {
  readonly maxMemoryUsage: number; // bytes
  readonly maxCpuUsage: number; // percentage
  readonly maxExecutionTime: number; // milliseconds
  readonly minThroughput: number; // files per second
  readonly alertThreshold: number; // percentage of limit
}

export default PerformanceMonitor;