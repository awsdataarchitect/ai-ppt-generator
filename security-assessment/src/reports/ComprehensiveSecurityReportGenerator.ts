/**
 * Comprehensive Security Report Generator
 * 
 * Main orchestrator for generating complete security assessment reports
 * Combines findings from all scanners and generates unified markdown reports
 * with vulnerability categorization, remediation plans, and compliance mapping
 */

import { ScanResult } from '../interfaces/ScannerInterface';
import { VulnerabilityFinding, VulnerabilitySeverity, VulnerabilityCategory } from '../types/VulnerabilityTypes';
import { RiskAssessment, RiskLevel, BusinessImpactType } from '../types/RiskAssessmentTypes';
import { ComplianceMapping, ComplianceFramework, ComplianceStatus } from '../types/ComplianceTypes';
import { BackendSecurityReportGenerator } from './BackendSecurityReportGenerator';
import { FrontendSecurityReportGenerator } from './FrontendSecurityReportGenerator';
import { InfrastructureSecurityReportGenerator } from './InfrastructureSecurityReportGenerator';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface ComprehensiveReportOptions {
  readonly includeExecutiveSummary: boolean;
  readonly includeVulnerabilityAnalysis: boolean;
  readonly includeRiskAssessment: boolean;
  readonly includeComplianceMapping: boolean;
  readonly includeRemediationRoadmap: boolean;
  readonly includeSecurityMetrics: boolean;
  readonly includeTechnicalAppendix: boolean;
  readonly outputFormat: 'markdown' | 'html' | 'json' | 'pdf';
  readonly outputPath?: string;
  readonly templatePath?: string;
  readonly customSections?: CustomSection[];
}

export interface CustomSection {
  readonly title: string;
  readonly content: string;
  readonly position: 'before-summary' | 'after-summary' | 'before-findings' | 'after-findings' | 'appendix';
}

export interface SecurityMetrics {
  readonly overallRiskScore: number; // 0-100
  readonly securityPostureGrade: string; // A, B, C, D, F
  readonly vulnerabilityDensity: number; // vulnerabilities per 1000 lines of code
  readonly criticalVulnerabilityRatio: number; // percentage of critical vulnerabilities
  readonly complianceScore: number; // 0-100 percentage
  readonly remediationEffort: string; // estimated total effort
  readonly timeToRemediation: string; // estimated timeline
  readonly businessRiskLevel: RiskLevel;
}

export interface ConsolidatedScanResult {
  readonly projectName: string;
  readonly assessmentDate: Date;
  readonly scanResults: ScanResult[];
  readonly totalVulnerabilities: number;
  readonly totalFiles: number;
  readonly scanDuration: number;
  readonly scannerVersions: Record<string, string>;
  readonly qualityMetrics?: {
    readonly deduplicationRate: number;
    readonly averageConfidence: number;
    readonly coverageMetrics: {
      readonly fileTypesCovered: number;
      readonly scannerTypesCovered: number;
      readonly totalScanners: number;
    };
    readonly qualityScore: number;
  };
}

export class ComprehensiveSecurityReportGenerator {
  private readonly defaultOptions: ComprehensiveReportOptions = {
    includeExecutiveSummary: true,
    includeVulnerabilityAnalysis: true,
    includeRiskAssessment: true,
    includeComplianceMapping: true,
    includeRemediationRoadmap: true,
    includeSecurityMetrics: true,
    includeTechnicalAppendix: true,
    outputFormat: 'markdown'
  };

  private readonly backendReportGenerator: BackendSecurityReportGenerator;
  private readonly frontendReportGenerator: FrontendSecurityReportGenerator;
  private readonly infrastructureReportGenerator: InfrastructureSecurityReportGenerator;

  constructor() {
    this.backendReportGenerator = new BackendSecurityReportGenerator();
    this.frontendReportGenerator = new FrontendSecurityReportGenerator();
    this.infrastructureReportGenerator = new InfrastructureSecurityReportGenerator();
  }

  /**
   * Generate comprehensive security assessment report from multiple scan results
   */
  public async generateComprehensiveReport(
    consolidatedResult: ConsolidatedScanResult,
    options: Partial<ComprehensiveReportOptions> = {}
  ): Promise<string> {
    const reportOptions = { ...this.defaultOptions, ...options };
    
    // Consolidate all vulnerabilities from different scanners
    const allVulnerabilities = this.consolidateVulnerabilities(consolidatedResult.scanResults);
    const allRiskAssessments = this.consolidateRiskAssessments(consolidatedResult.scanResults);
    const allComplianceMappings = this.consolidateComplianceMappings(consolidatedResult.scanResults);
    
    // Calculate security metrics
    const securityMetrics = this.calculateSecurityMetrics(
      allVulnerabilities,
      allRiskAssessments,
      allComplianceMappings,
      consolidatedResult.totalFiles
    );

    let report = '';

    // Report header
    report += this.generateReportHeader(consolidatedResult, securityMetrics);

    // Custom sections - before summary
    if (reportOptions.customSections) {
      report += this.renderCustomSections(reportOptions.customSections, 'before-summary');
    }

    // Executive summary
    if (reportOptions.includeExecutiveSummary) {
      report += this.generateExecutiveSummary(
        consolidatedResult,
        allVulnerabilities,
        securityMetrics
      );
    }

    // Custom sections - after summary
    if (reportOptions.customSections) {
      report += this.renderCustomSections(reportOptions.customSections, 'after-summary');
    }

    // Security metrics dashboard
    if (reportOptions.includeSecurityMetrics) {
      report += this.generateSecurityMetricsDashboard(securityMetrics, allVulnerabilities);
    }

    // Custom sections - before findings
    if (reportOptions.customSections) {
      report += this.renderCustomSections(reportOptions.customSections, 'before-findings');
    }

    // Vulnerability analysis
    if (reportOptions.includeVulnerabilityAnalysis) {
      report += this.generateVulnerabilityAnalysis(allVulnerabilities);
    }

    // Risk assessment
    if (reportOptions.includeRiskAssessment && allRiskAssessments.length > 0) {
      report += this.generateRiskAssessmentSection(allRiskAssessments);
    }

    // Compliance mapping
    if (reportOptions.includeComplianceMapping && allComplianceMappings.length > 0) {
      report += this.generateComplianceMappingSection(allComplianceMappings);
    }

    // Custom sections - after findings
    if (reportOptions.customSections) {
      report += this.renderCustomSections(reportOptions.customSections, 'after-findings');
    }

    // Remediation roadmap
    if (reportOptions.includeRemediationRoadmap) {
      report += this.generateRemediationRoadmap(allVulnerabilities, securityMetrics);
    }

    // Technical appendix
    if (reportOptions.includeTechnicalAppendix) {
      report += this.generateTechnicalAppendix(consolidatedResult, securityMetrics);
    }

    // Custom sections - appendix
    if (reportOptions.customSections) {
      report += this.renderCustomSections(reportOptions.customSections, 'appendix');
    }

    // Save report if output path specified
    if (reportOptions.outputPath) {
      await this.saveReport(report, reportOptions.outputPath, reportOptions.outputFormat);
    }

    return report;
  }

