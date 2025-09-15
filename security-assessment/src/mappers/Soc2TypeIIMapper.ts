/**
 * SOC2 Type II compliance mapping engine
 * Maps security vulnerabilities to SOC2 Trust Service Criteria and controls
 */

import {
  ComplianceMapping,
  ComplianceStatus,
  ComplianceControl,
  ComplianceFramework,
  ComplianceControlMapping,
  ComplianceGap
} from '../types/ComplianceTypes';
import {
  VulnerabilityFinding,
  VulnerabilityCategory,
  VulnerabilitySeverity
} from '../types/VulnerabilityTypes';

export enum Soc2TrustServiceCriteria {
  SECURITY = 'Security',
  AVAILABILITY = 'Availability',
  PROCESSING_INTEGRITY = 'Processing Integrity',
  CONFIDENTIALITY = 'Confidentiality',
  PRIVACY = 'Privacy'
}

export enum Soc2ControlCategory {
  CONTROL_ENVIRONMENT = 'Control Environment',
  COMMUNICATION_INFORMATION = 'Communication and Information',
  RISK_ASSESSMENT = 'Risk Assessment',
  MONITORING_ACTIVITIES = 'Monitoring Activities',
  CONTROL_ACTIVITIES = 'Control Activities'
}

export interface Soc2MappingResult {
  readonly vulnerabilityId: string;
  readonly trustServiceCriteria: Soc2TrustServiceCriteria;
  readonly controlCategory: Soc2ControlCategory;
  readonly controlId: string;
  readonly complianceStatus: ComplianceStatus;
  readonly gaps: string[];
  readonly recommendations: string[];
}

export class Soc2TypeIIMapper {
  private readonly soc2Controls: Map<string, ComplianceControl>;
  private readonly categoryMappings: Map<VulnerabilityCategory, string[]>;
  private readonly criteriaMappings: Map<VulnerabilityCategory, Soc2TrustServiceCriteria[]>;

  constructor() {
    this.soc2Controls = this.initializeSoc2Controls();
    this.categoryMappings = this.initializeCategoryMappings();
    this.criteriaMappings = this.initializeCriteriaMappings();
  }

  /**
   * Map a vulnerability finding to SOC2 controls
   */
  public mapVulnerability(vulnerability: VulnerabilityFinding): Soc2MappingResult[] {
    const results: Soc2MappingResult[] = [];
    
    // Get applicable SOC2 controls for this vulnerability
    const controlIds = this.categoryMappings.get(vulnerability.category) || [];
    
    for (const controlId of controlIds) {
      const control = this.soc2Controls.get(controlId);
      if (!control) continue;

      const complianceStatus = this.determineComplianceStatus(vulnerability, controlId);
      const gaps = this.identifyGaps(vulnerability, controlId);
      const recommendations = this.generateRecommendations(vulnerability, controlId);

      // Extract trust service criteria and control category from control ID
      const trustServiceCriteria = this.getTrustServiceCriteriaFromControlId(controlId);
      const controlCategory = this.getControlCategoryFromControlId(controlId);

      results.push({
        vulnerabilityId: vulnerability.id,
        trustServiceCriteria,
        controlCategory,
        controlId,
        complianceStatus,
        gaps,
        recommendations
      });
    }

    return results;
  }

  /**
   * Create comprehensive compliance mapping for multiple vulnerabilities
   */
  public createComplianceMapping(vulnerabilities: VulnerabilityFinding[]): ComplianceMapping[] {
    const mappingsByControl = new Map<string, VulnerabilityFinding[]>();
    
    // Group vulnerabilities by SOC2 control
    for (const vulnerability of vulnerabilities) {
      const soc2Results = this.mapVulnerability(vulnerability);
      
      for (const result of soc2Results) {
        if (!mappingsByControl.has(result.controlId)) {
          mappingsByControl.set(result.controlId, []);
        }
        mappingsByControl.get(result.controlId)!.push(vulnerability);
      }
    }

    // Create compliance mappings for each control
    const complianceMappings: ComplianceMapping[] = [];
    
    for (const [controlId, controlVulns] of mappingsByControl) {
      const control = this.soc2Controls.get(controlId)!;
      const overallStatus = this.determineOverallStatus(controlVulns);
      const gaps = this.createComplianceGaps(controlVulns, controlId);
      const actions = this.generateRemediationActions(controlVulns, controlId);

      const controlMapping: ComplianceControlMapping = {
        control,
        status: overallStatus,
        evidence: controlVulns.map(v => `Vulnerability: ${v.title} (${v.severity})`),
        gaps: gaps.map(g => g.gapDescription),
        remediation: actions
      };

      complianceMappings.push({
        vulnerabilityId: controlVulns.map(v => v.id).join(','),
        mappedControls: [controlMapping],
        overallStatus,
        gapAnalysis: gaps,
        recommendedActions: actions
      });
    }

    return complianceMappings;
  }

