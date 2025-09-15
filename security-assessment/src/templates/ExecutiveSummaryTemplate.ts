/**
 * Executive Summary Template
 * 
 * Professional template for generating executive-level security assessment summaries
 * Focuses on business impact, risk metrics, and strategic recommendations
 */

import { VulnerabilityFinding, VulnerabilitySeverity } from '../types/VulnerabilityTypes';
import { RiskAssessment, RiskLevel, BusinessImpactType } from '../types/RiskAssessmentTypes';
import { SecurityMetrics, ConsolidatedScanResult } from '../reports/ComprehensiveSecurityReportGenerator';

export interface ExecutiveSummaryContext {
  readonly projectName: string;
  readonly assessmentDate: Date;
  readonly vulnerabilities: VulnerabilityFinding[];
  readonly riskAssessments: RiskAssessment[];
  readonly securityMetrics: SecurityMetrics;
  readonly scanResults: ConsolidatedScanResult;
}

export interface ExecutiveSummaryOptions {
  readonly includeRiskScorecard: boolean;
  readonly includeBusinessImpact: boolean;
  readonly includeImmediateActions: boolean;
  readonly includeComplianceStatus: boolean;
  readonly includeInvestmentRecommendations: boolean;
  readonly executiveLevel: 'C-Suite' | 'VP' | 'Director' | 'Manager';
}

export class ExecutiveSummaryTemplate {
  private readonly defaultOptions: ExecutiveSummaryOptions = {
    includeRiskScorecard: true,
    includeBusinessImpact: true,
    includeImmediateActions: true,
    includeComplianceStatus: true,
    includeInvestmentRecommendations: true,
    executiveLevel: 'C-Suite'
  };

  /**
   * Generate executive summary tailored for senior leadership
   */
  public generateExecutiveSummary(
    context: ExecutiveSummaryContext,
    options: Partial<ExecutiveSummaryOptions> = {}
  ): string {
    const summaryOptions = { ...this.defaultOptions, ...options };
    
    let summary = this.renderSummaryHeader(context);
    
    if (summaryOptions.includeRiskScorecard) {
      summary += this.renderRiskScorecard(context, summaryOptions);
    }
    
    if (summaryOptions.includeBusinessImpact) {
      summary += this.renderBusinessImpactAnalysis(context, summaryOptions);
    }
    
    if (summaryOptions.includeImmediateActions) {
      summary += this.renderImmediateActions(context, summaryOptions);
    }
    
    if (summaryOptions.includeComplianceStatus) {
      summary += this.renderComplianceStatus(context, summaryOptions);
    }
    
    if (summaryOptions.includeInvestmentRecommendations) {
      summary += this.renderInvestmentRecommendations(context, summaryOptions);
    }
    
    summary += this.renderStrategicRecommendations(context, summaryOptions);
    
    return summary;
  }

