/**
 * Data Flow Security Report Generator
 * 
 * Generates comprehensive markdown reports for data flow security analysis
 * focusing on privacy compliance, PII handling, authentication security,
 * and multi-tenant isolation issues.
 */

import { ScanResult } from '../interfaces/ScannerInterface';
import { VulnerabilityFinding, VulnerabilitySeverity, VulnerabilityCategory } from '../types/VulnerabilityTypes';
import { RiskAssessment } from '../types/RiskAssessmentTypes';
import { ComplianceMapping } from '../types/ComplianceTypes';
import * as path from 'path';

export interface DataFlowReportOptions {
  includeExecutiveSummary: boolean;
  includeDetailedFindings: boolean;
  includeComplianceAnalysis: boolean;
  includeRemediationPlan: boolean;
  includeTechnicalAppendix: boolean;
  includePrivacyAnalysis: boolean;
  includeMultiTenantAnalysis: boolean;
  outputFormat: 'markdown' | 'html' | 'json';
  reportTitle?: string;
  organizationName?: string;
  assessmentDate?: Date;
}

export interface DataFlowMetrics {
  totalVulnerabilities: number;
  piiExposures: number;
  authenticationIssues: number;
  encryptionIssues: number;
  multiTenantIssues: number;
  documentProcessingIssues: number;
  apiSecurityIssues: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  gdprComplianceScore: number;
  ccpaComplianceScore: number;
  owaspComplianceScore: number;
}

export class DataFlowSecurityReportGenerator {
  private readonly defaultOptions: DataFlowReportOptions = {
    includeExecutiveSummary: true,
    includeDetailedFindings: true,
    includeComplianceAnalysis: true,
    includeRemediationPlan: true,
    includeTechnicalAppendix: true,
    includePrivacyAnalysis: true,
    includeMultiTenantAnalysis: true,
    outputFormat: 'markdown',
    reportTitle: 'Data Flow Security Assessment Report',
    organizationName: 'Organization',
    assessmentDate: new Date()
  };

  /**
   * Generate comprehensive data flow security report
   */
  public generateReport(
    scanResult: ScanResult,
    options: Partial<DataFlowReportOptions> = {}
  ): string {
    const opts = { ...this.defaultOptions, ...options };
    const metrics = this.calculateMetrics(scanResult);

    let report = '';

    // Report header
    report += this.generateReportHeader(opts, metrics);

    // Executive summary
    if (opts.includeExecutiveSummary) {
      report += this.generateExecutiveSummary(scanResult, metrics, opts);
    }

    // Privacy analysis
    if (opts.includePrivacyAnalysis) {
      report += this.generatePrivacyAnalysis(scanResult, metrics);
    }

    // Multi-tenant security analysis
    if (opts.includeMultiTenantAnalysis) {
      report += this.generateMultiTenantAnalysis(scanResult, metrics);
    }

    // Detailed findings
    if (opts.includeDetailedFindings) {
      report += this.generateDetailedFindings(scanResult);
    }

    // Compliance analysis
    if (opts.includeComplianceAnalysis) {
      report += this.generateComplianceAnalysis(scanResult);
    }

    // Remediation plan
    if (opts.includeRemediationPlan) {
      report += this.generateRemediationPlan(scanResult, metrics);
    }

    // Technical appendix
    if (opts.includeTechnicalAppendix) {
      report += this.generateTechnicalAppendix(scanResult, metrics);
    }

    // Report footer
    report += this.generateReportFooter(opts);

    return report;
  }