  /**
   * Generate security metrics calculation
   */
  public calculateSecurityMetrics(
    vulnerabilities: VulnerabilityFinding[],
    riskAssessments: RiskAssessment[],
    complianceMappings: ComplianceMapping[],
    totalFiles: number
  ): SecurityMetrics {
    // Calculate overall risk score (0-100)
    const overallRiskScore = this.calculateOverallRiskScore(vulnerabilities, riskAssessments);
    
    // Calculate security posture grade
    const securityPostureGrade = this.calculateSecurityPostureGrade(overallRiskScore);
    
    // Calculate vulnerability density (per 1000 lines - estimated)
    const estimatedLinesOfCode = totalFiles * 150; // Rough estimate
    const vulnerabilityDensity = (vulnerabilities.length / estimatedLinesOfCode) * 1000;
    
    // Calculate critical vulnerability ratio
    const criticalVulns = vulnerabilities.filter(v => v.severity === VulnerabilitySeverity.CRITICAL);
    const criticalVulnerabilityRatio = vulnerabilities.length > 0 
      ? (criticalVulns.length / vulnerabilities.length) * 100 
      : 0;
    
    // Calculate compliance score
    const complianceScore = this.calculateComplianceScore(complianceMappings);
    
    // Estimate remediation effort and timeline
    const { remediationEffort, timeToRemediation } = this.estimateRemediationEffort(vulnerabilities);
    
    // Determine business risk level
    const businessRiskLevel = this.determineBusinessRiskLevel(overallRiskScore, criticalVulns.length);

    return {
      overallRiskScore,
      securityPostureGrade,
      vulnerabilityDensity,
      criticalVulnerabilityRatio,
      complianceScore,
      remediationEffort,
      timeToRemediation,
      businessRiskLevel
    };
  }

  /**
   * Generate vulnerability severity categorization
   */
  public categorizeVulnerabilities(vulnerabilities: VulnerabilityFinding[]): Record<VulnerabilitySeverity, VulnerabilityFinding[]> {
    return vulnerabilities.reduce((categories, vuln) => {
      if (!categories[vuln.severity]) {
        categories[vuln.severity] = [];
      }
      categories[vuln.severity].push(vuln);
      return categories;
    }, {} as Record<VulnerabilitySeverity, VulnerabilityFinding[]>);
  }

  /**
   * Generate business impact analysis
   */
  public generateBusinessImpactAnalysis(
    vulnerabilities: VulnerabilityFinding[],
    riskAssessments: RiskAssessment[]
  ): string {
    const criticalVulns = vulnerabilities.filter(v => v.severity === VulnerabilitySeverity.CRITICAL);
    const highVulns = vulnerabilities.filter(v => v.severity === VulnerabilitySeverity.HIGH);
    
    // Analyze business impact types from risk assessments
    const impactTypes = new Set<BusinessImpactType>();
    let totalFinancialImpact = { min: 0, max: 0 };
    
    riskAssessments.forEach(risk => {
      risk.businessImpact.impactTypes.forEach(type => impactTypes.add(type));
      totalFinancialImpact.min += risk.businessImpact.financialImpact.estimatedCost.minimum;
      totalFinancialImpact.max += risk.businessImpact.financialImpact.estimatedCost.maximum;
    });

    let analysis = `### Business Impact Analysis\n\n`;
    
    if (criticalVulns.length > 0) {
      analysis += `**Critical Risk Alert:** ${criticalVulns.length} critical vulnerabilities pose immediate threat to business operations.\n\n`;
    }
    
    analysis += `**Potential Business Impacts:**\n`;
    Array.from(impactTypes).forEach(impact => {
      analysis += `- ${impact}\n`;
    });
    
    if (totalFinancialImpact.max > 0) {
      analysis += `\n**Estimated Financial Impact:** $${totalFinancialImpact.min.toLocaleString()} - $${totalFinancialImpact.max.toLocaleString()}\n`;
    }
    
    analysis += `\n**Immediate Actions Required:**\n`;
    if (criticalVulns.length > 0) {
      analysis += `- Address ${criticalVulns.length} critical vulnerabilities within 24 hours\n`;
    }
    if (highVulns.length > 0) {
      analysis += `- Remediate ${highVulns.length} high-severity issues within 1 week\n`;
    }
    analysis += `- Implement security monitoring and incident response procedures\n`;
    analysis += `- Conduct security awareness training for development teams\n\n`;

    return analysis;
  }

  private consolidateVulnerabilities(scanResults: ScanResult[]): VulnerabilityFinding[] {
    const allVulnerabilities: VulnerabilityFinding[] = [];
    
    scanResults.forEach(result => {
      allVulnerabilities.push(...result.vulnerabilities);
    });
    
    // Remove duplicates based on file path, line number, and vulnerability type
    const uniqueVulnerabilities = allVulnerabilities.filter((vuln, index, array) => {
      return array.findIndex(v => 
        v.location.filePath === vuln.location.filePath &&
        v.location.lineNumber === vuln.location.lineNumber &&
        v.category === vuln.category
      ) === index;
    });
    
    return uniqueVulnerabilities.sort((a, b) => {
      // Sort by severity (Critical first), then by category
      const severityOrder = {
        [VulnerabilitySeverity.CRITICAL]: 0,
        [VulnerabilitySeverity.HIGH]: 1,
        [VulnerabilitySeverity.MEDIUM]: 2,
        [VulnerabilitySeverity.LOW]: 3,
        [VulnerabilitySeverity.INFO]: 4
      };
      
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      
      return a.category.localeCompare(b.category);
    });
  }

  private consolidateRiskAssessments(scanResults: ScanResult[]): RiskAssessment[] {
    const allRiskAssessments: RiskAssessment[] = [];
    
    scanResults.forEach(result => {
      allRiskAssessments.push(...result.riskAssessments);
    });
    
    return allRiskAssessments;
  }

  private consolidateComplianceMappings(scanResults: ScanResult[]): ComplianceMapping[] {
    const allComplianceMappings: ComplianceMapping[] = [];
    
    scanResults.forEach(result => {
      allComplianceMappings.push(...result.complianceMappings);
    });
    
    return allComplianceMappings;
  }

