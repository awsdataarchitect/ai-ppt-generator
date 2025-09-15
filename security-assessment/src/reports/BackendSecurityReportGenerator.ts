/**
 * Backend Security Report Generator
 * 
 * Generates comprehensive security assessment reports for Python Lambda functions
 * including vulnerability findings, risk analysis, and remediation recommendations
 */

import { VulnerabilityFinding, VulnerabilitySeverity, VulnerabilityCategory } from '../types/VulnerabilityTypes';
import { BackendScanResult } from '../scanners/BackendSecurityScanner';
import * as fs from 'fs';
import * as path from 'path';

export interface BackendSecurityReport {
  executiveSummary: {
    totalFiles: number;
    vulnerableFiles: number;
    totalFindings: number;
    riskScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    topVulnerabilities: string[];
  };
  findingsByCategory: {
    [key in VulnerabilityCategory]?: {
      count: number;
      severity: VulnerabilitySeverity;
      findings: VulnerabilityFinding[];
    };
  };
  findingsBySeverity: {
    [key in VulnerabilitySeverity]: VulnerabilityFinding[];
  };
  remediationPlan: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  complianceMapping: {
    owasp: { [category: string]: VulnerabilityFinding[] };
    cwe: { [id: string]: VulnerabilityFinding[] };
  };
  detailedFindings: VulnerabilityFinding[];
}

export class BackendSecurityReportGenerator {
  /**
   * Generate comprehensive security report from scan results
   */
  public generateReport(scanResult: BackendScanResult): BackendSecurityReport {
    const findings = scanResult.findings;
    
    return {
      executiveSummary: this.generateExecutiveSummary(scanResult),
      findingsByCategory: this.groupFindingsByCategory(findings),
      findingsBySeverity: this.groupFindingsBySeverity(findings),
      remediationPlan: this.generateRemediationPlan(findings),
      complianceMapping: this.generateComplianceMapping(findings),
      detailedFindings: findings
    };
  }

  /**
   * Generate markdown report
   */
  public generateMarkdownReport(scanResult: BackendScanResult): string {
    const report = this.generateReport(scanResult);
    
    let markdown = `# Backend Lambda Security Assessment Report

## Executive Summary

**Assessment Date:** ${new Date().toISOString().split('T')[0]}
**Scanner:** Backend Lambda Security Scanner v1.0.0
**Scope:** Python Lambda Functions

### Key Metrics
- **Total Files Scanned:** ${report.executiveSummary.totalFiles}
- **Vulnerable Files:** ${report.executiveSummary.vulnerableFiles}
- **Total Security Findings:** ${report.executiveSummary.totalFindings}
- **Risk Score:** ${report.executiveSummary.riskScore}/100
- **Overall Risk Level:** ${report.executiveSummary.riskLevel}

### Top Vulnerability Categories
${report.executiveSummary.topVulnerabilities.map(vuln => `- ${vuln}`).join('\n')}

## Findings by Severity

### Critical Findings (${report.findingsBySeverity[VulnerabilitySeverity.CRITICAL]?.length || 0})
${this.formatFindingsBySeverity(report.findingsBySeverity[VulnerabilitySeverity.CRITICAL] || [])}

### High Findings (${report.findingsBySeverity[VulnerabilitySeverity.HIGH]?.length || 0})
${this.formatFindingsBySeverity(report.findingsBySeverity[VulnerabilitySeverity.HIGH] || [])}

### Medium Findings (${report.findingsBySeverity[VulnerabilitySeverity.MEDIUM]?.length || 0})
${this.formatFindingsBySeverity(report.findingsBySeverity[VulnerabilitySeverity.MEDIUM] || [])}

### Low Findings (${report.findingsBySeverity[VulnerabilitySeverity.LOW]?.length || 0})
${this.formatFindingsBySeverity(report.findingsBySeverity[VulnerabilitySeverity.LOW] || [])}

## Vulnerability Categories Analysis

${this.formatVulnerabilityCategories(report.findingsByCategory)}

## OWASP Top 10 Mapping

${this.formatOwaspMapping(report.complianceMapping.owasp)}

## CWE (Common Weakness Enumeration) Mapping

${this.formatCweMapping(report.complianceMapping.cwe)}

## Remediation Plan

### Immediate Actions (Critical & High Priority)
${report.remediationPlan.immediate.map(action => `- ${action}`).join('\n')}

### Short-term Actions (1-4 weeks)
${report.remediationPlan.shortTerm.map(action => `- ${action}`).join('\n')}

### Long-term Actions (1-3 months)
${report.remediationPlan.longTerm.map(action => `- ${action}`).join('\n')}

## Detailed Findings

${this.formatDetailedFindings(report.detailedFindings)}

## Security Recommendations

### Code Review Guidelines
- Implement mandatory security code reviews for all Lambda functions
- Use static analysis tools in CI/CD pipeline
- Establish secure coding standards for Python development

### Input Validation
- Implement comprehensive input validation for all Lambda function parameters
- Use schema validation libraries (e.g., Pydantic, Cerberus)
- Sanitize all user inputs before processing

### Authentication & Authorization
- Ensure all Lambda functions validate user authentication
- Implement proper authorization checks for resource access
- Use AWS IAM roles with least privilege principle

### Error Handling
- Implement centralized error handling
- Avoid exposing sensitive information in error messages
- Log security events for monitoring and alerting

### Dependency Management
- Regularly update Python dependencies
- Use dependency scanning tools (e.g., Safety, Bandit)
- Pin dependency versions in requirements.txt

### Monitoring & Logging
- Implement comprehensive security logging
- Set up alerts for suspicious activities
- Use AWS CloudWatch for centralized log management

## Conclusion

This assessment identified ${report.executiveSummary.totalFindings} security findings across ${report.executiveSummary.vulnerableFiles} files. 
The overall risk level is **${report.executiveSummary.riskLevel}** with a risk score of ${report.executiveSummary.riskScore}/100.

Priority should be given to addressing Critical and High severity findings, particularly:
${report.executiveSummary.topVulnerabilities.slice(0, 3).map(vuln => `- ${vuln}`).join('\n')}

Regular security assessments and implementation of the recommended security controls will significantly improve the security posture of the Lambda functions.

---
*Report generated on ${new Date().toISOString()}*
`;

    return markdown;
  }