  /**
   * Initialize SOC2 Type II controls
   */
  private initializeSoc2Controls(): Map<string, ComplianceControl> {
    const controls = new Map<string, ComplianceControl>();

    // Security Controls (CC)
    controls.set('CC1.1', {
      id: 'SOC2-CC1.1',
      framework: ComplianceFramework.SOC2_TYPE_II,
      controlNumber: 'CC1.1',
      title: 'Control Environment - Demonstrates Commitment to Integrity and Ethical Values',
      description: 'The entity demonstrates a commitment to integrity and ethical values.',
      category: 'Control Environment',
      requirements: [
        'Establish tone at the top regarding integrity and ethical values',
        'Establish standards of conduct and evaluate adherence',
        'Address deviations in a timely manner',
        'Communicate expectations to service providers'
      ],
      testProcedures: [
        'Review code of conduct and ethics policies',
        'Test communication of ethical standards',
        'Verify disciplinary actions for violations',
        'Review service provider agreements'
      ]
    });

    controls.set('CC2.1', {
      id: 'SOC2-CC2.1',
      framework: ComplianceFramework.SOC2_TYPE_II,
      controlNumber: 'CC2.1',
      title: 'Communication and Information - Information Quality',
      description: 'The entity obtains or generates and uses relevant, quality information to support the functioning of internal control.',
      category: 'Communication and Information',
      requirements: [
        'Identify information requirements',
        'Capture internal and external sources of data',
        'Process relevant data into quality information',
        'Maintain quality throughout processing'
      ],
      testProcedures: [
        'Review information requirements documentation',
        'Test data capture processes',
        'Verify information quality controls',
        'Review data processing procedures'
      ]
    });

    controls.set('CC3.1', {
      id: 'SOC2-CC3.1',
      framework: ComplianceFramework.SOC2_TYPE_II,
      controlNumber: 'CC3.1',
      title: 'Risk Assessment - Specifies Suitable Objectives',
      description: 'The entity specifies objectives with sufficient clarity to enable the identification and assessment of risks relating to objectives.',
      category: 'Risk Assessment',
      requirements: [
        'Specify operational objectives',
        'Specify external financial reporting objectives',
        'Specify compliance objectives',
        'Include materiality considerations'
      ],
      testProcedures: [
        'Review objective setting process',
        'Verify objective clarity and specificity',
        'Test risk identification procedures',
        'Review materiality assessments'
      ]
    });

    controls.set('CC4.1', {
      id: 'SOC2-CC4.1',
      framework: ComplianceFramework.SOC2_TYPE_II,
      controlNumber: 'CC4.1',
      title: 'Monitoring Activities - Conducts Ongoing and/or Separate Evaluations',
      description: 'The entity selects, develops, and performs ongoing and/or separate evaluations to ascertain whether the components of internal control are present and functioning.',
      category: 'Monitoring Activities',
      requirements: [
        'Establish baseline understanding of internal control',
        'Design and execute monitoring procedures',
        'Assess and report results',
        'Communicate deficiencies'
      ],
      testProcedures: [
        'Review monitoring procedures',
        'Test execution of monitoring activities',
        'Verify deficiency reporting',
        'Review corrective actions'
      ]
    });

    controls.set('CC5.1', {
      id: 'SOC2-CC5.1',
      framework: ComplianceFramework.SOC2_TYPE_II,
      controlNumber: 'CC5.1',
      title: 'Control Activities - Selects and Develops Control Activities',
      description: 'The entity selects and develops control activities that contribute to the mitigation of risks to the achievement of objectives to acceptable levels.',
      category: 'Control Activities',
      requirements: [
        'Integrate with risk assessment',
        'Consider entity-specific factors',
        'Determine relevant business processes',
        'Evaluate mix of control activity types'
      ],
      testProcedures: [
        'Review control activity design',
        'Test control effectiveness',
        'Verify risk mitigation',
        'Review control documentation'
      ]
    });

    // Security-specific controls
    controls.set('CC6.1', {
      id: 'SOC2-CC6.1',
      framework: ComplianceFramework.SOC2_TYPE_II,
      controlNumber: 'CC6.1',
      title: 'Logical and Physical Access Controls - Restricts Logical Access',
      description: 'The entity implements logical access security software, infrastructure, and architectures over protected information assets to protect them from security events to meet the entity\'s objectives.',
      category: 'Control Activities',
      requirements: [
        'Identify and manage the inventory of information assets',
        'Restrict logical access to information assets',
        'Manage points of access',
        'Restrict access to system configurations and master data'
      ],
      testProcedures: [
        'Review asset inventory procedures',
        'Test logical access controls',
        'Verify access point management',
        'Review configuration access controls'
      ]
    });

    controls.set('CC6.2', {
      id: 'SOC2-CC6.2',
      framework: ComplianceFramework.SOC2_TYPE_II,
      controlNumber: 'CC6.2',
      title: 'Logical and Physical Access Controls - Restricts Physical Access',
      description: 'Prior to issuing system credentials and granting system access, the entity registers and authorizes new internal and external users whose access is administered by the entity.',
      category: 'Control Activities',
      requirements: [
        'Register and authorize users before granting access',
        'Issue system credentials to authorized users',
        'Remove access when no longer required',
        'Review user access rights periodically'
      ],
      testProcedures: [
        'Test user registration process',
        'Verify authorization procedures',
        'Review access removal procedures',
        'Test periodic access reviews'
      ]
    });

    controls.set('CC6.3', {
      id: 'SOC2-CC6.3',
      framework: ComplianceFramework.SOC2_TYPE_II,
      controlNumber: 'CC6.3',
      title: 'Logical and Physical Access Controls - Manages Credentials',
      description: 'The entity authorizes, modifies, or removes access to data, software, functions, and other protected information assets based on roles, responsibilities, or the system design and changes.',
      category: 'Control Activities',
      requirements: [
        'Create or modify access based on authorization',
        'Remove access in a timely manner',
        'Review appropriateness of access rights',
        'Use role-based access controls'
      ],
      testProcedures: [
        'Test access provisioning process',
        'Verify access modification procedures',
        'Review access removal timeliness',
        'Test role-based access implementation'
      ]
    });

    controls.set('CC7.1', {
      id: 'SOC2-CC7.1',
      framework: ComplianceFramework.SOC2_TYPE_II,
      controlNumber: 'CC7.1',
      title: 'System Operations - Manages System Capacity',
      description: 'To meet its objectives, the entity uses detection and monitoring procedures to identify (1) changes to configurations that result in the introduction of new vulnerabilities, and (2) susceptibilities to newly discovered vulnerabilities.',
      category: 'Control Activities',
      requirements: [
        'Implement vulnerability scanning procedures',
        'Monitor for configuration changes',
        'Assess impact of vulnerabilities',
        'Implement remediation procedures'
      ],
      testProcedures: [
        'Review vulnerability scanning procedures',
        'Test configuration monitoring',
        'Verify vulnerability assessment process',
        'Review remediation procedures'
      ]
    });

    controls.set('CC8.1', {
      id: 'SOC2-CC8.1',
      framework: ComplianceFramework.SOC2_TYPE_II,
      controlNumber: 'CC8.1',
      title: 'Change Management - Manages Changes',
      description: 'The entity authorizes, designs, develops or acquires, configures, documents, tests, approves, and implements changes to infrastructure, data, software, and procedures to meet its objectives.',
      category: 'Control Activities',
      requirements: [
        'Authorize changes to the system',
        'Design and develop changes',
        'Document changes appropriately',
        'Test changes before implementation',
        'Approve changes before deployment'
      ],
      testProcedures: [
        'Review change authorization process',
        'Test change development procedures',
        'Verify change documentation',
        'Review testing procedures',
        'Test change approval process'
      ]
    });

    // Availability Controls (A)
    controls.set('A1.1', {
      id: 'SOC2-A1.1',
      framework: ComplianceFramework.SOC2_TYPE_II,
      controlNumber: 'A1.1',
      title: 'Availability - Performance of System Availability',
      description: 'The entity maintains, monitors, and evaluates current processing capacity and use of system components (infrastructure, data, and software) to manage capacity demand and to enable the implementation of additional capacity to help meet its objectives.',
      category: 'Control Activities',
      requirements: [
        'Monitor current processing capacity',
        'Evaluate system component utilization',
        'Manage capacity demand',
        'Plan for additional capacity needs'
      ],
      testProcedures: [
        'Review capacity monitoring procedures',
        'Test utilization evaluation process',
        'Verify capacity management',
        'Review capacity planning procedures'
      ]
    });

    // Confidentiality Controls (C)
    controls.set('C1.1', {
      id: 'SOC2-C1.1',
      framework: ComplianceFramework.SOC2_TYPE_II,
      controlNumber: 'C1.1',
      title: 'Confidentiality - Identifies and Maintains Confidential Information',
      description: 'The entity identifies and maintains confidential information to meet the entity\'s objectives related to confidentiality.',
      category: 'Control Activities',
      requirements: [
        'Identify confidential information',
        'Classify information by confidentiality level',
        'Implement handling procedures',
        'Monitor confidential information usage'
      ],
      testProcedures: [
        'Review information classification procedures',
        'Test confidentiality controls',
        'Verify handling procedures',
        'Review monitoring procedures'
      ]
    });

    return controls;
  }

