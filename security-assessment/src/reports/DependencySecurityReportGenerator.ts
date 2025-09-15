/**
 * Dependency Security Report Generator
 * Generates comprehensive markdown reports for dependency vulnerability assessments
 */

import { ScanResult } from '../interfaces/ScannerInterface';
import { VulnerabilityFinding, VulnerabilitySeverity, VulnerabilityCategory } from '../types/VulnerabilityTypes';
import { RiskAssessment } from '../types/RiskAssessmentTypes';
import { ComplianceMapping, ComplianceStatus } from '../types/ComplianceTypes';

export interface DependencyReportOptions {
  includeExecutiveSummary: boolean;
  includeDetailedFindings: boolean;
  includeRemediationPlan: boolean;
  includeComplianceMapping: boolean;
  includeRiskAssessment: boolean;
  includeLicenseAnalysis: boolean;
  includeMetrics: boolean;
  maxVulnerabilitiesPerSeverity: number;
  sortBy: 'severity' | 'package' | 'category';
}

export class DependencySecurityReportGenerator {
  private readonly defaultOptions: DependencyReportOptions = {
    includeExecutiveSummary: true,
    includeDetailedFindings: true,
    includeRemediationPlan: true,
    includeComplianceMapping: true,
    includeRiskAssessment: true,
    includeLicenseAnalysis: true,
    includeMetrics: true,
    maxVulnerabilitiesPerSeverity: 10,
    sortBy: 'severity'
  };

  generateReport(scanResult: ScanResult, options?: Partial<DependencyReportOptions>): string {
    const opts = { ...this.defaultOptions, ...options };
    const report: string[] = [];

    // Report header
    report.push(this.generateHeader(scanResult));
    
    // Executive summary
    if (opts.includeExecutiveSummary) {
      report.push(this.generateExecutiveSummary(scanResult));
    }

    // Vulnerability metrics
    if (opts.includeMetrics) {
      report.push(this.generateMetrics(scanResult));
    }

    // Risk assessment
    if (opts.includeRiskAssessment && scanResult.riskAssessments.length > 0) {
      report.push(this.generateRiskAssessment(scanResult.riskAssessments));
    }

    // Compliance mapping
    if (opts.includeComplianceMapping && scanResult.complianceMappings.length > 0) {
      report.push(this.generateComplianceMapping(scanResult.complianceMappings));
    }

    // Critical findings
    report.push(this.generateCriticalFindings(scanResult.vulnerabilities));

    // High priority findings
    report.push(this.generateHighPriorityFindings(scanResult.vulnerabilities));

    // License compliance analysis
    if (opts.includeLicenseAnalysis) {
      report.push(this.generateLicenseAnalysis(scanResult.vulnerabilities));
    }

    // Detailed findings
    if (opts.includeDetailedFindings) {
      report.push(this.generateDetailedFindings(scanResult.vulnerabilities, opts));
    }

    // Remediation roadmap
    if (opts.includeRemediationPlan) {
      report.push(this.generateRemediationRoadmap(scanResult.vulnerabilities));
    }

    // Appendices
    report.push(this.generateAppendices(scanResult));

    return report.join('\n\n');
  }

  private generateHeader(scanResult: ScanResult): string {
    const scanDate = scanResult.startTime.toLocaleDateString();
    const scanTime = scanResult.startTime.toLocaleTimeString();
    
    return `# Dependency Security Assessment Report

**Project:** ${scanResult.targetPath}  
**Scanner:** ${scanResult.scannerName} v${scanResult.scannerVersion}  
**Scan Date:** ${scanDate} at ${scanTime}  
**Report Generated:** ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}

---`;
  }

