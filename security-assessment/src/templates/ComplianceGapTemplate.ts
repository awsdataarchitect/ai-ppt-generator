/**
 * Compliance Gap Analysis Template
 * 
 * Professional template for generating compliance framework assessments
 * Maps security findings to regulatory requirements and identifies gaps
 */

import { ComplianceMapping, ComplianceFramework, ComplianceStatus, ComplianceControl } from '../types/ComplianceTypes';
import { VulnerabilityFinding, VulnerabilitySeverity } from '../types/VulnerabilityTypes';

export interface ComplianceGapContext {
  readonly complianceMappings: ComplianceMapping[];
  readonly vulnerabilities: VulnerabilityFinding[];
  readonly projectName: string;
  readonly assessmentDate: Date;
}

export interface ComplianceGapOptions {
  readonly includeFrameworkOverview: boolean;
  readonly includeGapAnalysis: boolean;
  readonly includeRemediationPlan: boolean;
  readonly includeComplianceRoadmap: boolean;
  readonly prioritizeByRisk: boolean;
  readonly maxGapsPerFramework: number;
}

export class ComplianceGapTemplate {
  private readonly defaultOptions: ComplianceGapOptions = {
    includeFrameworkOverview: true,
    includeGapAnalysis: true,
    includeRemediationPlan: true,
    includeComplianceRoadmap: true,
    prioritizeByRisk: true,
    maxGapsPerFramework: 20
  };

  /**
   * Generate comprehensive compliance gap analysis
   */
  public generateComplianceGapAnalysis(
    context: ComplianceGapContext,
    options: Partial<ComplianceGapOptions> = {}
  ): string {
    const gapOptions = { ...this.defaultOptions, ...options };
    
    let analysis = this.renderComplianceHeader(context);
    
    if (gapOptions.includeFrameworkOverview) {
      analysis += this.renderFrameworkOverview(context, gapOptions);
    }
    
    if (gapOptions.includeGapAnalysis) {
      analysis += this.renderDetailedGapAnalysis(context, gapOptions);
    }
    
    if (gapOptions.includeRemediationPlan) {
      analysis += this.renderComplianceRemediationPlan(context, gapOptions);
    }
    
    if (gapOptions.includeComplianceRoadmap) {
      analysis += this.renderComplianceRoadmap(context, gapOptions);
    }
    
    return analysis;
  }

  private renderComplianceHeader(context: ComplianceGapContext): string {
    const frameworkCounts = this.getFrameworkCounts(context.complianceMappings);
    const totalControls = this.getTotalControlCount(context.complianceMappings);
    const compliantControls = this.getCompliantControlCount(context.complianceMappings);
    const overallComplianceRate = totalControls > 0 ? (compliantControls / totalControls) * 100 : 0;
    
    return `## 📋 Compliance Framework Assessment

### Regulatory Compliance Overview

This section evaluates the current security posture of **${context.projectName}** against major compliance frameworks and regulatory requirements. The assessment identifies gaps that need to be addressed for regulatory compliance and provides a roadmap for achieving compliance objectives.

**Assessment Summary:**
- **Frameworks Evaluated:** ${Object.keys(frameworkCounts).length}
- **Total Controls Assessed:** ${totalControls}
- **Compliant Controls:** ${compliantControls}
- **Overall Compliance Rate:** ${overallComplianceRate.toFixed(1)}% ${this.getComplianceStatusIcon(overallComplianceRate)}
- **Assessment Date:** ${context.assessmentDate.toLocaleDateString()}

### Compliance Status Dashboard

\`\`\`
┌─────────────────────────────────────────────────────────────────────┐
│                    COMPLIANCE SCORECARD                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Overall Compliance:     ${overallComplianceRate.toFixed(1).padStart(6)}%  ${this.getScoreBar(overallComplianceRate, 20)}  │
│  Compliant Controls:     ${compliantControls.toString().padStart(6)}/${totalControls}  ${this.getControlsBar(compliantControls, totalControls, 20)}  │
│  Regulatory Risk:        ${this.getRegulatoryRiskLevel(overallComplianceRate).padStart(11)}  ${this.getRegulatoryRiskIcon(overallComplianceRate)}  │
│  Audit Readiness:        ${this.getAuditReadiness(overallComplianceRate).padStart(11)}  ${this.getAuditReadinessIcon(overallComplianceRate)}  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
\`\`\`

`;
  }

