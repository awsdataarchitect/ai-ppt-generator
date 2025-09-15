/**
 * Infrastructure Security Report Generator
 * Generates comprehensive markdown reports for CDK infrastructure security findings
 */

import { ScanResult } from '../interfaces/ScannerInterface';
import { VulnerabilityFinding, VulnerabilitySeverity, VulnerabilityCategory } from '../types/VulnerabilityTypes';
import { RiskAssessment } from '../types/RiskAssessmentTypes';
import { ComplianceMapping, ComplianceStatus, ComplianceFramework } from '../types/ComplianceTypes';
import * as fs from 'fs';
import * as path from 'path';

export interface InfrastructureReportOptions {
  readonly includeExecutiveSummary: boolean;
  readonly includeDetailedFindings: boolean;
  readonly includeRemediationPlans: boolean;
  readonly includeComplianceMapping: boolean;
  readonly includeRiskAssessment: boolean;
  readonly includeTechnicalAppendix: boolean;
  readonly maxFindingsPerCategory: number;
  readonly outputFormat: 'markdown' | 'html' | 'json';
}

export class InfrastructureSecurityReportGenerator {
  private readonly defaultOptions: InfrastructureReportOptions = {
    includeExecutiveSummary: true,
    includeDetailedFindings: true,
    includeRemediationPlans: true,
    includeComplianceMapping: true,
    includeRiskAssessment: true,
    includeTechnicalAppendix: true,
    maxFindingsPerCategory: 10,
    outputFormat: 'markdown'
  };

  public async generateReport(
    scanResult: ScanResult,
    outputPath: string,
    options: Partial<InfrastructureReportOptions> = {}
  ): Promise<string> {
    const reportOptions = { ...this.defaultOptions, ...options };
    
    let report = '';
    
    if (reportOptions.outputFormat === 'markdown') {
      report = this.generateMarkdownReport(scanResult, reportOptions);
    } else if (reportOptions.outputFormat === 'json') {
      report = this.generateJsonReport(scanResult, reportOptions);
    } else {
      throw new Error(`Unsupported output format: ${reportOptions.outputFormat}`);
    }

    // Write report to file
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, report, 'utf-8');
    
