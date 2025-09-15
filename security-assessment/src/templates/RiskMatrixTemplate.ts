/**
 * Risk Matrix Template
 * 
 * Professional template for generating risk assessment matrices and visualizations
 * Provides visual risk analysis and prioritization guidance
 */

import { RiskAssessment, RiskLevel, BusinessImpactType } from '../types/RiskAssessmentTypes';
import { VulnerabilityFinding, VulnerabilitySeverity } from '../types/VulnerabilityTypes';

export interface RiskMatrixContext {
  readonly riskAssessments: RiskAssessment[];
  readonly vulnerabilities: VulnerabilityFinding[];
  readonly projectName: string;
}

export interface RiskMatrixOptions {
  readonly includeHeatMap: boolean;
  readonly includeDistributionChart: boolean;
  readonly includeTopRisks: boolean;
  readonly includeRiskTrends: boolean;
  readonly maxTopRisks: number;
  readonly matrixSize: '3x3' | '5x5';
}

export class RiskMatrixTemplate {
  private readonly defaultOptions: RiskMatrixOptions = {
    includeHeatMap: true,
    includeDistributionChart: true,
    includeTopRisks: true,
    includeRiskTrends: false,
    maxTopRisks: 10,
    matrixSize: '5x5'
  };

  /**
   * Generate comprehensive risk matrix visualization
   */
  public generateRiskMatrix(
    context: RiskMatrixContext,
    options: Partial<RiskMatrixOptions> = {}
  ): string {
    const matrixOptions = { ...this.defaultOptions, ...options };
    
    let matrix = this.renderRiskMatrixHeader(context);
    
    if (matrixOptions.includeHeatMap) {
      matrix += this.renderRiskHeatMap(context, matrixOptions);
    }
    
    if (matrixOptions.includeDistributionChart) {
      matrix += this.renderRiskDistribution(context);
    }
    
    if (matrixOptions.includeTopRisks) {
      matrix += this.renderTopRiskScenarios(context, matrixOptions);
    }
    
    if (matrixOptions.includeRiskTrends) {
      matrix += this.renderRiskTrends(context);
    }
    
    matrix += this.renderRiskActionPlan(context);
    
    return matrix;
  }

  private renderRiskMatrixHeader(context: RiskMatrixContext): string {
    const riskGroups = this.groupRiskAssessmentsByLevel(context.riskAssessments);
    
    return `## 🎯 Risk Assessment Matrix

### Risk Distribution Overview

The following risk matrix visualizes the likelihood and impact of identified security vulnerabilities, helping prioritize remediation efforts based on business risk exposure for the **${context.projectName}** system.

**Risk Assessment Summary:**
- **Total Risk Assessments:** ${context.riskAssessments.length}
- **Critical Risk Items:** ${riskGroups[RiskLevel.CRITICAL]?.length || 0}
- **High Risk Items:** ${riskGroups[RiskLevel.HIGH]?.length || 0}
- **Medium Risk Items:** ${riskGroups[RiskLevel.MEDIUM]?.length || 0}
- **Low Risk Items:** ${riskGroups[RiskLevel.LOW]?.length || 0}

`;
  }

  private renderRiskHeatMap(context: RiskMatrixContext, options: RiskMatrixOptions): string {
    const matrix = this.createRiskMatrix(context.riskAssessments, options.matrixSize);
    
    if (options.matrixSize === '5x5') {
      return this.render5x5Matrix(matrix);
    } else {
      return this.render3x3Matrix(matrix);
    }
  }