  private generateExecutiveSummary(scanResult: ScanResult): string {
    const totalVulns = scanResult.vulnerabilities.length;
    const criticalCount = this.getVulnerabilitiesBySeverity(scanResult.vulnerabilities, VulnerabilitySeverity.CRITICAL).length;
    const highCount = this.getVulnerabilitiesBySeverity(scanResult.vulnerabilities, VulnerabilitySeverity.HIGH).length;
    const mediumCount = this.getVulnerabilitiesBySeverity(scanResult.vulnerabilities, VulnerabilitySeverity.MEDIUM).length;
    const lowCount = this.getVulnerabilitiesBySeverity(scanResult.vulnerabilities, VulnerabilitySeverity.LOW).length;

    const licenseIssues = scanResult.vulnerabilities.filter(v => 
      v.title.includes('License compliance')
    ).length;

    const riskLevel = this.calculateOverallRiskLevel(scanResult.vulnerabilities);
    const filesScanned = scanResult.filesScanned;
    const scanDuration = Math.round(scanResult.metadata.scanDuration / 1000);

    return `## Executive Summary

This dependency security assessment analyzed **${filesScanned} dependency files** and identified **${totalVulns} security issues** across NPM, Python, and infrastructure dependencies.

### Key Findings

- **Overall Risk Level:** ${riskLevel}
- **Critical Vulnerabilities:** ${criticalCount}
- **High Severity Issues:** ${highCount}
- **Medium Severity Issues:** ${mediumCount}
- **Low Severity Issues:** ${lowCount}
- **License Compliance Issues:** ${licenseIssues}

### Scan Performance

- **Files Scanned:** ${filesScanned}
- **Scan Duration:** ${scanDuration} seconds
- **Scanner Confidence:** ${scanResult.metadata.confidence}%

### Immediate Actions Required

${this.generateImmediateActions(scanResult.vulnerabilities)}

### Business Impact

${this.generateBusinessImpact(scanResult.vulnerabilities, scanResult.riskAssessments)}`;
  }

  private generateMetrics(scanResult: ScanResult): string {
    const vulnerabilities = scanResult.vulnerabilities;
    const dependencyVulns = vulnerabilities.filter(v => v.category === VulnerabilityCategory.VULNERABLE_DEPENDENCY);
    const licenseIssues = vulnerabilities.filter(v => v.title.includes('License compliance'));

    // Group by package ecosystem
    const npmVulns = vulnerabilities.filter(v => 
      v.location.filePath.includes('package.json') || 
      v.location.filePath.includes('package-lock.json') ||
      v.location.filePath.includes('yarn.lock')
    );
    
    const pythonVulns = vulnerabilities.filter(v => 
      v.location.filePath.includes('requirements.txt') || 
      v.location.filePath.includes('Pipfile')
    );

    // Calculate metrics
    const avgSeverityScore = this.calculateAverageSeverityScore(vulnerabilities);
    const patchableVulns = dependencyVulns.filter(v => 
      v.remediation.summary.toLowerCase().includes('update')
    ).length;

    return `## Security Metrics

### Vulnerability Distribution

| Ecosystem | Critical | High | Medium | Low | Total |
|-----------|----------|------|--------|-----|-------|
| NPM | ${this.countBySeverity(npmVulns, VulnerabilitySeverity.CRITICAL)} | ${this.countBySeverity(npmVulns, VulnerabilitySeverity.HIGH)} | ${this.countBySeverity(npmVulns, VulnerabilitySeverity.MEDIUM)} | ${this.countBySeverity(npmVulns, VulnerabilitySeverity.LOW)} | ${npmVulns.length} |
| Python | ${this.countBySeverity(pythonVulns, VulnerabilitySeverity.CRITICAL)} | ${this.countBySeverity(pythonVulns, VulnerabilitySeverity.HIGH)} | ${this.countBySeverity(pythonVulns, VulnerabilitySeverity.MEDIUM)} | ${this.countBySeverity(pythonVulns, VulnerabilitySeverity.LOW)} | ${pythonVulns.length} |
| **Total** | **${this.countBySeverity(vulnerabilities, VulnerabilitySeverity.CRITICAL)}** | **${this.countBySeverity(vulnerabilities, VulnerabilitySeverity.HIGH)}** | **${this.countBySeverity(vulnerabilities, VulnerabilitySeverity.MEDIUM)}** | **${this.countBySeverity(vulnerabilities, VulnerabilitySeverity.LOW)}** | **${vulnerabilities.length}** |

### Key Metrics

- **Average Severity Score:** ${avgSeverityScore.toFixed(1)}/10
- **Patchable Vulnerabilities:** ${patchableVulns}/${dependencyVulns.length} (${((patchableVulns/Math.max(dependencyVulns.length, 1)) * 100).toFixed(1)}%)
- **License Issues:** ${licenseIssues.length}
- **Unique CVEs:** ${this.getUniqueCVEs(vulnerabilities).length}
- **Affected Packages:** ${this.getAffectedPackages(vulnerabilities).length}

### Risk Score Calculation

The overall risk score is calculated based on:
- Vulnerability severity distribution (40%)
- Number of affected packages (25%)
- Patchability of vulnerabilities (20%)
- License compliance issues (15%)

**Current Risk Score:** ${this.calculateRiskScore(vulnerabilities)}/100`;
  }

