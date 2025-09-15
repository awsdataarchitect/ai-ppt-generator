/**
 * NIST Cybersecurity Framework compliance mapping engine
 * Maps security vulnerabilities to NIST CSF Functions, Categories, and Subcategories
 */

import {
  ComplianceMapping,
  ComplianceStatus,
  NistFunction,
  NistMapping,
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

export interface NistMappingResult {
  readonly vulnerabilityId: string;
  readonly nistFunction: NistFunction;
  readonly category: string;
  readonly subcategory: string;
  readonly mapping: NistMapping;
  readonly complianceStatus: ComplianceStatus;
  readonly gaps: string[];
  readonly recommendations: string[];
}

export class NistCsfMapper {
  private readonly nistControls: Map<string, ComplianceControl>;
  private readonly categoryMappings: Map<VulnerabilityCategory, string[]>;
  private readonly functionMappings: Map<VulnerabilityCategory, NistFunction[]>;

  constructor() {
    this.nistControls = this.initializeNistControls();
    this.categoryMappings = this.initializeCategoryMappings();
    this.functionMappings = this.initializeFunctionMappings();
  }

  /**
   * Map a vulnerability finding to NIST CSF subcategories
   */
  public mapVulnerability(vulnerability: VulnerabilityFinding): NistMappingResult[] {
    const results: NistMappingResult[] = [];
    
    // Get applicable NIST subcategories for this vulnerability
    const subcategories = this.categoryMappings.get(vulnerability.category) || [];
    
    for (const subcategoryId of subcategories) {
      const control = this.nistControls.get(subcategoryId);
      if (!control) continue;

      const mapping = this.createNistMapping(subcategoryId, vulnerability);
      const complianceStatus = this.determineComplianceStatus(vulnerability, subcategoryId);
      const gaps = this.identifyGaps(vulnerability, subcategoryId);
      const recommendations = this.generateRecommendations(vulnerability, subcategoryId);

      // Extract function and category from subcategory ID (e.g., "ID.AM-1" -> "ID", "AM")
      const [functionCode, categoryCode] = subcategoryId.split('.');
      const nistFunction = this.getFunctionFromCode(functionCode);
      const category = this.getCategoryFromCode(categoryCode.split('-')[0]);

      results.push({
        vulnerabilityId: vulnerability.id,
        nistFunction,
        category,
        subcategory: subcategoryId,
        mapping,
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
    const mappingsBySubcategory = new Map<string, VulnerabilityFinding[]>();
    
    // Group vulnerabilities by NIST subcategory
    for (const vulnerability of vulnerabilities) {
      const nistResults = this.mapVulnerability(vulnerability);
      
      for (const result of nistResults) {
        if (!mappingsBySubcategory.has(result.subcategory)) {
          mappingsBySubcategory.set(result.subcategory, []);
        }
        mappingsBySubcategory.get(result.subcategory)!.push(vulnerability);
      }
    }

    // Create compliance mappings for each subcategory
    const complianceMappings: ComplianceMapping[] = [];
    
    for (const [subcategoryId, categoryVulns] of mappingsBySubcategory) {
      const control = this.nistControls.get(subcategoryId)!;
      const overallStatus = this.determineOverallStatus(categoryVulns);
      const gaps = this.createComplianceGaps(categoryVulns, subcategoryId);
      const actions = this.generateRemediationActions(categoryVulns, subcategoryId);

      const controlMapping: ComplianceControlMapping = {
        control,
        status: overallStatus,
        evidence: categoryVulns.map(v => `Vulnerability: ${v.title} (${v.severity})`),
        gaps: gaps.map(g => g.gapDescription),
        remediation: actions
      };

      complianceMappings.push({
        vulnerabilityId: categoryVulns.map(v => v.id).join(','),
        mappedControls: [controlMapping],
        overallStatus,
        gapAnalysis: gaps,
        recommendedActions: actions
      });
    }

    return complianceMappings;
  }

  /**
   * Initialize NIST CSF controls and subcategories
   */
  private initializeNistControls(): Map<string, ComplianceControl> {
    const controls = new Map<string, ComplianceControl>();

    // IDENTIFY Function Controls
    controls.set('ID.AM-1', {
      id: 'NIST-ID.AM-1',
      framework: ComplianceFramework.NIST_CSF,
      controlNumber: 'ID.AM-1',
      title: 'Physical devices and systems within the organization are inventoried',
      description: 'Maintain an accurate, complete inventory of physical devices and systems.',
      category: 'Asset Management',
      requirements: [
        'Maintain inventory of physical devices',
        'Include system information in inventory',
        'Update inventory regularly',
        'Classify assets by criticality'
      ],
      testProcedures: [
        'Verify asset inventory completeness',
        'Test inventory update procedures',
        'Validate asset classification'
      ]
    });

    controls.set('ID.AM-2', {
      id: 'NIST-ID.AM-2',
      framework: ComplianceFramework.NIST_CSF,
      controlNumber: 'ID.AM-2',
      title: 'Software platforms and applications within the organization are inventoried',
      description: 'Maintain an accurate inventory of software platforms and applications.',
      category: 'Asset Management',
      requirements: [
        'Inventory all software platforms',
        'Track application versions',
        'Identify unauthorized software',
        'Maintain software licenses'
      ],
      testProcedures: [
        'Verify software inventory accuracy',
        'Test for unauthorized software',
        'Validate license compliance'
      ]
    });

    controls.set('ID.RA-1', {
      id: 'NIST-ID.RA-1',
      framework: ComplianceFramework.NIST_CSF,
      controlNumber: 'ID.RA-1',
      title: 'Asset vulnerabilities are identified and documented',
      description: 'Identify and document vulnerabilities in organizational assets.',
      category: 'Risk Assessment',
      requirements: [
        'Conduct regular vulnerability assessments',
        'Document identified vulnerabilities',
        'Prioritize vulnerabilities by risk',
        'Track remediation efforts'
      ],
      testProcedures: [
        'Review vulnerability assessment procedures',
        'Verify vulnerability documentation',
        'Test prioritization methodology'
      ]
    });

    // PROTECT Function Controls
    controls.set('PR.AC-1', {
      id: 'NIST-PR.AC-1',
      framework: ComplianceFramework.NIST_CSF,
      controlNumber: 'PR.AC-1',
      title: 'Identities and credentials are issued, managed, verified, revoked, and audited',
      description: 'Manage the lifecycle of identities and credentials for authorized devices, users and processes.',
      category: 'Identity Management and Access Control',
      requirements: [
        'Implement identity lifecycle management',
        'Manage credential issuance and revocation',
        'Verify identity before access',
        'Audit identity and credential usage'
      ],
      testProcedures: [
        'Test identity management processes',
        'Verify credential management',
        'Audit access controls'
      ]
    });

    controls.set('PR.AC-4', {
      id: 'NIST-PR.AC-4',
      framework: ComplianceFramework.NIST_CSF,
      controlNumber: 'PR.AC-4',
      title: 'Access permissions and authorizations are managed',
      description: 'Manage access permissions and authorizations incorporating the principles of least privilege and separation of duties.',
      category: 'Identity Management and Access Control',
      requirements: [
        'Implement least privilege access',
        'Enforce separation of duties',
        'Regularly review access permissions',
        'Document authorization procedures'
      ],
      testProcedures: [
        'Test access control implementation',
        'Verify least privilege enforcement',
        'Review authorization procedures'
      ]
    });

    controls.set('PR.DS-1', {
      id: 'NIST-PR.DS-1',
      framework: ComplianceFramework.NIST_CSF,
      controlNumber: 'PR.DS-1',
      title: 'Data-at-rest is protected',
      description: 'Protect data at rest using appropriate security measures.',
      category: 'Data Security',
      requirements: [
        'Encrypt sensitive data at rest',
        'Implement access controls for stored data',
        'Use secure storage mechanisms',
        'Monitor data access'
      ],
      testProcedures: [
        'Verify encryption implementation',
        'Test data access controls',
        'Review storage security'
      ]
    });

    controls.set('PR.DS-2', {
      id: 'NIST-PR.DS-2',
      framework: ComplianceFramework.NIST_CSF,
      controlNumber: 'PR.DS-2',
      title: 'Data-in-transit is protected',
      description: 'Protect data in transit using appropriate security measures.',
      category: 'Data Security',
      requirements: [
        'Encrypt data in transit',
        'Use secure communication protocols',
        'Implement network security controls',
        'Monitor data transmission'
      ],
      testProcedures: [
        'Test encryption in transit',
        'Verify secure protocols',
        'Review network security'
      ]
    });

    // DETECT Function Controls
    controls.set('DE.AE-1', {
      id: 'NIST-DE.AE-1',
      framework: ComplianceFramework.NIST_CSF,
      controlNumber: 'DE.AE-1',
      title: 'A baseline of network operations and expected data flows is established',
      description: 'Establish and maintain a baseline of network operations and expected data flows.',
      category: 'Anomalies and Events',
      requirements: [
        'Establish network baseline',
        'Document expected data flows',
        'Monitor for deviations',
        'Update baseline regularly'
      ],
      testProcedures: [
        'Review baseline establishment',
        'Test anomaly detection',
        'Verify monitoring coverage'
      ]
    });

    controls.set('DE.CM-1', {
      id: 'NIST-DE.CM-1',
      framework: ComplianceFramework.NIST_CSF,
      controlNumber: 'DE.CM-1',
      title: 'The network is monitored to detect potential cybersecurity events',
      description: 'Monitor network traffic to detect potential cybersecurity events.',
      category: 'Security Continuous Monitoring',
      requirements: [
        'Implement network monitoring',
        'Detect security events',
        'Analyze network traffic',
        'Generate security alerts'
      ],
      testProcedures: [
        'Test monitoring capabilities',
        'Verify event detection',
        'Review alert generation'
      ]
    });

    // RESPOND Function Controls
    controls.set('RS.RP-1', {
      id: 'NIST-RS.RP-1',
      framework: ComplianceFramework.NIST_CSF,
      controlNumber: 'RS.RP-1',
      title: 'Response plan is executed during or after an incident',
      description: 'Execute response plan during or after a cybersecurity incident.',
      category: 'Response Planning',
      requirements: [
        'Develop incident response plan',
        'Execute response procedures',
        'Coordinate response activities',
        'Document response actions'
      ],
      testProcedures: [
        'Test response plan execution',
        'Verify coordination procedures',
        'Review documentation practices'
      ]
    });

    // RECOVER Function Controls
    controls.set('RC.RP-1', {
      id: 'NIST-RC.RP-1',
      framework: ComplianceFramework.NIST_CSF,
      controlNumber: 'RC.RP-1',
      title: 'Recovery plan is executed during or after a cybersecurity incident',
      description: 'Execute recovery plan during or after a cybersecurity incident.',
      category: 'Recovery Planning',
      requirements: [
        'Develop recovery plan',
        'Execute recovery procedures',
        'Restore normal operations',
        'Document recovery actions'
      ],
      testProcedures: [
        'Test recovery plan execution',
        'Verify restoration procedures',
        'Review recovery documentation'
      ]
    });

    return controls;
  }

  /**
   * Initialize vulnerability category to NIST subcategory mappings
   */
  private initializeCategoryMappings(): Map<VulnerabilityCategory, string[]> {
    const mappings = new Map<VulnerabilityCategory, string[]>();

    mappings.set(VulnerabilityCategory.XSS, ['PR.DS-2', 'DE.CM-1']);
    mappings.set(VulnerabilityCategory.CSRF, ['PR.AC-4', 'DE.AE-1']);
    mappings.set(VulnerabilityCategory.SQL_INJECTION, ['PR.DS-1', 'PR.DS-2', 'DE.CM-1']);
    mappings.set(VulnerabilityCategory.COMMAND_INJECTION, ['PR.AC-4', 'DE.CM-1']);
    mappings.set(VulnerabilityCategory.PATH_TRAVERSAL, ['PR.AC-4', 'PR.DS-1']);
    mappings.set(VulnerabilityCategory.INFORMATION_DISCLOSURE, ['PR.DS-1', 'PR.DS-2', 'DE.AE-1']);
    mappings.set(VulnerabilityCategory.AUTHENTICATION_BYPASS, ['PR.AC-1', 'PR.AC-4', 'DE.CM-1']);
    mappings.set(VulnerabilityCategory.AUTHORIZATION_FAILURE, ['PR.AC-4', 'DE.AE-1']);
    mappings.set(VulnerabilityCategory.CRYPTOGRAPHIC_FAILURE, ['PR.DS-1', 'PR.DS-2']);
    mappings.set(VulnerabilityCategory.INSECURE_CONFIGURATION, ['ID.AM-2', 'PR.AC-4']);
    mappings.set(VulnerabilityCategory.VULNERABLE_DEPENDENCY, ['ID.AM-2', 'ID.RA-1']);
    mappings.set(VulnerabilityCategory.INSECURE_DESIGN, ['ID.RA-1', 'PR.AC-4']);
    mappings.set(VulnerabilityCategory.LOGGING_FAILURE, ['DE.AE-1', 'DE.CM-1', 'RS.RP-1']);
    mappings.set(VulnerabilityCategory.SSRF, ['PR.AC-4', 'DE.CM-1']);
    mappings.set(VulnerabilityCategory.INPUT_VALIDATION, ['PR.DS-2', 'DE.CM-1']);
    mappings.set(VulnerabilityCategory.INSECURE_DESERIALIZATION, ['PR.DS-1', 'DE.AE-1']);
    mappings.set(VulnerabilityCategory.HARDCODED_SECRETS, ['PR.AC-1', 'PR.DS-1']);
    mappings.set(VulnerabilityCategory.WEAK_CRYPTOGRAPHY, ['PR.DS-1', 'PR.DS-2']);
    mappings.set(VulnerabilityCategory.INSECURE_FILE_HANDLING, ['PR.AC-4', 'PR.DS-1']);

    return mappings;
  }

  /**
   * Initialize vulnerability category to NIST function mappings
   */
  private initializeFunctionMappings(): Map<VulnerabilityCategory, NistFunction[]> {
    const mappings = new Map<VulnerabilityCategory, NistFunction[]>();

    mappings.set(VulnerabilityCategory.XSS, [NistFunction.PROTECT, NistFunction.DETECT]);
    mappings.set(VulnerabilityCategory.CSRF, [NistFunction.PROTECT, NistFunction.DETECT]);
    mappings.set(VulnerabilityCategory.SQL_INJECTION, [NistFunction.PROTECT, NistFunction.DETECT]);
    mappings.set(VulnerabilityCategory.COMMAND_INJECTION, [NistFunction.PROTECT, NistFunction.DETECT]);
    mappings.set(VulnerabilityCategory.PATH_TRAVERSAL, [NistFunction.PROTECT]);
    mappings.set(VulnerabilityCategory.INFORMATION_DISCLOSURE, [NistFunction.PROTECT, NistFunction.DETECT]);
    mappings.set(VulnerabilityCategory.AUTHENTICATION_BYPASS, [NistFunction.PROTECT, NistFunction.DETECT]);
    mappings.set(VulnerabilityCategory.AUTHORIZATION_FAILURE, [NistFunction.PROTECT, NistFunction.DETECT]);
    mappings.set(VulnerabilityCategory.CRYPTOGRAPHIC_FAILURE, [NistFunction.PROTECT]);
    mappings.set(VulnerabilityCategory.INSECURE_CONFIGURATION, [NistFunction.IDENTIFY, NistFunction.PROTECT]);
    mappings.set(VulnerabilityCategory.VULNERABLE_DEPENDENCY, [NistFunction.IDENTIFY]);
    mappings.set(VulnerabilityCategory.INSECURE_DESIGN, [NistFunction.IDENTIFY, NistFunction.PROTECT]);
    mappings.set(VulnerabilityCategory.LOGGING_FAILURE, [NistFunction.DETECT, NistFunction.RESPOND]);
    mappings.set(VulnerabilityCategory.SSRF, [NistFunction.PROTECT, NistFunction.DETECT]);
    mappings.set(VulnerabilityCategory.INPUT_VALIDATION, [NistFunction.PROTECT, NistFunction.DETECT]);
    mappings.set(VulnerabilityCategory.INSECURE_DESERIALIZATION, [NistFunction.PROTECT, NistFunction.DETECT]);
    mappings.set(VulnerabilityCategory.HARDCODED_SECRETS, [NistFunction.PROTECT]);
    mappings.set(VulnerabilityCategory.WEAK_CRYPTOGRAPHY, [NistFunction.PROTECT]);
    mappings.set(VulnerabilityCategory.INSECURE_FILE_HANDLING, [NistFunction.PROTECT]);

    return mappings;
  }

  /**
   * Create NIST mapping for a specific subcategory and vulnerability
   */
  private createNistMapping(subcategoryId: string, vulnerability: VulnerabilityFinding): NistMapping {
    const [functionCode, categoryCode] = subcategoryId.split('.');
    const nistFunction = this.getFunctionFromCode(functionCode);
    const category = this.getCategoryFromCode(categoryCode.split('-')[0]);

    return {
      function: nistFunction,
      category,
      subcategory: subcategoryId,
      informativeReferences: this.getInformativeReferences(subcategoryId),
      implementationGuidance: this.getImplementationGuidance(subcategoryId, vulnerability)
    };
  }

  /**
   * Get NIST function from function code
   */
  private getFunctionFromCode(code: string): NistFunction {
    switch (code) {
      case 'ID': return NistFunction.IDENTIFY;
      case 'PR': return NistFunction.PROTECT;
      case 'DE': return NistFunction.DETECT;
      case 'RS': return NistFunction.RESPOND;
      case 'RC': return NistFunction.RECOVER;
      default: return NistFunction.IDENTIFY;
    }
  }

  /**
   * Get category name from category code
   */
  private getCategoryFromCode(code: string): string {
    const categoryMap: { [key: string]: string } = {
      'AM': 'Asset Management',
      'BE': 'Business Environment',
      'GV': 'Governance',
      'RA': 'Risk Assessment',
      'RM': 'Risk Management Strategy',
      'SC': 'Supply Chain Risk Management',
      'AC': 'Identity Management and Access Control',
      'AT': 'Awareness and Training',
      'DS': 'Data Security',
      'IP': 'Information Protection Processes and Procedures',
      'MA': 'Maintenance',
      'PT': 'Protective Technology',
      'AE': 'Anomalies and Events',
      'CM': 'Security Continuous Monitoring',
      'DP': 'Detection Processes',
      'RP': 'Response Planning',
      'CO': 'Communications',
      'AN': 'Analysis',
      'MI': 'Mitigation',
      'IM': 'Improvements'
    };

    return categoryMap[code] || 'Unknown Category';
  }

  /**
   * Get informative references for a subcategory
   */
  private getInformativeReferences(subcategoryId: string): string[] {
    const references: { [key: string]: string[] } = {
      'ID.AM-1': ['CIS CSC 1', 'COBIT 5 BAI09.01', 'ISA 62443-2-1:2009 4.2.3.4', 'ISO/IEC 27001:2013 A.8.1.1'],
      'ID.AM-2': ['CIS CSC 2', 'COBIT 5 BAI09.02', 'ISA 62443-2-1:2009 4.2.3.4', 'ISO/IEC 27001:2013 A.8.1.1'],
      'ID.RA-1': ['CIS CSC 4', 'COBIT 5 APO12.01', 'ISA 62443-2-1:2009 4.2.3', 'ISO/IEC 27001:2013 A.12.6.1'],
      'PR.AC-1': ['CIS CSC 16', 'COBIT 5 DSS05.04', 'ISA 62443-2-1:2009 4.3.3.5.1', 'ISO/IEC 27001:2013 A.9.2.1'],
      'PR.AC-4': ['CIS CSC 14', 'COBIT 5 DSS05.04', 'ISA 62443-2-1:2009 4.3.3.7.3', 'ISO/IEC 27001:2013 A.9.1.2'],
      'PR.DS-1': ['CIS CSC 13', 'COBIT 5 APO01.06', 'ISA 62443-3-3:2013 SR 4.1', 'ISO/IEC 27001:2013 A.8.2.3'],
      'PR.DS-2': ['CIS CSC 13', 'COBIT 5 APO01.06', 'ISA 62443-3-3:2013 SR 4.1', 'ISO/IEC 27001:2013 A.8.2.3'],
      'DE.AE-1': ['CIS CSC 6', 'COBIT 5 DSS03.01', 'ISA 62443-2-1:2009 4.3.4.5.6', 'ISO/IEC 27001:2013 A.12.1.1'],
      'DE.CM-1': ['CIS CSC 1', 'COBIT 5 DSS05.07', 'ISA 62443-3-3:2013 SR 6.2', 'ISO/IEC 27001:2013 A.12.4.1'],
      'RS.RP-1': ['CIS CSC 19', 'COBIT 5 APO12.06', 'ISA 62443-2-1:2009 4.3.4.5.1', 'ISO/IEC 27001:2013 A.16.1.5'],
      'RC.RP-1': ['CIS CSC 10', 'COBIT 5 DSS04.07', 'ISA 62443-2-1:2009 4.3.4.5.1', 'ISO/IEC 27001:2013 A.17.1.2']
    };

    return references[subcategoryId] || [];
  }

  /**
   * Get implementation guidance for a subcategory
   */
  private getImplementationGuidance(subcategoryId: string, vulnerability: VulnerabilityFinding): string[] {
    const baseGuidance: { [key: string]: string[] } = {
      'ID.AM-1': [
        'Maintain comprehensive asset inventory',
        'Include hardware specifications and locations',
        'Update inventory when assets are added/removed',
        'Classify assets by business criticality'
      ],
      'ID.AM-2': [
        'Inventory all software and applications',
        'Track software versions and patch levels',
        'Identify unauthorized software installations',
        'Maintain software license compliance'
      ],
      'ID.RA-1': [
        'Conduct regular vulnerability assessments',
        'Use automated scanning tools',
        'Prioritize vulnerabilities by business risk',
        'Track remediation progress'
      ],
      'PR.AC-1': [
        'Implement centralized identity management',
        'Use strong authentication mechanisms',
        'Regularly audit user accounts and permissions',
        'Implement account lifecycle management'
      ],
      'PR.AC-4': [
        'Implement role-based access control',
        'Apply principle of least privilege',
        'Regularly review and update permissions',
        'Implement segregation of duties'
      ],
      'PR.DS-1': [
        'Encrypt sensitive data at rest',
        'Use strong encryption algorithms',
        'Implement proper key management',
        'Regularly test encryption effectiveness'
      ],
      'PR.DS-2': [
        'Encrypt data in transit using TLS/SSL',
        'Use secure communication protocols',
        'Implement network segmentation',
        'Monitor data transmission security'
      ],
      'DE.AE-1': [
        'Establish network traffic baselines',
        'Document normal system behavior',
        'Implement anomaly detection systems',
        'Regularly update baselines'
      ],
      'DE.CM-1': [
        'Deploy network monitoring tools',
        'Implement security information and event management (SIEM)',
        'Configure real-time alerting',
        'Regularly review monitoring coverage'
      ],
      'RS.RP-1': [
        'Develop comprehensive incident response plan',
        'Define roles and responsibilities',
        'Establish communication procedures',
        'Regularly test and update the plan'
      ],
      'RC.RP-1': [
        'Develop business continuity plan',
        'Implement backup and recovery procedures',
        'Test recovery capabilities regularly',
        'Document recovery time objectives'
      ]
    };

    const guidance = baseGuidance[subcategoryId] || [];
    
    // Add vulnerability-specific guidance
    if (vulnerability.severity === VulnerabilitySeverity.CRITICAL || vulnerability.severity === VulnerabilitySeverity.HIGH) {
      guidance.push(`Address ${vulnerability.title} as high priority due to ${vulnerability.severity.toLowerCase()} severity`);
    }

    return guidance;
  }

  /**
   * Determine compliance status for a vulnerability against NIST subcategory
   */
  private determineComplianceStatus(vulnerability: VulnerabilityFinding, subcategoryId: string): ComplianceStatus {
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
   * Identify gaps for a vulnerability against NIST subcategory
   */
  private identifyGaps(vulnerability: VulnerabilityFinding, subcategoryId: string): string[] {
    const gaps: string[] = [];
    
    const control = this.nistControls.get(subcategoryId);
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
    if (reqLower.includes('encrypt') && (vulnTitle.includes('unencrypted') || vulnTitle.includes('plaintext'))) {
      return true;
    }
    
    if (reqLower.includes('access control') && vulnTitle.includes('unauthorized access')) {
      return true;
    }
    
    if (reqLower.includes('monitor') && vulnTitle.includes('logging')) {
      return true;
    }
    
    return false;
  }

  /**
   * Generate recommendations for a vulnerability against NIST subcategory
   */
  private generateRecommendations(vulnerability: VulnerabilityFinding, subcategoryId: string): string[] {
    const recommendations: string[] = [];
    
    const control = this.nistControls.get(subcategoryId);
    if (!control) return recommendations;

    // Add general recommendations based on control
    recommendations.push(`Implement ${control.title.toLowerCase()}`);
    
    // Add specific recommendations based on vulnerability type
    switch (vulnerability.category) {
      case VulnerabilityCategory.CRYPTOGRAPHIC_FAILURE:
        recommendations.push('Implement strong encryption for data at rest and in transit');
        recommendations.push('Use industry-standard cryptographic algorithms');
        break;
      case VulnerabilityCategory.AUTHENTICATION_BYPASS:
        recommendations.push('Implement multi-factor authentication');
        recommendations.push('Regularly audit authentication mechanisms');
        break;
      case VulnerabilityCategory.LOGGING_FAILURE:
        recommendations.push('Implement comprehensive security logging');
        recommendations.push('Deploy security monitoring and alerting');
        break;
      default:
        recommendations.push(`Address ${vulnerability.category.toLowerCase()} vulnerabilities`);
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
  private createComplianceGaps(vulnerabilities: VulnerabilityFinding[], subcategoryId: string): ComplianceGap[] {
    const gaps: ComplianceGap[] = [];
    
    for (const vulnerability of vulnerabilities) {
      gaps.push({
        controlId: subcategoryId,
        framework: ComplianceFramework.NIST_CSF,
        gapDescription: `${vulnerability.title}: ${vulnerability.description}`,
        severity: vulnerability.severity,
        remediation: `Implement controls to address ${vulnerability.category.toLowerCase()}`,
        timeline: this.getRemediationTimeline(vulnerability.severity),
        owner: 'Security Team'
      });
    }

    return gaps;
  }

  /**
   * Generate remediation actions for vulnerabilities
   */
  private generateRemediationActions(vulnerabilities: VulnerabilityFinding[], subcategoryId: string): string[] {
    const actions: string[] = [];
    
    const control = this.nistControls.get(subcategoryId);
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
      case VulnerabilitySeverity.INFO: return 'Informational (Next maintenance window)';
      default: return 'To be determined';
    }
  }
}