  private render5x5Matrix(matrix: number[][]): string {
    return `### Risk Heat Map (5x5 Matrix)

\`\`\`
                    RISK ASSESSMENT MATRIX
                         
    Impact    │ 5 │${this.formatMatrixCell(matrix[4][0])}│${this.formatMatrixCell(matrix[4][1])}│${this.formatMatrixCell(matrix[4][2])}│${this.formatMatrixCell(matrix[4][3])}│${this.formatMatrixCell(matrix[4][4])}│  Catastrophic
              │ 4 │${this.formatMatrixCell(matrix[3][0])}│${this.formatMatrixCell(matrix[3][1])}│${this.formatMatrixCell(matrix[3][2])}│${this.formatMatrixCell(matrix[3][3])}│${this.formatMatrixCell(matrix[3][4])}│  Major
              │ 3 │${this.formatMatrixCell(matrix[2][0])}│${this.formatMatrixCell(matrix[2][1])}│${this.formatMatrixCell(matrix[2][2])}│${this.formatMatrixCell(matrix[2][3])}│${this.formatMatrixCell(matrix[2][4])}│  Moderate
              │ 2 │${this.formatMatrixCell(matrix[1][0])}│${this.formatMatrixCell(matrix[1][1])}│${this.formatMatrixCell(matrix[1][2])}│${this.formatMatrixCell(matrix[1][3])}│${this.formatMatrixCell(matrix[1][4])}│  Minor
              │ 1 │${this.formatMatrixCell(matrix[0][0])}│${this.formatMatrixCell(matrix[0][1])}│${this.formatMatrixCell(matrix[0][2])}│${this.formatMatrixCell(matrix[0][3])}│${this.formatMatrixCell(matrix[0][4])}│  Minimal
              └───┼───┼───┼───┼───┼───┘
                  1   2   3   4   5
                    Likelihood →
                 Rare Unlikely Possible Likely Almost
                                                Certain

    Risk Levels:
    🟢 Low Risk (1-8)     🟡 Medium Risk (9-15)
    🟠 High Risk (16-20)  🔴 Critical Risk (21-25)
\`\`\`

**Risk Level Distribution:**

| Risk Level | Count | Risk Score Range | Action Required |
|------------|-------|------------------|-----------------|
| 🔴 **Critical** | ${this.countRisksInRange(21, 25)} | 21-25 | Immediate escalation and emergency response |
| 🟠 **High** | ${this.countRisksInRange(16, 20)} | 16-20 | Priority remediation within 1-2 weeks |
| 🟡 **Medium** | ${this.countRisksInRange(9, 15)} | 9-15 | Planned remediation within 1-3 months |
| 🟢 **Low** | ${this.countRisksInRange(1, 8)} | 1-8 | Monitor and review quarterly |

`;
  }

  private render3x3Matrix(matrix: number[][]): string {
    return `### Risk Heat Map (3x3 Matrix)

\`\`\`
                SIMPLIFIED RISK MATRIX
                         
    Impact    │ 3 │${this.formatMatrixCell(matrix[2][0])}│${this.formatMatrixCell(matrix[2][1])}│${this.formatMatrixCell(matrix[2][2])}│  High
              │ 2 │${this.formatMatrixCell(matrix[1][0])}│${this.formatMatrixCell(matrix[1][1])}│${this.formatMatrixCell(matrix[1][2])}│  Medium
              │ 1 │${this.formatMatrixCell(matrix[0][0])}│${this.formatMatrixCell(matrix[0][1])}│${this.formatMatrixCell(matrix[0][2])}│  Low
              └───┼───┼───┼───┘
                  1   2   3
                Likelihood →
               Low Med High

    Legend: Numbers represent count of risks in each cell
    🟢 Low Risk    🟡 Medium Risk    🔴 High Risk
\`\`\`

`;
  }