  /**
   * Initialize vulnerability category to SOC2 control mappings
   */
  private initializeCategoryMappings(): Map<VulnerabilityCategory, string[]> {
    const mappings = new Map<VulnerabilityCategory, string[]>();

    mappings.set(VulnerabilityCategory.XSS, ['CC6.1', 'CC7.1', 'C1.1']);
    mappings.set(VulnerabilityCategory.CSRF, ['CC6.1', 'CC6.3', 'CC7.1']);
    mappings.set(VulnerabilityCategory.SQL_INJECTION, ['CC6.1', 'CC7.1', 'C1.1']);
    mappings.set(VulnerabilityCategory.COMMAND_INJECTION, ['CC6.1', 'CC6.2', 'CC7.1']);
    mappings.set(VulnerabilityCategory.PATH_TRAVERSAL, ['CC6.1', 'CC6.3', 'C1.1']);
    mappings.set(VulnerabilityCategory.INFORMATION_DISCLOSURE, ['CC6.1', 'C1.1', 'CC4.1']);
    mappings.set(VulnerabilityCategory.AUTHENTICATION_BYPASS, ['CC6.2', 'CC6.3', 'CC7.1']);
    mappings.set(VulnerabilityCategory.AUTHORIZATION_FAILURE, ['CC6.1', 'CC6.3', 'CC4.1']);
    mappings.set(VulnerabilityCategory.CRYPTOGRAPHIC_FAILURE, ['CC6.1', 'C1.1', 'CC7.1']);
    mappings.set(VulnerabilityCategory.INSECURE_CONFIGURATION, ['CC5.1', 'CC7.1', 'CC8.1']);
    mappings.set(VulnerabilityCategory.VULNERABLE_DEPENDENCY, ['CC7.1', 'CC8.1', 'CC3.1']);
    mappings.set(VulnerabilityCategory.INSECURE_DESIGN, ['CC3.1', 'CC5.1', 'CC8.1']);
    mappings.set(VulnerabilityCategory.LOGGING_FAILURE, ['CC4.1', 'CC7.1', 'CC2.1']);
    mappings.set(VulnerabilityCategory.SSRF, ['CC6.1', 'CC7.1', 'C1.1']);
    mappings.set(VulnerabilityCategory.INPUT_VALIDATION, ['CC6.1', 'CC7.1', 'CC5.1']);
    mappings.set(VulnerabilityCategory.INSECURE_DESERIALIZATION, ['CC6.1', 'CC7.1', 'C1.1']);
    mappings.set(VulnerabilityCategory.HARDCODED_SECRETS, ['CC6.1', 'CC6.3', 'C1.1']);
    mappings.set(VulnerabilityCategory.WEAK_CRYPTOGRAPHY, ['CC6.1', 'C1.1', 'CC7.1']);
    mappings.set(VulnerabilityCategory.INSECURE_FILE_HANDLING, ['CC6.1', 'CC6.3', 'C1.1']);

    return mappings;
  }