  private renderFrameworkOverview(context: ComplianceGapContext, options: ComplianceGapOptions): string {
    const frameworkGroups = this.groupMappingsByFramework(context.complianceMappings);
    
    let overview = `### Compliance Framework Status

**Framework Assessment Results:**

| Framework | Controls | Compliant | Non-Compliant | Compliance Rate | Status |
|-----------|----------|-----------|---------------|-----------------|--------|
`;

    Object.entries(frameworkGroups).forEach(([framework, mappings]) => {
      const totalControls = this.getFrameworkControlCount(mappings);
      const compliantControls = this.getFrameworkCompliantCount(mappings);
      const nonCompliantControls = totalControls - compliantControls;
      const complianceRate = totalControls > 0 ? (compliantControls / totalControls) * 100 : 0;
      const status = this.getFrameworkStatus(complianceRate);
      const icon = this.getFrameworkIcon(framework as ComplianceFramework);
      
      overview += `| ${icon} ${framework} | ${totalControls} | ${compliantControls} | ${nonCompliantControls} | ${complianceRate.toFixed(1)}% | ${status} |\n`;
    });

    overview += '\n';

    // Framework-specific details
    Object.entries(frameworkGroups).forEach(([framework, mappings]) => {
      overview += this.renderFrameworkDetails(framework as ComplianceFramework, mappings);
    });

    return overview;
  }

  private renderFrameworkDetails(framework: ComplianceFramework, mappings: ComplianceMapping[]): string {
    const totalControls = this.getFrameworkControlCount(mappings);
    const compliantControls = this.getFrameworkCompliantCount(mappings);
    const complianceRate = totalControls > 0 ? (compliantControls / totalControls) * 100 : 0;
    const nonCompliantMappings = this.getNonCompliantMappings(mappings);
    
    let details = `#### ${this.getFrameworkIcon(framework)} ${framework}\n\n`;
    details += `**Compliance Status:** ${this.getComplianceStatusBadge(complianceRate)} ${complianceRate.toFixed(1)}% (${compliantControls}/${totalControls} controls)\n\n`;
    details += `**Progress:** [${this.createProgressBar(complianceRate, 100, 20, '█')}] ${complianceRate.toFixed(1)}%\n\n`;
    
    if (nonCompliantMappings.length > 0) {
      details += `**🔴 Non-Compliant Controls (${nonCompliantMappings.length}):**\n\n`;
      details += `| Control | Title | Vulnerability | Gap Analysis |\n`;
      details += `|---------|-------|---------------|-------------|\n`;
      
      nonCompliantMappings.slice(0, 10).forEach(mapping => {
        mapping.mappedControls.forEach(controlMapping => {
          if (controlMapping.status === ComplianceStatus.NON_COMPLIANT) {
            const gaps = controlMapping.gaps.slice(0, 2).join(', ');
            details += `| ${controlMapping.control.controlNumber} | ${controlMapping.control.title} | ${mapping.vulnerabilityId} | ${gaps} |\n`;
          }
        });
      });
      
      if (nonCompliantMappings.length > 10) {
        details += `\n*... and ${nonCompliantMappings.length - 10} more non-compliant controls*\n`;
      }
    } else {
      details += `**✅ All Controls Compliant:** No compliance gaps identified for this framework.\n`;
    }
    
    details += `\n**Key Requirements:**\n`;
    details += this.getFrameworkKeyRequirements(framework);
    
    details += `\n**Regulatory Impact:**\n`;
    details += this.getFrameworkRegulatoryImpact(framework, complianceRate);
    
    details += '\n---\n\n';
    
    return details;
  }