  private generateCriticalFindings(vulnerabilities: VulnerabilityFinding[]): string {
    const criticalVulns = this.getVulnerabilitiesBySeverity(vulnerabilities, VulnerabilitySeverity.CRITICAL);
    
    if (criticalVulns.length === 0) {
      return `## Critical Findings

✅ **No critical vulnerabilities found.**

This is excellent! Your dependencies do not contain any critical security vulnerabilities that require immediate attention.`;
    }

    let section = `## Critical Findings

🚨 **${criticalVulns.length} critical vulnerabilities require immediate attention.**

These vulnerabilities pose severe security risks and should be addressed immediately:

`;

    criticalVulns.slice(0, 5).forEach((vuln, index) => {
      section += `### ${index + 1}. ${vuln.title}

**Package:** ${this.extractPackageName(vuln)}  
**CVE:** ${vuln.cveId || 'N/A'}  
**CWE:** ${vuln.cweId || 'N/A'}  

**Impact:** ${vuln.impact}

**Immediate Action:** ${vuln.remediation.summary}

**Evidence:**
${vuln.evidence.map(e => `- ${e}`).join('\n')}

---

`;
    });

    if (criticalVulns.length > 5) {
      section += `*... and ${criticalVulns.length - 5} more critical vulnerabilities. See detailed findings section for complete list.*\n`;
    }

    return section;
  }

  private generateHighPriorityFindings(vulnerabilities: VulnerabilityFinding[]): string {
    const highVulns = this.getVulnerabilitiesBySeverity(vulnerabilities, VulnerabilitySeverity.HIGH);
    
    if (highVulns.length === 0) {
      return `## High Priority Findings

✅ **No high-severity vulnerabilities found.**`;
    }

    let section = `## High Priority Findings

⚠️ **${highVulns.length} high-severity vulnerabilities found.**

These vulnerabilities should be addressed within the next week:

`;

    highVulns.slice(0, 8).forEach((vuln, index) => {
      section += `### ${index + 1}. ${vuln.title}

- **Package:** ${this.extractPackageName(vuln)}
- **Severity:** ${vuln.severity}
- **Category:** ${vuln.category}
- **CVE:** ${vuln.cveId || 'N/A'}
- **Remediation:** ${vuln.remediation.summary}

`;
    });

    if (highVulns.length > 8) {
      section += `*... and ${highVulns.length - 8} more high-severity vulnerabilities.*\n`;
    }

    return section;
  }

  private generateLicenseAnalysis(vulnerabilities: VulnerabilityFinding[]): string {
    const licenseIssues = vulnerabilities.filter(v => v.title.includes('License compliance'));
    
    if (licenseIssues.length === 0) {
      return `## License Compliance Analysis

✅ **No license compliance issues detected.**

All scanned dependencies appear to use licenses compatible with your project.`;
    }

    const highRisk = licenseIssues.filter(v => v.severity === VulnerabilitySeverity.HIGH);
    const mediumRisk = licenseIssues.filter(v => v.severity === VulnerabilitySeverity.MEDIUM);
    const lowRisk = licenseIssues.filter(v => v.severity === VulnerabilitySeverity.LOW);

    let section = `## License Compliance Analysis

⚖️ **${licenseIssues.length} license compliance issues found.**

### Risk Distribution

- **High Risk (Copyleft):** ${highRisk.length} packages
- **Medium Risk (Restrictive):** ${mediumRisk.length} packages  
- **Low Risk (Permissive):** ${lowRisk.length} packages

### High-Risk License Issues

`;

    if (highRisk.length > 0) {
      highRisk.forEach((issue, index) => {
        const packageName = this.extractPackageName(issue);
        const license = issue.evidence.find(e => e.includes('License:'))?.split(': ')[1] || 'Unknown';
        
        section += `${index + 1}. **${packageName}** - ${license}
   - Risk: ${issue.evidence.find(e => e.includes('Reason:'))?.split(': ')[1] || 'Unknown'}
   - Recommendation: ${issue.remediation.summary}

`;
      });
    } else {
      section += `✅ No high-risk license issues found.

`;
    }

    section += `### Recommendations

1. **Review Legal Implications:** Consult with legal team about copyleft license usage
2. **Consider Alternatives:** Replace high-risk packages with permissively licensed alternatives
3. **Document Compliance:** Maintain license inventory and compliance documentation
4. **Automate Scanning:** Integrate license scanning into CI/CD pipeline

### License Risk Matrix

| License Type | Risk Level | Commercial Use | Distribution Requirements |
|--------------|------------|----------------|---------------------------|
| GPL-2.0/3.0 | High | ⚠️ Restricted | Must open-source derivative works |
| LGPL-2.1/3.0 | Medium | ✅ Allowed | Must provide source for LGPL components |
| MIT/Apache-2.0 | Low | ✅ Allowed | Minimal attribution requirements |
| BSD-2/3-Clause | Low | ✅ Allowed | Attribution required |`;

    return section;
  }