    return outputPath;
  }

  private generateMarkdownReport(scanResult: ScanResult, options: InfrastructureReportOptions): string {
    const sections: string[] = [];

    // Header
    sections.push(this.generateHeader(scanResult));

    // Executive Summary
    if (options.includeExecutiveSummary) {
      sections.push(this.generateExecutiveSummary(scanResult));
    }

    // Risk Assessment
    if (options.includeRiskAssessment && scanResult.riskAssessments.length > 0) {
      sections.push(this.generateRiskAssessmentSection(scanResult.riskAssessments));
    }

    // Compliance Mapping
    if (options.includeComplianceMapping && scanResult.complianceMappings.length > 0) {
      sections.push(this.generateComplianceMappingSection(scanResult.complianceMappings));
    }

    // Detailed Findings
    if (options.includeDetailedFindings) {
      sections.push(this.generateDetailedFindings(scanResult.vulnerabilities, options));
    }

    // Remediation Plans
    if (options.includeRemediationPlans) {
      sections.push(this.generateRemediationPlans(scanResult.vulnerabilities));
    }

    // Technical Appendix
    if (options.includeTechnicalAppendix) {
      sections.push(this.generateTechnicalAppendix(scanResult));
    }

    return sections.join('\n\n');
  }

  private generateJsonReport(scanResult: ScanResult, options: InfrastructureReportOptions): string {
    const report = {
      metadata: {
        reportType: 'Infrastructure Security Assessment',
        generatedAt: new Date().toISOString(),
        scannerName: scanResult.scannerName,
        scannerVersion: scanResult.scannerVersion,
        targetPath: scanResult.targetPath,
        scanDuration: scanResult.metadata.scanDuration,
        filesScanned: scanResult.filesScanned
      },
      summary: this.generateSummaryData(scanResult),
      vulnerabilities: scanResult.vulnerabilities,
      riskAssessments: scanResult.riskAssessments,
      complianceMappings: scanResult.complianceMappings,
      errors: scanResult.errors,
      recommendations: this.generateRecommendations(scanResult.vulnerabilities)
    };

    return JSON.stringify(report, null, 2);
  }

  private generateHeader(scanResult: ScanResult): string {
    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();
    
    return `# Infrastructure Security Assessment Report

**Generated:** ${date} at ${time}  
**Scanner:** ${scanResult.scannerName} v${scanResult.scannerVersion}  
**Target:** ${scanResult.targetPath}  
**Scan Duration:** ${Math.round(scanResult.metadata.scanDuration / 1000)}s  
**Files Scanned:** ${scanResult.filesScanned}  
**Confidence:** ${scanResult.metadata.confidence}%

---`;
  }

  private generateExecutiveSummary(scanResult: ScanResult): string {
    const vulnerabilities = scanResult.vulnerabilities;
    const severityCounts = this.countBySeverity(vulnerabilities);
    const categoryCounts = this.countByCategory(vulnerabilities);
    
    const totalVulns = vulnerabilities.length;
    const criticalAndHigh = severityCounts.Critical + severityCounts.High;
    
    let riskLevel = 'Low';
    if (severityCounts.Critical > 0) riskLevel = 'Critical';
    else if (severityCounts.High > 2) riskLevel = 'High';
    else if (severityCounts.High > 0) riskLevel = 'Medium';

    return `## Executive Summary

### Overall Security Posture: **${riskLevel} Risk**

This infrastructure security assessment identified **${totalVulns} security vulnerabilities** across your AWS CDK infrastructure configuration. The findings indicate ${this.getRiskDescription(riskLevel)} security posture that requires ${this.getActionUrgency(riskLevel)} attention.

### Key Findings

- **Critical Vulnerabilities:** ${severityCounts.Critical} (require immediate action)
- **High Severity Issues:** ${severityCounts.High} (address within 1 week)
- **Medium Priority Items:** ${severityCounts.Medium} (address within 2 weeks)
- **Low Priority Observations:** ${severityCounts.Low} (address within 1 month)

### Top Security Concerns

${this.getTopConcerns(categoryCounts)}

### Business Impact

${this.getBusinessImpact(riskLevel, criticalAndHigh)}

### Recommended Actions

${this.getExecutiveRecommendations(riskLevel, severityCounts)}`;
  }

  private generateRiskAssessmentSection(riskAssessments: RiskAssessment[]): string {
    let section = `## Risk Assessment

The following risk assessments have been generated based on the identified vulnerabilities:

`;

    riskAssessments.forEach((risk, index) => {
      const riskIcon = this.getRiskIcon(risk.riskScore.riskLevel);
      
      section += `### ${riskIcon} ${risk.vulnerabilityId}

**Risk Level:** ${risk.riskScore.riskLevel} (Score: ${risk.riskScore.overallRisk}/25)  
**Impact:** ${risk.riskScore.impact} | **Likelihood:** ${risk.riskScore.likelihood}

**Business Impact Types:** ${risk.businessImpact.impactTypes.join(', ')}

**Financial Impact:** $${risk.businessImpact.financialImpact.estimatedCost.minimum.toLocaleString()} - $${risk.businessImpact.financialImpact.estimatedCost.maximum.toLocaleString()} ${risk.businessImpact.financialImpact.estimatedCost.currency}

**Operational Impact:** ${risk.businessImpact.operationalImpact.userImpact}

**Affected Systems:**
${risk.businessImpact.operationalImpact.affectedSystems.map(system => `- ${system}`).join('\n')}

**Mitigation Strategies:**
${risk.mitigationStrategies.map(strategy => `- ${strategy}`).join('\n')}

**Recovery Time:** ${risk.businessImpact.financialImpact.recoveryTime}

---
`;
    });

    return section;
  }

  private generateComplianceMappingSection(complianceMappings: ComplianceMapping[]): string {
    let section = `## Compliance Framework Assessment

### OWASP Top 10 2021 Compliance Status

`;

    const owaspMappings = complianceMappings.filter(m => 
      m.mappedControls.some(c => c.control.framework === ComplianceFramework.OWASP_TOP_10)
    );
    
    if (owaspMappings.length > 0) {
      section += `| Control | Status | Vulnerability | Gaps |\n`;
      section += `|---------|--------|---------------|------|\n`;
      
      owaspMappings.forEach(mapping => {
        const control = mapping.mappedControls[0]?.control;
        if (control) {
          const statusIcon = mapping.overallStatus === ComplianceStatus.COMPLIANT ? '✅' : '❌';
          const gapCount = mapping.gapAnalysis.length;
          section += `| ${control.title} | ${statusIcon} ${mapping.overallStatus} | ${mapping.vulnerabilityId} | ${gapCount} |\n`;
        }
      });
      
      section += '\n';
      
      // Detailed compliance analysis
      const nonCompliant = owaspMappings.filter(m => m.overallStatus === ComplianceStatus.NON_COMPLIANT);
      
      if (nonCompliant.length > 0) {
        section += `### Non-Compliant Controls (${nonCompliant.length})\n\n`;
        
        nonCompliant.forEach(mapping => {
          const control = mapping.mappedControls[0]?.control;
          if (control) {
            section += `#### ${control.title} (${control.id})\n\n`;
            section += `**Status:** ${mapping.overallStatus}  \n`;
            section += `**Vulnerability:** ${mapping.vulnerabilityId}  \n`;
            section += `**Gaps:** ${mapping.gapAnalysis.length}  \n\n`;
            
            if (mapping.gapAnalysis.length > 0) {
              section += `**Identified Gaps:**\n`;
              mapping.gapAnalysis.forEach(gap => {
                section += `- ${gap.gapDescription}\n`;
              });
              section += '\n';
            }
            
            if (mapping.recommendedActions.length > 0) {
              section += `**Recommendations:**\n`;
              mapping.recommendedActions.forEach(rec => {
                section += `- ${rec}\n`;
              });
              section += '\n';
            }
            
            section += '---\n\n';
          }
        });
      }
    }

    return section;
  }

  private generateDetailedFindings(vulnerabilities: VulnerabilityFinding[], options: InfrastructureReportOptions): string {
    let section = `## Detailed Security Findings

`;

    const groupedVulns = this.groupVulnerabilitiesByCategory(vulnerabilities);
    
    Object.entries(groupedVulns).forEach(([category, vulns]) => {
      section += `### ${this.getCategoryIcon(category as VulnerabilityCategory)} ${category}\n\n`;
      
      const vulnsToShow = vulns.slice(0, options.maxFindingsPerCategory);
      
      vulnsToShow.forEach((vuln, index) => {
        const severityIcon = this.getSeverityIcon(vuln.severity);
        
        section += `#### ${severityIcon} ${vuln.title}\n\n`;
        section += `**Severity:** ${vuln.severity}  \n`;
        section += `**CWE ID:** ${vuln.cweId || 'N/A'}  \n`;
        section += `**File:** \`${path.basename(vuln.location.filePath)}\`  \n`;
        section += `**Line:** ${vuln.location.lineNumber || 'N/A'}  \n\n`;
        
        section += `**Description:** ${vuln.description}\n\n`;
        section += `**Impact:** ${vuln.impact}\n\n`;
        section += `**Likelihood:** ${vuln.likelihood}\n\n`;
        
        if (vuln.evidence.length > 0) {
          section += `**Evidence:**\n`;
          vuln.evidence.forEach(evidence => {
            section += `- ${evidence}\n`;
          });
          section += '\n';
        }
        
        if (vuln.location.codeSnippet) {
          section += `**Code Snippet:**\n\`\`\`typescript\n${vuln.location.codeSnippet}\n\`\`\`\n\n`;
        }
        
        section += '---\n\n';
      });
      
      if (vulns.length > options.maxFindingsPerCategory) {
        const remaining = vulns.length - options.maxFindingsPerCategory;
        section += `*... and ${remaining} more ${category} findings*\n\n`;
      }
    });

    return section;
  }

  private generateRemediationPlans(vulnerabilities: VulnerabilityFinding[]): string {
    let section = `## Remediation Roadmap

### Priority-Based Action Plan

`;

    // Group by priority and severity
    const criticalVulns = vulnerabilities.filter(v => v.severity === VulnerabilitySeverity.CRITICAL);
    const highVulns = vulnerabilities.filter(v => v.severity === VulnerabilitySeverity.HIGH);
    const mediumVulns = vulnerabilities.filter(v => v.severity === VulnerabilitySeverity.MEDIUM);
    const lowVulns = vulnerabilities.filter(v => v.severity === VulnerabilitySeverity.LOW);

    if (criticalVulns.length > 0) {
      section += `### 🔴 Immediate Action Required (Critical)\n\n`;
      section += `**Timeline:** Within 24 hours  \n`;
      section += `**Vulnerabilities:** ${criticalVulns.length}  \n\n`;
      
      criticalVulns.slice(0, 5).forEach(vuln => {
        section += `#### ${vuln.title}\n`;
        section += `**File:** \`${path.basename(vuln.location.filePath)}\`  \n`;
        section += `**Remediation:** ${vuln.remediation.summary}  \n`;
        section += `**Effort:** ${vuln.remediation.estimatedEffort}  \n\n`;
        
        vuln.remediation.steps.forEach(step => {
          section += `${step.stepNumber}. ${step.description}\n`;
          if (step.codeChanges) {
            section += `   - Code: ${step.codeChanges}\n`;
          }
          if (step.configurationChanges) {
            section += `   - Config: ${step.configurationChanges}\n`;
          }
        });
        section += '\n';
      });
    }

    if (highVulns.length > 0) {
      section += `### 🟠 High Priority (Within 1 Week)\n\n`;
      section += `**Vulnerabilities:** ${highVulns.length}  \n\n`;
      
      highVulns.slice(0, 3).forEach(vuln => {
        section += `- **${vuln.title}** (${path.basename(vuln.location.filePath)})\n`;
        section += `  - ${vuln.remediation.summary}\n`;
        section += `  - Effort: ${vuln.remediation.estimatedEffort}\n\n`;
      });
    }

    if (mediumVulns.length > 0) {
      section += `### 🟡 Medium Priority (Within 2 Weeks)\n\n`;
      section += `**Vulnerabilities:** ${mediumVulns.length}  \n\n`;
      
      const groupedMedium = this.groupVulnerabilitiesByCategory(mediumVulns);
      Object.entries(groupedMedium).forEach(([category, vulns]) => {
        section += `**${category}:** ${vulns.length} issues\n`;
      });
      section += '\n';
    }

    if (lowVulns.length > 0) {
      section += `### 🟢 Low Priority (Within 1 Month)\n\n`;
      section += `**Vulnerabilities:** ${lowVulns.length}  \n\n`;
      section += `These items represent security improvements and best practices that should be addressed during regular maintenance cycles.\n\n`;
    }

    return section;
  }

  private generateTechnicalAppendix(scanResult: ScanResult): string {
    let section = `## Technical Appendix

### Scan Metadata

- **Scanner Version:** ${scanResult.scannerVersion}
- **Scan Start:** ${scanResult.startTime.toISOString()}
- **Scan End:** ${scanResult.endTime.toISOString()}
- **Duration:** ${Math.round(scanResult.metadata.scanDuration / 1000)} seconds
- **Files Processed:** ${scanResult.filesScanned}
- **Rules Applied:** ${scanResult.metadata.rulesApplied}
- **Memory Usage:** ${Math.round(scanResult.metadata.memoryUsage / 1024 / 1024)} MB
- **Confidence Score:** ${scanResult.metadata.confidence}%

### Vulnerability Distribution

`;

    const severityCounts = this.countBySeverity(scanResult.vulnerabilities);
    const categoryCounts = this.countByCategory(scanResult.vulnerabilities);

    section += `#### By Severity\n\n`;
    Object.entries(severityCounts).forEach(([severity, count]) => {
      const icon = this.getSeverityIcon(severity as VulnerabilitySeverity);
      section += `- ${icon} ${severity}: ${count}\n`;
    });

    section += `\n#### By Category\n\n`;
    Object.entries(categoryCounts).forEach(([category, count]) => {
      section += `- ${category}: ${count}\n`;
    });

    if (scanResult.errors.length > 0) {
      section += `\n### Scan Errors\n\n`;
      section += `${scanResult.errors.length} errors encountered during scanning:\n\n`;
      
      scanResult.errors.slice(0, 10).forEach((error, index) => {
        section += `${index + 1}. **${error.errorType}** in \`${path.basename(error.filePath)}\`\n`;
        section += `   ${error.message}\n\n`;
      });
      
      if (scanResult.errors.length > 10) {
        section += `*... and ${scanResult.errors.length - 10} more errors*\n\n`;
      }
    }

    section += `### References

- [OWASP Top 10 2021](https://owasp.org/www-project-top-ten/)
- [AWS Security Best Practices](https://docs.aws.amazon.com/security/)
- [CWE Common Weakness Enumeration](https://cwe.mitre.org/)
- [AWS CDK Security Best Practices](https://docs.aws.amazon.com/cdk/latest/guide/best-practices.html)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

### Disclaimer

This report is generated by automated security scanning tools and should be reviewed by qualified security professionals. The findings represent potential security issues that require manual verification and assessment in the context of your specific environment and requirements.
`;

    return section;
  }

  // Helper methods
  private countBySeverity(vulnerabilities: VulnerabilityFinding[]): Record<string, number> {
    return vulnerabilities.reduce((acc, vuln) => {
      acc[vuln.severity] = (acc[vuln.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private countByCategory(vulnerabilities: VulnerabilityFinding[]): Record<string, number> {
    return vulnerabilities.reduce((acc, vuln) => {
      acc[vuln.category] = (acc[vuln.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupVulnerabilitiesByCategory(vulnerabilities: VulnerabilityFinding[]): Record<string, VulnerabilityFinding[]> {
    return vulnerabilities.reduce((acc, vuln) => {
      if (!acc[vuln.category]) acc[vuln.category] = [];
      acc[vuln.category].push(vuln);
      return acc;
    }, {} as Record<string, VulnerabilityFinding[]>);
  }

  private generateSummaryData(scanResult: ScanResult) {
    return {
      totalVulnerabilities: scanResult.vulnerabilities.length,
      severityBreakdown: this.countBySeverity(scanResult.vulnerabilities),
      categoryBreakdown: this.countByCategory(scanResult.vulnerabilities),
      riskLevel: this.calculateOverallRiskLevel(scanResult.vulnerabilities),
      complianceStatus: this.calculateComplianceStatus(scanResult.complianceMappings)
    };
  }

  private generateRecommendations(vulnerabilities: VulnerabilityFinding[]): string[] {
    const recommendations = new Set<string>();
    
    vulnerabilities.forEach(vuln => {
      vuln.remediation.steps.forEach(step => {
        if (step.description) {
          recommendations.add(step.description);
        }
      });
    });
    
    return Array.from(recommendations).slice(0, 10);
  }

  private getRiskDescription(riskLevel: string): string {
    switch (riskLevel) {
      case 'Critical': return 'a critical';
      case 'High': return 'a high-risk';
      case 'Medium': return 'a moderate';
      case 'Low': return 'a low-risk';
      default: return 'an unknown';
    }
  }

  private getActionUrgency(riskLevel: string): string {
    switch (riskLevel) {
      case 'Critical': return 'immediate';
      case 'High': return 'urgent';
      case 'Medium': return 'prompt';
      case 'Low': return 'routine';
      default: return 'appropriate';
    }
  }

  private getTopConcerns(categoryCounts: Record<string, number>): string {
    const sortedCategories = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    
    return sortedCategories
      .map(([category, count]) => `- **${category}:** ${count} issues`)
      .join('\n');
  }

  private getBusinessImpact(riskLevel: string, criticalAndHigh: number): string {
    if (riskLevel === 'Critical') {
      return `The identified critical vulnerabilities pose **significant business risk** including potential data breaches, service disruptions, and compliance violations. Immediate remediation is essential to prevent security incidents.`;
    } else if (riskLevel === 'High') {
      return `The security issues identified could lead to **moderate business impact** including unauthorized access, data exposure, and potential compliance issues. Prompt attention is recommended.`;
    } else if (riskLevel === 'Medium') {
      return `The findings represent **manageable security risks** that should be addressed to maintain good security posture and prevent potential future issues.`;
    } else {
      return `The identified issues represent **low business risk** and can be addressed during regular maintenance cycles to improve overall security posture.`;
    }
  }

  private getExecutiveRecommendations(riskLevel: string, severityCounts: Record<string, number>): string {
    const recommendations = [];
    
    if (severityCounts.Critical > 0) {
      recommendations.push('1. **Immediate Action:** Address all critical vulnerabilities within 24 hours');
    }
    
    if (severityCounts.High > 0) {
      recommendations.push('2. **Priority Focus:** Remediate high-severity issues within 1 week');
    }
    
    recommendations.push('3. **Process Improvement:** Implement infrastructure security scanning in CI/CD pipeline');
    recommendations.push('4. **Training:** Provide security awareness training for development teams');
    recommendations.push('5. **Monitoring:** Establish continuous security monitoring and alerting');
    
    return recommendations.join('\n');
  }

  private getRiskIcon(riskLevel: string): string {
    switch (riskLevel) {
      case 'Critical': return '🔴';
      case 'High': return '🟠';
      case 'Medium': return '🟡';
      case 'Low': return '🟢';
      default: return '⚪';
    }
  }

  private getSeverityIcon(severity: VulnerabilitySeverity): string {
    switch (severity) {
      case VulnerabilitySeverity.CRITICAL: return '🔴';
      case VulnerabilitySeverity.HIGH: return '🟠';
      case VulnerabilitySeverity.MEDIUM: return '🟡';
      case VulnerabilitySeverity.LOW: return '🟢';
      default: return '⚪';
    }
  }

  private getCategoryIcon(category: VulnerabilityCategory): string {
    switch (category) {
      case VulnerabilityCategory.AUTHORIZATION_FAILURE: return '🔐';
      case VulnerabilityCategory.CRYPTOGRAPHIC_FAILURE: return '🔒';
      case VulnerabilityCategory.INSECURE_CONFIGURATION: return '⚙️';
      case VulnerabilityCategory.HARDCODED_SECRETS: return '🔑';
      case VulnerabilityCategory.AUTHENTICATION_BYPASS: return '🚪';
      case VulnerabilityCategory.LOGGING_FAILURE: return '📝';
      default: return '⚠️';
    }
  }

  private calculateOverallRiskLevel(vulnerabilities: VulnerabilityFinding[]): string {
    const severityCounts = this.countBySeverity(vulnerabilities);
    const criticalCount = severityCounts.Critical || 0;
    const highCount = severityCounts.High || 0;
    
    if (criticalCount > 0) return 'Critical';
    if (highCount > 2) return 'High';
    if (highCount > 0) return 'Medium';
    return 'Low';
  }

  private calculateComplianceStatus(complianceMappings: ComplianceMapping[]): string {
    if (complianceMappings.length === 0) return 'Unknown';
    
    const nonCompliant = complianceMappings.filter(m => m.overallStatus === ComplianceStatus.NON_COMPLIANT);
    const complianceRate = ((complianceMappings.length - nonCompliant.length) / complianceMappings.length) * 100;
    
    if (complianceRate >= 90) return 'Excellent';
    if (complianceRate >= 75) return 'Good';
    if (complianceRate >= 50) return 'Fair';
    return 'Poor';
  }
}