  private renderRiskDistribution(context: RiskMatrixContext): string {
    const riskGroups = this.groupRiskAssessmentsByLevel(context.riskAssessments);
    const totalRisks = context.riskAssessments.length;
    
    return `### Risk Level Distribution

**Quantitative Risk Analysis:**

| Risk Level | Count | Percentage | Average Score | Business Impact |
|------------|-------|------------|---------------|-----------------|
| 🔴 **Critical** | ${riskGroups[RiskLevel.CRITICAL]?.length || 0} | ${this.getPercentage(riskGroups[RiskLevel.CRITICAL]?.length || 0, totalRisks)}% | ${this.getAverageRiskScore(riskGroups[RiskLevel.CRITICAL] || [])}/25 | Severe business disruption |
| 🟠 **High** | ${riskGroups[RiskLevel.HIGH]?.length || 0} | ${this.getPercentage(riskGroups[RiskLevel.HIGH]?.length || 0, totalRisks)}% | ${this.getAverageRiskScore(riskGroups[RiskLevel.HIGH] || [])}/25 | Significant operational impact |
| 🟡 **Medium** | ${riskGroups[RiskLevel.MEDIUM]?.length || 0} | ${this.getPercentage(riskGroups[RiskLevel.MEDIUM]?.length || 0, totalRisks)}% | ${this.getAverageRiskScore(riskGroups[RiskLevel.MEDIUM] || [])}/25 | Moderate business risk |
| 🟢 **Low** | ${riskGroups[RiskLevel.LOW]?.length || 0} | ${this.getPercentage(riskGroups[RiskLevel.LOW]?.length || 0, totalRisks)}% | ${this.getAverageRiskScore(riskGroups[RiskLevel.LOW] || [])}/25 | Minimal business impact |

**Risk Distribution Visualization:**

\`\`\`
Critical  [${this.createProgressBar(riskGroups[RiskLevel.CRITICAL]?.length || 0, totalRisks, 20, '█')}] ${(riskGroups[RiskLevel.CRITICAL]?.length || 0).toString().padStart(3)}
High      [${this.createProgressBar(riskGroups[RiskLevel.HIGH]?.length || 0, totalRisks, 20, '█')}] ${(riskGroups[RiskLevel.HIGH]?.length || 0).toString().padStart(3)}
Medium    [${this.createProgressBar(riskGroups[RiskLevel.MEDIUM]?.length || 0, totalRisks, 20, '█')}] ${(riskGroups[RiskLevel.MEDIUM]?.length || 0).toString().padStart(3)}
Low       [${this.createProgressBar(riskGroups[RiskLevel.LOW]?.length || 0, totalRisks, 20, '█')}] ${(riskGroups[RiskLevel.LOW]?.length || 0).toString().padStart(3)}
\`\`\`

**Business Impact Analysis:**

${this.renderBusinessImpactBreakdown(context.riskAssessments)}

`;
  }

  private renderTopRiskScenarios(context: RiskMatrixContext, options: RiskMatrixOptions): string {
    const topRisks = context.riskAssessments
      .sort((a, b) => b.riskScore.overallRisk - a.riskScore.overallRisk)
      .slice(0, options.maxTopRisks);
    
    if (topRisks.length === 0) {
      return `### Top Risk Scenarios

No high-risk scenarios identified in the current assessment.

`;
    }

    let scenarios = `### Top Risk Scenarios

The following ${Math.min(topRisks.length, options.maxTopRisks)} risk scenarios require immediate attention based on their combined likelihood and business impact:

`;

    topRisks.forEach((risk, index) => {
      scenarios += this.renderRiskScenario(risk, index + 1);
    });

    return scenarios;
  }