  private generateDetailedFindings(vulnerabilities: VulnerabilityFinding[], options: DependencyReportOptions): string {
    if (vulnerabilities.length === 0) {
      return `## Detailed Findings

✅ **No vulnerabilities found in dependency scan.**`;
    }

    let section = `## Detailed Findings

This section provides comprehensive details for all identified vulnerabilities, organized by severity level.

`;

    // Group by severity
    const severityGroups = [
      { severity: VulnerabilitySeverity.CRITICAL, emoji: '🚨', color: 'Critical' },
      { severity: VulnerabilitySeverity.HIGH, emoji: '⚠️', color: 'High' },
      { severity: VulnerabilitySeverity.MEDIUM, emoji: '🔶', color: 'Medium' },
      { severity: VulnerabilitySeverity.LOW, emoji: '🔵', color: 'Low' }
    ];

    severityGroups.forEach(group => {
      const vulns = this.getVulnerabilitiesBySeverity(vulnerabilities, group.severity);
      if (vulns.length === 0) return;

      section += `### ${group.emoji} ${group.color} Severity (${vulns.length} findings)

`;

      vulns.slice(0, options.maxVulnerabilitiesPerSeverity).forEach((vuln, index) => {
        section += this.generateVulnerabilityDetail(vuln, index + 1);
      });

      if (vulns.length > options.maxVulnerabilitiesPerSeverity) {
        section += `*... and ${vulns.length - options.maxVulnerabilitiesPerSeverity} more ${group.color.toLowerCase()}-severity vulnerabilities.*

`;
      }
    });

    return section;
  }

  private generateVulnerabilityDetail(vuln: VulnerabilityFinding, index: number): string {
    const packageName = this.extractPackageName(vuln);
    const filePath = vuln.location.filePath.split('/').pop() || vuln.location.filePath;

    return `#### ${index}. ${vuln.title}

| Field | Value |
|-------|-------|
| **Package** | ${packageName} |
| **File** | ${filePath} |
| **Severity** | ${vuln.severity} |
| **Category** | ${vuln.category} |
| **CVE ID** | ${vuln.cveId || 'N/A'} |
| **CWE ID** | ${vuln.cweId || 'N/A'} |
| **Discovery Date** | ${vuln.discoveredAt.toLocaleDateString()} |

**Description:** ${vuln.description}

**Impact:** ${vuln.impact}

**Evidence:**
${vuln.evidence.map(e => `- ${e}`).join('\n')}

**Remediation Steps:**
${vuln.remediation.steps.map((step, i) => `${i + 1}. ${step.description}`).join('\n')}

**Estimated Effort:** ${vuln.remediation.estimatedEffort}  
**Timeline:** ${vuln.remediation.timeline}

${vuln.references.length > 0 ? `**References:**
${vuln.references.map(ref => `- ${ref}`).join('\n')}` : ''}

---

`;
  }