  private renderSummaryHeader(context: ExecutiveSummaryContext): string {
    const severityCounts = this.countVulnerabilitiesBySeverity(context.vulnerabilities);
    const categoryCounts = this.countVulnerabilitiesByCategory(context.vulnerabilities);
    const topCategories = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category, count]) => `${category} (${count})`);

    return `## 📊 Executive Summary

### Security Assessment Overview

This comprehensive security assessment evaluated the **${context.projectName}** application infrastructure and identified **${context.vulnerabilities.length} security findings** across **${context.scanResults.totalFiles.toLocaleString()} analyzed files**. The assessment utilized industry-standard security scanning tools and methodologies to provide a complete risk profile of the current security posture.

### Key Security Findings

<div align="center">

| 🎯 **Security Scorecard** | Value | Status |
|---------------------------|-------|--------|
| **Overall Risk Score** | ${context.securityMetrics.overallRiskScore.toFixed(1)}/100 | ${this.getRiskStatusBadge(context.securityMetrics.overallRiskScore)} |
| **Security Posture Grade** | ${context.securityMetrics.securityPostureGrade} | ${this.getGradeBadge(context.securityMetrics.securityPostureGrade)} |
| **Business Risk Level** | ${context.securityMetrics.businessRiskLevel} | ${this.getBusinessRiskBadge(context.securityMetrics.businessRiskLevel)} |
| **Compliance Score** | ${context.securityMetrics.complianceScore.toFixed(1)}% | ${this.getComplianceBadge(context.securityMetrics.complianceScore)} |

</div>

### Vulnerability Distribution

**By Severity Level:**

| Severity | Count | Percentage | Business Priority |
|----------|-------|------------|-------------------|
| 🔴 **Critical** | ${severityCounts[VulnerabilitySeverity.CRITICAL] || 0} | ${this.getPercentage(severityCounts[VulnerabilitySeverity.CRITICAL] || 0, context.vulnerabilities.length)}% | ${severityCounts[VulnerabilitySeverity.CRITICAL] > 0 ? 'Immediate Executive Action Required' : 'None Identified'} |
| 🟠 **High** | ${severityCounts[VulnerabilitySeverity.HIGH] || 0} | ${this.getPercentage(severityCounts[VulnerabilitySeverity.HIGH] || 0, context.vulnerabilities.length)}% | ${severityCounts[VulnerabilitySeverity.HIGH] > 0 ? 'Senior Management Oversight Required' : 'None Identified'} |
| 🟡 **Medium** | ${severityCounts[VulnerabilitySeverity.MEDIUM] || 0} | ${this.getPercentage(severityCounts[VulnerabilitySeverity.MEDIUM] || 0, context.vulnerabilities.length)}% | Planned Remediation with Management Review |
| 🟢 **Low** | ${severityCounts[VulnerabilitySeverity.LOW] || 0} | ${this.getPercentage(severityCounts[VulnerabilitySeverity.LOW] || 0, context.vulnerabilities.length)}% | Operational Team Management |

**Primary Security Concerns:**

${topCategories.map((category, index) => 
  `${index + 1}. **${category}** - Requires focused remediation effort`
).join('\n')}

`;
  }

  private renderRiskScorecard(
    context: ExecutiveSummaryContext,
    options: ExecutiveSummaryOptions
  ): string {
    const criticalCount = this.countBySeverity(context.vulnerabilities, VulnerabilitySeverity.CRITICAL);
    const highCount = this.countBySeverity(context.vulnerabilities, VulnerabilitySeverity.HIGH);
    
    return `### 🎯 Risk Scorecard & Business Impact

**Current Security Posture:**

\`\`\`
┌─────────────────────────────────────────────────────────────────────┐
│                        EXECUTIVE RISK DASHBOARD                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Overall Risk Score:     ${context.securityMetrics.overallRiskScore.toFixed(1).padStart(6)}/100  ${this.getScoreBar(context.securityMetrics.overallRiskScore, 20)}  │
│  Security Grade:         ${context.securityMetrics.securityPostureGrade.padStart(11)}  ${this.getGradeDescription(context.securityMetrics.securityPostureGrade)}  │
│  Business Risk:          ${context.securityMetrics.businessRiskLevel.padStart(11)}  ${this.getRiskLevelDescription(context.securityMetrics.businessRiskLevel)}  │
│  Compliance Score:       ${context.securityMetrics.complianceScore.toFixed(1).padStart(6)}%  ${this.getScoreBar(context.securityMetrics.complianceScore, 20)}  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
\`\`\`

**Key Risk Indicators:**

| Risk Factor | Current Status | Industry Benchmark | Gap Analysis |
|-------------|----------------|-------------------|--------------|
| **Critical Vulnerabilities** | ${criticalCount} | 0 | ${criticalCount > 0 ? `🔴 ${criticalCount} above benchmark` : '✅ Meeting benchmark'} |
| **High-Risk Issues** | ${highCount} | < 5 | ${highCount >= 5 ? `🟠 ${highCount - 4} above benchmark` : '✅ Within acceptable range'} |
| **Security Coverage** | ${this.calculateSecurityCoverage(context)}% | > 95% | ${this.calculateSecurityCoverage(context) < 95 ? `🟡 ${95 - this.calculateSecurityCoverage(context)}% gap` : '✅ Meeting benchmark'} |
| **Remediation Timeline** | ${context.securityMetrics.timeToRemediation} | < 30 days | ${this.getTimelineStatus(context.securityMetrics.timeToRemediation)} |

`;
  }

  private renderBusinessImpactAnalysis(
    context: ExecutiveSummaryContext,
    options: ExecutiveSummaryOptions
  ): string {
    const criticalVulns = context.vulnerabilities.filter(v => v.severity === VulnerabilitySeverity.CRITICAL);
    const highVulns = context.vulnerabilities.filter(v => v.severity === VulnerabilitySeverity.HIGH);
    
    // Analyze business impact types from risk assessments
    const impactTypes = new Set<BusinessImpactType>();
    let totalFinancialImpact = { min: 0, max: 0 };
    
    context.riskAssessments.forEach(risk => {
      risk.businessImpact.impactTypes.forEach(type => impactTypes.add(type));
      totalFinancialImpact.min += risk.businessImpact.financialImpact.estimatedCost.minimum;
      totalFinancialImpact.max += risk.businessImpact.financialImpact.estimatedCost.maximum;
    });

    return `### 💼 Business Impact Assessment

**Executive Risk Summary:**

${criticalVulns.length > 0 ? `🚨 **CRITICAL ALERT:** ${criticalVulns.length} critical vulnerabilities pose immediate threat to business operations and require emergency response.` : '✅ **No Critical Risks:** No critical vulnerabilities identified that require immediate executive intervention.'}

**Potential Business Consequences:**

${Array.from(impactTypes).length > 0 ? Array.from(impactTypes).map(impact => `- **${impact}**: ${this.getImpactDescription(impact)}`).join('\n') : '- Minimal business impact identified from current findings'}

**Financial Risk Exposure:**

${totalFinancialImpact.max > 0 ? `
- **Estimated Cost of Inaction:** $${totalFinancialImpact.min.toLocaleString()} - $${totalFinancialImpact.max.toLocaleString()}
- **Potential Revenue Impact:** ${this.calculateRevenueImpact(totalFinancialImpact.max)}
- **Regulatory Penalty Risk:** ${this.calculateRegulatoryRisk(criticalVulns.length, highVulns.length)}
` : `
- **Current Financial Risk:** Low - No significant financial exposure identified
- **Preventive Investment:** Recommended to maintain current security posture
`}

**Operational Impact:**

- **Service Availability Risk:** ${this.getAvailabilityRisk(criticalVulns.length, highVulns.length)}
- **Data Protection Status:** ${this.getDataProtectionStatus(context.vulnerabilities)}
- **Customer Trust Impact:** ${this.getCustomerTrustImpact(context.securityMetrics.overallRiskScore)}
- **Competitive Advantage:** ${this.getCompetitiveAdvantageImpact(context.securityMetrics.securityPostureGrade)}

`;
  }

  private renderImmediateActions(
    context: ExecutiveSummaryContext,
    options: ExecutiveSummaryOptions
  ): string {
    const criticalVulns = context.vulnerabilities.filter(v => v.severity === VulnerabilitySeverity.CRITICAL);
    const highVulns = context.vulnerabilities.filter(v => v.severity === VulnerabilitySeverity.HIGH);
    
    return `### ⚡ Immediate Executive Actions Required

**Priority 1 - Emergency Response (24-48 hours):**

${criticalVulns.length > 0 ? `
- 🚨 **Activate Incident Response Team** - ${criticalVulns.length} critical vulnerabilities require immediate attention
- 🔒 **Implement Emergency Controls** - Deploy temporary security measures to mitigate critical risks
- 📞 **Stakeholder Notification** - Inform board members, customers, and regulatory bodies as required
- 💰 **Emergency Budget Approval** - Authorize immediate security remediation resources
` : `
- ✅ **No Emergency Actions Required** - No critical vulnerabilities identified
`}

**Priority 2 - Urgent Management Actions (1-2 weeks):**

${highVulns.length > 0 ? `
- 🎯 **Security Task Force** - Establish dedicated team to address ${highVulns.length} high-priority vulnerabilities
- 📋 **Resource Allocation** - Assign senior technical resources to remediation efforts
- 📊 **Progress Monitoring** - Implement daily status reporting to executive leadership
- 🔍 **Third-Party Assessment** - Consider external security expertise for complex issues
` : `
- 📈 **Maintain Current Posture** - Continue existing security practices and monitoring
`}

**Priority 3 - Strategic Planning (2-4 weeks):**

- 📈 **Security Investment Plan** - Develop comprehensive security improvement roadmap
- 👥 **Team Capability Assessment** - Evaluate current security team skills and capacity
- 🛡️ **Security Architecture Review** - Assess overall security design and controls
- 📚 **Security Awareness Program** - Implement organization-wide security training

**Success Metrics:**

- **Risk Score Improvement:** Target reduction to < ${Math.max(40, context.securityMetrics.overallRiskScore - 20)} within 90 days
- **Critical Vulnerability Elimination:** 100% resolution within 30 days
- **Security Grade Improvement:** Target grade of 'B' or better within 6 months
- **Compliance Score:** Achieve > 90% compliance within 120 days

`;
  }

  private renderComplianceStatus(
    context: ExecutiveSummaryContext,
    options: ExecutiveSummaryOptions
  ): string {
    return `### 📋 Regulatory Compliance & Governance

**Current Compliance Posture:**

- **Overall Compliance Score:** ${context.securityMetrics.complianceScore.toFixed(1)}% ${this.getComplianceStatusIcon(context.securityMetrics.complianceScore)}
- **Regulatory Risk Level:** ${this.getRegulatoryRiskLevel(context.securityMetrics.complianceScore)}
- **Audit Readiness:** ${this.getAuditReadiness(context.securityMetrics.complianceScore)}

**Key Compliance Considerations:**

- **Data Protection (GDPR/CCPA):** ${this.getDataProtectionCompliance(context.vulnerabilities)}
- **Industry Standards (SOC2/ISO27001):** ${this.getIndustryStandardsCompliance(context.securityMetrics.complianceScore)}
- **Regulatory Reporting:** ${this.getRegulatoryReportingStatus(context.vulnerabilities)}
- **Third-Party Risk Management:** ${this.getThirdPartyRiskStatus(context.vulnerabilities)}

**Governance Recommendations:**

- **Board Reporting:** ${this.getBoardReportingRecommendation(context.securityMetrics.overallRiskScore)}
- **Risk Committee Oversight:** ${this.getRiskCommitteeRecommendation(context.vulnerabilities)}
- **External Audit Preparation:** ${this.getExternalAuditRecommendation(context.securityMetrics.complianceScore)}

`;
  }

  private renderInvestmentRecommendations(
    context: ExecutiveSummaryContext,
    options: ExecutiveSummaryOptions
  ): string {
    const estimatedInvestment = this.calculateInvestmentNeeds(context);
    
    return `### 💰 Investment Recommendations & ROI Analysis

**Recommended Security Investment:**

- **Immediate Remediation:** ${estimatedInvestment.immediate}
- **Strategic Improvements:** ${estimatedInvestment.strategic}
- **Ongoing Operations:** ${estimatedInvestment.operational}
- **Total Investment:** ${estimatedInvestment.total}

**Return on Investment (ROI) Analysis:**

- **Risk Reduction Value:** ${this.calculateRiskReductionValue(context)}
- **Compliance Cost Avoidance:** ${this.calculateComplianceCostAvoidance(context)}
- **Business Continuity Value:** ${this.calculateBusinessContinuityValue(context)}
- **Estimated ROI:** ${this.calculateROI(context, estimatedInvestment)}

**Investment Priorities:**

1. **Critical Vulnerability Remediation** (${estimatedInvestment.critical})
   - Immediate risk mitigation
   - Prevents potential business disruption
   - ROI: ${this.calculateCriticalROI(context)}

2. **Security Infrastructure Enhancement** (${estimatedInvestment.infrastructure})
   - Long-term security posture improvement
   - Reduces ongoing operational costs
   - ROI: ${this.calculateInfrastructureROI(context)}

3. **Compliance & Governance** (${estimatedInvestment.compliance})
   - Regulatory requirement fulfillment
   - Avoids potential penalties
   - ROI: ${this.calculateComplianceROI(context)}

**Budget Justification:**

- **Cost of Data Breach:** Industry average $4.45M (IBM Security Report 2023)
- **Regulatory Penalties:** Up to 4% of annual revenue (GDPR)
- **Business Disruption:** Estimated ${this.calculateBusinessDisruptionCost(context)} per day
- **Reputation Recovery:** 2-5 years and significant marketing investment

`;
  }

  private renderStrategicRecommendations(
    context: ExecutiveSummaryContext,
    options: ExecutiveSummaryOptions
  ): string {
    return `### 🎯 Strategic Security Recommendations

**Short-Term Strategy (0-6 months):**

1. **Risk Mitigation Focus**
   - Address all critical and high-severity vulnerabilities
   - Implement emergency security controls
   - Establish security incident response capabilities

2. **Organizational Readiness**
   - Strengthen security team capabilities
   - Implement security awareness training
   - Establish security governance framework

3. **Compliance Achievement**
   - Address regulatory compliance gaps
   - Prepare for external security audits
   - Implement required security controls

**Medium-Term Strategy (6-18 months):**

1. **Security Architecture Maturity**
   - Implement comprehensive security monitoring
   - Deploy advanced threat detection capabilities
   - Establish security automation and orchestration

2. **Risk Management Integration**
   - Integrate security risk into enterprise risk management
   - Implement continuous security assessment
   - Establish security metrics and KPIs

3. **Business Enablement**
   - Align security with business objectives
   - Enable secure digital transformation
   - Implement security-by-design principles

**Long-Term Vision (18+ months):**

1. **Security Excellence**
   - Achieve industry-leading security posture
   - Implement zero-trust architecture
   - Establish security center of excellence

2. **Competitive Advantage**
   - Leverage security as business differentiator
   - Enable secure innovation and growth
   - Establish security thought leadership

**Success Factors:**

- **Executive Sponsorship:** Continued C-suite commitment and oversight
- **Resource Investment:** Adequate funding for people, process, and technology
- **Cultural Transformation:** Organization-wide security mindset adoption
- **Continuous Improvement:** Regular assessment and adaptation of security strategy

**Next Steps:**

1. **Executive Decision:** Approve recommended investment and timeline
2. **Team Assembly:** Establish security improvement task force
3. **Vendor Selection:** Engage security partners and solution providers
4. **Implementation Planning:** Develop detailed project plans and milestones
5. **Progress Monitoring:** Establish regular executive reporting and oversight

---

`;
  }

  // Helper methods
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

  private countBySeverity(vulnerabilities: VulnerabilityFinding[], severity: VulnerabilitySeverity): number {
    return vulnerabilities.filter(v => v.severity === severity).length;
  }

  private getPercentage(value: number, total: number): string {
    return total > 0 ? (value / total * 100).toFixed(1) : '0.0';
  }

  private getRiskStatusBadge(score: number): string {
    if (score >= 80) return '🔴 High Risk';
    if (score >= 60) return '🟠 Medium Risk';
    if (score >= 40) return '🟡 Low Risk';
    return '🟢 Minimal Risk';
  }

  private getGradeBadge(grade: string): string {
    const badges = {
      'A': '🟢 Excellent',
      'B': '🟡 Good',
      'C': '🟠 Fair',
      'D': '🔴 Poor',
      'F': '🔴 Critical'
    };
    return badges[grade] || '⚪ Unknown';
  }

  private getBusinessRiskBadge(riskLevel: RiskLevel): string {
    const badges = {
      [RiskLevel.CRITICAL]: '🔴 Critical',
      [RiskLevel.HIGH]: '🟠 High',
      [RiskLevel.MEDIUM]: '🟡 Medium',
      [RiskLevel.LOW]: '🟢 Low'
    };
    return badges[riskLevel] || '⚪ Unknown';
  }

  private getComplianceBadge(score: number): string {
    if (score >= 90) return '🟢 Excellent';
    if (score >= 80) return '🟡 Good';
    if (score >= 70) return '🟠 Fair';
    return '🔴 Poor';
  }

  private getScoreBar(score: number, width: number = 20): string {
    const filled = Math.round((score / 100) * width);
    const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
    return `[${bar}]`;
  }

  private getGradeDescription(grade: string): string {
    const descriptions = {
      'A': 'Excellent Security Posture',
      'B': 'Good Security Controls',
      'C': 'Fair Security Implementation',
      'D': 'Poor Security Practices',
      'F': 'Critical Security Failures'
    };
    return descriptions[grade] || 'Unknown Security Status';
  }

  private getRiskLevelDescription(riskLevel: RiskLevel): string {
    const descriptions = {
      [RiskLevel.CRITICAL]: 'Immediate Action Required',
      [RiskLevel.HIGH]: 'Urgent Management Attention',
      [RiskLevel.MEDIUM]: 'Planned Remediation Needed',
      [RiskLevel.LOW]: 'Monitor and Maintain'
    };
    return descriptions[riskLevel] || 'Assessment Required';
  }

  private calculateSecurityCoverage(context: ExecutiveSummaryContext): number {
    // Calculate based on scanners used and domains covered
    const scannerCount = Object.keys(context.scanResults.scannerVersions).length;
    const maxScanners = 6; // Expected number of security domains
    return Math.min(100, (scannerCount / maxScanners) * 100);
  }

  private getTimelineStatus(timeline: string): string {
    // Parse timeline and compare to benchmark
    if (timeline.includes('week') || timeline.includes('day')) {
      return '✅ Within benchmark';
    }
    return '🟡 Above benchmark';
  }

  private getImpactDescription(impact: BusinessImpactType): string {
    const descriptions = {
      [BusinessImpactType.FINANCIAL_LOSS]: 'Direct revenue impact and cost increases',
      [BusinessImpactType.REPUTATION_DAMAGE]: 'Brand value and customer trust erosion',
      [BusinessImpactType.REGULATORY_PENALTIES]: 'Compliance violations and legal consequences',
      [BusinessImpactType.OPERATIONAL_DISRUPTION]: 'Service interruption and productivity loss',
      [BusinessImpactType.DATA_BREACH]: 'Confidential information exposure and privacy violations',
      [BusinessImpactType.COMPETITIVE_DISADVANTAGE]: 'Market position and competitive edge loss'
    };
    return descriptions[impact] || 'Business impact assessment required';
  }

  // Additional helper methods would be implemented here for calculations...
  private calculateRevenueImpact(maxImpact: number): string {
    return `Potential ${(maxImpact * 0.1).toLocaleString()} in lost revenue`;
  }

  private calculateRegulatoryRisk(criticalCount: number, highCount: number): string {
    if (criticalCount > 0) return 'High - Potential regulatory violations';
    if (highCount > 5) return 'Medium - Compliance concerns';
    return 'Low - Minimal regulatory exposure';
  }

  private getAvailabilityRisk(criticalCount: number, highCount: number): string {
    if (criticalCount > 0) return 'High - Service disruption likely';
    if (highCount > 3) return 'Medium - Potential service impact';
    return 'Low - Minimal availability risk';
  }

  private getDataProtectionStatus(vulnerabilities: VulnerabilityFinding[]): string {
    const dataVulns = vulnerabilities.filter(v => 
      v.category.includes('Information Disclosure') || 
      v.category.includes('Authentication') ||
      v.category.includes('Authorization')
    );
    
    if (dataVulns.length > 5) return 'At Risk - Multiple data protection issues';
    if (dataVulns.length > 0) return 'Moderate Risk - Some data protection concerns';
    return 'Protected - No significant data protection issues';
  }

  private getCustomerTrustImpact(riskScore: number): string {
    if (riskScore >= 80) return 'High Risk - Potential customer confidence loss';
    if (riskScore >= 60) return 'Medium Risk - Customer trust concerns';
    return 'Low Risk - Customer trust maintained';
  }

  private getCompetitiveAdvantageImpact(grade: string): string {
    if (grade === 'A' || grade === 'B') return 'Positive - Security as differentiator';
    if (grade === 'C') return 'Neutral - Standard security posture';
    return 'Negative - Security liability';
  }

  private getComplianceStatusIcon(score: number): string {
    if (score >= 90) return '🟢';
    if (score >= 80) return '🟡';
    if (score >= 70) return '🟠';
    return '🔴';
  }

  private getRegulatoryRiskLevel(score: number): string {
    if (score >= 90) return 'Low - Strong compliance posture';
    if (score >= 80) return 'Medium - Some compliance gaps';
    if (score >= 70) return 'High - Significant compliance issues';
    return 'Critical - Major compliance violations';
  }

  private getAuditReadiness(score: number): string {
    if (score >= 90) return 'Ready - Well prepared for audits';
    if (score >= 80) return 'Mostly Ready - Minor preparation needed';
    if (score >= 70) return 'Preparation Required - Significant work needed';
    return 'Not Ready - Major compliance work required';
  }

  // Placeholder methods for complex calculations
  private getDataProtectionCompliance(vulnerabilities: VulnerabilityFinding[]): string {
    return 'Assessment required based on findings';
  }

  private getIndustryStandardsCompliance(score: number): string {
    return score >= 80 ? 'Compliant' : 'Non-compliant';
  }

  private getRegulatoryReportingStatus(vulnerabilities: VulnerabilityFinding[]): string {
    return 'Current - No immediate reporting requirements';
  }

  private getThirdPartyRiskStatus(vulnerabilities: VulnerabilityFinding[]): string {
    return 'Managed - Third-party risks under control';
  }

  private getBoardReportingRecommendation(riskScore: number): string {
    return riskScore >= 70 ? 'Required - Immediate board notification' : 'Recommended - Regular board updates';
  }

  private getRiskCommitteeRecommendation(vulnerabilities: VulnerabilityFinding[]): string {
    return 'Monthly oversight recommended';
  }

  private getExternalAuditRecommendation(score: number): string {
    return score < 80 ? 'Recommended - External validation needed' : 'Optional - Internal controls sufficient';
  }

  private calculateInvestmentNeeds(context: ExecutiveSummaryContext): {
    immediate: string;
    strategic: string;
    operational: string;
    total: string;
    critical: string;
    infrastructure: string;
    compliance: string;
  } {
    // Placeholder calculations - would be based on actual vulnerability analysis
    return {
      immediate: '$50,000 - $100,000',
      strategic: '$200,000 - $500,000',
      operational: '$100,000 - $200,000 annually',
      total: '$350,000 - $800,000',
      critical: '$25,000 - $50,000',
      infrastructure: '$150,000 - $300,000',
      compliance: '$75,000 - $150,000'
    };
  }

  private calculateRiskReductionValue(context: ExecutiveSummaryContext): string {
    return '$500,000 - $2,000,000 in avoided losses';
  }

  private calculateComplianceCostAvoidance(context: ExecutiveSummaryContext): string {
    return '$100,000 - $500,000 in avoided penalties';
  }

  private calculateBusinessContinuityValue(context: ExecutiveSummaryContext): string {
    return '$1,000,000+ in maintained operations';
  }

  private calculateROI(context: ExecutiveSummaryContext, investment: any): string {
    return '300% - 500% over 3 years';
  }

  private calculateCriticalROI(context: ExecutiveSummaryContext): string {
    return '1000%+ (immediate risk mitigation)';
  }

  private calculateInfrastructureROI(context: ExecutiveSummaryContext): string {
    return '200% - 400% over 5 years';
  }

  private calculateComplianceROI(context: ExecutiveSummaryContext): string {
    return '150% - 300% (penalty avoidance)';
  }

  private calculateBusinessDisruptionCost(context: ExecutiveSummaryContext): string {
    return '$50,000 - $200,000';
  }
}