  private generateReportHeader(
    consolidatedResult: ConsolidatedScanResult,
    securityMetrics: SecurityMetrics
  ): string {
    const date = consolidatedResult.assessmentDate.toLocaleDateString();
    const time = consolidatedResult.assessmentDate.toLocaleTimeString();
    
    return `# Comprehensive Security Assessment Report

**Project:** ${consolidatedResult.projectName}  
**Assessment Date:** ${date} at ${time}  
**Total Files Scanned:** ${consolidatedResult.totalFiles.toLocaleString()}  
**Total Vulnerabilities:** ${consolidatedResult.totalVulnerabilities.toLocaleString()}  
**Scan Duration:** ${Math.round(consolidatedResult.scanDuration / 1000)}s  
**Overall Risk Score:** ${securityMetrics.overallRiskScore.toFixed(1)}/100  
**Security Grade:** ${securityMetrics.securityPostureGrade}  
**Business Risk Level:** ${securityMetrics.businessRiskLevel}

---

`;
  }

  private generateExecutiveSummary(
    consolidatedResult: ConsolidatedScanResult,
    vulnerabilities: VulnerabilityFinding[],
    securityMetrics: SecurityMetrics
  ): string {
    const severityCounts = this.countVulnerabilitiesBySeverity(vulnerabilities);
    const categoryCounts = this.countVulnerabilitiesByCategory(vulnerabilities);
    const topCategories = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category, count]) => `${category} (${count})`);

    return `## Executive Summary

### Security Assessment Overview

This comprehensive security assessment analyzed **${consolidatedResult.totalFiles.toLocaleString()} files** across the ${consolidatedResult.projectName} codebase using multiple specialized security scanners. The assessment identified **${vulnerabilities.length} security vulnerabilities** that require attention to maintain a secure application environment.

### Key Security Findings

| Metric | Value | Status |
|--------|-------|--------|
| **Overall Risk Score** | ${securityMetrics.overallRiskScore.toFixed(1)}/100 | ${this.getRiskStatusIcon(securityMetrics.overallRiskScore)} ${this.getRiskStatus(securityMetrics.overallRiskScore)} |
| **Security Posture Grade** | ${securityMetrics.securityPostureGrade} | ${this.getGradeStatusIcon(securityMetrics.securityPostureGrade)} |
| **Critical Vulnerabilities** | ${severityCounts[VulnerabilitySeverity.CRITICAL] || 0} | ${severityCounts[VulnerabilitySeverity.CRITICAL] > 0 ? '🔴 Immediate Action Required' : '✅ None Found'} |
| **High Priority Issues** | ${severityCounts[VulnerabilitySeverity.HIGH] || 0} | ${severityCounts[VulnerabilitySeverity.HIGH] > 0 ? '🟠 Address Within 1 Week' : '✅ None Found'} |
| **Compliance Score** | ${securityMetrics.complianceScore.toFixed(1)}% | ${securityMetrics.complianceScore >= 80 ? '✅ Good' : securityMetrics.complianceScore >= 60 ? '🟡 Fair' : '🔴 Poor'} |

### Vulnerability Distribution

**By Severity:**
- 🔴 **Critical:** ${severityCounts[VulnerabilitySeverity.CRITICAL] || 0} (${this.getPercentage(severityCounts[VulnerabilitySeverity.CRITICAL] || 0, vulnerabilities.length)}%)
- 🟠 **High:** ${severityCounts[VulnerabilitySeverity.HIGH] || 0} (${this.getPercentage(severityCounts[VulnerabilitySeverity.HIGH] || 0, vulnerabilities.length)}%)
- 🟡 **Medium:** ${severityCounts[VulnerabilitySeverity.MEDIUM] || 0} (${this.getPercentage(severityCounts[VulnerabilitySeverity.MEDIUM] || 0, vulnerabilities.length)}%)
- 🟢 **Low:** ${severityCounts[VulnerabilitySeverity.LOW] || 0} (${this.getPercentage(severityCounts[VulnerabilitySeverity.LOW] || 0, vulnerabilities.length)}%)

**Top Security Concerns:**
${topCategories.map(category => `- ${category}`).join('\n')}

### Business Impact Assessment

${this.generateBusinessImpactSummary(securityMetrics, severityCounts)}

### Recommended Immediate Actions

${this.generateImmediateActionsSummary(vulnerabilities, securityMetrics)}

### Assessment Scope

**Scanners Used:**
${Object.entries(consolidatedResult.scannerVersions).map(([name, version]) => `- ${name} v${version}`).join('\n')}

**Coverage:**
- Frontend Security Analysis (React/Next.js)
- Backend Security Analysis (Python/Lambda)
- Infrastructure Security Analysis (AWS CDK)
- Dependency Vulnerability Scanning
- Data Flow Security Analysis
- Deployment Security Assessment

---

`;
  }

  private generateSecurityMetricsDashboard(
    securityMetrics: SecurityMetrics,
    vulnerabilities: VulnerabilityFinding[]
  ): string {
    const severityCounts = this.countVulnerabilitiesBySeverity(vulnerabilities);
    
    return `## Security Metrics Dashboard

### Overall Security Posture

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY SCORECARD                      │
├─────────────────────────────────────────────────────────────┤
│ Overall Risk Score:     ${securityMetrics.overallRiskScore.toFixed(1).padStart(6)}/100 │ ${this.getScoreBar(securityMetrics.overallRiskScore)} │
│ Security Grade:         ${securityMetrics.securityPostureGrade.padStart(11)} │ ${this.getGradeDescription(securityMetrics.securityPostureGrade)} │
│ Compliance Score:       ${securityMetrics.complianceScore.toFixed(1).padStart(6)}% │ ${this.getScoreBar(securityMetrics.complianceScore)} │
│ Business Risk:          ${securityMetrics.businessRiskLevel.padStart(11)} │ ${this.getRiskLevelDescription(securityMetrics.businessRiskLevel)} │
└─────────────────────────────────────────────────────────────┘
\`\`\`

### Key Performance Indicators

| Metric | Value | Benchmark | Status |
|--------|-------|-----------|--------|
| **Vulnerability Density** | ${securityMetrics.vulnerabilityDensity.toFixed(2)} per 1K LOC | < 5.0 | ${securityMetrics.vulnerabilityDensity < 5 ? '✅ Good' : securityMetrics.vulnerabilityDensity < 10 ? '🟡 Fair' : '🔴 Poor'} |
| **Critical Vulnerability Ratio** | ${securityMetrics.criticalVulnerabilityRatio.toFixed(1)}% | < 5% | ${securityMetrics.criticalVulnerabilityRatio < 5 ? '✅ Good' : securityMetrics.criticalVulnerabilityRatio < 10 ? '🟡 Fair' : '🔴 Poor'} |
| **Estimated Remediation Effort** | ${securityMetrics.remediationEffort} | - | ℹ️ Planning Required |
| **Time to Full Remediation** | ${securityMetrics.timeToRemediation} | - | ⏱️ Schedule Required |

### Vulnerability Trend Analysis

**Severity Distribution:**
\`\`\`
Critical  [${'█'.repeat(Math.min(20, (severityCounts[VulnerabilitySeverity.CRITICAL] || 0)))}${' '.repeat(Math.max(0, 20 - (severityCounts[VulnerabilitySeverity.CRITICAL] || 0)))}] ${severityCounts[VulnerabilitySeverity.CRITICAL] || 0}
High      [${'█'.repeat(Math.min(20, (severityCounts[VulnerabilitySeverity.HIGH] || 0)))}${' '.repeat(Math.max(0, 20 - (severityCounts[VulnerabilitySeverity.HIGH] || 0)))}] ${severityCounts[VulnerabilitySeverity.HIGH] || 0}
Medium    [${'█'.repeat(Math.min(20, (severityCounts[VulnerabilitySeverity.MEDIUM] || 0)))}${' '.repeat(Math.max(0, 20 - (severityCounts[VulnerabilitySeverity.MEDIUM] || 0)))}] ${severityCounts[VulnerabilitySeverity.MEDIUM] || 0}
Low       [${'█'.repeat(Math.min(20, (severityCounts[VulnerabilitySeverity.LOW] || 0)))}${' '.repeat(Math.max(0, 20 - (severityCounts[VulnerabilitySeverity.LOW] || 0)))}] ${severityCounts[VulnerabilitySeverity.LOW] || 0}
\`\`\`

### Security Recommendations Priority Matrix

| Priority | Action Items | Timeline | Impact |
|----------|-------------|----------|---------|
| 🔴 **Critical** | Address ${severityCounts[VulnerabilitySeverity.CRITICAL] || 0} critical vulnerabilities | 24-48 hours | High business risk mitigation |
| 🟠 **High** | Remediate ${severityCounts[VulnerabilitySeverity.HIGH] || 0} high-severity issues | 1-2 weeks | Significant risk reduction |
| 🟡 **Medium** | Fix ${severityCounts[VulnerabilitySeverity.MEDIUM] || 0} medium-priority items | 2-4 weeks | Improved security posture |
| 🟢 **Low** | Address ${severityCounts[VulnerabilitySeverity.LOW] || 0} low-priority observations | 1-3 months | Enhanced security hygiene |

---

`;
  }

  private generateVulnerabilityAnalysis(vulnerabilities: VulnerabilityFinding[]): string {
    const categorizedVulns = this.categorizeVulnerabilities(vulnerabilities);
    const categoryGroups = this.groupVulnerabilitiesByCategory(vulnerabilities);
    
    let analysis = `## Detailed Vulnerability Analysis

### Vulnerability Categories Overview

`;

    // Generate category summary table
    analysis += `| Category | Count | Highest Severity | Risk Level |\n`;
    analysis += `|----------|-------|------------------|------------|\n`;
    
    Object.entries(categoryGroups).forEach(([category, vulns]) => {
      const highestSeverity = this.getHighestSeverity(vulns);
      const riskLevel = this.getCategoryRiskLevel(vulns);
      const icon = this.getCategoryIcon(category as VulnerabilityCategory);
      
      analysis += `| ${icon} ${category} | ${vulns.length} | ${highestSeverity} | ${riskLevel} |\n`;
    });

    analysis += '\n';

    // Detailed analysis by severity
    Object.entries(categorizedVulns).forEach(([severity, vulns]) => {
      if (vulns.length === 0) return;
      
      const severityIcon = this.getSeverityIcon(severity as VulnerabilitySeverity);
      analysis += `### ${severityIcon} ${severity} Severity Vulnerabilities (${vulns.length})\n\n`;
      
      // Group by category within severity
      const categoryGroups = this.groupVulnerabilitiesByCategory(vulns);
      
      Object.entries(categoryGroups).forEach(([category, categoryVulns]) => {
        analysis += `#### ${category} (${categoryVulns.length} issues)\n\n`;
        
        // Show top 3 vulnerabilities in each category
        const topVulns = categoryVulns.slice(0, 3);
        
        topVulns.forEach((vuln, index) => {
          analysis += `**${index + 1}. ${vuln.title}**\n`;
          analysis += `- **File:** \`${path.basename(vuln.location.filePath)}\`\n`;
          analysis += `- **Line:** ${vuln.location.lineNumber || 'N/A'}\n`;
          analysis += `- **Impact:** ${vuln.impact}\n`;
          analysis += `- **CWE:** ${vuln.cweId || 'N/A'}\n`;
          
          if (vuln.location.codeSnippet) {
            analysis += `- **Code:** \`${vuln.location.codeSnippet.substring(0, 100)}${vuln.location.codeSnippet.length > 100 ? '...' : ''}\`\n`;
          }
          
          analysis += '\n';
        });
        
        if (categoryVulns.length > 3) {
          analysis += `*... and ${categoryVulns.length - 3} more ${category} issues*\n\n`;
        }
      });
    });

    return analysis + '---\n\n';
  }

  private generateRiskAssessmentSection(riskAssessments: RiskAssessment[]): string {
    let section = `## Risk Assessment Analysis

### Risk Distribution Overview

`;

    // Group risk assessments by risk level
    const riskGroups = riskAssessments.reduce((groups, risk) => {
      const level = risk.riskScore.riskLevel;
      if (!groups[level]) groups[level] = [];
      groups[level].push(risk);
      return groups;
    }, {} as Record<RiskLevel, RiskAssessment[]>);

    // Risk summary table
    section += `| Risk Level | Count | Avg Score | Business Impact |\n`;
    section += `|------------|-------|-----------|----------------|\n`;
    
    Object.entries(riskGroups).forEach(([level, risks]) => {
      const avgScore = risks.reduce((sum, r) => sum + r.riskScore.overallRisk, 0) / risks.length;
      const impactTypes = new Set<BusinessImpactType>();
      risks.forEach(r => r.businessImpact.impactTypes.forEach(t => impactTypes.add(t)));
      
      section += `| ${this.getRiskIcon(level as RiskLevel)} ${level} | ${risks.length} | ${avgScore.toFixed(1)}/25 | ${Array.from(impactTypes).slice(0, 2).join(', ')} |\n`;
    });

    section += '\n';

    // Detailed risk analysis for high-risk items
    const highRiskAssessments = riskAssessments.filter(r => 
      r.riskScore.riskLevel === RiskLevel.CRITICAL || r.riskScore.riskLevel === RiskLevel.HIGH
    );

    if (highRiskAssessments.length > 0) {
      section += `### High-Risk Items Requiring Immediate Attention\n\n`;
      
      highRiskAssessments.slice(0, 5).forEach((risk, index) => {
        section += `#### ${index + 1}. Risk Assessment for ${risk.vulnerabilityId}\n\n`;
        section += `**Risk Level:** ${this.getRiskIcon(risk.riskScore.riskLevel)} ${risk.riskScore.riskLevel} (Score: ${risk.riskScore.overallRisk}/25)\n`;
        section += `**Likelihood:** ${risk.riskScore.likelihood}/5 | **Impact:** ${risk.riskScore.impact}/5\n\n`;
        
        section += `**Business Impact Types:**\n`;
        risk.businessImpact.impactTypes.forEach(type => {
          section += `- ${type}\n`;
        });
        
        section += `\n**Financial Impact:** $${risk.businessImpact.financialImpact.estimatedCost.minimum.toLocaleString()} - $${risk.businessImpact.financialImpact.estimatedCost.maximum.toLocaleString()}\n`;
        section += `**Recovery Time:** ${risk.businessImpact.financialImpact.recoveryTime}\n\n`;
        
        section += `**Mitigation Strategies:**\n`;
        risk.mitigationStrategies.slice(0, 3).forEach(strategy => {
          section += `- ${strategy}\n`;
        });
        
        section += '\n---\n\n';
      });
    }

    return section;
  }

  private generateComplianceMappingSection(complianceMappings: ComplianceMapping[]): string {
    let section = `## Compliance Framework Assessment

### Compliance Status Overview

`;

    // Group by framework
    const frameworkGroups = complianceMappings.reduce((groups, mapping) => {
      mapping.mappedControls.forEach(controlMapping => {
        const framework = controlMapping.control.framework;
        if (!groups[framework]) groups[framework] = [];
        groups[framework].push({
          vulnerabilityId: mapping.vulnerabilityId,
          controlId: controlMapping.control.controlNumber,
          controlTitle: controlMapping.control.title,
          status: controlMapping.status,
          gaps: controlMapping.gaps
        });
      });
      return groups;
    }, {} as Record<ComplianceFramework, any[]>);

    // Framework compliance summary
    Object.entries(frameworkGroups).forEach(([framework, controls]) => {
      const compliantCount = controls.filter(c => c.status === ComplianceStatus.COMPLIANT).length;
      const complianceRate = (compliantCount / controls.length) * 100;
      
      section += `### ${framework}\n\n`;
      section += `**Compliance Rate:** ${complianceRate.toFixed(1)}% (${compliantCount}/${controls.length} controls)\n`;
      section += `**Status:** ${complianceRate >= 80 ? '✅ Good' : complianceRate >= 60 ? '🟡 Needs Improvement' : '🔴 Non-Compliant'}\n\n`;
      
      // Show non-compliant controls
      const nonCompliant = controls.filter(c => c.status === ComplianceStatus.NON_COMPLIANT);
      if (nonCompliant.length > 0) {
        section += `**Non-Compliant Controls (${nonCompliant.length}):**\n\n`;
        section += `| Control ID | Control Title | Vulnerability | Gap Description |\n`;
        section += `|------------|---------------|---------------|----------------|\n`;
        
        nonCompliant.slice(0, 10).forEach(control => {
          const gapDescription = control.gaps.slice(0, 2).join(', ');
          section += `| ${control.controlId} | ${control.controlTitle} | ${control.vulnerabilityId} | ${gapDescription} |\n`;
        });
        
        if (nonCompliant.length > 10) {
          section += `\n*... and ${nonCompliant.length - 10} more non-compliant controls*\n`;
        }
        
        section += '\n';
      }
    });

    return section + '---\n\n';
  }

  private generateRemediationRoadmap(
    vulnerabilities: VulnerabilityFinding[],
    securityMetrics: SecurityMetrics
  ): string {
    let roadmap = `## Remediation Roadmap

### Strategic Remediation Plan

**Estimated Total Effort:** ${securityMetrics.remediationEffort}  
**Projected Timeline:** ${securityMetrics.timeToRemediation}  
**Business Risk Reduction:** ${securityMetrics.businessRiskLevel} → Low Risk

### Phase-Based Implementation Strategy

`;

    // Phase 1: Critical and High (Immediate)
    const criticalHighVulns = vulnerabilities.filter(v => 
      v.severity === VulnerabilitySeverity.CRITICAL || v.severity === VulnerabilitySeverity.HIGH
    );
    
    if (criticalHighVulns.length > 0) {
      roadmap += `#### 🔴 Phase 1: Critical Risk Mitigation (0-2 weeks)\n\n`;
      roadmap += `**Objective:** Eliminate critical business risks and high-severity vulnerabilities\n`;
      roadmap += `**Priority:** Immediate action required\n`;
      roadmap += `**Effort:** ${this.estimatePhaseEffort(criticalHighVulns)}\n\n`;
      
      roadmap += `**Key Actions:**\n`;
      const criticalActions = this.generatePhaseActions(criticalHighVulns);
      criticalActions.slice(0, 5).forEach(action => {
        roadmap += `- ${action}\n`;
      });
      
      roadmap += `\n**Success Criteria:**\n`;
      roadmap += `- Zero critical vulnerabilities remaining\n`;
      roadmap += `- High-severity issues reduced by 80%\n`;
      roadmap += `- Security monitoring implemented\n\n`;
    }

    // Phase 2: Medium (Short-term)
    const mediumVulns = vulnerabilities.filter(v => v.severity === VulnerabilitySeverity.MEDIUM);
    
    if (mediumVulns.length > 0) {
      roadmap += `#### 🟡 Phase 2: Security Hardening (2-6 weeks)\n\n`;
      roadmap += `**Objective:** Address medium-priority vulnerabilities and improve security posture\n`;
      roadmap += `**Priority:** Scheduled remediation\n`;
      roadmap += `**Effort:** ${this.estimatePhaseEffort(mediumVulns)}\n\n`;
      
      roadmap += `**Key Actions:**\n`;
      const mediumActions = this.generatePhaseActions(mediumVulns);
      mediumActions.slice(0, 5).forEach(action => {
        roadmap += `- ${action}\n`;
      });
      
      roadmap += `\n**Success Criteria:**\n`;
      roadmap += `- Medium-severity issues reduced by 90%\n`;
      roadmap += `- Security controls implemented\n`;
      roadmap += `- Code review process established\n\n`;
    }

    // Phase 3: Low and Process Improvements (Long-term)
    const lowVulns = vulnerabilities.filter(v => v.severity === VulnerabilitySeverity.LOW);
    
    roadmap += `#### 🟢 Phase 3: Security Excellence (6-12 weeks)\n\n`;
    roadmap += `**Objective:** Achieve security excellence and establish ongoing security practices\n`;
    roadmap += `**Priority:** Continuous improvement\n`;
    roadmap += `**Effort:** ${this.estimatePhaseEffort(lowVulns)}\n\n`;
    
    roadmap += `**Key Actions:**\n`;
    roadmap += `- Address remaining ${lowVulns.length} low-priority vulnerabilities\n`;
    roadmap += `- Implement automated security testing in CI/CD pipeline\n`;
    roadmap += `- Establish security training program\n`;
    roadmap += `- Create security incident response procedures\n`;
    roadmap += `- Implement continuous security monitoring\n\n`;
    
    roadmap += `**Success Criteria:**\n`;
    roadmap += `- Security grade improved to A or B\n`;
    roadmap += `- Compliance score above 90%\n`;
    roadmap += `- Automated security controls in place\n`;
    roadmap += `- Team security awareness established\n\n`;

    // Implementation recommendations
    roadmap += `### Implementation Recommendations\n\n`;
    roadmap += `**Resource Allocation:**\n`;
    roadmap += `- Assign dedicated security champion for each phase\n`;
    roadmap += `- Allocate 20-30% of development capacity for security remediation\n`;
    roadmap += `- Engage security consultant for critical vulnerability assessment\n\n`;
    
    roadmap += `**Risk Management:**\n`;
    roadmap += `- Implement temporary mitigations for critical vulnerabilities\n`;
    roadmap += `- Establish security incident response team\n`;
    roadmap += `- Create rollback procedures for security fixes\n\n`;
    
    roadmap += `**Progress Tracking:**\n`;
    roadmap += `- Weekly security remediation status meetings\n`;
    roadmap += `- Automated vulnerability scanning reports\n`;
    roadmap += `- Security metrics dashboard updates\n\n`;

    return roadmap + '---\n\n';
  }

  private generateTechnicalAppendix(
    consolidatedResult: ConsolidatedScanResult,
    securityMetrics: SecurityMetrics
  ): string {
    let appendix = `## Technical Appendix

### Assessment Methodology

This comprehensive security assessment employed multiple specialized scanners to analyze different aspects of the application security:

**Scanner Coverage:**
${Object.entries(consolidatedResult.scannerVersions).map(([name, version]) => `- **${name} v${version}:** ${this.getScannerDescription(name)}`).join('\n')}

**Analysis Scope:**
- **Static Code Analysis:** Automated pattern matching for known vulnerability types
- **Configuration Review:** Infrastructure and deployment configuration assessment
- **Dependency Analysis:** Third-party library vulnerability identification
- **Compliance Mapping:** Alignment with industry security standards

### Technical Metrics

**Performance Statistics:**
- **Total Scan Duration:** ${Math.round(consolidatedResult.scanDuration / 1000)} seconds
- **Files Processed:** ${consolidatedResult.totalFiles.toLocaleString()}
- **Average Processing Rate:** ${Math.round(consolidatedResult.totalFiles / (consolidatedResult.scanDuration / 1000))} files/second
- **Memory Efficiency:** Optimized for large codebase analysis

**Quality Assurance:**
- **False Positive Filtering:** Advanced pattern matching to reduce noise
- **Confidence Scoring:** Each finding includes confidence assessment
- **Cross-Scanner Validation:** Duplicate detection across multiple scanners

### Vulnerability Classification System

**Severity Levels:**
- **Critical (9.0-10.0 CVSS):** Immediate threat to business operations
- **High (7.0-8.9 CVSS):** Significant security risk requiring prompt attention
- **Medium (4.0-6.9 CVSS):** Moderate risk that should be addressed
- **Low (0.1-3.9 CVSS):** Minor security improvements

**Category Mapping:**
- **OWASP Top 10 2021:** Industry-standard web application security risks
- **CWE (Common Weakness Enumeration):** Detailed vulnerability classification
- **NIST Cybersecurity Framework:** Strategic security control alignment

### Compliance Framework Details

**OWASP Top 10 2021 Coverage:**
- A01: Broken Access Control
- A02: Cryptographic Failures
- A03: Injection
- A04: Insecure Design
- A05: Security Misconfiguration
- A06: Vulnerable and Outdated Components
- A07: Identification and Authentication Failures
- A08: Software and Data Integrity Failures
- A09: Security Logging and Monitoring Failures
- A10: Server-Side Request Forgery (SSRF)

**Additional Standards:**
- **NIST CSF:** Identify, Protect, Detect, Respond, Recover
- **AWS Well-Architected:** Security pillar best practices
- **SOC2 Type II:** Trust services criteria
- **ISO 27001:** Information security management

### Limitations and Considerations

**Static Analysis Limitations:**
- Cannot detect runtime-specific vulnerabilities
- May produce false positives requiring manual verification
- Business logic flaws require manual code review
- Dynamic behavior analysis not included

**Recommendations for Enhanced Security:**
- Implement dynamic application security testing (DAST)
- Conduct manual penetration testing
- Perform regular security code reviews
- Establish continuous security monitoring

### References and Resources

**Security Standards:**
- [OWASP Top 10 2021](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [AWS Security Best Practices](https://docs.aws.amazon.com/security/)
- [CWE Common Weakness Enumeration](https://cwe.mitre.org/)

**Tools and Methodologies:**
- [CVSS Calculator](https://www.first.org/cvss/calculator/3.1)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [AWS CDK Security Best Practices](https://docs.aws.amazon.com/cdk/latest/guide/best-practices.html)

---

*This report was generated using automated security assessment tools and should be reviewed by qualified security professionals. The findings represent potential security issues that require manual verification and assessment in the context of your specific environment and requirements.*

**Report Generation Details:**
- **Generated:** ${new Date().toISOString()}
- **Report Version:** 1.0.0
- **Assessment ID:** ${this.generateAssessmentId()}
`;

    return appendix;
  }

  // Helper methods for calculations and formatting
  private calculateOverallRiskScore(
    vulnerabilities: VulnerabilityFinding[],
    riskAssessments: RiskAssessment[]
  ): number {
    if (vulnerabilities.length === 0) return 0;
    
    const severityWeights = {
      [VulnerabilitySeverity.CRITICAL]: 25,
      [VulnerabilitySeverity.HIGH]: 15,
      [VulnerabilitySeverity.MEDIUM]: 8,
      [VulnerabilitySeverity.LOW]: 3,
      [VulnerabilitySeverity.INFO]: 1
    };
    
    const totalScore = vulnerabilities.reduce((sum, vuln) => {
      return sum + severityWeights[vuln.severity];
    }, 0);
    
    // Normalize to 0-100 scale
    const maxPossibleScore = vulnerabilities.length * severityWeights[VulnerabilitySeverity.CRITICAL];
    return Math.min(100, (totalScore / maxPossibleScore) * 100);
  }

  private calculateSecurityPostureGrade(riskScore: number): string {
    if (riskScore <= 20) return 'A';
    if (riskScore <= 40) return 'B';
    if (riskScore <= 60) return 'C';
    if (riskScore <= 80) return 'D';
    return 'F';
  }

  private calculateComplianceScore(complianceMappings: ComplianceMapping[]): number {
    if (complianceMappings.length === 0) return 0;
    
    const compliantMappings = complianceMappings.filter(m => 
      m.overallStatus === ComplianceStatus.COMPLIANT || 
      m.overallStatus === ComplianceStatus.PARTIALLY_COMPLIANT
    );
    
    return (compliantMappings.length / complianceMappings.length) * 100;
  }

  private estimateRemediationEffort(vulnerabilities: VulnerabilityFinding[]): { remediationEffort: string; timeToRemediation: string } {
    const effortHours = vulnerabilities.reduce((total, vuln) => {
      const severityEffort = {
        [VulnerabilitySeverity.CRITICAL]: 8,
        [VulnerabilitySeverity.HIGH]: 4,
        [VulnerabilitySeverity.MEDIUM]: 2,
        [VulnerabilitySeverity.LOW]: 1,
        [VulnerabilitySeverity.INFO]: 0.5
      };
      return total + severityEffort[vuln.severity];
    }, 0);
    
    const days = Math.ceil(effortHours / 8);
    const weeks = Math.ceil(days / 5);
    
    return {
      remediationEffort: `${Math.round(effortHours)} hours (${days} person-days)`,
      timeToRemediation: weeks <= 4 ? `${weeks} weeks` : `${Math.ceil(weeks / 4)} months`
    };
  }

  private determineBusinessRiskLevel(riskScore: number, criticalCount: number): RiskLevel {
    if (criticalCount > 0 || riskScore >= 80) return RiskLevel.CRITICAL;
    if (riskScore >= 60) return RiskLevel.HIGH;
    if (riskScore >= 40) return RiskLevel.MEDIUM;
    if (riskScore >= 20) return RiskLevel.LOW;
    return RiskLevel.NEGLIGIBLE;
  }

  // Additional helper methods for formatting and data processing
  private countVulnerabilitiesBySeverity(vulnerabilities: VulnerabilityFinding[]): Record<VulnerabilitySeverity, number> {
    return vulnerabilities.reduce((counts, vuln) => {
      counts[vuln.severity] = (counts[vuln.severity] || 0) + 1;
      return counts;
    }, {} as Record<VulnerabilitySeverity, number>);
  }

  private countVulnerabilitiesByCategory(vulnerabilities: VulnerabilityFinding[]): Record<string, number> {
    return vulnerabilities.reduce((counts, vuln) => {
      counts[vuln.category] = (counts[vuln.category] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  }

  private groupVulnerabilitiesByCategory(vulnerabilities: VulnerabilityFinding[]): Record<string, VulnerabilityFinding[]> {
    return vulnerabilities.reduce((groups, vuln) => {
      if (!groups[vuln.category]) groups[vuln.category] = [];
      groups[vuln.category].push(vuln);
      return groups;
    }, {} as Record<string, VulnerabilityFinding[]>);
  }

  private getHighestSeverity(vulnerabilities: VulnerabilityFinding[]): VulnerabilitySeverity {
    const severityOrder = [
      VulnerabilitySeverity.CRITICAL,
      VulnerabilitySeverity.HIGH,
      VulnerabilitySeverity.MEDIUM,
      VulnerabilitySeverity.LOW,
      VulnerabilitySeverity.INFO
    ];
    
    for (const severity of severityOrder) {
      if (vulnerabilities.some(v => v.severity === severity)) {
        return severity;
      }
    }
    
    return VulnerabilitySeverity.INFO;
  }

  private getCategoryRiskLevel(vulnerabilities: VulnerabilityFinding[]): string {
    const highestSeverity = this.getHighestSeverity(vulnerabilities);
    const count = vulnerabilities.length;
    
    if (highestSeverity === VulnerabilitySeverity.CRITICAL || count > 10) return 'High Risk';
    if (highestSeverity === VulnerabilitySeverity.HIGH || count > 5) return 'Medium Risk';
    return 'Low Risk';
  }

  private generatePhaseActions(vulnerabilities: VulnerabilityFinding[]): string[] {
    const actions = new Set<string>();
    
    vulnerabilities.forEach(vuln => {
      if (vuln.remediation.summary) {
        actions.add(vuln.remediation.summary);
      }
    });
    
    return Array.from(actions);
  }

  private estimatePhaseEffort(vulnerabilities: VulnerabilityFinding[]): string {
    const { remediationEffort } = this.estimateRemediationEffort(vulnerabilities);
    return remediationEffort;
  }

  private getScannerDescription(scannerName: string): string {
    const descriptions: Record<string, string> = {
      'Frontend Security Scanner': 'React/Next.js client-side vulnerability analysis',
      'Backend Security Scanner': 'Python/Lambda server-side security assessment',
      'Infrastructure Security Scanner': 'AWS CDK configuration security review',
      'Dependency Vulnerability Scanner': 'Third-party library vulnerability identification',
      'Data Flow Security Scanner': 'Privacy and data handling compliance analysis',
      'Deployment Security Scanner': 'CI/CD and deployment configuration assessment'
    };
    
    return descriptions[scannerName] || 'Security vulnerability analysis';
  }

  private generateAssessmentId(): string {
    return `SEC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  // UI/Formatting helper methods
  private getRiskStatusIcon(riskScore: number): string {
    if (riskScore >= 80) return '🔴';
    if (riskScore >= 60) return '🟠';
    if (riskScore >= 40) return '🟡';
    return '🟢';
  }

  private getRiskStatus(riskScore: number): string {
    if (riskScore >= 80) return 'Critical Risk';
    if (riskScore >= 60) return 'High Risk';
    if (riskScore >= 40) return 'Medium Risk';
    if (riskScore >= 20) return 'Low Risk';
    return 'Minimal Risk';
  }

  private getGradeStatusIcon(grade: string): string {
    const icons: Record<string, string> = { 'A': '🟢', 'B': '🟡', 'C': '🟠', 'D': '🔴', 'F': '🔴' };
    return icons[grade] || '⚪';
  }

  private getScoreBar(score: number): string {
    const filled = Math.round(score / 10);
    return '█'.repeat(filled) + '░'.repeat(10 - filled);
  }

  private getGradeDescription(grade: string): string {
    const descriptions: Record<string, string> = {
      'A': 'Excellent Security',
      'B': 'Good Security',
      'C': 'Fair Security',
      'D': 'Poor Security',
      'F': 'Critical Issues'
    };
    return descriptions[grade] || 'Unknown';
  }

  private getRiskLevelDescription(riskLevel: RiskLevel): string {
    const descriptions = {
      [RiskLevel.CRITICAL]: 'Immediate Action Required',
      [RiskLevel.HIGH]: 'Urgent Attention Needed',
      [RiskLevel.MEDIUM]: 'Moderate Risk Level',
      [RiskLevel.LOW]: 'Manageable Risk',
      [RiskLevel.NEGLIGIBLE]: 'Minimal Risk'
    };
    return descriptions[riskLevel] || 'Unknown Risk';
  }

  private getSeverityIcon(severity: VulnerabilitySeverity): string {
    const icons = {
      [VulnerabilitySeverity.CRITICAL]: '🔴',
      [VulnerabilitySeverity.HIGH]: '🟠',
      [VulnerabilitySeverity.MEDIUM]: '🟡',
      [VulnerabilitySeverity.LOW]: '🟢',
      [VulnerabilitySeverity.INFO]: '⚪'
    };
    return icons[severity] || '⚪';
  }

  private getCategoryIcon(category: VulnerabilityCategory): string {
    const icons: Partial<Record<VulnerabilityCategory, string>> = {
      [VulnerabilityCategory.XSS]: '🔗',
      [VulnerabilityCategory.SQL_INJECTION]: '💉',
      [VulnerabilityCategory.COMMAND_INJECTION]: '⚡',
      [VulnerabilityCategory.AUTHENTICATION_BYPASS]: '🔐',
      [VulnerabilityCategory.AUTHORIZATION_FAILURE]: '🚪',
      [VulnerabilityCategory.CRYPTOGRAPHIC_FAILURE]: '🔒',
      [VulnerabilityCategory.INSECURE_CONFIGURATION]: '⚙️',
      [VulnerabilityCategory.HARDCODED_SECRETS]: '🔑',
      [VulnerabilityCategory.VULNERABLE_DEPENDENCY]: '📦',
      [VulnerabilityCategory.LOGGING_FAILURE]: '📝'
    };
    return icons[category] || '⚠️';
  }

  private getRiskIcon(riskLevel: RiskLevel): string {
    const icons = {
      [RiskLevel.CRITICAL]: '🔴',
      [RiskLevel.HIGH]: '🟠',
      [RiskLevel.MEDIUM]: '🟡',
      [RiskLevel.LOW]: '🟢',
      [RiskLevel.NEGLIGIBLE]: '⚪'
    };
    return icons[riskLevel] || '⚪';
  }

  private getPercentage(count: number, total: number): string {
    return total === 0 ? '0.0' : ((count / total) * 100).toFixed(1);
  }

  private generateBusinessImpactSummary(
    securityMetrics: SecurityMetrics,
    severityCounts: Record<VulnerabilitySeverity, number>
  ): string {
    const criticalCount = severityCounts[VulnerabilitySeverity.CRITICAL] || 0;
    const highCount = severityCounts[VulnerabilitySeverity.HIGH] || 0;
    
    if (criticalCount > 0) {
      return `**Critical Business Risk:** ${criticalCount} critical vulnerabilities pose immediate threat to business operations, potentially leading to data breaches, service disruptions, and compliance violations. Immediate remediation is essential.`;
    } else if (highCount > 0) {
      return `**Elevated Business Risk:** ${highCount} high-severity vulnerabilities could impact business operations and customer trust. Prompt remediation recommended within 1 week.`;
    } else if (securityMetrics.overallRiskScore > 40) {
      return `**Moderate Business Risk:** Current security posture requires improvement to maintain customer trust and regulatory compliance. Systematic remediation approach recommended.`;
    } else {
      return `**Manageable Business Risk:** Security posture is generally acceptable with room for improvement. Focus on continuous security enhancement and monitoring.`;
    }
  }

  private generateImmediateActionsSummary(
    vulnerabilities: VulnerabilityFinding[],
    securityMetrics: SecurityMetrics
  ): string {
    const criticalVulns = vulnerabilities.filter(v => v.severity === VulnerabilitySeverity.CRITICAL);
    const highVulns = vulnerabilities.filter(v => v.severity === VulnerabilitySeverity.HIGH);
    
    const actions = [];
    
    if (criticalVulns.length > 0) {
      actions.push(`🔴 **Critical Priority:** Address ${criticalVulns.length} critical vulnerabilities within 24 hours`);
    }
    
    if (highVulns.length > 0) {
      actions.push(`🟠 **High Priority:** Remediate ${highVulns.length} high-severity issues within 1 week`);
    }
    
    actions.push(`📊 **Monitoring:** Implement security monitoring and alerting systems`);
    actions.push(`👥 **Team Training:** Conduct security awareness training for development teams`);
    actions.push(`🔄 **Process:** Establish security code review and testing procedures`);
    
    return actions.join('\n');
  }

  private renderCustomSections(sections: CustomSection[], position: CustomSection['position']): string {
    return sections
      .filter(section => section.position === position)
      .map(section => `## ${section.title}\n\n${section.content}\n\n---\n\n`)
      .join('');
  }

  private async saveReport(
    report: string,
    outputPath: string,
    format: ComprehensiveReportOptions['outputFormat']
  ): Promise<void> {
    await fs.ensureDir(path.dirname(outputPath));
    
    switch (format) {
      case 'markdown':
        await fs.writeFile(outputPath, report, 'utf-8');
        break;
      case 'json':
        // Convert markdown to structured JSON
        const jsonReport = {
          format: 'comprehensive-security-report',
          version: '1.0.0',
          generatedAt: new Date().toISOString(),
          content: report
        };
        await fs.writeFile(outputPath, JSON.stringify(jsonReport, null, 2), 'utf-8');
        break;
      case 'html':
        // Basic HTML wrapper for markdown content
        const htmlReport = `<!DOCTYPE html>
<html>
<head>
    <title>Security Assessment Report</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
<pre>${report.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
</body>
</html>`;
        await fs.writeFile(outputPath, htmlReport, 'utf-8');
        break;
      default:
        throw new Error(`Unsupported output format: ${format}`);
    }
  }
}