  private generateRemediationRoadmap(vulnerabilities: VulnerabilityFinding[]): string {
    if (vulnerabilities.length === 0) {
      return `## Remediation Roadmap

✅ **No remediation actions required.**`;
    }

    // Group by priority and timeline
    const immediate = vulnerabilities.filter(v => 
      v.severity === VulnerabilitySeverity.CRITICAL || 
      v.remediation.timeline.toLowerCase().includes('immediate')
    );
    
    const shortTerm = vulnerabilities.filter(v => 
      v.severity === VulnerabilitySeverity.HIGH &&
      !immediate.includes(v)
    );
    
    const mediumTerm = vulnerabilities.filter(v => 
      v.severity === VulnerabilitySeverity.MEDIUM
    );

    let section = `## Remediation Roadmap

This roadmap prioritizes vulnerability fixes based on severity and business impact.

### 🚨 Immediate Actions (0-24 hours)

${immediate.length} critical vulnerabilities requiring immediate attention:

`;

    immediate.forEach((vuln, index) => {
      const packageName = this.extractPackageName(vuln);
      section += `${index + 1}. **${packageName}** - ${vuln.title}
   - Action: ${vuln.remediation.summary}
   - Effort: ${vuln.remediation.estimatedEffort}
   - Verification: ${vuln.remediation.verification.join(', ')}

`;
    });

    section += `### ⚠️ Short-term Actions (1-7 days)

${shortTerm.length} high-severity vulnerabilities:

`;

    shortTerm.slice(0, 10).forEach((vuln, index) => {
      const packageName = this.extractPackageName(vuln);
      section += `${index + 1}. **${packageName}** - ${vuln.remediation.summary}
`;
    });

    if (shortTerm.length > 10) {
      section += `   *... and ${shortTerm.length - 10} more high-severity items*
`;
    }

    section += `
### 🔶 Medium-term Actions (1-4 weeks)

${mediumTerm.length} medium-severity vulnerabilities can be addressed in regular maintenance cycles.

### 📋 Implementation Checklist

- [ ] **Immediate:** Address all critical vulnerabilities
- [ ] **Testing:** Verify fixes in development environment
- [ ] **Staging:** Deploy and test in staging environment
- [ ] **Production:** Deploy fixes to production
- [ ] **Monitoring:** Monitor for any regression issues
- [ ] **Documentation:** Update security documentation
- [ ] **Process:** Review and improve dependency management processes

### 🔄 Ongoing Maintenance

1. **Automated Scanning:** Integrate dependency scanning into CI/CD pipeline
2. **Regular Updates:** Establish monthly dependency update schedule
3. **Security Monitoring:** Subscribe to security advisories for critical packages
4. **License Compliance:** Regular license compliance reviews
5. **Vendor Assessment:** Evaluate security practices of dependency maintainers`;

    return section;
  }

  private generateRiskAssessment(riskAssessments: RiskAssessment[]): string {
    if (riskAssessments.length === 0) {
      return `## Risk Assessment

✅ **No significant risks identified in dependency analysis.**`;
    }

    let section = `## Risk Assessment

Based on the vulnerability analysis, the following risks have been identified:

`;

    riskAssessments.forEach((assessment, index) => {
      section += `### ${index + 1}. Dependency Risk Assessment

**Risk Level:** ${assessment.riskScore.riskLevel}  
**Overall Risk Score:** ${assessment.riskScore.overallRisk}/25  
**Likelihood:** ${assessment.riskScore.likelihood}/5  
**Impact:** ${assessment.riskScore.impact}/5

**Business Impact:** ${assessment.businessImpact.financialImpact.estimatedCost.minimum} - ${assessment.businessImpact.financialImpact.estimatedCost.maximum} ${assessment.businessImpact.financialImpact.estimatedCost.currency}

**Technical Impact:** ${assessment.businessImpact.operationalImpact.userImpact}

**Affected Assets:**
${assessment.businessImpact.operationalImpact.affectedSystems.map(asset => `- ${asset}`).join('\n')}

**Mitigation Strategies:**
${assessment.mitigationStrategies.map((strategy, i) => `${i + 1}. ${strategy}`).join('\n')}

**Residual Risk:** ${assessment.residualRisk.riskLevel} (${assessment.residualRisk.overallRisk}/25)  
**Assessment Date:** ${assessment.assessmentDate.toLocaleDateString()}  
**Assessor:** ${assessment.assessor}

---

`;
    });

    return section;
  }