  /**
   * Save report to file
   */
  public async saveReport(scanResult: BackendScanResult, outputPath: string): Promise<void> {
    const markdown = this.generateMarkdownReport(scanResult);
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, markdown, 'utf-8');
  }

  /**
   * Generate executive summary
   */
  private generateExecutiveSummary(scanResult: BackendScanResult): BackendSecurityReport['executiveSummary'] {
    const { summary, findings } = scanResult;
    
    // Calculate risk score (0-100)
    const riskScore = this.calculateRiskScore(summary);
    
    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (riskScore >= 80) riskLevel = 'CRITICAL';
    else if (riskScore >= 60) riskLevel = 'HIGH';
    else if (riskScore >= 30) riskLevel = 'MEDIUM';
    else riskLevel = 'LOW';
    
    // Get top vulnerability types
    const vulnerabilityTypeCounts = this.getVulnerabilityTypeCounts(findings);
    const topVulnerabilities = Object.entries(vulnerabilityTypeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => `${this.formatVulnerabilityType(type)} (${count})`);
    
    return {
      totalFiles: summary.totalFiles,
      vulnerableFiles: summary.vulnerableFiles,
      totalFindings: findings.length,
      riskScore,
      riskLevel,
      topVulnerabilities
    };
  }

  /**
   * Calculate risk score based on findings
   */
  private calculateRiskScore(summary: any): number {
    const weights = {
      critical: 25,
      high: 15,
      medium: 8,
      low: 2
    };
    
    const score = (
      summary.criticalFindings * weights.critical +
      summary.highFindings * weights.high +
      summary.mediumFindings * weights.medium +
      summary.lowFindings * weights.low
    );
    
    // Normalize to 0-100 scale
    return Math.min(100, score);
  }

  /**
   * Group findings by vulnerability category
   */
  private groupFindingsByCategory(findings: VulnerabilityFinding[]): BackendSecurityReport['findingsByCategory'] {
    const grouped: BackendSecurityReport['findingsByCategory'] = {};
    
    for (const finding of findings) {
      if (!grouped[finding.category]) {
        grouped[finding.category] = {
          count: 0,
          severity: finding.severity,
          findings: []
        };
      }
      
      grouped[finding.category]!.count++;
      grouped[finding.category]!.findings.push(finding);
      
      // Use highest severity for the category
      if (this.getSeverityWeight(finding.severity) > this.getSeverityWeight(grouped[finding.category]!.severity)) {
        grouped[finding.category]!.severity = finding.severity;
      }
    }
    
    return grouped;
  }

  /**
   * Group findings by severity
   */
  private groupFindingsBySeverity(findings: VulnerabilityFinding[]): BackendSecurityReport['findingsBySeverity'] {
    const grouped: BackendSecurityReport['findingsBySeverity'] = {
      [VulnerabilitySeverity.CRITICAL]: [],
      [VulnerabilitySeverity.HIGH]: [],
      [VulnerabilitySeverity.MEDIUM]: [],
      [VulnerabilitySeverity.LOW]: [],
      [VulnerabilitySeverity.INFO]: []
    };
    
    for (const finding of findings) {
      grouped[finding.severity].push(finding);
    }
    
    return grouped;
  }

  /**
   * Generate remediation plan
   */
  private generateRemediationPlan(findings: VulnerabilityFinding[]): BackendSecurityReport['remediationPlan'] {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];
    
    // Group by vulnerability type for targeted recommendations
    const byType = this.groupFindingsByType(findings);
    
    // Critical and High severity - immediate action
    if (byType[VulnerabilityCategory.COMMAND_INJECTION]?.length > 0) {
      immediate.push('Remove all subprocess calls with shell=True and replace with secure alternatives');
      immediate.push('Eliminate eval() and exec() calls - use safe parsing libraries instead');
    }
    
    if (byType[VulnerabilityCategory.SQL_INJECTION]?.length > 0) {
      immediate.push('Implement parameterized DynamoDB queries using ExpressionAttributeValues');
      immediate.push('Review and fix all string concatenation in database operations');
    }
    
    if (byType[VulnerabilityCategory.HARDCODED_SECRETS]?.length > 0) {
      immediate.push('Remove all hardcoded secrets and move to AWS Secrets Manager or environment variables');
      immediate.push('Rotate any exposed credentials immediately');
    }
    
    if (byType[VulnerabilityCategory.INSECURE_DESERIALIZATION]?.length > 0) {
      immediate.push('Replace pickle.loads with safe JSON deserialization');
      immediate.push('Use yaml.safe_load instead of yaml.load');
    }
    
    // Medium severity - short term
    if (byType[VulnerabilityCategory.PATH_TRAVERSAL]?.length > 0) {
      shortTerm.push('Implement path validation and sanitization for all file operations');
      shortTerm.push('Use allowlists for permitted file paths and S3 keys');
    }
    
    if (byType[VulnerabilityCategory.INPUT_VALIDATION]?.length > 0) {
      shortTerm.push('Implement comprehensive input validation using schema validation libraries');
      shortTerm.push('Add type checking and bounds validation for all user inputs');
    }
    
    if (byType[VulnerabilityCategory.INFORMATION_DISCLOSURE]?.length > 0) {
      shortTerm.push('Implement centralized error handling that sanitizes error messages');
      shortTerm.push('Remove debug information and stack traces from production responses');
    }
    
    if (byType[VulnerabilityCategory.AUTHENTICATION_BYPASS]?.length > 0) {
      shortTerm.push('Add authentication validation to all Lambda function entry points');
      shortTerm.push('Implement proper authorization checks for resource access');
    }
    
    // Long term improvements
    longTerm.push('Implement automated security testing in CI/CD pipeline');
    longTerm.push('Set up regular dependency vulnerability scanning');
    longTerm.push('Establish security code review process');
    longTerm.push('Implement comprehensive security logging and monitoring');
    longTerm.push('Create security training program for development team');
    longTerm.push('Establish incident response procedures for security events');
    
    return { immediate, shortTerm, longTerm };
  }

  /**
   * Generate compliance mapping
   */
  private generateComplianceMapping(findings: VulnerabilityFinding[]): BackendSecurityReport['complianceMapping'] {
    const owasp: { [category: string]: VulnerabilityFinding[] } = {};
    const cwe: { [id: string]: VulnerabilityFinding[] } = {};
    
    for (const finding of findings) {
      // OWASP mapping - use references array
      if (finding.references && finding.references.length > 0) {
        const owaspCategory = finding.references[0]; // First reference is OWASP category
        if (!owasp[owaspCategory]) {
          owasp[owaspCategory] = [];
        }
        owasp[owaspCategory].push(finding);
      }
      
      // CWE mapping
      if (finding.cweId) {
        if (!cwe[finding.cweId]) {
          cwe[finding.cweId] = [];
        }
        cwe[finding.cweId].push(finding);
      }
    }
    
    return { owasp, cwe };
  }

  /**
   * Helper methods for formatting
   */
  private formatFindingsBySeverity(findings: VulnerabilityFinding[]): string {
    if (findings.length === 0) {
      return '*No findings of this severity level.*\n';
    }
    
    return findings.map(finding => 
      `- **${finding.title}** in \`${finding.location.filePath}:${finding.location.lineNumber}\`\n  ${finding.description}`
    ).join('\n\n') + '\n';
  }

  private formatVulnerabilityCategories(categories: BackendSecurityReport['findingsByCategory']): string {
    return Object.entries(categories)
      .sort(([,a], [,b]) => b.count - a.count)
      .map(([type, data]) => {
        const typeFormatted = this.formatVulnerabilityType(type);
        return `### ${typeFormatted} (${data.count} findings, ${data.severity} severity)

${data.findings.map(f => `- \`${f.file}:${f.line}\` - ${f.description}`).join('\n')}

**Recommendation:** ${data.findings[0]?.recommendation || 'Review and remediate identified issues'}
`;
      }).join('\n');
  }

  private formatOwaspMapping(owasp: { [category: string]: VulnerabilityFinding[] }): string {
    return Object.entries(owasp)
      .sort(([,a], [,b]) => b.length - a.length)
      .map(([category, findings]) => 
        `### ${category} (${findings.length} findings)\n${findings.map(f => `- ${f.title} in \`${f.file}\``).join('\n')}`
      ).join('\n\n');
  }

  private formatCweMapping(cwe: { [id: string]: VulnerabilityFinding[] }): string {
    return Object.entries(cwe)
      .sort(([,a], [,b]) => b.length - a.length)
      .map(([id, findings]) => 
        `### ${id} (${findings.length} findings)\n${findings.map(f => `- ${f.title} in \`${f.file}\``).join('\n')}`
      ).join('\n\n');
  }

  private formatDetailedFindings(findings: VulnerabilityFinding[]): string {
    return findings
      .sort((a, b) => this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity))
      .map((finding, index) => `### Finding ${index + 1}: ${finding.title}