  private renderRiskScenario(risk: RiskAssessment, index: number): string {
    const riskIcon = this.getRiskLevelIcon(risk.riskScore.riskLevel);
    const impactTypes = risk.businessImpact.impactTypes.slice(0, 3).join(', ');
    
    return `#### ${riskIcon} Risk Scenario ${index}: ${risk.vulnerabilityId}

**Risk Assessment:**
- **Overall Risk Score:** ${risk.riskScore.overallRisk}/25 (${risk.riskScore.riskLevel})
- **Likelihood:** ${risk.riskScore.likelihood}/5 (${this.getLikelihoodDescription(risk.riskScore.likelihood)})
- **Impact:** ${risk.riskScore.impact}/5 (${this.getImpactDescription(risk.riskScore.impact)})

**Business Impact:**
- **Primary Impact Types:** ${impactTypes}
- **Financial Impact:** $${risk.businessImpact.financialImpact.estimatedCost.minimum.toLocaleString()} - $${risk.businessImpact.financialImpact.estimatedCost.maximum.toLocaleString()}
- **Recovery Time:** ${risk.businessImpact.financialImpact.recoveryTime}

**Mitigation Strategies:**
${risk.mitigationStrategies.slice(0, 3).map(strategy => `- ${strategy}`).join('\n')}

**Recommended Actions:**
- **Priority:** ${this.getActionPriority(risk.riskScore.riskLevel)}
- **Timeline:** ${this.getActionTimeline(risk.riskScore.riskLevel)}
- **Resources:** ${this.getResourceRequirements(risk.riskScore.riskLevel)}

---

`;
  }

  private renderRiskTrends(context: RiskMatrixContext): string {
    // This would typically show risk trends over time
    // For now, providing a placeholder structure
    return `### Risk Trend Analysis

**Historical Risk Progression:**
- Current assessment represents baseline risk profile
- Future assessments will show risk trend analysis
- Recommended quarterly risk reassessment

**Risk Velocity Indicators:**
- **New Risks:** Monitor for emerging threats
- **Risk Escalation:** Track risks moving to higher levels
- **Risk Mitigation:** Measure successful risk reduction

**Predictive Risk Modeling:**
- **Emerging Threats:** Industry threat intelligence integration
- **Seasonal Patterns:** Risk pattern analysis over time
- **Business Growth Impact:** Risk scaling with business expansion

`;
  }

  private renderRiskActionPlan(context: RiskMatrixContext): string {
    const criticalRisks = context.riskAssessments.filter(r => r.riskScore.riskLevel === RiskLevel.CRITICAL);
    const highRisks = context.riskAssessments.filter(r => r.riskScore.riskLevel === RiskLevel.HIGH);
    
    return `### Risk-Based Action Plan

**Immediate Actions (0-30 days):**

${criticalRisks.length > 0 ? `
🚨 **Critical Risk Response:**
- **Emergency Response Team:** Activate incident response for ${criticalRisks.length} critical risks
- **Executive Notification:** Immediate C-suite and board notification required
- **Resource Mobilization:** Deploy emergency security resources and budget
- **Stakeholder Communication:** Prepare customer and partner communications
- **Regulatory Compliance:** Assess breach notification requirements
` : `
✅ **No Critical Risks:** No immediate emergency response required
`}

**Priority Actions (30-90 days):**

${highRisks.length > 0 ? `
🔥 **High Risk Mitigation:**
- **Dedicated Task Force:** Establish security improvement team for ${highRisks.length} high risks
- **Vendor Engagement:** Engage security consultants and solution providers
- **Process Improvement:** Implement enhanced security processes and controls
- **Monitoring Enhancement:** Deploy advanced threat detection and monitoring
- **Training Programs:** Conduct targeted security awareness training
` : `
📈 **Risk Maintenance:** Continue current security practices and monitoring
`}

**Strategic Actions (90+ days):**

- **Security Architecture Review:** Comprehensive security design assessment
- **Risk Management Integration:** Embed security risk into enterprise risk management
- **Continuous Improvement:** Establish ongoing security assessment and improvement
- **Industry Benchmarking:** Compare security posture against industry standards
- **Innovation Security:** Integrate security into digital transformation initiatives

**Success Metrics:**

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| **Critical Risks** | ${criticalRisks.length} | 0 | 30 days |
| **High Risks** | ${highRisks.length} | < 3 | 90 days |
| **Overall Risk Score** | ${this.calculateOverallRiskScore(context.riskAssessments)}/25 | < 10 | 180 days |
| **Risk Assessment Frequency** | Baseline | Quarterly | Ongoing |

**Risk Monitoring Framework:**

- **Daily:** Critical risk status monitoring
- **Weekly:** High risk progress reporting
- **Monthly:** Executive risk dashboard updates
- **Quarterly:** Comprehensive risk reassessment
- **Annually:** Strategic risk management review

---

`;
  }

