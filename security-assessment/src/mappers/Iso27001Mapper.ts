/**
 * ISO 27001 compliance mapping engine
 * Maps security vulnerabilities to ISO 27001:2022 controls and requirements
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

export enum Iso27001ControlCategory {
  INFORMATION_SECURITY_POLICIES = 'Information Security Policies',
  ORGANIZATION_INFORMATION_SECURITY = 'Organization of Information Security',
  HUMAN_RESOURCE_SECURITY = 'Human Resource Security',
  ASSET_MANAGEMENT = 'Asset Management',
  ACCESS_CONTROL = 'Access Control',
  CRYPTOGRAPHY = 'Cryptography',
  PHYSICAL_ENVIRONMENTAL_SECURITY = 'Physical and Environmental Security',
  OPERATIONS_SECURITY = 'Operations Security',
  COMMUNICATIONS_SECURITY = 'Communications Security',
  SYSTEM_ACQUISITION_DEVELOPMENT = 'System Acquisition, Development and Maintenance',
  SUPPLIER_RELATIONSHIPS = 'Supplier Relationships',
  INCIDENT_MANAGEMENT = 'Information Security Incident Management',
  BUSINESS_CONTINUITY = 'Information Security in Business Continuity Management',
  COMPLIANCE = 'Compliance'
}

export interface Iso27001MappingResult {
  readonly vulnerabilityId: string;
  readonly controlCategory: Iso27001ControlCategory;
  readonly controlId: string;
  readonly complianceStatus: ComplianceStatus;
  readonly gaps: string[];
  readonly recommendations: string[];
}

export class Iso27001Mapper {
  private readonly iso27001Controls: Map<string, ComplianceControl>;
  private readonly categoryMappings: Map<VulnerabilityCategory, string[]>;
  private readonly controlCategoryMappings: Map<VulnerabilityCategory, Iso27001ControlCategory[]>;

  constructor() {
    this.iso27001Controls = this.initializeIso27001Controls();
    this.categoryMappings = this.initializeCategoryMappings();
    this.controlCategoryMappings = this.initializeControlCategoryMappings();
  }

  /**
   * Map a vulnerability finding to ISO 27001 controls
   */
  public mapVulnerability(vulnerability: VulnerabilityFinding): Iso27001MappingResult[] {
    const results: Iso27001MappingResult[] = [];
    
    // Get applicable ISO 27001 controls for this vulnerability
    const controlIds = this.categoryMappings.get(vulnerability.category) || [];
    
    for (const controlId of controlIds) {
      const control = this.iso27001Controls.get(controlId);
      if (!control) continue;

      const complianceStatus = this.determineComplianceStatus(vulnerability, controlId);
      const gaps = this.identifyGaps(vulnerability, controlId);
      const recommendations = this.generateRecommendations(vulnerability, controlId);

      // Extract control category from control ID
      const controlCategory = this.getControlCategoryFromControlId(controlId);

      results.push({
        vulnerabilityId: vulnerability.id,
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
    
    // Group vulnerabilities by ISO 27001 control
    for (const vulnerability of vulnerabilities) {
      const iso27001Results = this.mapVulnerability(vulnerability);
      
      for (const result of iso27001Results) {
        if (!mappingsByControl.has(result.controlId)) {
          mappingsByControl.set(result.controlId, []);
        }
        mappingsByControl.get(result.controlId)!.push(vulnerability);
      }
    }

    // Create compliance mappings for each control
    const complianceMappings: ComplianceMapping[] = [];
    
    for (const [controlId, controlVulns] of mappingsByControl) {
      const control = this.iso27001Controls.get(controlId)!;
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
   * Initialize ISO 27001:2022 controls
   */
  private initializeIso27001Controls(): Map<string, ComplianceControl> {
    const controls = new Map<string, ComplianceControl>();

    // A.5 Information Security Policies
    controls.set('A.5.1', {
      id: 'ISO27001-A.5.1',
      framework: ComplianceFramework.ISO_27001,
      controlNumber: 'A.5.1',
      title: 'Policies for information security',
      description: 'Information security policy and topic-specific policies should be defined, approved by management, published, communicated to and acknowledged by relevant personnel and relevant interested parties, and reviewed at planned intervals or if significant changes occur.',
      category: 'Information Security Policies',
      requirements: [
        'Define information security policies',
        'Obtain management approval',
        'Publish and communicate policies',
        'Review policies at planned intervals'
      ],
      testProcedures: [
        'Review policy documentation',
        'Verify management approval',
        'Test policy communication',
        'Review policy update procedures'
      ]
    });

    // A.8 Asset Management
    controls.set('A.8.1', {
      id: 'ISO27001-A.8.1',
      framework: ComplianceFramework.ISO_27001,
      controlNumber: 'A.8.1',
      title: 'Inventory of assets',
      description: 'Assets associated with information and information processing facilities should be identified, and an inventory of these assets should be drawn up and maintained.',
      category: 'Asset Management',
      requirements: [
        'Identify information assets',
        'Maintain asset inventory',
        'Assign asset ownership',
        'Update inventory regularly'
      ],
      testProcedures: [
        'Review asset inventory',
        'Verify asset identification',
        'Test inventory maintenance',
        'Review ownership assignments'
      ]
    });

    controls.set('A.8.2', {
      id: 'ISO27001-A.8.2',
      framework: ComplianceFramework.ISO_27001,
      controlNumber: 'A.8.2',
      title: 'Information classification',
      description: 'Information should be classified according to the information security requirements of the organization based on confidentiality, integrity, availability and relevant interested party requirements.',
      category: 'Asset Management',
      requirements: [
        'Classify information by sensitivity',
        'Define classification levels',
        'Implement handling procedures',
        'Review classifications regularly'
      ],
      testProcedures: [
        'Review classification scheme',
        'Test classification procedures',
        'Verify handling controls',
        'Review classification updates'
      ]
    });

    // A.9 Access Control
    controls.set('A.9.1', {
      id: 'ISO27001-A.9.1',
      framework: ComplianceFramework.ISO_27001,
      controlNumber: 'A.9.1',
      title: 'Access control policy',
      description: 'An access control policy should be established, documented and reviewed based on business and information security requirements.',
      category: 'Access Control',
      requirements: [
        'Establish access control policy',
        'Document access requirements',
        'Review policy regularly',
        'Align with business requirements'
      ],
      testProcedures: [
        'Review access control policy',
        'Test policy implementation',
        'Verify business alignment',
        'Review policy updates'
      ]
    });

    controls.set('A.9.2', {
      id: 'ISO27001-A.9.2',
      framework: ComplianceFramework.ISO_27001,
      controlNumber: 'A.9.2',
      title: 'Access to networks and network services',
      description: 'Users should only be provided with access to networks and network services that they have been specifically authorized to use.',
      category: 'Access Control',
      requirements: [
        'Control network access',
        'Authorize network services',
        'Monitor network usage',
        'Restrict unauthorized access'
      ],
      testProcedures: [
        'Test network access controls',
        'Verify authorization procedures',
        'Review network monitoring',
        'Test access restrictions'
      ]
    });

    controls.set('A.9.4', {
      id: 'ISO27001-A.9.4',
      framework: ComplianceFramework.ISO_27001,
      controlNumber: 'A.9.4',
      title: 'Privileged access rights',
      description: 'The allocation and use of privileged access rights should be restricted and controlled.',
      category: 'Access Control',
      requirements: [
        'Restrict privileged access',
        'Control allocation of privileges',
        'Monitor privileged activities',
        'Review privileged accounts regularly'
      ],
      testProcedures: [
        'Review privileged access controls',
        'Test privilege allocation',
        'Verify monitoring procedures',
        'Review account management'
      ]
    });

    // A.10 Cryptography
    controls.set('A.10.1', {
      id: 'ISO27001-A.10.1',
      framework: ComplianceFramework.ISO_27001,
      controlNumber: 'A.10.1',
      title: 'Cryptographic controls',
      description: 'A policy on the use of cryptographic controls for protection of information should be developed and implemented.',
      category: 'Cryptography',
      requirements: [
        'Develop cryptographic policy',
        'Implement encryption controls',
        'Manage cryptographic keys',
        'Review cryptographic implementations'
      ],
      testProcedures: [
        'Review cryptographic policy',
        'Test encryption implementation',
        'Verify key management',
        'Review cryptographic controls'
      ]
    });

    // A.12 Operations Security
    controls.set('A.12.1', {
      id: 'ISO27001-A.12.1',
      framework: ComplianceFramework.ISO_27001,
      controlNumber: 'A.12.1',
      title: 'Operational procedures and responsibilities',
      description: 'Operating procedures should be documented and made available to all users who need them.',
      category: 'Operations Security',
      requirements: [
        'Document operational procedures',
        'Make procedures available to users',
        'Update procedures regularly',
        'Train users on procedures'
      ],
      testProcedures: [
        'Review operational documentation',
        'Test procedure availability',
        'Verify update processes',
        'Review training records'
      ]
    });

    controls.set('A.12.6', {
      id: 'ISO27001-A.12.6',
      framework: ComplianceFramework.ISO_27001,
      controlNumber: 'A.12.6',
      title: 'Management of technical vulnerabilities',
      description: 'Information about technical vulnerabilities of information systems being used should be obtained in a timely manner, the organization\'s exposure to such vulnerabilities evaluated and appropriate measures taken to address the associated risk.',
      category: 'Operations Security',
      requirements: [
        'Obtain vulnerability information',
        'Evaluate exposure to vulnerabilities',
        'Take appropriate measures',
        'Monitor vulnerability status'
      ],
      testProcedures: [
        'Review vulnerability management',
        'Test vulnerability assessment',
        'Verify remediation procedures',
        'Review monitoring processes'
      ]
    });

    // A.13 Communications Security
    controls.set('A.13.1', {
      id: 'ISO27001-A.13.1',
      framework: ComplianceFramework.ISO_27001,
      controlNumber: 'A.13.1',
      title: 'Network security management',
      description: 'Networks should be managed and controlled to protect information in systems and applications.',
      category: 'Communications Security',
      requirements: [
        'Manage network security',
        'Control network access',
        'Monitor network traffic',
        'Implement network controls'
      ],
      testProcedures: [
        'Review network management',
        'Test network controls',
        'Verify traffic monitoring',
        'Review security implementations'
      ]
    });

    controls.set('A.13.2', {
      id: 'ISO27001-A.13.2',
      framework: ComplianceFramework.ISO_27001,
      controlNumber: 'A.13.2',
      title: 'Information transfer',
      description: 'Information transfer within the organization and with any external party should be subject to appropriate security measures.',
      category: 'Communications Security',
      requirements: [
        'Secure information transfer',
        'Implement transfer controls',
        'Monitor information flows',
        'Protect against interception'
      ],
      testProcedures: [
        'Review transfer procedures',
        'Test security measures',
        'Verify monitoring controls',
        'Review protection mechanisms'
      ]
    });

    // A.14 System Acquisition, Development and Maintenance
    controls.set('A.14.1', {
      id: 'ISO27001-A.14.1',
      framework: ComplianceFramework.ISO_27001,
      controlNumber: 'A.14.1',
      title: 'Information security requirements analysis and specification',
      description: 'The information security requirements related to the information system should be included in the requirements for new information systems or enhancements to existing information systems.',
      category: 'System Acquisition, Development and Maintenance',
      requirements: [
        'Include security requirements',
        'Analyze security needs',
        'Specify security controls',
        'Review requirements regularly'
      ],
      testProcedures: [
        'Review security requirements',
        'Test requirements analysis',
        'Verify control specifications',
        'Review requirement updates'
      ]
    });

    controls.set('A.14.2', {
      id: 'ISO27001-A.14.2',
      framework: ComplianceFramework.ISO_27001,
      controlNumber: 'A.14.2',
      title: 'Securing application services on public networks',
      description: 'Information involved in application services passing over public networks should be protected from fraudulent activity, contract dispute and unauthorized disclosure and modification.',
      category: 'System Acquisition, Development and Maintenance',
      requirements: [
        'Protect application services',
        'Prevent fraudulent activity',
        'Secure data transmission',
        'Implement authentication controls'
      ],
      testProcedures: [
        'Review application security',
        'Test fraud prevention',
        'Verify transmission security',
        'Review authentication controls'
      ]
    });

    // A.16 Information Security Incident Management
    controls.set('A.16.1', {
      id: 'ISO27001-A.16.1',
      framework: ComplianceFramework.ISO_27001,
      controlNumber: 'A.16.1',
      title: 'Management of information security incidents and improvements',
      description: 'Management responsibilities and procedures should be established to ensure a quick, effective and orderly response to information security incidents.',
      category: 'Information Security Incident Management',
      requirements: [
        'Establish incident management',
        'Define response procedures',
        'Assign management responsibilities',
        'Ensure quick response'
      ],
      testProcedures: [
        'Review incident procedures',
        'Test response capabilities',
        'Verify management roles',
        'Review response times'
      ]
    });

    return controls;
  }

  /**
   * Initialize vulnerability category to ISO 27001 control mappings
   */
  private initializeCategoryMappings(): Map<VulnerabilityCategory, string[]> {
    const mappings = new Map<VulnerabilityCategory, string[]>();

    mappings.set(VulnerabilityCategory.XSS, ['A.14.2', 'A.13.2', 'A.12.6']);
    mappings.set(VulnerabilityCategory.CSRF, ['A.14.2', 'A.9.2', 'A.12.6']);
    mappings.set(VulnerabilityCategory.SQL_INJECTION, ['A.14.2', 'A.13.2', 'A.12.6']);
    mappings.set(VulnerabilityCategory.COMMAND_INJECTION, ['A.14.2', 'A.9.4', 'A.12.6']);
    mappings.set(VulnerabilityCategory.PATH_TRAVERSAL, ['A.9.2', 'A.9.4', 'A.8.2']);
    mappings.set(VulnerabilityCategory.INFORMATION_DISCLOSURE, ['A.8.2', 'A.13.2', 'A.10.1']);
    mappings.set(VulnerabilityCategory.AUTHENTICATION_BYPASS, ['A.9.1', 'A.9.2', 'A.16.1']);
    mappings.set(VulnerabilityCategory.AUTHORIZATION_FAILURE, ['A.9.1', 'A.9.4', 'A.16.1']);
    mappings.set(VulnerabilityCategory.CRYPTOGRAPHIC_FAILURE, ['A.10.1', 'A.13.2', 'A.8.2']);
    mappings.set(VulnerabilityCategory.INSECURE_CONFIGURATION, ['A.12.1', 'A.12.6', 'A.14.1']);
    mappings.set(VulnerabilityCategory.VULNERABLE_DEPENDENCY, ['A.12.6', 'A.14.1', 'A.8.1']);
    mappings.set(VulnerabilityCategory.INSECURE_DESIGN, ['A.14.1', 'A.14.2', 'A.5.1']);
    mappings.set(VulnerabilityCategory.LOGGING_FAILURE, ['A.16.1', 'A.12.1', 'A.13.1']);
    mappings.set(VulnerabilityCategory.SSRF, ['A.13.1', 'A.13.2', 'A.12.6']);
    mappings.set(VulnerabilityCategory.INPUT_VALIDATION, ['A.14.2', 'A.13.2', 'A.12.6']);
    mappings.set(VulnerabilityCategory.INSECURE_DESERIALIZATION, ['A.14.2', 'A.13.2', 'A.12.6']);
    mappings.set(VulnerabilityCategory.HARDCODED_SECRETS, ['A.10.1', 'A.9.4', 'A.8.2']);
    mappings.set(VulnerabilityCategory.WEAK_CRYPTOGRAPHY, ['A.10.1', 'A.13.2', 'A.8.2']);
    mappings.set(VulnerabilityCategory.INSECURE_FILE_HANDLING, ['A.9.2', 'A.8.2', 'A.13.2']);

    return mappings;
  }

  /**
   * Initialize vulnerability category to ISO 27001 control category mappings
   */
  private initializeControlCategoryMappings(): Map<VulnerabilityCategory, Iso27001ControlCategory[]> {
    const mappings = new Map<VulnerabilityCategory, Iso27001ControlCategory[]>();

    mappings.set(VulnerabilityCategory.XSS, [Iso27001ControlCategory.SYSTEM_ACQUISITION_DEVELOPMENT, Iso27001ControlCategory.COMMUNICATIONS_SECURITY]);
    mappings.set(VulnerabilityCategory.CSRF, [Iso27001ControlCategory.SYSTEM_ACQUISITION_DEVELOPMENT, Iso27001ControlCategory.ACCESS_CONTROL]);
    mappings.set(VulnerabilityCategory.SQL_INJECTION, [Iso27001ControlCategory.SYSTEM_ACQUISITION_DEVELOPMENT, Iso27001ControlCategory.COMMUNICATIONS_SECURITY]);
    mappings.set(VulnerabilityCategory.COMMAND_INJECTION, [Iso27001ControlCategory.SYSTEM_ACQUISITION_DEVELOPMENT, Iso27001ControlCategory.ACCESS_CONTROL]);
    mappings.set(VulnerabilityCategory.PATH_TRAVERSAL, [Iso27001ControlCategory.ACCESS_CONTROL, Iso27001ControlCategory.ASSET_MANAGEMENT]);
    mappings.set(VulnerabilityCategory.INFORMATION_DISCLOSURE, [Iso27001ControlCategory.ASSET_MANAGEMENT, Iso27001ControlCategory.CRYPTOGRAPHY]);
    mappings.set(VulnerabilityCategory.AUTHENTICATION_BYPASS, [Iso27001ControlCategory.ACCESS_CONTROL, Iso27001ControlCategory.INCIDENT_MANAGEMENT]);
    mappings.set(VulnerabilityCategory.AUTHORIZATION_FAILURE, [Iso27001ControlCategory.ACCESS_CONTROL, Iso27001ControlCategory.INCIDENT_MANAGEMENT]);
    mappings.set(VulnerabilityCategory.CRYPTOGRAPHIC_FAILURE, [Iso27001ControlCategory.CRYPTOGRAPHY, Iso27001ControlCategory.COMMUNICATIONS_SECURITY]);
    mappings.set(VulnerabilityCategory.INSECURE_CONFIGURATION, [Iso27001ControlCategory.OPERATIONS_SECURITY, Iso27001ControlCategory.SYSTEM_ACQUISITION_DEVELOPMENT]);
    mappings.set(VulnerabilityCategory.VULNERABLE_DEPENDENCY, [Iso27001ControlCategory.OPERATIONS_SECURITY, Iso27001ControlCategory.ASSET_MANAGEMENT]);
    mappings.set(VulnerabilityCategory.INSECURE_DESIGN, [Iso27001ControlCategory.SYSTEM_ACQUISITION_DEVELOPMENT, Iso27001ControlCategory.INFORMATION_SECURITY_POLICIES]);
    mappings.set(VulnerabilityCategory.LOGGING_FAILURE, [Iso27001ControlCategory.INCIDENT_MANAGEMENT, Iso27001ControlCategory.OPERATIONS_SECURITY]);
    mappings.set(VulnerabilityCategory.SSRF, [Iso27001ControlCategory.COMMUNICATIONS_SECURITY, Iso27001ControlCategory.OPERATIONS_SECURITY]);
    mappings.set(VulnerabilityCategory.INPUT_VALIDATION, [Iso27001ControlCategory.SYSTEM_ACQUISITION_DEVELOPMENT, Iso27001ControlCategory.COMMUNICATIONS_SECURITY]);
    mappings.set(VulnerabilityCategory.INSECURE_DESERIALIZATION, [Iso27001ControlCategory.SYSTEM_ACQUISITION_DEVELOPMENT, Iso27001ControlCategory.COMMUNICATIONS_SECURITY]);
    mappings.set(VulnerabilityCategory.HARDCODED_SECRETS, [Iso27001ControlCategory.CRYPTOGRAPHY, Iso27001ControlCategory.ACCESS_CONTROL]);
    mappings.set(VulnerabilityCategory.WEAK_CRYPTOGRAPHY, [Iso27001ControlCategory.CRYPTOGRAPHY, Iso27001ControlCategory.COMMUNICATIONS_SECURITY]);
    mappings.set(VulnerabilityCategory.INSECURE_FILE_HANDLING, [Iso27001ControlCategory.ACCESS_CONTROL, Iso27001ControlCategory.ASSET_MANAGEMENT]);

    return mappings;
  }

  /**
   * Get control category from control ID
   */
  private getControlCategoryFromControlId(controlId: string): Iso27001ControlCategory {
    const categoryMap: { [key: string]: Iso27001ControlCategory } = {
      'A.5': Iso27001ControlCategory.INFORMATION_SECURITY_POLICIES,
      'A.6': Iso27001ControlCategory.ORGANIZATION_INFORMATION_SECURITY,
      'A.7': Iso27001ControlCategory.HUMAN_RESOURCE_SECURITY,
      'A.8': Iso27001ControlCategory.ASSET_MANAGEMENT,
      'A.9': Iso27001ControlCategory.ACCESS_CONTROL,
      'A.10': Iso27001ControlCategory.CRYPTOGRAPHY,
      'A.11': Iso27001ControlCategory.PHYSICAL_ENVIRONMENTAL_SECURITY,
      'A.12': Iso27001ControlCategory.OPERATIONS_SECURITY,
      'A.13': Iso27001ControlCategory.COMMUNICATIONS_SECURITY,
      'A.14': Iso27001ControlCategory.SYSTEM_ACQUISITION_DEVELOPMENT,
      'A.15': Iso27001ControlCategory.SUPPLIER_RELATIONSHIPS,
      'A.16': Iso27001ControlCategory.INCIDENT_MANAGEMENT,
      'A.17': Iso27001ControlCategory.BUSINESS_CONTINUITY,
      'A.18': Iso27001ControlCategory.COMPLIANCE
    };

    const prefix = controlId.substring(0, controlId.lastIndexOf('.'));
    return categoryMap[prefix] || Iso27001ControlCategory.OPERATIONS_SECURITY;
  }

  /**
   * Determine compliance status for a vulnerability against ISO 27001 control
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
   * Identify gaps for a vulnerability against ISO 27001 control
   */
  private identifyGaps(vulnerability: VulnerabilityFinding, controlId: string): string[] {
    const gaps: string[] = [];
    
    const control = this.iso27001Controls.get(controlId);
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
    
    if (reqLower.includes('encrypt') && vulnTitle.includes('unencrypted')) {
      return true;
    }
    
    if (reqLower.includes('vulnerability') && vulnTitle.includes('vulnerable')) {
      return true;
    }
    
    if (reqLower.includes('secure') && vulnTitle.includes('insecure')) {
      return true;
    }
    
    return false;
  }

  /**
   * Generate recommendations for a vulnerability against ISO 27001 control
   */
  private generateRecommendations(vulnerability: VulnerabilityFinding, controlId: string): string[] {
    const recommendations: string[] = [];
    
    const control = this.iso27001Controls.get(controlId);
    if (!control) return recommendations;

    // Add general recommendations based on control
    recommendations.push(`Implement ${control.title.toLowerCase()}`);
    
    // Add ISO 27001-specific recommendations based on vulnerability type
    switch (vulnerability.category) {
      case VulnerabilityCategory.CRYPTOGRAPHIC_FAILURE:
        recommendations.push('Develop and implement cryptographic policy (A.10.1)');
        recommendations.push('Implement strong encryption for data protection');
        recommendations.push('Establish key management procedures');
        break;
      case VulnerabilityCategory.AUTHENTICATION_BYPASS:
        recommendations.push('Establish access control policy (A.9.1)');
        recommendations.push('Implement strong authentication mechanisms');
        recommendations.push('Monitor and log access attempts');
        break;
      case VulnerabilityCategory.LOGGING_FAILURE:
        recommendations.push('Establish incident management procedures (A.16.1)');
        recommendations.push('Implement comprehensive logging and monitoring');
        recommendations.push('Define incident response procedures');
        break;
      case VulnerabilityCategory.INSECURE_CONFIGURATION:
        recommendations.push('Document operational procedures (A.12.1)');
        recommendations.push('Implement configuration management');
        recommendations.push('Establish change control procedures');
        break;
      case VulnerabilityCategory.VULNERABLE_DEPENDENCY:
        recommendations.push('Implement vulnerability management (A.12.6)');
        recommendations.push('Maintain asset inventory (A.8.1)');
        recommendations.push('Establish patch management procedures');
        break;
      default:
        recommendations.push(`Address ${vulnerability.category.toLowerCase()} through appropriate ISO 27001 controls`);
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
        framework: ComplianceFramework.ISO_27001,
        gapDescription: `${vulnerability.title}: ${vulnerability.description}`,
        severity: vulnerability.severity,
        remediation: `Implement ISO 27001 controls to address ${vulnerability.category.toLowerCase()}`,
        timeline: this.getRemediationTimeline(vulnerability.severity),
        owner: 'Information Security Team'
      });
    }

    return gaps;
  }

  /**
   * Generate remediation actions for vulnerabilities
   */
  private generateRemediationActions(vulnerabilities: VulnerabilityFinding[], controlId: string): string[] {
    const actions: string[] = [];
    
    const control = this.iso27001Controls.get(controlId);
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