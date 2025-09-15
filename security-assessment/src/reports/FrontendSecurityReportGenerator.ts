/**
 * Frontend Security Report Generator
 * Generates detailed markdown reports for frontend security vulnerabilities
 */

import { VulnerabilityFinding, VulnerabilitySeverity, VulnerabilityCategory } from '../types/VulnerabilityTypes';
import { RiskAssessment } from '../types/RiskAssessmentTypes';
import { ComplianceMapping } from '../types/ComplianceTypes';
import { ScanResult } from '../interfaces/ScannerInterface';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface FrontendReportOptions {
  readonly includeExecutiveSummary: boolean;
  readonly includeDetailedFindings: boolean;
  readonly includeRemediationPlan: boolean;
  readonly includeComplianceMapping: boolean;
  readonly includeRiskAssessment: boolean;
  readonly includeTechnicalAppendix: boolean;
  readonly outputFormat: 'markdown' | 'html' | 'json';
  readonly outputPath?: string;
}

export interface FrontendReportSummary {
  readonly totalVulnerabilities: number;
  readonly criticalCount: number;
  readonly highCount: number;
  readonly mediumCount: number;
  readonly lowCount: number;
  readonly infoCount: number;
  readonly categoryCounts: Record<string, number>;
  readonly riskScore: number;
  readonly complianceStatus: string;
}

export class FrontendSecurityReportGenerator {
  private readonly reportOptions: FrontendReportOptions;

  constructor(options: Partial<FrontendReportOptions> = {}) {
    this.reportOptions = {
      includeExecutiveSummary: true,
      includeDetailedFindings: true,
      includeRemediationPlan: true,
      includeComplianceMapping: true,
      includeRiskAssessment: true,
      includeTechnicalAppendix: true,
      outputFormat: 'markdown',
      ...options
    };
  }

  async generateReport(scanResult: ScanResult): Promise<string> {
    const summary = this.generateSummary(scanResult);
    
    let report = '';
    
    // Report header
    report += this.generateHeader(scanResult, summary);
    
    // Executive summary
    if (this.reportOptions.includeExecutiveSummary) {
      report += this.generateExecutiveSummary(scanResult, summary);
    }
    
    // Detailed findings
    if (this.reportOptions.includeDetailedFindings) {
      report += this.generateDetailedFindings(scanResult);
    }
    
    // Risk assessment
    if (this.reportOptions.includeRiskAssessment) {
      report += this.generateRiskAssessment(scanResult);
    }
    
    // Compliance mapping
    if (this.reportOptions.includeComplianceMapping) {
      report += this.generateComplianceMapping(scanResult);
    }
    
    // Remediation plan
    if (this.reportOptions.includeRemediationPlan) {
      report += this.generateRemediationPlan(scanResult);
    }
    
    // Technical appendix
    if (this.reportOptions.includeTechnicalAppendix) {
      report += this.generateTechnicalAppendix(scanResult);
    }
    
    // Save report if output path is specified
    if (this.reportOptions.outputPath) {
      await this.saveReport(report, this.reportOptions.outputPath);
    }
    
    return report;
  }