  private renderDetailedGapAnalysis(context: ComplianceGapContext, options: ComplianceGapOptions): string {
    const criticalGaps = this.getCriticalComplianceGaps(context.complianceMappings, context.vulnerabilities);
    const gapsByCategory = this.groupGapsByCategory(context.complianceMappings);
    
    let analysis = `### Detailed Gap Analysis

**Critical Compliance Gaps:**

${criticalGaps.length > 0 ? `
The following compliance gaps pose the highest risk to regulatory compliance and require immediate attention:

${criticalGaps.map((gap, index) => this.renderCriticalGap(gap, index + 1)).join('\n')}
` : `
✅ **No Critical Gaps:** No critical compliance gaps identified that require immediate attention.
`}

**Gap Analysis by Category:**

${Object.entries(gapsByCategory).map(([category, gaps]) => 
  this.renderGapCategory(category, gaps)
).join('\n')}

**Risk-Based Gap Prioritization:**

${this.renderGapPrioritization(context.complianceMappings, context.vulnerabilities, options)}

`;

    return analysis;
  }

  private renderCriticalGap(gap: any, index: number): string {
    return `#### 🚨 Critical Gap ${index}: ${gap.framework} - ${gap.controlNumber}

**Control:** ${gap.controlTitle}
**Framework:** ${gap.framework}
**Vulnerability:** ${gap.vulnerabilityId}
**Risk Level:** ${gap.riskLevel}

**Gap Description:**
${gap.gaps.join('\n- ')}

**Business Impact:**
- **Regulatory Risk:** ${gap.regulatoryRisk}
- **Penalty Exposure:** ${gap.penaltyExposure}
- **Audit Impact:** ${gap.auditImpact}

**Immediate Actions Required:**
${gap.immediateActions.map((action: string) => `- ${action}`).join('\n')}

---
`;
  }

  private renderGapCategory(category: string, gaps: any[]): string {
    return `**${category} (${gaps.length} gaps):**
${gaps.slice(0, 5).map(gap => `- ${gap.framework} ${gap.controlNumber}: ${gap.controlTitle}`).join('\n')}
${gaps.length > 5 ? `\n*... and ${gaps.length - 5} more gaps in this category*` : ''}

`;
  }

  private renderGapPrioritization(
    mappings: ComplianceMapping[], 
    vulnerabilities: VulnerabilityFinding[], 
    options: ComplianceGapOptions
  ): string {
    const prioritizedGaps = this.prioritizeGaps(mappings, vulnerabilities, options.prioritizeByRisk);
    
    return `| Priority | Framework | Control | Vulnerability Severity | Business Impact | Timeline |
|----------|-----------|---------|----------------------|-----------------|----------|
${prioritizedGaps.slice(0, 15).map((gap, index) => 
  `| ${index + 1} | ${gap.framework} | ${gap.controlNumber} | ${gap.severity} | ${gap.businessImpact} | ${gap.timeline} |`
).join('\n')}

`;
  }

  private renderComplianceRemediationPlan(context: ComplianceGapContext, options: ComplianceGapOptions): string {
    const remediationPhases = this.createComplianceRemediationPhases(context.complianceMappings, context.vulnerabilities);
    
    let plan = `### Compliance Remediation Plan

**Strategic Compliance Approach:**

This remediation plan addresses compliance gaps in a phased approach, prioritizing high-risk areas and regulatory requirements with the greatest business impact.

`;

    remediationPhases.forEach((phase, index) => {
      const phaseNumber = index + 1;
      const phaseIcon = this.getPhaseIcon(phase.priority);
      
      plan += `#### ${phaseIcon} Phase ${phaseNumber}: ${phase.title}\n\n`;
      plan += `**🎯 Objective:** ${phase.objective}\n`;
      plan += `**⏱️ Timeline:** ${phase.timeline}\n`;
      plan += `**💰 Investment:** ${phase.investment}\n`;
      plan += `**📈 Compliance Improvement:** ${phase.complianceImprovement}\n\n`;
      
      plan += `**Key Deliverables:**\n`;
      phase.deliverables.forEach(deliverable => {
        plan += `- ${deliverable}\n`;
      });
      
      plan += `\n**Success Criteria:**\n`;
      phase.successCriteria.forEach(criteria => {
        plan += `- ${criteria}\n`;
      });
      
      plan += `\n**Regulatory Benefits:**\n`;
      phase.regulatoryBenefits.forEach(benefit => {
        plan += `- ${benefit}\n`;
      });
      
      plan += '\n---\n\n';
    });

    return plan;
  }