  /**
   * Calculate security metrics from scan results
   */
  private calculateMetrics(scanResult: ScanResult): DataFlowMetrics {
    const vulnerabilities = scanResult.vulnerabilities;

    // Count by severity
    const criticalFindings = vulnerabilities.filter(v => v.severity === VulnerabilitySeverity.CRITICAL).length;
    const highFindings = vulnerabilities.filter(v => v.severity === VulnerabilitySeverity.HIGH).length;
    const mediumFindings = vulnerabilities.filter(v => v.severity === VulnerabilitySeverity.MEDIUM).length;
    const lowFindings = vulnerabilities.filter(v => v.severity === VulnerabilitySeverity.LOW).length;

    // Count by category
    const piiExposures = vulnerabilities.filter(v => 
      v.title.includes('PII') || v.category === VulnerabilityCategory.INFORMATION_DISCLOSURE
    ).length;

    const authenticationIssues = vulnerabilities.filter(v => 
      v.title.includes('Authentication') || v.category === VulnerabilityCategory.AUTHENTICATION_BYPASS
    ).length;

    const encryptionIssues = vulnerabilities.filter(v => 
      v.title.includes('Encryption') || v.category === VulnerabilityCategory.CRYPTOGRAPHIC_FAILURE
    ).length;

    const multiTenantIssues = vulnerabilities.filter(v => 
      v.title.includes('Multi-Tenant') || v.category === VulnerabilityCategory.AUTHORIZATION_FAILURE
    ).length;

    const documentProcessingIssues = vulnerabilities.filter(v => 
      v.title.includes('Document Processing') || v.category === VulnerabilityCategory.COMMAND_INJECTION
    ).length;

    const apiSecurityIssues = vulnerabilities.filter(v => 
      v.title.includes('API Communication') || v.category === VulnerabilityCategory.INSECURE_CONFIGURATION
    ).length;

    // Calculate compliance scores (0-100)
    const totalIssues = vulnerabilities.length;
    const gdprRelevantIssues = piiExposures + encryptionIssues;
    const gdprComplianceScore = totalIssues > 0 ? Math.max(0, 100 - (gdprRelevantIssues / totalIssues * 100)) : 100;

    const ccpaRelevantIssues = piiExposures;
    const ccpaComplianceScore = totalIssues > 0 ? Math.max(0, 100 - (ccpaRelevantIssues / totalIssues * 100)) : 100;

    const owaspRelevantIssues = criticalFindings + highFindings;
    const owaspComplianceScore = totalIssues > 0 ? Math.max(0, 100 - (owaspRelevantIssues / totalIssues * 100)) : 100;

    return {
      totalVulnerabilities: vulnerabilities.length,
      piiExposures,
      authenticationIssues,
      encryptionIssues,
      multiTenantIssues,
      documentProcessingIssues,
      apiSecurityIssues,
      criticalFindings,
      highFindings,
      mediumFindings,
      lowFindings,
      gdprComplianceScore: Math.round(gdprComplianceScore),
      ccpaComplianceScore: Math.round(ccpaComplianceScore),
      owaspComplianceScore: Math.round(owaspComplianceScore)
    };
  }

  /**
   * Generate report header
   */
  private generateReportHeader(options: DataFlowReportOptions, metrics: DataFlowMetrics): string {
    const date = options.assessmentDate?.toLocaleDateString() || new Date().toLocaleDateString();
    
    return `# ${options.reportTitle}

**Organization:** ${options.organizationName}
**Assessment Date:** ${date}
**Report Type:** Data Flow Security Analysis
**Scanner:** DataFlowSecurityScanner v1.0.0

---

## Assessment Overview

| Metric | Value |
|--------|-------|
| Total Vulnerabilities | ${metrics.totalVulnerabilities} |
| Critical Findings | ${metrics.criticalFindings} |
| High Risk Findings | ${metrics.highFindings} |
| PII Exposures | ${metrics.piiExposures} |
| Authentication Issues | ${metrics.authenticationIssues} |
| Multi-Tenant Issues | ${metrics.multiTenantIssues} |
| GDPR Compliance Score | ${metrics.gdprComplianceScore}% |
| CCPA Compliance Score | ${metrics.ccpaComplianceScore}% |
| OWASP Compliance Score | ${metrics.owaspComplianceScore}% |

---

`;
  }