  private generateSummary(scanResult: ScanResult): FrontendReportSummary {
    const vulnerabilities = scanResult.vulnerabilities;
    
    const severityCounts = {
      critical: vulnerabilities.filter(v => v.severity === VulnerabilitySeverity.CRITICAL).length,
      high: vulnerabilities.filter(v => v.severity === VulnerabilitySeverity.HIGH).length,
      medium: vulnerabilities.filter(v => v.severity === VulnerabilitySeverity.MEDIUM).length,
      low: vulnerabilities.filter(v => v.severity === VulnerabilitySeverity.LOW).length,
      info: vulnerabilities.filter(v => v.severity === VulnerabilitySeverity.INFO).length
    };
    
    const categoryCounts = vulnerabilities.reduce((counts, vuln) => {
      counts[vuln.category] = (counts[vuln.category] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    const riskScore = this.calculateOverallRiskScore(vulnerabilities);
    const complianceStatus = this.determineComplianceStatus(riskScore, severityCounts);
    
    return {
      totalVulnerabilities: vulnerabilities.length,
      criticalCount: severityCounts.critical,
      highCount: severityCounts.high,
      mediumCount: severityCounts.medium,
      lowCount: severityCounts.low,
      infoCount: severityCounts.info,
      categoryCounts,
      riskScore,
      complianceStatus
    };
  }

  private generateHeader(scanResult: ScanResult, summary: FrontendReportSummary): string {
    return `# Frontend Security Assessment Report

**Project:** AI PPT Generator - Frontend Security Analysis  
**Scanner:** ${scanResult.scannerName} v${scanResult.scannerVersion}  
**Scan Date:** ${scanResult.startTime.toISOString().split('T')[0]}  
**Report Generated:** ${new Date().toISOString().split('T')[0]}  
**Files Scanned:** ${scanResult.filesScanned}  
**Total Vulnerabilities:** ${summary.totalVulnerabilities}  
**Risk Score:** ${summary.riskScore.toFixed(1)}/10  
**Compliance Status:** ${summary.complianceStatus}

---

`;
  }

  private generateExecutiveSummary(scanResult: ScanResult, summary: FrontendReportSummary): string {
    const criticalHighCount = summary.criticalCount + summary.highCount;
    const riskLevel = this.getRiskLevel(summary.riskScore);
    
    return `## Executive Summary

### Overview
This report presents the findings of a comprehensive security assessment conducted on the AI PPT Generator frontend application. The assessment analyzed ${scanResult.filesScanned} files using automated security scanning tools to identify potential vulnerabilities, security misconfigurations, and compliance gaps.

### Key Findings
- **Total Vulnerabilities Identified:** ${summary.totalVulnerabilities}
- **Critical/High Priority Issues:** ${criticalHighCount}
- **Overall Risk Level:** ${riskLevel}
- **Primary Security Concerns:** ${this.getTopCategories(summary.categoryCounts).join(', ')}

### Severity Breakdown
| Severity | Count | Percentage |
|----------|-------|------------|
| Critical | ${summary.criticalCount} | ${this.getPercentage(summary.criticalCount, summary.totalVulnerabilities)}% |
| High | ${summary.highCount} | ${this.getPercentage(summary.highCount, summary.totalVulnerabilities)}% |
| Medium | ${summary.mediumCount} | ${this.getPercentage(summary.mediumCount, summary.totalVulnerabilities)}% |
| Low | ${summary.lowCount} | ${this.getPercentage(summary.lowCount, summary.totalVulnerabilities)}% |
| Info | ${summary.infoCount} | ${this.getPercentage(summary.infoCount, summary.totalVulnerabilities)}% |

### Immediate Actions Required
${this.generateImmediateActions(scanResult.vulnerabilities)}

### Business Impact
${this.generateBusinessImpact(summary)}

---

`;
  }

  private generateDetailedFindings(scanResult: ScanResult): string {
    let report = `## Detailed Security Findings

`;

    // Group vulnerabilities by severity
    const groupedVulns = this.groupVulnerabilitiesBySeverity(scanResult.vulnerabilities);
    
    for (const severity of [VulnerabilitySeverity.CRITICAL, VulnerabilitySeverity.HIGH, VulnerabilitySeverity.MEDIUM, VulnerabilitySeverity.LOW, VulnerabilitySeverity.INFO]) {
      const vulns = groupedVulns[severity] || [];
      if (vulns.length === 0) continue;
      
      report += `### ${severity} Severity Issues (${vulns.length})\n\n`;
      
      vulns.forEach((vuln, index) => {
        report += this.generateVulnerabilityDetail(vuln, index + 1);
      });
    }
    
    return report + '\n---\n\n';
  }

  private generateVulnerabilityDetail(vuln: VulnerabilityFinding, index: number): string {
    return `#### ${index}. ${vuln.title}

**Severity:** ${vuln.severity}  
**Category:** ${vuln.category}  
**CWE ID:** ${vuln.cweId || 'N/A'}  
**File:** \`${vuln.location.filePath}\`  
**Line:** ${vuln.location.lineNumber || 'N/A'}  

**Description:**  
${vuln.description}

**Code Snippet:**
\`\`\`javascript
${vuln.location.codeSnippet || 'N/A'}
\`\`\`

**Impact:**  
${vuln.impact}

**Likelihood:**  
${vuln.likelihood}

**Evidence:**
${vuln.evidence.map(e => `- ${e}`).join('\n')}

**Remediation Summary:**  
${vuln.remediation.summary}

**References:**
${vuln.references.map(ref => `- [${ref}](${ref})`).join('\n')}

---

`;
  }

  private generateRiskAssessment(scanResult: ScanResult): string {
    let report = `## Risk Assessment

`;
    
    if (scanResult.riskAssessments.length === 0) {
      return report + 'No specific risk assessments generated.\n\n---\n\n';
    }
    
    scanResult.riskAssessments.forEach((risk, index) => {
      report += `### ${index + 1}. Risk Assessment for Vulnerability ${risk.vulnerabilityId}

**Risk Level:** ${risk.riskScore.riskLevel}  
**Risk Score:** ${risk.riskScore.overallRisk}/25  
**Likelihood:** ${risk.riskScore.likelihood}/5  
**Impact:** ${risk.riskScore.impact}/5  

**Description:**  
Risk assessment for vulnerability ${risk.vulnerabilityId}

**Business Impact Types:**
${risk.businessImpact.impactTypes.map(type => `- ${type}`).join('\n')}

**Mitigation Strategies:**
${risk.mitigationStrategies.map(strategy => `- ${strategy}`).join('\n')}

**Residual Risk:** ${risk.residualRisk.riskLevel}  
**Assessor:** ${risk.assessor}  
**Assessment Date:** ${risk.assessmentDate.toISOString().split('T')[0]}  

---

`;
    });
    
    return report + '\n';
  }

  private generateComplianceMapping(scanResult: ScanResult): string {
    let report = `## Compliance Assessment

`;
    
    if (scanResult.complianceMappings.length === 0) {
      return report + 'No compliance mappings available.\n\n---\n\n';
    }
    
    // Group by framework
    const frameworkGroups = scanResult.complianceMappings.reduce((groups, mapping) => {
      mapping.mappedControls.forEach(controlMapping => {
        const framework = controlMapping.control.framework;
        if (!groups[framework]) {
          groups[framework] = [];
        }
        groups[framework].push({
          controlId: controlMapping.control.controlNumber,
          controlName: controlMapping.control.title,
          status: controlMapping.status,
          gaps: controlMapping.gaps,
          vulnerabilityId: mapping.vulnerabilityId
        });
      });
      return groups;
    }, {} as Record<string, any[]>);
    
    Object.entries(frameworkGroups).forEach(([framework, controls]) => {
      report += `### ${framework}

| Control ID | Control Name | Status | Gap Description | Vulnerability ID |
|------------|--------------|--------|-----------------|------------------|
`;
      
      controls.forEach(control => {
        const gapDescription = control.gaps.join(', ');
        report += `| ${control.controlId} | ${control.controlName} | ${control.status} | ${gapDescription} | ${control.vulnerabilityId} |\n`;
      });
      
      report += '\n';
    });
    
    return report + '---\n\n';
  }

  private generateRemediationPlan(scanResult: ScanResult): string {
    let report = `## Remediation Roadmap

### Priority Matrix

The following remediation plan prioritizes vulnerabilities based on severity, business impact, and implementation effort:

`;
    
    // Group vulnerabilities by priority
    const priorityGroups = {
      1: scanResult.vulnerabilities.filter(v => v.remediation.priority === 1),
      2: scanResult.vulnerabilities.filter(v => v.remediation.priority === 2),
      3: scanResult.vulnerabilities.filter(v => v.remediation.priority === 3),
      4: scanResult.vulnerabilities.filter(v => v.remediation.priority === 4)
    };
    
    const priorityNames = {
      1: 'Critical Priority (Immediate Action Required)',
      2: 'High Priority (1-2 weeks)',
      3: 'Medium Priority (1-2 months)',
      4: 'Low Priority (Next maintenance cycle)'
    };
    
    Object.entries(priorityGroups).forEach(([priority, vulns]) => {
      if (vulns.length === 0) return;
      
      const priorityKey = priority as '1' | '2' | '3' | '4';
      report += `### ${priorityNames[priorityKey]} - ${vulns.length} items\n\n`;
      
      vulns.forEach((vuln, index) => {
        report += `#### ${index + 1}. ${vuln.title}
**File:** \`${vuln.location.filePath}\`  
**Estimated Effort:** ${vuln.remediation.estimatedEffort}  
**Timeline:** ${vuln.remediation.timeline}  

**Remediation Steps:**
${vuln.remediation.steps.map(step => `${step.stepNumber}. ${step.description}`).join('\n')}

**Verification:**
${vuln.remediation.verification.map(v => `- ${v}`).join('\n')}

---

`;
      });
    });
    
    return report + '\n';
  }

  private generateTechnicalAppendix(scanResult: ScanResult): string {
    return `## Technical Appendix

### Scan Configuration
- **Target Path:** ${scanResult.targetPath}
- **Scanner Version:** ${scanResult.scannerVersion}
- **Scan Duration:** ${scanResult.metadata.scanDuration}ms
- **Files Scanned:** ${scanResult.filesScanned}
- **Rules Applied:** ${scanResult.metadata.rulesApplied}
- **Memory Usage:** ${Math.round(scanResult.metadata.memoryUsage / 1024 / 1024)}MB
- **Confidence Level:** ${scanResult.metadata.confidence}%

### Vulnerability Categories Detected
${Object.entries(this.groupVulnerabilitiesByCategory(scanResult.vulnerabilities))
  .map(([category, vulns]) => `- **${category}:** ${vulns.length} issues`)
  .join('\n')}

### Files with Vulnerabilities
${this.getFilesWithVulnerabilities(scanResult.vulnerabilities)
  .map(file => `- \`${file.path}\` (${file.count} issues)`)
  .join('\n')}

### Scan Errors
${scanResult.errors.length === 0 ? 'No errors encountered during scan.' : 
  scanResult.errors.map(error => `- **${error.errorType}:** ${error.message} (${error.filePath})`).join('\n')}

### Methodology
This security assessment was conducted using automated static analysis tools specifically designed for frontend JavaScript/TypeScript applications. The scanner analyzed code patterns, configuration files, and implementation practices to identify potential security vulnerabilities.

**Limitations:**
- Static analysis may produce false positives that require manual verification
- Dynamic runtime vulnerabilities may not be detected
- Business logic flaws require manual code review
- Third-party library vulnerabilities require separate dependency scanning

### Recommendations for Ongoing Security
1. **Implement Continuous Security Scanning:** Integrate security scanning into CI/CD pipeline
2. **Regular Dependency Updates:** Keep all dependencies updated to latest secure versions
3. **Security Code Reviews:** Implement mandatory security-focused code reviews
4. **Developer Security Training:** Provide regular security training for development team
5. **Penetration Testing:** Conduct regular manual penetration testing
6. **Security Monitoring:** Implement runtime security monitoring and alerting

---

*Report generated by ${scanResult.scannerName} v${scanResult.scannerVersion} on ${new Date().toISOString()}*
`;
  }

  private async saveReport(report: string, outputPath: string): Promise<void> {
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, report, 'utf-8');
  }

  // Helper methods
  private calculateOverallRiskScore(vulnerabilities: VulnerabilityFinding[]): number {
    if (vulnerabilities.length === 0) return 0;
    
    const severityWeights = {
      [VulnerabilitySeverity.CRITICAL]: 10,
      [VulnerabilitySeverity.HIGH]: 8,
      [VulnerabilitySeverity.MEDIUM]: 6,
      [VulnerabilitySeverity.LOW]: 4,
      [VulnerabilitySeverity.INFO]: 2
    };
    
    const totalScore = vulnerabilities.reduce((sum, vuln) => {
      return sum + severityWeights[vuln.severity];
    }, 0);
    
    return Math.min(10, totalScore / vulnerabilities.length);
  }

  private determineComplianceStatus(riskScore: number, severityCounts: any): string {
    if (severityCounts.critical > 0) return 'Non-Compliant (Critical Issues)';
    if (severityCounts.high > 2) return 'Non-Compliant (Multiple High Issues)';
    if (riskScore > 7) return 'Non-Compliant (High Risk)';
    if (riskScore > 5) return 'Partially Compliant (Medium Risk)';
    if (riskScore > 3) return 'Mostly Compliant (Low Risk)';
    return 'Compliant (Minimal Risk)';
  }

  private getRiskLevel(riskScore: number): string {
    if (riskScore >= 8) return 'Critical';
    if (riskScore >= 6) return 'High';
    if (riskScore >= 4) return 'Medium';
    if (riskScore >= 2) return 'Low';
    return 'Minimal';
  }

  private getTopCategories(categoryCounts: Record<string, number>): string[] {
    return Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);
  }

  private getPercentage(count: number, total: number): string {
    return total === 0 ? '0' : ((count / total) * 100).toFixed(1);
  }

  private generateImmediateActions(vulnerabilities: VulnerabilityFinding[]): string {
    const criticalHigh = vulnerabilities.filter(v => 
      v.severity === VulnerabilitySeverity.CRITICAL || v.severity === VulnerabilitySeverity.HIGH
    );
    
    if (criticalHigh.length === 0) {
      return '- No critical or high severity issues requiring immediate action';
    }
    
    return criticalHigh.slice(0, 5).map(v => 
      `- **${v.title}** in \`${v.location.filePath}\` - ${v.remediation.timeline}`
    ).join('\n');
  }