  /**
   * Initialize vulnerability category to SOC2 trust service criteria mappings
   */
  private initializeCriteriaMappings(): Map<VulnerabilityCategory, Soc2TrustServiceCriteria[]> {
    const mappings = new Map<VulnerabilityCategory, Soc2TrustServiceCriteria[]>();

    mappings.set(VulnerabilityCategory.XSS, [Soc2TrustServiceCriteria.SECURITY, Soc2TrustServiceCriteria.CONFIDENTIALITY]);
    mappings.set(VulnerabilityCategory.CSRF, [Soc2TrustServiceCriteria.SECURITY, Soc2TrustServiceCriteria.PROCESSING_INTEGRITY]);
    mappings.set(VulnerabilityCategory.SQL_INJECTION, [Soc2TrustServiceCriteria.SECURITY, Soc2TrustServiceCriteria.CONFIDENTIALITY]);
    mappings.set(VulnerabilityCategory.COMMAND_INJECTION, [Soc2TrustServiceCriteria.SECURITY, Soc2TrustServiceCriteria.AVAILABILITY]);
    mappings.set(VulnerabilityCategory.PATH_TRAVERSAL, [Soc2TrustServiceCriteria.SECURITY, Soc2TrustServiceCriteria.CONFIDENTIALITY]);
    mappings.set(VulnerabilityCategory.INFORMATION_DISCLOSURE, [Soc2TrustServiceCriteria.CONFIDENTIALITY, Soc2TrustServiceCriteria.PRIVACY]);
    mappings.set(VulnerabilityCategory.AUTHENTICATION_BYPASS, [Soc2TrustServiceCriteria.SECURITY]);
    mappings.set(VulnerabilityCategory.AUTHORIZATION_FAILURE, [Soc2TrustServiceCriteria.SECURITY, Soc2TrustServiceCriteria.CONFIDENTIALITY]);
    mappings.set(VulnerabilityCategory.CRYPTOGRAPHIC_FAILURE, [Soc2TrustServiceCriteria.SECURITY, Soc2TrustServiceCriteria.CONFIDENTIALITY]);
    mappings.set(VulnerabilityCategory.INSECURE_CONFIGURATION, [Soc2TrustServiceCriteria.SECURITY, Soc2TrustServiceCriteria.AVAILABILITY]);
    mappings.set(VulnerabilityCategory.VULNERABLE_DEPENDENCY, [Soc2TrustServiceCriteria.SECURITY, Soc2TrustServiceCriteria.AVAILABILITY]);
    mappings.set(VulnerabilityCategory.INSECURE_DESIGN, [Soc2TrustServiceCriteria.SECURITY, Soc2TrustServiceCriteria.PROCESSING_INTEGRITY]);
    mappings.set(VulnerabilityCategory.LOGGING_FAILURE, [Soc2TrustServiceCriteria.SECURITY, Soc2TrustServiceCriteria.AVAILABILITY]);
    mappings.set(VulnerabilityCategory.SSRF, [Soc2TrustServiceCriteria.SECURITY, Soc2TrustServiceCriteria.CONFIDENTIALITY]);
    mappings.set(VulnerabilityCategory.INPUT_VALIDATION, [Soc2TrustServiceCriteria.SECURITY, Soc2TrustServiceCriteria.PROCESSING_INTEGRITY]);
    mappings.set(VulnerabilityCategory.INSECURE_DESERIALIZATION, [Soc2TrustServiceCriteria.SECURITY, Soc2TrustServiceCriteria.CONFIDENTIALITY]);
    mappings.set(VulnerabilityCategory.HARDCODED_SECRETS, [Soc2TrustServiceCriteria.SECURITY, Soc2TrustServiceCriteria.CONFIDENTIALITY]);
    mappings.set(VulnerabilityCategory.WEAK_CRYPTOGRAPHY, [Soc2TrustServiceCriteria.SECURITY, Soc2TrustServiceCriteria.CONFIDENTIALITY]);
    mappings.set(VulnerabilityCategory.INSECURE_FILE_HANDLING, [Soc2TrustServiceCriteria.SECURITY, Soc2TrustServiceCriteria.CONFIDENTIALITY]);

    return mappings;
  }