  /**
   * Generate executive summary
   */
  private generateExecutiveSummary(
    scanResult: ScanResult,
    metrics: DataFlowMetrics,
    options: DataFlowReportOptions
  ): string {
    const riskLevel = this.calculateOverallRiskLevel(metrics);
    const riskIcon = this.getRiskIcon(riskLevel);

    return `## Executive Summary

### Overall Security Posture: ${riskIcon} ${riskLevel}

The data flow security assessment identified **${metrics.totalVulnerabilities} security vulnerabilities** across ${scanResult.filesScanned} files. The analysis focused on privacy compliance, authentication security, data protection, and multi-tenant isolation.

### Key Findings

**Critical Issues (${metrics.criticalFindings})**
- Require immediate attention within 24-48 hours
- Pose significant risk to data privacy and security
- May result in regulatory compliance violations

**High Priority Issues (${metrics.highFindings})**
- Should be addressed within 1 week
- Present substantial security risks
- Could lead to data breaches or unauthorized access

**Medium Priority Issues (${metrics.mediumFindings})**
- Recommended to fix within 2-4 weeks
- Represent moderate security concerns
- May impact overall security posture

### Privacy and Compliance Assessment

**GDPR Compliance:** ${metrics.gdprComplianceScore}% ${this.getComplianceIcon(metrics.gdprComplianceScore)}
- ${metrics.piiExposures} potential PII exposure issues identified
- Data protection measures need strengthening
- Encryption and access controls require review

**CCPA Compliance:** ${metrics.ccpaComplianceScore}% ${this.getComplianceIcon(metrics.ccpaComplianceScore)}
- Personal information handling practices assessed
- Consumer privacy rights implementation reviewed
- Data retention and deletion policies evaluated

**OWASP Top 10 Alignment:** ${metrics.owaspComplianceScore}% ${this.getComplianceIcon(metrics.owaspComplianceScore)}
- Security vulnerabilities mapped to OWASP categories
- Industry-standard security practices evaluated
- Risk-based prioritization applied

### Immediate Actions Required

1. **Address Critical PII Exposures** - ${metrics.piiExposures} instances found
2. **Secure Authentication Tokens** - ${metrics.authenticationIssues} issues identified
3. **Implement Multi-Tenant Isolation** - ${metrics.multiTenantIssues} gaps discovered
4. **Encrypt Data Transmissions** - ${metrics.encryptionIssues} unencrypted communications found

---

`;
  }

  /**
   * Generate privacy analysis section
   */
  private generatePrivacyAnalysis(scanResult: ScanResult, metrics: DataFlowMetrics): string {
    const piiVulns = scanResult.vulnerabilities.filter(v => 
      v.title.includes('PII') || v.category === VulnerabilityCategory.INFORMATION_DISCLOSURE
    );

    let analysis = `## Privacy and Data Protection Analysis

### Personal Identifiable Information (PII) Assessment

**Total PII Exposures Found:** ${metrics.piiExposures}

`;

    if (piiVulns.length > 0) {
      analysis += `### PII Vulnerabilities Detected

`;
      piiVulns.forEach((vuln, index) => {
        analysis += `${index + 1}. **${vuln.title}**
   - Severity: ${vuln.severity}
   - File: ${path.basename(vuln.location.filePath)}
   - Impact: ${vuln.impact}

`;
      });

    } else {
      analysis += `No PII exposures detected - Good privacy posture maintained.

`;
    }

    analysis += `### Data Protection Recommendations

1. **Implement Data Classification**
   - Classify all data based on sensitivity levels
   - Apply appropriate protection measures per classification

2. **Enhance Encryption Practices**
   - Encrypt PII at rest using AES-256 or equivalent
   - Use TLS 1.3 for data in transit

3. **Access Control and Monitoring**
   - Implement role-based access controls (RBAC)
   - Log all access to PII data

---

`;

    return analysis;
  }

  /**
   * Generate multi-tenant security analysis
   */
  private generateMultiTenantAnalysis(scanResult: ScanResult, metrics: DataFlowMetrics): string {
    const multiTenantVulns = scanResult.vulnerabilities.filter(v => 
      v.title.includes('Multi-Tenant') || v.category === VulnerabilityCategory.AUTHORIZATION_FAILURE
    );

    let analysis = `## Multi-Tenant Security Analysis

### Tenant Isolation Assessment

**Total Isolation Issues Found:** ${metrics.multiTenantIssues}

`;

    if (multiTenantVulns.length > 0) {
      analysis += `### Isolation Vulnerabilities

`;
      multiTenantVulns.forEach((vuln, index) => {
        analysis += `${index + 1}. **${vuln.title}**
   - Severity: ${vuln.severity}
   - File: ${path.basename(vuln.location.filePath)}
   - Impact: ${vuln.impact}

`;
      });

    } else {
      analysis += `No multi-tenant isolation issues detected - Good tenant separation maintained.

`;
    }

    analysis += `### Multi-Tenant Security Recommendations

1. **Implement Comprehensive Tenant Filtering**
   - Add tenant ID to all database queries
   - Use parameterized queries with tenant validation

2. **Enhance Storage Isolation**
   - Use tenant-specific S3 prefixes or buckets
   - Implement IAM policies for tenant-based access

3. **API Security Hardening**
   - Implement tenant validation middleware
   - Use JWT tokens with tenant claims

---

`;

    return analysis;
  }