  private generateComplianceMapping(complianceMappings: ComplianceMapping[]): string {
    if (complianceMappings.length === 0) {
      return `## Compliance Assessment

✅ **No compliance violations identified.**`;
    }

    let section = `## Compliance Assessment

This section maps identified vulnerabilities to relevant compliance frameworks and standards.

`;

    // Group by framework
    const frameworkGroups = new Map<string, ComplianceMapping[]>();
    complianceMappings.forEach(mapping => {
      mapping.mappedControls.forEach(controlMapping => {
        const framework = controlMapping.control.framework;
        if (!frameworkGroups.has(framework)) {
          frameworkGroups.set(framework, []);
        }
        frameworkGroups.get(framework)!.push(mapping);
      });
    });

    frameworkGroups.forEach((mappings, framework) => {
      section += `### ${framework}

`;

      mappings.forEach(mapping => {
        mapping.mappedControls.forEach(controlMapping => {
          const statusEmoji = controlMapping.status === ComplianceStatus.COMPLIANT ? '✅' : 
                             controlMapping.status === ComplianceStatus.PARTIALLY_COMPLIANT ? '⚠️' : '❌';
          
          section += `#### ${statusEmoji} ${controlMapping.control.controlNumber}: ${controlMapping.control.title}

**Status:** ${controlMapping.status}  
**Framework:** ${controlMapping.control.framework}

**Gap Description:** ${mapping.gapAnalysis.length > 0 ? mapping.gapAnalysis[0].gapDescription : 'No gaps identified'}

**Remediation Required:** ${mapping.recommendedActions.join(', ')}

**Evidence:** ${controlMapping.evidence.length} pieces of evidence

---

`;
        });
      });
    });

    return section;
  }

  private generateAppendices(scanResult: ScanResult): string {
    return `## Appendices

### Appendix A: Scan Configuration

- **Target Path:** ${scanResult.targetPath}
- **Scanner:** ${scanResult.scannerName} v${scanResult.scannerVersion}
- **Scan Start:** ${scanResult.startTime.toISOString()}
- **Scan End:** ${scanResult.endTime.toISOString()}
- **Duration:** ${Math.round(scanResult.metadata.scanDuration / 1000)} seconds
- **Files Scanned:** ${scanResult.filesScanned}

### Appendix B: Scanner Metadata

- **Rules Applied:** ${scanResult.metadata.rulesApplied}
- **Memory Usage:** ${Math.round(scanResult.metadata.memoryUsage / 1024 / 1024)} MB
- **Confidence Level:** ${scanResult.metadata.confidence}%
- **False Positives Filtered:** ${scanResult.metadata.falsePositiveFiltered}

### Appendix C: Error Log

${scanResult.errors.length === 0 ? 
  '✅ No errors encountered during scan.' : 
  scanResult.errors.map(error => 
    `- **${error.errorType}** in ${error.filePath}: ${error.message} (${error.timestamp.toISOString()})`
  ).join('\n')
}

### Appendix D: Glossary

**CVE (Common Vulnerabilities and Exposures):** A standardized identifier for known security vulnerabilities.

**CWE (Common Weakness Enumeration):** A categorization system for software security weaknesses.

**CVSS (Common Vulnerability Scoring System):** A framework for rating the severity of security vulnerabilities.

**Dependency:** External code libraries or packages that your application relies on.

**Transitive Dependency:** Dependencies of your direct dependencies.

**License Compliance:** Ensuring that the licenses of dependencies are compatible with your project's requirements.

---

*Report generated by ${scanResult.scannerName} v${scanResult.scannerVersion} on ${new Date().toISOString()}*`;
  }

  // Helper methods
  private getVulnerabilitiesBySeverity(vulnerabilities: VulnerabilityFinding[], severity: VulnerabilitySeverity): VulnerabilityFinding[] {
    return vulnerabilities.filter(v => v.severity === severity);
  }

  private countBySeverity(vulnerabilities: VulnerabilityFinding[], severity: VulnerabilitySeverity): number {
    return vulnerabilities.filter(v => v.severity === severity).length;
  }