  /**
   * Get trust service criteria from control ID
   */
  private getTrustServiceCriteriaFromControlId(controlId: string): Soc2TrustServiceCriteria {
    if (controlId.startsWith('CC')) return Soc2TrustServiceCriteria.SECURITY;
    if (controlId.startsWith('A')) return Soc2TrustServiceCriteria.AVAILABILITY;
    if (controlId.startsWith('PI')) return Soc2TrustServiceCriteria.PROCESSING_INTEGRITY;
    if (controlId.startsWith('C')) return Soc2TrustServiceCriteria.CONFIDENTIALITY;
    if (controlId.startsWith('P')) return Soc2TrustServiceCriteria.PRIVACY;
    
    return Soc2TrustServiceCriteria.SECURITY; // Default
  }

  /**
   * Get control category from control ID
   */
  private getControlCategoryFromControlId(controlId: string): Soc2ControlCategory {
    const categoryMap: { [key: string]: Soc2ControlCategory } = {
      'CC1': Soc2ControlCategory.CONTROL_ENVIRONMENT,
      'CC2': Soc2ControlCategory.COMMUNICATION_INFORMATION,
      'CC3': Soc2ControlCategory.RISK_ASSESSMENT,
      'CC4': Soc2ControlCategory.MONITORING_ACTIVITIES,
      'CC5': Soc2ControlCategory.CONTROL_ACTIVITIES,
      'CC6': Soc2ControlCategory.CONTROL_ACTIVITIES,
      'CC7': Soc2ControlCategory.CONTROL_ACTIVITIES,
      'CC8': Soc2ControlCategory.CONTROL_ACTIVITIES,
      'A1': Soc2ControlCategory.CONTROL_ACTIVITIES,
      'C1': Soc2ControlCategory.CONTROL_ACTIVITIES
    };

    const prefix = controlId.substring(0, controlId.indexOf('.'));
    return categoryMap[prefix] || Soc2ControlCategory.CONTROL_ACTIVITIES;
  }