  /**
   * Generate detailed findings section
   */
  private generateDetailedFindings(scanResult: ScanResult): string {
    let findings = `## Detailed Security Findings

### Vulnerability Breakdown by Severity

`;

    const severityGroups = {
      [VulnerabilitySeverity.CRITICAL]: [] as VulnerabilityFinding[],
      [VulnerabilitySeverity.HIGH]: [] as VulnerabilityFinding[],
      [VulnerabilitySeverity.MEDIUM]: [] as VulnerabilityFinding[],
      [VulnerabilitySeverity.LOW]: [] as VulnerabilityFinding[]
    };

    scanResult.vulnerabilities.forEach(vuln => {
      severityGroups[vuln.severity].push(vuln);
    });

    Object.entries(severityGroups).forEach(([severity, vulns]) => {
      if (vulns.length > 0) {
        const icon = this.getSeverityIcon(severity as VulnerabilitySeverity);
        findings += `### ${icon} ${severity} Severity (${vulns.length} findings)

`;

        vulns.forEach((vuln, index) => {
          findings += `#### ${index + 1}. ${vuln.title}

**File:** ${vuln.location.filePath}
**Line:** ${vuln.location.lineNumber || 'N/A'}
**Category:** ${vuln.category}

**Description:**
${vuln.description}

**Impact:**
${vuln.impact}

**Remediation:**
${vuln.remediation.summary}

---

`;
        });
      }
    });

    return findings;
  }

  /**
   * Generate compliance analysis section
   */
  private generateComplianceAnalysis(scanResult: ScanResult): string {
    let compliance = `## Compliance Analysis

### Regulatory Compliance Assessment

`;

    if (scanResult.complianceMappings.length === 0) {
      compliance += `No specific compliance mappings were generated for this assessment.

`;
      return compliance;
    }

    // Group by framework
    const frameworkGroups = scanResult.complianceMappings.reduce((acc, mapping) => {
      const framework = mapping.mappedControls[0]?.control.framework || 'Unknown';
      if (!acc[framework]) {
        acc[framework] = [];
      }
      acc[framework].push(mapping);
      return acc;
    }, {} as Record<string, ComplianceMapping[]>);

    Object.entries(frameworkGroups).forEach(([framework, mappings]) => {
      compliance += `### ${framework}

`;

      mappings.forEach(mapping => {
        const control = mapping.mappedControls[0]?.control;
        if (control) {
          const statusIcon = this.getComplianceStatusIcon(mapping.overallStatus);
          compliance += `#### ${statusIcon} ${control.controlNumber}: ${control.title}

**Status:** ${mapping.overallStatus}
**Description:** ${control.description}
**Findings:** ${mapping.mappedControls[0]?.gaps.length || 0} gaps identified

**Recommendations:**
`;
          mapping.recommendedActions.forEach(rec => {
            compliance += `- ${rec}
`;
          });

          compliance += `

---

`;
        }
      });
    });

    return compliance;
  }

