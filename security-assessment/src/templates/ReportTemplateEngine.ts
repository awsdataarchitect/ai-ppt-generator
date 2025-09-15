/**
 * Report Template Engine
 * 
 * Professional markdown report template system for security assessments
 * Provides consistent formatting, vulnerability detail templates, and compliance reporting
 */

import { VulnerabilityFinding, VulnerabilitySeverity, VulnerabilityCategory } from '../types/VulnerabilityTypes';
import { RiskAssessment, RiskLevel, BusinessImpactType } from '../types/RiskAssessmentTypes';
import { ComplianceMapping, ComplianceFramework, ComplianceStatus } from '../types/ComplianceTypes';
import { SecurityMetrics, ConsolidatedScanResult } from '../reports/ComprehensiveSecurityReportGenerator';
import * as path from 'path';

export interface TemplateContext {
  readonly projectName: string;
  readonly assessmentDate: Date;
  readonly vulnerabilities: VulnerabilityFinding[];
  readonly riskAssessments: RiskAssessment[];
  readonly complianceMappings: ComplianceMapping[];
  readonly securityMetrics: SecurityMetrics;
  readonly scanResults: ConsolidatedScanResult;
  readonly customData?: Record<string, any>;
}

export interface TemplateOptions {
  readonly includeTableOfContents: boolean;
  readonly includeExecutiveSummary: boolean;
  readonly includeVulnerabilityDetails: boolean;
  readonly includeRiskMatrix: boolean;
  readonly includeComplianceGaps: boolean;
  readonly includeRemediationPlans: boolean;
  readonly includeTechnicalAppendix: boolean;
  readonly includeSecurityMetrics: boolean;
  readonly customSections?: CustomTemplateSection[];
  readonly branding?: BrandingOptions;
}

export interface CustomTemplateSection {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly position: 'header' | 'after-summary' | 'before-findings' | 'after-findings' | 'appendix';
  readonly order: number;
}

export interface BrandingOptions {
  readonly organizationName?: string;
  readonly logoUrl?: string;
  readonly primaryColor?: string;
  readonly footerText?: string;
  readonly contactInfo?: string;
}

export class ReportTemplateEngine {
  private readonly defaultOptions: TemplateOptions = {
    includeTableOfContents: true,
    includeExecutiveSummary: true,
    includeVulnerabilityDetails: true,
    includeRiskMatrix: true,
    includeComplianceGaps: true,
    includeRemediationPlans: true,
    includeTechnicalAppendix: true,
    includeSecurityMetrics: true
  };

  /**
   * Generate complete security assessment report using professional templates
   */
  public generateReport(
    context: TemplateContext,
    options: Partial<TemplateOptions> = {}
  ): string {
    const templateOptions = { ...this.defaultOptions, ...options };
    let report = '';

    // Document header with branding
    report += this.renderDocumentHeader(context, templateOptions);

    // Table of contents
    if (templateOptions.includeTableOfContents) {
      report += this.renderTableOfContents(templateOptions);
    }

    // Custom sections - header position
    if (templateOptions.customSections) {
      report += this.renderCustomSections(templateOptions.customSections, 'header');
    }

    // Executive summary
    if (templateOptions.includeExecutiveSummary) {
      report += this.renderExecutiveSummary(context);
    }

    // Security metrics dashboard
    if (templateOptions.includeSecurityMetrics) {
      report += this.renderSecurityMetricsDashboard(context);
    }

    // Custom sections - after summary
    if (templateOptions.customSections) {
      report += this.renderCustomSections(templateOptions.customSections, 'after-summary');
    }

    // Risk matrix visualization
    if (templateOptions.includeRiskMatrix) {
      report += this.renderRiskMatrix(context);
    }

    // Custom sections - before findings
    if (templateOptions.customSections) {
      report += this.renderCustomSections(templateOptions.customSections, 'before-findings');
    }

    // Detailed vulnerability findings
    if (templateOptions.includeVulnerabilityDetails) {
      report += this.renderVulnerabilityDetails(context);
    }

    // Compliance gap analysis
    if (templateOptions.includeComplianceGaps) {
      report += this.renderComplianceGapAnalysis(context);
    }

    // Custom sections - after findings
    if (templateOptions.customSections) {
      report += this.renderCustomSections(templateOptions.customSections, 'after-findings');
    }

    // Remediation roadmap
    if (templateOptions.includeRemediationPlans) {
      report += this.renderRemediationRoadmap(context);
    }

    // Technical appendix
    if (templateOptions.includeTechnicalAppendix) {
      report += this.renderTechnicalAppendix(context);
    }

    // Custom sections - appendix
    if (templateOptions.customSections) {
      report += this.renderCustomSections(templateOptions.customSections, 'appendix');
    }

    // Document footer
    report += this.renderDocumentFooter(context, templateOptions);

    return report;
  }