  private renderComplianceRoadmap(context: ComplianceGapContext, options: ComplianceGapOptions): string {
    const frameworks = Object.keys(this.groupMappingsByFramework(context.complianceMappings));
    
    return `### Compliance Achievement Roadmap

**Long-Term Compliance Strategy:**

\`\`\`
COMPLIANCE ROADMAP (12-MONTH TIMELINE)

Month 1-3: Foundation & Critical Gaps
├── Emergency compliance fixes
├── Critical control implementation
├── Regulatory notification preparation
└── Audit preparation initiation

Month 4-6: Core Compliance Implementation
├── Primary framework compliance
├── Process documentation
├── Staff training programs
└── Monitoring system deployment

Month 7-9: Advanced Compliance Features
├── Secondary framework alignment
├── Automated compliance monitoring
├── Third-party risk management
└── Continuous compliance processes

Month 10-12: Compliance Excellence
├── Full framework compliance
├── External audit preparation
├── Compliance optimization
└── Continuous improvement
\`\`\`

**Framework-Specific Milestones:**

${frameworks.map(framework => this.renderFrameworkMilestones(framework as ComplianceFramework)).join('\n')}

**Compliance Governance:**

- **Executive Oversight:** Monthly compliance committee meetings
- **Risk Management:** Quarterly compliance risk assessments
- **External Validation:** Annual third-party compliance audits
- **Continuous Monitoring:** Real-time compliance dashboard
- **Regulatory Updates:** Ongoing regulatory change management

**Investment & ROI:**

- **Total Investment:** $200,000 - $500,000 over 12 months
- **Penalty Avoidance:** $1M+ in potential regulatory penalties
- **Business Value:** Enhanced customer trust and market access
- **Operational Benefits:** Improved security posture and risk management
- **Competitive Advantage:** Compliance as business differentiator

**Success Metrics:**

| Metric | Current | 6 Months | 12 Months |
|--------|---------|----------|-----------|
| **Overall Compliance** | ${this.calculateOverallCompliance(context.complianceMappings)}% | 80% | 95% |
| **Critical Gaps** | ${this.getCriticalGapCount(context.complianceMappings)} | 0 | 0 |
| **Audit Readiness** | ${this.getAuditReadinessScore(context.complianceMappings)}% | 90% | 98% |
| **Regulatory Risk** | ${this.getRegulatoryRiskScore(context.complianceMappings)} | Low | Minimal |

---

`;
  }

  private renderFrameworkMilestones(framework: ComplianceFramework): string {
    const milestones = this.getFrameworkMilestones(framework);
    
    return `**${this.getFrameworkIcon(framework)} ${framework}:**
${milestones.map(milestone => `- **${milestone.timeline}:** ${milestone.description}`).join('\n')}

`;
  }

  // Helper methods
  private getFrameworkCounts(mappings: ComplianceMapping[]): Record<string, number> {
    const counts: Record<string, number> = {};
    
    mappings.forEach(mapping => {
      mapping.mappedControls.forEach(controlMapping => {
        const framework = controlMapping.control.framework;
        counts[framework] = (counts[framework] || 0) + 1;
      });
    });
    
    return counts;
  }

  private getTotalControlCount(mappings: ComplianceMapping[]): number {
    return mappings.reduce((total, mapping) => total + mapping.mappedControls.length, 0);
  }

  private getCompliantControlCount(mappings: ComplianceMapping[]): number {
    return mappings.reduce((total, mapping) => {
      return total + mapping.mappedControls.filter(c => c.status === ComplianceStatus.COMPLIANT).length;
    }, 0);
  }