  private generateBusinessImpact(summary: FrontendReportSummary): string {
    const criticalHighCount = summary.criticalCount + summary.highCount;
    
    if (criticalHighCount === 0) {
      return 'The identified vulnerabilities pose minimal immediate risk to business operations. However, addressing medium and low priority issues will strengthen the overall security posture.';
    }
    
    return `The ${criticalHighCount} critical and high severity vulnerabilities pose significant risk to business operations, including potential data breaches, unauthorized access, and service disruption. Immediate remediation is recommended to protect user data and maintain system integrity.`;
  }

  private groupVulnerabilitiesBySeverity(vulnerabilities: VulnerabilityFinding[]): Record<VulnerabilitySeverity, VulnerabilityFinding[]> {
    return vulnerabilities.reduce((groups, vuln) => {
      if (!groups[vuln.severity]) {
        groups[vuln.severity] = [];
      }
      groups[vuln.severity].push(vuln);
      return groups;
    }, {} as Record<VulnerabilitySeverity, VulnerabilityFinding[]>);
  }

  private groupVulnerabilitiesByCategory(vulnerabilities: VulnerabilityFinding[]): Record<string, VulnerabilityFinding[]> {
    return vulnerabilities.reduce((groups, vuln) => {
      if (!groups[vuln.category]) {
        groups[vuln.category] = [];
      }
      groups[vuln.category].push(vuln);
      return groups;
    }, {} as Record<string, VulnerabilityFinding[]>);
  }

  private getFilesWithVulnerabilities(vulnerabilities: VulnerabilityFinding[]): Array<{path: string, count: number}> {
    const fileCounts = vulnerabilities.reduce((counts, vuln) => {
      const path = vuln.location.filePath;
      counts[path] = (counts[path] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    return Object.entries(fileCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count);
  }
}