  /**
   * Render professional document header with metadata
   */
  private renderDocumentHeader(context: TemplateContext, options: TemplateOptions): string {
    const date = context.assessmentDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const time = context.assessmentDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    const organizationName = options.branding?.organizationName || 'Security Assessment Team';
    const contactInfo = options.branding?.contactInfo || '';

    return `# 🛡️ Comprehensive Security Assessment Report

<div align="center">

## ${context.projectName}

**Security Vulnerability Assessment & Risk Analysis**

---

**Assessment Date:** ${date} at ${time}  
**Prepared by:** ${organizationName}  
**Report Version:** 1.0  
**Classification:** Confidential  

${contactInfo ? `**Contact:** ${contactInfo}` : ''}

---

</div>

## Document Information

| Field | Value |
|-------|-------|
| **Project Name** | ${context.projectName} |
| **Assessment Type** | Comprehensive Security Vulnerability Assessment |
| **Assessment Date** | ${date} |
| **Total Files Analyzed** | ${context.scanResults.totalFiles.toLocaleString()} |
| **Total Vulnerabilities Found** | ${context.vulnerabilities.length.toLocaleString()} |
| **Scan Duration** | ${Math.round(context.scanResults.scanDuration / 1000)}s |
| **Overall Risk Score** | ${context.securityMetrics.overallRiskScore.toFixed(1)}/100 |
| **Security Grade** | ${context.securityMetrics.securityPostureGrade} |
| **Business Risk Level** | ${context.securityMetrics.businessRiskLevel} |

### ⚠️ Important Notice

This security assessment report contains sensitive information about potential vulnerabilities in the ${context.projectName} system. This document should be treated as **CONFIDENTIAL** and distributed only to authorized personnel with a legitimate need to know.

---

`;
  }

  /**
   * Render table of contents with page references
   */
  private renderTableOfContents(options: TemplateOptions): string {
    let toc = `## 📋 Table of Contents

`;

    let sectionNumber = 1;

    if (options.includeExecutiveSummary) {
      toc += `${sectionNumber++}. [Executive Summary](#executive-summary)\n`;
    }

    if (options.includeSecurityMetrics) {
      toc += `${sectionNumber++}. [Security Metrics Dashboard](#security-metrics-dashboard)\n`;
    }

    if (options.includeRiskMatrix) {
      toc += `${sectionNumber++}. [Risk Assessment Matrix](#risk-assessment-matrix)\n`;
    }

    if (options.includeVulnerabilityDetails) {
      toc += `${sectionNumber++}. [Detailed Vulnerability Analysis](#detailed-vulnerability-analysis)\n`;
      toc += `   ${sectionNumber - 1}.1. [Critical Severity Vulnerabilities](#critical-severity-vulnerabilities)\n`;
      toc += `   ${sectionNumber - 1}.2. [High Severity Vulnerabilities](#high-severity-vulnerabilities)\n`;
      toc += `   ${sectionNumber - 1}.3. [Medium Severity Vulnerabilities](#medium-severity-vulnerabilities)\n`;
      toc += `   ${sectionNumber - 1}.4. [Low Severity Vulnerabilities](#low-severity-vulnerabilities)\n`;
    }

    if (options.includeComplianceGaps) {
      toc += `${sectionNumber++}. [Compliance Framework Assessment](#compliance-framework-assessment)\n`;
    }

    if (options.includeRemediationPlans) {
      toc += `${sectionNumber++}. [Remediation Roadmap](#remediation-roadmap)\n`;
    }

    if (options.includeTechnicalAppendix) {
      toc += `${sectionNumber++}. [Technical Appendix](#technical-appendix)\n`;
      toc += `   ${sectionNumber - 1}.1. [Scanner Configuration](#scanner-configuration)\n`;
      toc += `   ${sectionNumber - 1}.2. [Methodology](#methodology)\n`;
      toc += `   ${sectionNumber - 1}.3. [References](#references)\n`;
    }

    return toc + '\n---\n\n';
  }

  // Helper methods for template rendering
  private countVulnerabilitiesBySeverity(vulnerabilities: VulnerabilityFinding[]): Record<VulnerabilitySeverity, number> {
    return vulnerabilities.reduce((counts, vuln) => {
      counts[vuln.severity] = (counts[vuln.severity] || 0) + 1;
      return counts;
    }, {} as Record<VulnerabilitySeverity, number>);
  }

  private renderCustomSections(sections: CustomTemplateSection[], position: string): string {
    return sections
      .filter(section => section.position === position)
      .sort((a, b) => a.order - b.order)
      .map(section => `## ${section.title}\n\n${section.content}\n\n---\n\n`)
      .join('');
  }

  private renderDocumentFooter(context: TemplateContext, options: TemplateOptions): string {
    const footerText = options.branding?.footerText || 'Security Assessment Report';
    const organizationName = options.branding?.organizationName || 'Security Team';
    
    return `---

<div align="center">

**${footerText}**

Generated on ${context.assessmentDate.toLocaleDateString()} by ${organizationName}

*This document contains confidential security information and should be handled according to your organization's data classification policies.*

</div>

`;
  }

  // Placeholder methods - will be implemented in the next part
  private renderExecutiveSummary(context: TemplateContext): string {
    return '## Executive Summary\n\nPlaceholder for executive summary\n\n---\n\n';
  }

  private renderSecurityMetricsDashboard(context: TemplateContext): string {
    return '## Security Metrics Dashboard\n\nPlaceholder for security metrics\n\n---\n\n';
  }

  private renderRiskMatrix(context: TemplateContext): string {
    return '## Risk Assessment Matrix\n\nPlaceholder for risk matrix\n\n---\n\n';
  }

  private renderVulnerabilityDetails(context: TemplateContext): string {
    return '## Detailed Vulnerability Analysis\n\nPlaceholder for vulnerability details\n\n---\n\n';
  }

  private renderComplianceGapAnalysis(context: TemplateContext): string {
    return '## Compliance Framework Assessment\n\nPlaceholder for compliance analysis\n\n---\n\n';
  }

  private renderRemediationRoadmap(context: TemplateContext): string {
    return '## Remediation Roadmap\n\nPlaceholder for remediation roadmap\n\n---\n\n';
  }

  private renderTechnicalAppendix(context: TemplateContext): string {
    return '## Technical Appendix\n\nPlaceholder for technical appendix\n\n---\n\n';
  }
}

// Export all interfaces and classes
export { TemplateContext, TemplateOptions, CustomTemplateSection, BrandingOptions };