  /**
   * Determine compliance status for a vulnerability against SOC2 control
   */
  private determineComplianceStatus(vulnerability: VulnerabilityFinding, controlId: string): ComplianceStatus {
    // Critical and High severity vulnerabilities indicate non-compliance
    if (vulnerability.severity === VulnerabilitySeverity.CRITICAL || vulnerability.severity === VulnerabilitySeverity.HIGH) {
      return ComplianceStatus.NON_COMPLIANT;
    }
    
    // Medium severity may indicate partial compliance
    if (vulnerability.severity === VulnerabilitySeverity.MEDIUM) {
      return ComplianceStatus.PARTIALLY_COMPLIANT;
    }
    
    // Low and Info severity require review
    return ComplianceStatus.REQUIRES_REVIEW;
  }

  /**
   * Identify gaps for a vulnerability against SOC2 control
   */
  private identifyGaps(vulnerability: VulnerabilityFinding, controlId: string): string[] {
    const gaps: string[] = [];
    
    const control = this.soc2Controls.get(controlId);
    if (!control) return gaps;

    // Check if vulnerability indicates gaps in control requirements
    for (const requirement of control.requirements) {
      if (this.vulnerabilityIndicatesGap(vulnerability, requirement)) {
        gaps.push(`Gap in ${requirement.toLowerCase()}: ${vulnerability.title}`);
      }
    }

    return gaps;
  }

  /**
   * Check if vulnerability indicates a gap in a specific requirement
   */
  private vulnerabilityIndicatesGap(vulnerability: VulnerabilityFinding, requirement: string): boolean {
    const vulnTitle = vulnerability.title.toLowerCase();
    const reqLower = requirement.toLowerCase();
    
    // Simple keyword matching - could be enhanced with more sophisticated logic
    if (reqLower.includes('access') && vulnTitle.includes('unauthorized')) {
      return true;
    }
    
    if (reqLower.includes('authorize') && vulnTitle.includes('bypass')) {
      return true;
    }
    
    if (reqLower.includes('monitor') && vulnTitle.includes('logging')) {
      return true;
    }
    
    if (reqLower.includes('confidential') && vulnTitle.includes('disclosure')) {
      return true;
    }
    
    return false;
  }