  private groupMappingsByFramework(mappings: ComplianceMapping[]): Record<string, ComplianceMapping[]> {
    const groups: Record<string, ComplianceMapping[]> = {};
    
    mappings.forEach(mapping => {
      mapping.mappedControls.forEach(controlMapping => {
        const framework = controlMapping.control.framework;
        if (!groups[framework]) groups[framework] = [];
        if (!groups[framework].includes(mapping)) {
          groups[framework].push(mapping);
        }
      });
    });
    
    return groups;
  }

  private getFrameworkControlCount(mappings: ComplianceMapping[]): number {
    return mappings.reduce((total, mapping) => total + mapping.mappedControls.length, 0);
  }

  private getFrameworkCompliantCount(mappings: ComplianceMapping[]): number {
    return mappings.reduce((total, mapping) => {
      return total + mapping.mappedControls.filter(c => c.status === ComplianceStatus.COMPLIANT).length;
    }, 0);
  }

  private getNonCompliantMappings(mappings: ComplianceMapping[]): ComplianceMapping[] {
    return mappings.filter(mapping => 
      mapping.mappedControls.some(c => c.status === ComplianceStatus.NON_COMPLIANT)
    );
  }

  private getComplianceStatusIcon(rate: number): string {
    if (rate >= 90) return '🟢';
    if (rate >= 80) return '🟡';
    if (rate >= 70) return '🟠';
    return '🔴';
  }

  private getScoreBar(score: number, width: number = 20): string {
    const filled = Math.round((score / 100) * width);
    const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
    return `[${bar}]`;
  }

  private getControlsBar(compliant: number, total: number, width: number = 20): string {
    const rate = total > 0 ? (compliant / total) * 100 : 0;
    return this.getScoreBar(rate, width);
  }

  private getRegulatoryRiskLevel(complianceRate: number): string {
    if (complianceRate >= 90) return 'Low';
    if (complianceRate >= 80) return 'Medium';
    if (complianceRate >= 70) return 'High';
    return 'Critical';
  }

  private getRegulatoryRiskIcon(complianceRate: number): string {
    if (complianceRate >= 90) return '🟢 Minimal Risk';
    if (complianceRate >= 80) return '🟡 Moderate Risk';
    if (complianceRate >= 70) return '🟠 High Risk';
    return '🔴 Critical Risk';
  }

  private getAuditReadiness(complianceRate: number): string {
    if (complianceRate >= 95) return 'Ready';
    if (complianceRate >= 85) return 'Mostly Ready';
    if (complianceRate >= 75) return 'Preparation';
    return 'Not Ready';
  }

  private getAuditReadinessIcon(complianceRate: number): string {
    if (complianceRate >= 95) return '✅ Audit Ready';
    if (complianceRate >= 85) return '🟡 Minor Prep';
    if (complianceRate >= 75) return '🟠 Prep Required';
    return '🔴 Not Ready';
  }

  private getFrameworkStatus(complianceRate: number): string {
    if (complianceRate >= 90) return '✅ Compliant';
    if (complianceRate >= 80) return '🟡 Mostly Compliant';
    if (complianceRate >= 70) return '🟠 Partially Compliant';
    return '🔴 Non-Compliant';
  }

  private getFrameworkIcon(framework: ComplianceFramework): string {
    const icons = {
      [ComplianceFramework.OWASP_TOP_10]: '🛡️',
      [ComplianceFramework.NIST_CSF]: '🏛️',
      [ComplianceFramework.ISO_27001]: '📋',
      [ComplianceFramework.SOC2_TYPE_II]: '🔒',
      [ComplianceFramework.AWS_WELL_ARCHITECTED]: '☁️'
    };
    return icons[framework] || '📊';
  }

  private getComplianceStatusBadge(rate: number): string {
    if (rate >= 90) return '🟢';
    if (rate >= 80) return '🟡';
    if (rate >= 70) return '🟠';
    return '🔴';
  }

  private createProgressBar(value: number, max: number, width: number, char: string = '█'): string {
    const filled = Math.round((value / max) * width);
    return char.repeat(filled) + '░'.repeat(width - filled);
  }