**Severity:** ${finding.severity}
**Type:** ${this.formatVulnerabilityType(finding.type)}
**File:** \`${finding.file}:${finding.line}\`
**OWASP Category:** ${finding.owaspCategory || 'N/A'}
**CWE ID:** ${finding.cweId || 'N/A'}

**Description:** ${finding.description}

**Evidence:**
\`\`\`python
${finding.evidence}
\`\`\`

**Recommendation:** ${finding.recommendation}

---`).join('\n\n');
  }

  private formatVulnerabilityType(type: string): string {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }

  private getSeverityWeight(severity: VulnerabilitySeverity): number {
    const weights = {
      [VulnerabilitySeverity.CRITICAL]: 4,
      [VulnerabilitySeverity.HIGH]: 3,
      [VulnerabilitySeverity.MEDIUM]: 2,
      [VulnerabilitySeverity.LOW]: 1
    };
    return weights[severity];
  }

  private getVulnerabilityTypeCounts(findings: VulnerabilityFinding[]): { [type: string]: number } {
    const counts: { [type: string]: number } = {};
    for (const finding of findings) {
      counts[finding.type] = (counts[finding.type] || 0) + 1;
    }
    return counts;
  }

  private groupFindingsByType(findings: VulnerabilityFinding[]): { [type: string]: VulnerabilityFinding[] } {
    const grouped: { [type: string]: VulnerabilityFinding[] } = {};
    for (const finding of findings) {
      if (!grouped[finding.type]) {
        grouped[finding.type] = [];
      }
      grouped[finding.type].push(finding);
    }
    return grouped;
  }
}