  private extractPackageName(vuln: VulnerabilityFinding): string {
    const packageEvidence = vuln.evidence.find(e => e.startsWith('Package:'));
    return packageEvidence ? packageEvidence.split(': ')[1] : 'Unknown';
  }

  private calculateOverallRiskLevel(vulnerabilities: VulnerabilityFinding[]): string {
    const criticalCount = this.countBySeverity(vulnerabilities, VulnerabilitySeverity.CRITICAL);
    const highCount = this.countBySeverity(vulnerabilities, VulnerabilitySeverity.HIGH);
    
    if (criticalCount > 0) return '🚨 **CRITICAL**';
    if (highCount > 5) return '⚠️ **HIGH**';
    if (highCount > 0) return '🔶 **MEDIUM**';
    return '🔵 **LOW**';
  }

  private generateImmediateActions(vulnerabilities: VulnerabilityFinding[]): string {
    const critical = this.countBySeverity(vulnerabilities, VulnerabilitySeverity.CRITICAL);
    const high = this.countBySeverity(vulnerabilities, VulnerabilitySeverity.HIGH);
    
    if (critical > 0) {
      return `1. **URGENT:** Address ${critical} critical vulnerabilities immediately
2. Update vulnerable dependencies to patched versions
3. Test fixes in development environment before production deployment`;
    }
    
    if (high > 0) {
      return `1. Address ${high} high-severity vulnerabilities within 7 days
2. Prioritize packages with available patches
3. Review and update dependency management processes`;
    }
    
    return `1. Continue regular dependency maintenance
2. Monitor for new security advisories
3. Consider implementing automated dependency scanning`;
  }

  private generateBusinessImpact(vulnerabilities: VulnerabilityFinding[], riskAssessments: RiskAssessment[]): string {
    const critical = this.countBySeverity(vulnerabilities, VulnerabilitySeverity.CRITICAL);
    const high = this.countBySeverity(vulnerabilities, VulnerabilitySeverity.HIGH);
    
    if (critical > 0 || high > 5) {
      return `**HIGH RISK:** Multiple severe vulnerabilities could lead to data breaches, service disruption, or compliance violations. Immediate action required to prevent potential security incidents.`;
    }
    
    if (high > 0) {
      return `**MEDIUM RISK:** Some high-severity vulnerabilities present moderate risk to business operations. Address within planned maintenance cycles.`;
    }
    
    return `**LOW RISK:** Current dependency security posture is acceptable. Continue regular maintenance and monitoring.`;
  }

  private calculateAverageSeverityScore(vulnerabilities: VulnerabilityFinding[]): number {
    if (vulnerabilities.length === 0) return 0;
    
    const severityScores = {
      [VulnerabilitySeverity.CRITICAL]: 10,
      [VulnerabilitySeverity.HIGH]: 7,
      [VulnerabilitySeverity.MEDIUM]: 4,
      [VulnerabilitySeverity.LOW]: 2
    };
    
    const totalScore = vulnerabilities.reduce((sum, vuln) => 
      sum + (severityScores[vuln.severity] || 0), 0
    );
    
    return totalScore / vulnerabilities.length;
  }

  private calculateRiskScore(vulnerabilities: VulnerabilityFinding[]): number {
    const weights = {
      [VulnerabilitySeverity.CRITICAL]: 40,
      [VulnerabilitySeverity.HIGH]: 25,
      [VulnerabilitySeverity.MEDIUM]: 15,
      [VulnerabilitySeverity.LOW]: 5
    };
    
    let score = 0;
    Object.entries(weights).forEach(([severity, weight]) => {
      const count = this.countBySeverity(vulnerabilities, severity as VulnerabilitySeverity);
      score += Math.min(count * weight, weight * 2); // Cap at 2x weight per severity
    });
    
    return Math.min(score, 100);
  }

  private getUniqueCVEs(vulnerabilities: VulnerabilityFinding[]): string[] {
    const cves = vulnerabilities
      .map(v => v.cveId)
      .filter(cve => cve && cve !== 'N/A') as string[];
    return [...new Set(cves)];
  }

  private getAffectedPackages(vulnerabilities: VulnerabilityFinding[]): string[] {
    const packages = vulnerabilities
      .map(v => this.extractPackageName(v))
      .filter(pkg => pkg !== 'Unknown');
    return [...new Set(packages)];
  }
}