  private renderBusinessImpactBreakdown(riskAssessments: RiskAssessment[]): string {
    const impactTypes = new Map<BusinessImpactType, number>();
    let totalFinancialImpact = { min: 0, max: 0 };
    
    riskAssessments.forEach(risk => {
      risk.businessImpact.impactTypes.forEach(type => {
        impactTypes.set(type, (impactTypes.get(type) || 0) + 1);
      });
      totalFinancialImpact.min += risk.businessImpact.financialImpact.estimatedCost.minimum;
      totalFinancialImpact.max += risk.businessImpact.financialImpact.estimatedCost.maximum;
    });

    let breakdown = `**Business Impact Categories:**

| Impact Type | Frequency | Percentage | Description |
|-------------|-----------|------------|-------------|
`;

    Array.from(impactTypes.entries())
      .sort(([,a], [,b]) => b - a)
      .forEach(([type, count]) => {
        const percentage = ((count / riskAssessments.length) * 100).toFixed(1);
        breakdown += `| ${type} | ${count} | ${percentage}% | ${this.getBusinessImpactDescription(type)} |\n`;
      });

    breakdown += `\n**Financial Impact Summary:**
- **Total Estimated Impact:** $${totalFinancialImpact.min.toLocaleString()} - $${totalFinancialImpact.max.toLocaleString()}
- **Average Impact per Risk:** $${Math.round(totalFinancialImpact.min / riskAssessments.length).toLocaleString()} - $${Math.round(totalFinancialImpact.max / riskAssessments.length).toLocaleString()}
- **Risk Concentration:** ${this.calculateRiskConcentration(riskAssessments)}

`;

    return breakdown;
  }

  // Helper methods
  private groupRiskAssessmentsByLevel(riskAssessments: RiskAssessment[]): Record<RiskLevel, RiskAssessment[]> {
    return riskAssessments.reduce((groups, risk) => {
      const level = risk.riskScore.riskLevel;
      if (!groups[level]) groups[level] = [];
      groups[level].push(risk);
      return groups;
    }, {} as Record<RiskLevel, RiskAssessment[]>);
  }

  private createRiskMatrix(riskAssessments: RiskAssessment[], size: '3x3' | '5x5'): number[][] {
    const matrixSize = size === '5x5' ? 5 : 3;
    const matrix: number[][] = Array(matrixSize).fill(null).map(() => Array(matrixSize).fill(0));
    
    riskAssessments.forEach(risk => {
      const likelihood = Math.min(risk.riskScore.likelihood - 1, matrixSize - 1);
      const impact = Math.min(risk.riskScore.impact - 1, matrixSize - 1);
      matrix[impact][likelihood]++;
    });
    
    return matrix;
  }

  private formatMatrixCell(count: number): string {
    if (count === 0) return ' ';
    if (count < 10) return count.toString();
    return '+';
  }

  private countRisksInRange(min: number, max: number): number {
    // This would count risks in the specified score range
    // Placeholder implementation
    return 0;
  }

  private getPercentage(value: number, total: number): string {
    return total > 0 ? (value / total * 100).toFixed(1) : '0.0';
  }

  private getAverageRiskScore(risks: RiskAssessment[]): string {
    if (risks.length === 0) return '0.0';
    const avg = risks.reduce((sum, r) => sum + r.riskScore.overallRisk, 0) / risks.length;
    return avg.toFixed(1);
  }

  private createProgressBar(value: number, max: number, width: number, char: string = '█'): string {
    if (max === 0) return ' '.repeat(width);
    const filled = Math.round((value / max) * width);
    return char.repeat(filled) + ' '.repeat(width - filled);
  }