  /**
   * Generate recommendations for a vulnerability against SOC2 control
   */
  private generateRecommendations(vulnerability: VulnerabilityFinding, controlId: string): string[] {
    const recommendations: string[] = [];
    
    const control = this.soc2Controls.get(controlId);
    if (!control) return recommendations;

    // Add general recommendations based on control
    recommendations.push(`Implement ${control.title.toLowerCase()}`);
    
    // Add SOC2-specific recommendations based on vulnerability type
    switch (vulnerability.category) {
      case VulnerabilityCategory.CRYPTOGRAPHIC_FAILURE:
        recommendations.push('Implement strong encryption for confidential information');
        recommendations.push('Establish key management procedures');
        recommendations.push('Document encryption standards and procedures');
        break;
      case VulnerabilityCategory.AUTHENTICATION_BYPASS:
        recommendations.push('Implement multi-factor authentication');
        recommendations.push('Establish user access provisioning procedures');
        recommendations.push('Conduct regular access reviews');
        break;
      case VulnerabilityCategory.LOGGING_FAILURE:
        recommendations.push('Implement comprehensive security monitoring');
        recommendations.push('Establish incident detection and response procedures');
        recommendations.push('Document monitoring and alerting procedures');
        break;
      case VulnerabilityCategory.INSECURE_CONFIGURATION:
        recommendations.push('Implement configuration management procedures');
        recommendations.push('Establish change management controls');
        recommendations.push('Document system configuration standards');
        break;
      case VulnerabilityCategory.VULNERABLE_DEPENDENCY:
        recommendations.push('Implement vulnerability management procedures');
        recommendations.push('Establish patch management processes');
        recommendations.push('Document software inventory and assessment procedures');
        break;
      default:
        recommendations.push(`Address ${vulnerability.category.toLowerCase()} through appropriate SOC2 controls`);
    }

    return recommendations;
  }

  /**
   * Determine overall compliance status for multiple vulnerabilities
   */
  private determineOverallStatus(vulnerabilities: VulnerabilityFinding[]): ComplianceStatus {
    const hasCritical = vulnerabilities.some(v => v.severity === VulnerabilitySeverity.CRITICAL);
    const hasHigh = vulnerabilities.some(v => v.severity === VulnerabilitySeverity.HIGH);
    const hasMedium = vulnerabilities.some(v => v.severity === VulnerabilitySeverity.MEDIUM);

    if (hasCritical) return ComplianceStatus.NON_COMPLIANT;
    if (hasHigh) return ComplianceStatus.NON_COMPLIANT;
    if (hasMedium) return ComplianceStatus.PARTIALLY_COMPLIANT;
    
    return ComplianceStatus.REQUIRES_REVIEW;
  }

  /**
   * Create compliance gaps for vulnerabilities
   */
  private createComplianceGaps(vulnerabilities: VulnerabilityFinding[], controlId: string): ComplianceGap[] {
    const gaps: ComplianceGap[] = [];
    
    for (const vulnerability of vulnerabilities) {
      gaps.push({
        controlId,
        framework: ComplianceFramework.SOC2_TYPE_II,
        gapDescription: `${vulnerability.title}: ${vulnerability.description}`,
        severity: vulnerability.severity,
        remediation: `Implement SOC2 controls to address ${vulnerability.category.toLowerCase()}`,
        timeline: this.getRemediationTimeline(vulnerability.severity),
        owner: 'Compliance Team'
      });
    }

    return gaps;
  }

  /**
   * Generate remediation actions for vulnerabilities
   */
  private generateRemediationActions(vulnerabilities: VulnerabilityFinding[], controlId: string): string[] {
    const actions: string[] = [];
    
    const control = this.soc2Controls.get(controlId);
    if (control) {
      actions.push(`Implement ${control.title}`);
      actions.push(...control.requirements.map(req => `Ensure ${req.toLowerCase()}`));
    }

    // Add vulnerability-specific actions
    for (const vulnerability of vulnerabilities) {
      actions.push(`Remediate ${vulnerability.title} (${vulnerability.severity})`);
    }

    return actions;
  }

  /**
   * Get remediation timeline based on severity
   */
  private getRemediationTimeline(severity: VulnerabilitySeverity): string {
    switch (severity) {
      case VulnerabilitySeverity.CRITICAL: return 'Immediate (24-48 hours)';
      case VulnerabilitySeverity.HIGH: return 'Urgent (1-2 weeks)';
      case VulnerabilitySeverity.MEDIUM: return 'Medium (1-3 months)';
      case VulnerabilitySeverity.LOW: return 'Low (3-6 months)';
      case VulnerabilitySeverity.INFO: return 'Informational (Next audit cycle)';
      default: return 'To be determined';
    }
  }
}