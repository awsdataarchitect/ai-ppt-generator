/**
 * Simple Backend Security Report Generator
 * 
 * Generates basic security assessment reports for Python Lambda functions
 */

import { VulnerabilityFinding, VulnerabilitySeverity, VulnerabilityCategory } from '../types/VulnerabilityTypes';
import { BackendScanResult } from '../scanners/BackendSecurityScanner';
import * as fs from 'fs';
import * as path from 'path';

export class SimpleBackendReportGenerator {
  /**
   * Generate markdown report
   */
  public generateMarkdownReport(scanResult: BackendScanResult): string {
    const { findings, summary } = scanResult;
    
    let markdown = `# Backend Lambda Security Assessment Report

## Executive Summary

**Assessment Date:** ${new Date().toISOString().split('T')[0]}
**Scanner:** Backend Lambda Security Scanner v1.0.0
**Scope:** Python Lambda Functions

### Key Metrics
- **Total Files Scanned:** ${summary.totalFiles}
- **Vulnerable Files:** ${summary.vulnerableFiles}
- **Total Security Findings:** ${findings.length}
- **Critical Findings:** ${summary.criticalFindings}
- **High Findings:** ${summary.highFindings}
- **Medium Findings:** ${summary.mediumFindings}
- **Low Findings:** ${summary.lowFindings}

### Risk Assessment
${this.generateRiskAssessment(summary)}

## Findings by Severity

### Critical Findings (${summary.criticalFindings})
${this.formatFindingsBySeverity(findings.filter(f => f.severity === VulnerabilitySeverity.CRITICAL))}

### High Findings (${summary.highFindings})
${this.formatFindingsBySeverity(findings.filter(f => f.severity === VulnerabilitySeverity.HIGH))}

### Medium Findings (${summary.mediumFindings})
${this.formatFindingsBySeverity(findings.filter(f => f.severity === VulnerabilitySeverity.MEDIUM))}

### Low Findings (${summary.lowFindings})
${this.formatFindingsBySeverity(findings.filter(f => f.severity === VulnerabilitySeverity.LOW))}

## Vulnerability Categories

${this.formatVulnerabilityCategories(findings)}

## Remediation Recommendations

### Immediate Actions (Critical & High Priority)
${this.generateImmediateActions(findings)}

### Short-term Actions (1-4 weeks)
${this.generateShortTermActions(findings)}

### Long-term Actions (1-3 months)
${this.generateLongTermActions()}

## Detailed Findings

${this.formatDetailedFindings(findings)}

## Security Best Practices

### Input Validation
- Implement comprehensive input validation for all Lambda function parameters
- Use schema validation libraries (e.g., Pydantic, Cerberus)
- Sanitize all user inputs before processing

### Database Security
- Use parameterized queries with ExpressionAttributeValues for DynamoDB
- Avoid string concatenation in database operations
- Implement proper error handling without information disclosure

### Authentication & Authorization
- Validate user authentication in all Lambda functions
- Implement proper authorization checks for resource access
- Use AWS IAM roles with least privilege principle

### Secrets Management
- Store all secrets in AWS Secrets Manager or environment variables
- Never hardcode credentials in source code
- Rotate credentials regularly

### Error Handling
- Implement centralized error handling
- Sanitize error messages to prevent information disclosure
- Log security events for monitoring

## Conclusion

This assessment identified ${findings.length} security findings across ${summary.totalFiles} Lambda functions. 
${summary.criticalFindings > 0 ? `**CRITICAL**: ${summary.criticalFindings} critical vulnerabilities require immediate attention.` : ''}
${summary.highFindings > 0 ? `**HIGH**: ${summary.highFindings} high-priority vulnerabilities should be addressed within 1 week.` : ''}

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

  private generateRiskAssessment(summary: any): string {
    const riskScore = this.calculateRiskScore(summary);
    let riskLevel = 'LOW';
    if (riskScore >= 80) riskLevel = 'CRITICAL';
    else if (riskScore >= 60) riskLevel = 'HIGH';
    else if (riskScore >= 30) riskLevel = 'MEDIUM';

    return `**Risk Score:** ${riskScore}/100
**Risk Level:** ${riskLevel}

${riskLevel === 'CRITICAL' ? '🚨 **CRITICAL RISK**: Immediate action required to address security vulnerabilities.' : ''}
${riskLevel === 'HIGH' ? '⚠️ **HIGH RISK**: Significant security vulnerabilities require prompt attention.' : ''}
${riskLevel === 'MEDIUM' ? '🟡 **MEDIUM RISK**: Moderate security issues should be addressed in upcoming sprints.' : ''}
${riskLevel === 'LOW' ? '✅ **LOW RISK**: Minor security concerns can be addressed during regular maintenance.' : ''}`;
  }

  private calculateRiskScore(summary: any): number {
    const weights = { critical: 25, high: 15, medium: 8, low: 2 };
    
    const score = (
      summary.criticalFindings * weights.critical +
      summary.highFindings * weights.high +
      summary.mediumFindings * weights.medium +
      summary.lowFindings * weights.low
    );
    
    return Math.min(100, score);
  }

  private formatFindingsBySeverity(findings: VulnerabilityFinding[]): string {
    if (findings.length === 0) {
      return '*No findings of this severity level.*\n';
    }
    
    return findings.map(finding => 
      `- **${finding.title}** in \`${finding.location.filePath}:${finding.location.lineNumber}\`
  ${finding.description}
  *Recommendation:* ${finding.remediation.summary}`
    ).join('\n\n') + '\n';
  }

  private formatVulnerabilityCategories(findings: VulnerabilityFinding[]): string {
    const categories: { [key: string]: VulnerabilityFinding[] } = {};
    
    for (const finding of findings) {
      const category = finding.category;
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(finding);
    }

    return Object.entries(categories)
      .sort(([,a], [,b]) => b.length - a.length)
      .map(([category, categoryFindings]) => {
        const highestSeverity = this.getHighestSeverity(categoryFindings);
        return `### ${category} (${categoryFindings.length} findings, ${highestSeverity} severity)

${categoryFindings.map(f => `- \`${f.location.filePath}:${f.location.lineNumber}\` - ${f.description}`).join('\n')}

**Recommendation:** ${categoryFindings[0]?.remediation.summary || 'Review and remediate identified issues'}
`;
      }).join('\n');
  }

  private getHighestSeverity(findings: VulnerabilityFinding[]): VulnerabilitySeverity {
    const severityOrder = [
      VulnerabilitySeverity.CRITICAL,
      VulnerabilitySeverity.HIGH,
      VulnerabilitySeverity.MEDIUM,
      VulnerabilitySeverity.LOW,
      VulnerabilitySeverity.INFO
    ];

    for (const severity of severityOrder) {
      if (findings.some(f => f.severity === severity)) {
        return severity;
      }
    }

    return VulnerabilitySeverity.LOW;
  }

  private generateImmediateActions(findings: VulnerabilityFinding[]): string {
    const criticalAndHigh = findings.filter(f => 
      f.severity === VulnerabilitySeverity.CRITICAL || f.severity === VulnerabilitySeverity.HIGH
    );

    if (criticalAndHigh.length === 0) {
      return '- No critical or high-priority vulnerabilities found.';
    }

    const actions = new Set<string>();
    
    for (const finding of criticalAndHigh) {
      if (finding.category === VulnerabilityCategory.COMMAND_INJECTION) {
        actions.add('Remove all subprocess calls with shell=True and replace with secure alternatives');
        actions.add('Eliminate eval() and exec() calls - use safe parsing libraries instead');
      }
      if (finding.category === VulnerabilityCategory.SQL_INJECTION) {
        actions.add('Implement parameterized DynamoDB queries using ExpressionAttributeValues');
      }
      if (finding.category === VulnerabilityCategory.HARDCODED_SECRETS) {
        actions.add('Remove all hardcoded secrets and move to AWS Secrets Manager');
        actions.add('Rotate any exposed credentials immediately');
      }
      if (finding.category === VulnerabilityCategory.PATH_TRAVERSAL) {
        actions.add('Implement path validation and sanitization for all file operations');
      }
    }

    return Array.from(actions).map(action => `- ${action}`).join('\n');
  }

  private generateShortTermActions(findings: VulnerabilityFinding[]): string {
    const mediumFindings = findings.filter(f => f.severity === VulnerabilitySeverity.MEDIUM);
    
    const actions = new Set<string>();
    
    for (const finding of mediumFindings) {
      if (finding.category === VulnerabilityCategory.INPUT_VALIDATION) {
        actions.add('Implement comprehensive input validation using schema validation libraries');
      }
      if (finding.category === VulnerabilityCategory.INFORMATION_DISCLOSURE) {
        actions.add('Implement centralized error handling that sanitizes error messages');
      }
      if (finding.category === VulnerabilityCategory.AUTHENTICATION_BYPASS) {
        actions.add('Add authentication validation to all Lambda function entry points');
      }
    }

    if (actions.size === 0) {
      actions.add('Review and address any medium-priority findings');
      actions.add('Implement security code review process');
    }

    return Array.from(actions).map(action => `- ${action}`).join('\n');
  }

  private generateLongTermActions(): string {
    return `- Implement automated security testing in CI/CD pipeline
- Set up regular dependency vulnerability scanning
- Establish security code review process
- Implement comprehensive security logging and monitoring
- Create security training program for development team
- Establish incident response procedures for security events`;
  }

  private formatDetailedFindings(findings: VulnerabilityFinding[]): string {
    if (findings.length === 0) {
      return '*No security findings detected.*';
    }

    return findings
      .sort((a, b) => this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity))
      .map((finding, index) => `### Finding ${index + 1}: ${finding.title}

**Severity:** ${finding.severity}
**Category:** ${finding.category}
**File:** \`${finding.location.filePath}:${finding.location.lineNumber}\`
**CWE ID:** ${finding.cweId || 'N/A'}

**Description:** ${finding.description}

**Evidence:**
\`\`\`python
${finding.location.codeSnippet || finding.evidence[0] || 'Code snippet not available'}
\`\`\`

**Impact:** ${finding.impact}

**Recommendation:** ${finding.remediation.summary}

---`).join('\n\n');
  }

  private getSeverityWeight(severity: VulnerabilitySeverity): number {
    const weights = {
      [VulnerabilitySeverity.CRITICAL]: 4,
      [VulnerabilitySeverity.HIGH]: 3,
      [VulnerabilitySeverity.MEDIUM]: 2,
      [VulnerabilitySeverity.LOW]: 1,
      [VulnerabilitySeverity.INFO]: 0
    };
    return weights[severity] || 0;
  }
}