  private getRiskLevelIcon(riskLevel: RiskLevel): string {
    const icons = {
      [RiskLevel.CRITICAL]: '🔴',
      [RiskLevel.HIGH]: '🟠',
      [RiskLevel.MEDIUM]: '🟡',
      [RiskLevel.LOW]: '🟢'
    };
    return icons[riskLevel] || '⚪';
  }

  private getLikelihoodDescription(likelihood: number): string {
    const descriptions = ['Very Unlikely', 'Unlikely', 'Possible', 'Likely', 'Very Likely'];
    return descriptions[likelihood - 1] || 'Unknown';
  }

  private getImpactDescription(impact: number): string {
    const descriptions = ['Minimal', 'Minor', 'Moderate', 'Major', 'Catastrophic'];
    return descriptions[impact - 1] || 'Unknown';
  }

  private getActionPriority(riskLevel: RiskLevel): string {
    const priorities = {
      [RiskLevel.CRITICAL]: 'Emergency - Immediate action required',
      [RiskLevel.HIGH]: 'Urgent - High priority remediation',
      [RiskLevel.MEDIUM]: 'Important - Planned remediation',
      [RiskLevel.LOW]: 'Monitor - Regular review'
    };
    return priorities[riskLevel] || 'Assessment required';
  }

  private getActionTimeline(riskLevel: RiskLevel): string {
    const timelines = {
      [RiskLevel.CRITICAL]: '24-48 hours',
      [RiskLevel.HIGH]: '1-2 weeks',
      [RiskLevel.MEDIUM]: '1-3 months',
      [RiskLevel.LOW]: '3-12 months'
    };
    return timelines[riskLevel] || 'TBD';
  }

  private getResourceRequirements(riskLevel: RiskLevel): string {
    const resources = {
      [RiskLevel.CRITICAL]: 'Emergency team, executive oversight, unlimited budget',
      [RiskLevel.HIGH]: 'Dedicated team, senior management oversight, priority budget',
      [RiskLevel.MEDIUM]: 'Assigned resources, regular management review, planned budget',
      [RiskLevel.LOW]: 'Standard resources, periodic review, maintenance budget'
    };
    return resources[riskLevel] || 'Assessment required';
  }

  private calculateOverallRiskScore(riskAssessments: RiskAssessment[]): number {
    if (riskAssessments.length === 0) return 0;
    return riskAssessments.reduce((sum, r) => sum + r.riskScore.overallRisk, 0) / riskAssessments.length;
  }

  private getBusinessImpactDescription(type: BusinessImpactType): string {
    const descriptions = {
      [BusinessImpactType.FINANCIAL_LOSS]: 'Direct revenue impact and increased costs',
      [BusinessImpactType.REPUTATION_DAMAGE]: 'Brand value erosion and customer trust loss',
      [BusinessImpactType.REGULATORY_PENALTIES]: 'Compliance violations and legal consequences',
      [BusinessImpactType.OPERATIONAL_DISRUPTION]: 'Service interruption and productivity loss',
      [BusinessImpactType.DATA_BREACH]: 'Information exposure and privacy violations',
      [BusinessImpactType.COMPETITIVE_DISADVANTAGE]: 'Market position and advantage loss'
    };
    return descriptions[type] || 'Impact assessment required';
  }

  private calculateRiskConcentration(riskAssessments: RiskAssessment[]): string {
    const highRiskCount = riskAssessments.filter(r => 
      r.riskScore.riskLevel === RiskLevel.CRITICAL || r.riskScore.riskLevel === RiskLevel.HIGH
    ).length;
    
    const concentration = (highRiskCount / riskAssessments.length) * 100;
    
    if (concentration > 50) return 'High - Significant risk concentration';
    if (concentration > 25) return 'Medium - Moderate risk concentration';
    return 'Low - Distributed risk profile';
  }
}