  // Placeholder methods for complex calculations
  private getFrameworkKeyRequirements(framework: ComplianceFramework): string {
    const requirements = {
      [ComplianceFramework.OWASP_TOP_10]: '- Secure coding practices\n- Input validation\n- Authentication and authorization\n- Data protection',
      [ComplianceFramework.NIST_CSF]: '- Risk management framework\n- Security controls implementation\n- Incident response capabilities\n- Continuous monitoring',
      [ComplianceFramework.ISO_27001]: '- Information security management system\n- Risk assessment processes\n- Security policies and procedures\n- Management oversight',
      [ComplianceFramework.SOC2_TYPE_II]: '- Security controls design and operation\n- Access controls\n- System monitoring\n- Change management',
      [ComplianceFramework.AWS_WELL_ARCHITECTED]: '- Security pillar implementation\n- Identity and access management\n- Data protection\n- Infrastructure protection'
    };
    return requirements[framework] || '- Framework-specific requirements assessment needed';
  }

  private getFrameworkRegulatoryImpact(framework: ComplianceFramework, complianceRate: number): string {
    if (complianceRate >= 90) return '- Low regulatory risk\n- Audit-ready status\n- Competitive advantage';
    if (complianceRate >= 80) return '- Moderate regulatory risk\n- Minor compliance gaps\n- Audit preparation needed';
    if (complianceRate >= 70) return '- High regulatory risk\n- Significant compliance work required\n- Potential audit findings';
    return '- Critical regulatory risk\n- Major compliance violations\n- Immediate remediation required';
  }

  private getCriticalComplianceGaps(mappings: ComplianceMapping[], vulnerabilities: VulnerabilityFinding[]): any[] {
    // Implementation would identify critical gaps based on severity and regulatory impact
    return [];
  }

  private groupGapsByCategory(mappings: ComplianceMapping[]): Record<string, any[]> {
    // Implementation would group gaps by security category
    return {};
  }

  private prioritizeGaps(mappings: ComplianceMapping[], vulnerabilities: VulnerabilityFinding[], prioritizeByRisk: boolean): any[] {
    // Implementation would prioritize gaps based on risk and business impact
    return [];
  }

  private createComplianceRemediationPhases(mappings: ComplianceMapping[], vulnerabilities: VulnerabilityFinding[]): any[] {
    // Implementation would create phased remediation plan
    return [
      {
        title: 'Critical Compliance Fixes',
        objective: 'Address immediate regulatory violations',
        timeline: '0-30 days',
        investment: '$50,000 - $100,000',
        complianceImprovement: '20-30%',
        priority: 'critical',
        deliverables: ['Emergency security controls', 'Critical vulnerability fixes'],
        successCriteria: ['Zero critical compliance violations', 'Regulatory notification compliance'],
        regulatoryBenefits: ['Reduced penalty risk', 'Improved audit position']
      }
    ];
  }

  private getPhaseIcon(priority: string): string {
    const icons = {
      'critical': '🚨',
      'high': '🔥',
      'medium': '⚠️',
      'low': '📝'
    };
    return icons[priority] || '📋';
  }

  private getFrameworkMilestones(framework: ComplianceFramework): Array<{timeline: string, description: string}> {
    // Implementation would return framework-specific milestones
    return [
      { timeline: 'Month 3', description: 'Critical controls implemented' },
      { timeline: 'Month 6', description: 'Core compliance achieved' },
      { timeline: 'Month 9', description: 'Advanced features deployed' },
      { timeline: 'Month 12', description: 'Full compliance certification' }
    ];
  }

  private calculateOverallCompliance(mappings: ComplianceMapping[]): number {
    const total = this.getTotalControlCount(mappings);
    const compliant = this.getCompliantControlCount(mappings);
    return total > 0 ? Math.round((compliant / total) * 100) : 0;
  }

  private getCriticalGapCount(mappings: ComplianceMapping[]): number {
    // Implementation would count critical compliance gaps
    return 0;
  }

  private getAuditReadinessScore(mappings: ComplianceMapping[]): number {
    // Implementation would calculate audit readiness score
    return 75;
  }

  private getRegulatoryRiskScore(mappings: ComplianceMapping[]): string {
    // Implementation would assess regulatory risk level
    return 'Medium';
  }
}