  /**
   * Generate remediation plan
   */
  private generateRemediationPlan(scanResult: ScanResult, metrics: DataFlowMetrics): string {
    let plan = `## Remediation Plan

### Priority-Based Action Items

`;

    // Group vulnerabilities by priority
    const priorityGroups = scanResult.vulnerabilities.reduce((acc, vuln) => {
      const priority = vuln.remediation.priority;
      if (!acc[priority]) acc[priority] = [];
      acc[priority].push(vuln);
      return acc;
    }, {} as Record<number, VulnerabilityFinding[]>);

    // Sort by priority (1 = highest)
    const sortedPriorities = Object.keys(priorityGroups)
      .map(Number)
      .sort((a, b) => a - b);

    sortedPriorities.forEach(priority => {
      const vulns = priorityGroups[priority];
      const priorityLabel = priority === 1 ? 'Critical' : priority === 2 ? 'High' : priority === 3 ? 'Medium' : 'Low';
      
      plan += `### Priority ${priority} - ${priorityLabel} (${vulns.length} items)

`;

      vulns.forEach((vuln, index) => {
        plan += `#### ${index + 1}. ${vuln.title}

**Timeline:** ${vuln.remediation.timeline}
**Estimated Effort:** ${vuln.remediation.estimatedEffort}

**Remediation Steps:**
`;
        vuln.remediation.steps.forEach(step => {
          plan += `${step.stepNumber}. ${step.description}
`;
        });

        plan += `

---

`;
      });
    });

    return plan;
  }

  /**
   * Generate technical appendix
   */
  private generateTechnicalAppendix(scanResult: ScanResult, metrics: DataFlowMetrics): string {
    let appendix = `## Technical Appendix

### Scan Configuration

**Scanner:** ${scanResult.scannerName} v${scanResult.scannerVersion}
**Target Path:** ${scanResult.targetPath}
**Files Scanned:** ${scanResult.filesScanned}
**Scan Duration:** ${scanResult.metadata.scanDuration}ms
**Memory Usage:** ${Math.round(scanResult.metadata.memoryUsage / 1024 / 1024)}MB
**Rules Applied:** ${scanResult.metadata.rulesApplied}
**Confidence Level:** ${scanResult.metadata.confidence}%

### Vulnerability Categories

| Category | Count | Percentage |
|----------|-------|------------|
`;

    const categoryCount = scanResult.vulnerabilities.reduce((acc, vuln) => {
      acc[vuln.category] = (acc[vuln.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(categoryCount).forEach(([category, count]) => {
      const percentage = Math.round((count / metrics.totalVulnerabilities) * 100);
      appendix += `| ${category} | ${count} | ${percentage}% |
`;
    });

    appendix += `

### Assessment Limitations

- Static analysis only - runtime behavior not assessed
- Pattern-based detection may produce false positives
- Custom business logic security not evaluated
- Third-party service integrations not fully analyzed

---

`;

    return appendix;
  }

  /**
   * Generate report footer
   */
  private generateReportFooter(options: DataFlowReportOptions): string {
    return `## Contact Information

For questions about this assessment or remediation support, please contact the security team.

**Report Generated:** ${new Date().toLocaleString()}
**Report Version:** 1.0
**Next Assessment:** Recommended within 90 days

---

*This report contains confidential security information. Distribution should be limited to authorized personnel only.*
`;
  }

  // Helper methods

  private calculateOverallRiskLevel(metrics: DataFlowMetrics): string {
    if (metrics.criticalFindings > 0) return 'Critical';
    if (metrics.highFindings > 5) return 'High';
    if (metrics.highFindings > 0 || metrics.mediumFindings > 10) return 'Medium';
    return 'Low';
  }

  private getRiskIcon(riskLevel: string): string {
    switch (riskLevel) {
      case 'Critical': return '🔴';
      case 'High': return '🟠';
      case 'Medium': return '🟡';
      case 'Low': return '🟢';
      default: return 'ℹ️';
    }
  }

  private getSeverityIcon(severity: VulnerabilitySeverity): string {
    switch (severity) {
      case VulnerabilitySeverity.CRITICAL: return '🔴';
      case VulnerabilitySeverity.HIGH: return '🟠';
      case VulnerabilitySeverity.MEDIUM: return '🟡';
      case VulnerabilitySeverity.LOW: return '🟢';
      default: return 'ℹ️';
    }
  }

  private getComplianceIcon(score: number): string {
    if (score >= 90) return '✅';
    if (score >= 70) return '⚠️';
    return '❌';
  }

  private getComplianceStatusIcon(status: string): string {
    switch (status) {
      case 'Compliant': return '✅';
      case 'Partially Compliant': return '⚠️';
      case 'Non-Compliant': return '❌';
      default: return 'ℹ️';
    }
  }
}

export default DataFlowSecurityReportGenerator;