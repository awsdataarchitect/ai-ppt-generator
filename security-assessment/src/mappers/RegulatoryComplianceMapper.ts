/**
 * Regulatory Compliance mapping engine
 * Maps security vulnerabilities to GDPR, CCPA, and HIPAA regulatory requirements
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

export enum RegulatoryFramework {
  GDPR = 'General Data Protection Regulation',
  CCPA = 'California Consumer Privacy Act',
  HIPAA = 'Health Insurance Portability and Accountability Act'
}

export enum GdprArticle {
  ARTICLE_5 = 'Article 5 - Principles of processing',
  ARTICLE_6 = 'Article 6 - Lawfulness of processing',
  ARTICLE_25 = 'Article 25 - Data protection by design and by default',
  ARTICLE_32 = 'Article 32 - Security of processing',
  ARTICLE_33 = 'Article 33 - Notification of breach to supervisory authority',
  ARTICLE_34 = 'Article 34 - Communication of breach to data subject',
  ARTICLE_35 = 'Article 35 - Data protection impact assessment'
}

export enum CcpaSection {
  SECTION_1798_100 = '§1798.100 - Right to know about personal information',
  SECTION_1798_105 = '§1798.105 - Right to delete personal information',
  SECTION_1798_110 = '§1798.110 - Right to know about personal information sold or disclosed',
  SECTION_1798_115 = '§1798.115 - Right to opt-out of sale',
  SECTION_1798_150 = '§1798.150 - Private right of action'
}

export enum HipaaRule {
  SECURITY_RULE = 'HIPAA Security Rule',
  PRIVACY_RULE = 'HIPAA Privacy Rule',
  BREACH_NOTIFICATION_RULE = 'HIPAA Breach Notification Rule',
  ENFORCEMENT_RULE = 'HIPAA Enforcement Rule'
}

export interface RegulatoryMappingResult {
  readonly vulnerabilityId: string;
  readonly framework: RegulatoryFramework;
  readonly regulation: string;
  readonly complianceStatus: ComplianceStatus;
  readonly gaps: string[];
  readonly recommendations: string[];
  readonly legalRisk: string;
  readonly penalties: string[];
}

export class RegulatoryComplianceMapper {
  private readonly regulatoryControls: Map<string, ComplianceControl>;
  private readonly categoryMappings: Map<VulnerabilityCategory, string[]>;
  private readonly frameworkMappings: Map<VulnerabilityCategory, RegulatoryFramework[]>;

  constructor() {
    this.regulatoryControls = this.initializeRegulatoryControls();
    this.categoryMappings = this.initializeCategoryMappings();
    this.frameworkMappings = this.initializeFrameworkMappings();
  }

  /**
   * Map a vulnerability finding to regulatory requirements
   */
  public mapVulnerability(vulnerability: VulnerabilityFinding): RegulatoryMappingResult[] {
    const results: RegulatoryMappingResult[] = [];
    
    // Get applicable regulatory controls for this vulnerability
    const controlIds = this.categoryMappings.get(vulnerability.category) || [];
    
    for (const controlId of controlIds) {
      const control = this.regulatoryControls.get(controlId);
      if (!control) continue;

      const complianceStatus = this.determineComplianceStatus(vulnerability, controlId);
      const gaps = this.identifyGaps(vulnerability, controlId);
      const recommendations = this.generateRecommendations(vulnerability, controlId);
      const legalRisk = this.assessLegalRisk(vulnerability, controlId);
      const penalties = this.getPotentialPenalties(controlId);

      // Extract framework and regulation from control ID
      const framework = this.getFrameworkFromControlId(controlId);
      const regulation = this.getRegulationFromControlId(controlId);

      results.push({
        vulnerabilityId: vulnerability.id,
        framework,
        regulation,
        complianceStatus,
        gaps,
        recommendations,
        legalRisk,
        penalties
      });
    }

    return results;
  }

  /**
   * Create comprehensive compliance mapping for multiple vulnerabilities
   */
  public createComplianceMapping(vulnerabilities: VulnerabilityFinding[]): ComplianceMapping[] {
    const mappingsByControl = new Map<string, VulnerabilityFinding[]>();
    
    // Group vulnerabilities by regulatory control
    for (const vulnerability of vulnerabilities) {
      const regulatoryResults = this.mapVulnerability(vulnerability);
      
      for (const result of regulatoryResults) {
        const controlId = this.getControlIdFromFramework(result.framework, result.regulation);
        if (!mappingsByControl.has(controlId)) {
          mappingsByControl.set(controlId, []);
        }
        mappingsByControl.get(controlId)!.push(vulnerability);
      }
    }

    // Create compliance mappings for each control
    const complianceMappings: ComplianceMapping[] = [];
    
    for (const [controlId, controlVulns] of mappingsByControl) {
      const control = this.regulatoryControls.get(controlId)!;
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
   * Initialize regulatory compliance controls
   */
  private initializeRegulatoryControls(): Map<string, ComplianceControl> {
    const controls = new Map<string, ComplianceControl>();

    // GDPR Controls
    controls.set('GDPR-ART5', {
      id: 'GDPR-ART5',
      framework: ComplianceFramework.GDPR,
      controlNumber: 'Article 5',
      title: 'Principles relating to processing of personal data',
      description: 'Personal data shall be processed lawfully, fairly and in a transparent manner; collected for specified, explicit and legitimate purposes; adequate, relevant and limited to what is necessary; accurate and kept up to date; kept in a form which permits identification for no longer than necessary; processed in a manner that ensures appropriate security.',
      category: 'Data Processing Principles',
      requirements: [
        'Process data lawfully, fairly and transparently',
        'Collect data for specified, explicit and legitimate purposes',
        'Ensure data is adequate, relevant and limited to necessity',
        'Keep data accurate and up to date',
        'Limit data retention to necessary period',
        'Ensure appropriate security of personal data'
      ],
      testProcedures: [
        'Review data processing activities',
        'Verify purpose limitation compliance',
        'Test data minimization practices',
        'Review data accuracy procedures',
        'Verify retention policies',
        'Test security measures'
      ]
    });

    controls.set('GDPR-ART25', {
      id: 'GDPR-ART25',
      framework: ComplianceFramework.GDPR,
      controlNumber: 'Article 25',
      title: 'Data protection by design and by default',
      description: 'The controller shall implement appropriate technical and organisational measures to ensure that, by default, only personal data which are necessary for each specific purpose of the processing are processed.',
      category: 'Data Protection by Design',
      requirements: [
        'Implement data protection by design',
        'Implement data protection by default',
        'Use appropriate technical measures',
        'Use appropriate organisational measures',
        'Consider state of the art and implementation costs',
        'Protect rights of data subjects'
      ],
      testProcedures: [
        'Review system design for privacy',
        'Test default privacy settings',
        'Verify technical measures',
        'Review organisational measures',
        'Assess cost-benefit analysis',
        'Test data subject rights'
      ]
    });

    controls.set('GDPR-ART32', {
      id: 'GDPR-ART32',
      framework: ComplianceFramework.GDPR,
      controlNumber: 'Article 32',
      title: 'Security of processing',
      description: 'The controller and processor shall implement appropriate technical and organisational measures to ensure a level of security appropriate to the risk.',
      category: 'Security of Processing',
      requirements: [
        'Implement appropriate technical measures',
        'Implement appropriate organisational measures',
        'Ensure security appropriate to risk',
        'Consider pseudonymisation and encryption',
        'Ensure ongoing confidentiality, integrity, availability',
        'Restore availability after incidents',
        'Test and evaluate effectiveness regularly'
      ],
      testProcedures: [
        'Review technical security measures',
        'Review organisational security measures',
        'Assess risk-appropriate security',
        'Test encryption and pseudonymisation',
        'Verify CIA triad protection',
        'Test incident recovery procedures',
        'Review security testing procedures'
      ]
    });

    controls.set('GDPR-ART33', {
      id: 'GDPR-ART33',
      framework: ComplianceFramework.GDPR,
      controlNumber: 'Article 33',
      title: 'Notification of a personal data breach to the supervisory authority',
      description: 'In the case of a personal data breach, the controller shall without undue delay and, where feasible, not later than 72 hours after having become aware of it, notify the personal data breach to the competent supervisory authority.',
      category: 'Breach Notification',
      requirements: [
        'Notify supervisory authority within 72 hours',
        'Describe nature of breach',
        'Communicate categories and numbers affected',
        'Provide contact details of DPO',
        'Describe likely consequences',
        'Describe measures taken or proposed'
      ],
      testProcedures: [
        'Test breach notification procedures',
        'Verify 72-hour notification capability',
        'Review breach documentation',
        'Test DPO contact procedures',
        'Review consequence assessment',
        'Test remediation procedures'
      ]
    });

    // CCPA Controls
    controls.set('CCPA-1798.100', {
      id: 'CCPA-1798.100',
      framework: ComplianceFramework.CCPA,
      controlNumber: '§1798.100',
      title: 'Right to Know About Personal Information Collected',
      description: 'A consumer shall have the right to request that a business that collects personal information about the consumer disclose the categories and specific pieces of personal information it has collected.',
      category: 'Consumer Rights',
      requirements: [
        'Disclose categories of personal information collected',
        'Disclose specific pieces of personal information',
        'Provide information about sources',
        'Explain business purposes for collection',
        'Identify third parties with whom information is shared',
        'Respond to requests within 45 days'
      ],
      testProcedures: [
        'Test information disclosure procedures',
        'Verify category identification',
        'Review source documentation',
        'Test purpose explanations',
        'Verify third-party disclosures',
        'Test response timeframes'
      ]
    });

    controls.set('CCPA-1798.105', {
      id: 'CCPA-1798.105',
      framework: ComplianceFramework.CCPA,
      controlNumber: '§1798.105',
      title: 'Right to Delete Personal Information',
      description: 'A consumer shall have the right to request that a business delete any personal information about the consumer which the business has collected from the consumer.',
      category: 'Consumer Rights',
      requirements: [
        'Delete personal information upon request',
        'Direct service providers to delete information',
        'Verify identity before deletion',
        'Provide exceptions for necessary retention',
        'Confirm deletion to consumer',
        'Maintain deletion logs'
      ],
      testProcedures: [
        'Test deletion procedures',
        'Verify service provider deletion',
        'Test identity verification',
        'Review retention exceptions',
        'Test deletion confirmation',
        'Review deletion logging'
      ]
    });

    controls.set('CCPA-1798.150', {
      id: 'CCPA-1798.150',
      framework: ComplianceFramework.CCPA,
      controlNumber: '§1798.150',
      title: 'Personal Information Security Breach',
      description: 'Any consumer whose nonencrypted and nonredacted personal information is subject to an unauthorized access and exfiltration, theft, or disclosure as a result of the business\'s violation of the duty to implement and maintain reasonable security procedures and practices may institute a civil action.',
      category: 'Security Requirements',
      requirements: [
        'Implement reasonable security procedures',
        'Maintain reasonable security practices',
        'Encrypt personal information',
        'Redact personal information when appropriate',
        'Prevent unauthorized access',
        'Prevent data exfiltration and theft'
      ],
      testProcedures: [
        'Review security procedures',
        'Test security practices',
        'Verify encryption implementation',
        'Test redaction procedures',
        'Test access controls',
        'Review data loss prevention'
      ]
    });

    // HIPAA Controls
    controls.set('HIPAA-SEC-164.306', {
      id: 'HIPAA-SEC-164.306',
      framework: ComplianceFramework.HIPAA,
      controlNumber: '§164.306',
      title: 'Security standards: General rules',
      description: 'A covered entity or business associate must comply with the applicable administrative, physical, and technical safeguards to protect electronic protected health information.',
      category: 'Security Rule',
      requirements: [
        'Implement administrative safeguards',
        'Implement physical safeguards',
        'Implement technical safeguards',
        'Protect electronic PHI',
        'Ensure confidentiality, integrity, availability',
        'Protect against unauthorized access'
      ],
      testProcedures: [
        'Review administrative safeguards',
        'Test physical safeguards',
        'Verify technical safeguards',
        'Test ePHI protection',
        'Verify CIA triad protection',
        'Test access controls'
      ]
    });

    controls.set('HIPAA-SEC-164.312', {
      id: 'HIPAA-SEC-164.312',
      framework: ComplianceFramework.HIPAA,
      controlNumber: '§164.312',
      title: 'Technical safeguards',
      description: 'A covered entity or business associate must implement technical policies and procedures for electronic information systems that maintain electronic protected health information.',
      category: 'Technical Safeguards',
      requirements: [
        'Implement access control procedures',
        'Assign unique user identification',
        'Implement automatic logoff',
        'Encrypt and decrypt ePHI',
        'Implement audit controls',
        'Ensure data integrity',
        'Implement transmission security'
      ],
      testProcedures: [
        'Test access control implementation',
        'Verify unique user identification',
        'Test automatic logoff',
        'Verify encryption/decryption',
        'Review audit controls',
        'Test data integrity measures',
        'Test transmission security'
      ]
    });

    controls.set('HIPAA-PRIV-164.502', {
      id: 'HIPAA-PRIV-164.502',
      framework: ComplianceFramework.HIPAA,
      controlNumber: '§164.502',
      title: 'Uses and disclosures of protected health information: General rules',
      description: 'A covered entity or business associate may not use or disclose protected health information, except as permitted or required by this subpart or by subpart C of part 160.',
      category: 'Privacy Rule',
      requirements: [
        'Limit uses and disclosures of PHI',
        'Obtain authorization when required',
        'Implement minimum necessary standard',
        'Designate privacy officer',
        'Train workforce on privacy',
        'Implement safeguards for PHI'
      ],
      testProcedures: [
        'Review PHI use and disclosure policies',
        'Test authorization procedures',
        'Verify minimum necessary implementation',
        'Review privacy officer designation',
        'Test workforce training',
        'Review PHI safeguards'
      ]
    });

    return controls;
  }

  /**
   * Initialize vulnerability category to regulatory control mappings
   */
  private initializeCategoryMappings(): Map<VulnerabilityCategory, string[]> {
    const mappings = new Map<VulnerabilityCategory, string[]>();

    mappings.set(VulnerabilityCategory.XSS, ['GDPR-ART32', 'CCPA-1798.150', 'HIPAA-SEC-164.312']);
    mappings.set(VulnerabilityCategory.CSRF, ['GDPR-ART32', 'CCPA-1798.150', 'HIPAA-SEC-164.312']);
    mappings.set(VulnerabilityCategory.SQL_INJECTION, ['GDPR-ART32', 'CCPA-1798.150', 'HIPAA-SEC-164.312']);
    mappings.set(VulnerabilityCategory.COMMAND_INJECTION, ['GDPR-ART32', 'CCPA-1798.150', 'HIPAA-SEC-164.306']);
    mappings.set(VulnerabilityCategory.PATH_TRAVERSAL, ['GDPR-ART32', 'CCPA-1798.150', 'HIPAA-SEC-164.312']);
    mappings.set(VulnerabilityCategory.INFORMATION_DISCLOSURE, ['GDPR-ART5', 'GDPR-ART32', 'CCPA-1798.100', 'HIPAA-PRIV-164.502']);
    mappings.set(VulnerabilityCategory.AUTHENTICATION_BYPASS, ['GDPR-ART32', 'CCPA-1798.150', 'HIPAA-SEC-164.312']);
    mappings.set(VulnerabilityCategory.AUTHORIZATION_FAILURE, ['GDPR-ART32', 'CCPA-1798.150', 'HIPAA-SEC-164.312']);
    mappings.set(VulnerabilityCategory.CRYPTOGRAPHIC_FAILURE, ['GDPR-ART32', 'CCPA-1798.150', 'HIPAA-SEC-164.312']);
    mappings.set(VulnerabilityCategory.INSECURE_CONFIGURATION, ['GDPR-ART25', 'GDPR-ART32', 'CCPA-1798.150', 'HIPAA-SEC-164.306']);
    mappings.set(VulnerabilityCategory.VULNERABLE_DEPENDENCY, ['GDPR-ART32', 'CCPA-1798.150', 'HIPAA-SEC-164.306']);
    mappings.set(VulnerabilityCategory.INSECURE_DESIGN, ['GDPR-ART25', 'CCPA-1798.150', 'HIPAA-SEC-164.306']);
    mappings.set(VulnerabilityCategory.LOGGING_FAILURE, ['GDPR-ART33', 'CCPA-1798.150', 'HIPAA-SEC-164.312']);
    mappings.set(VulnerabilityCategory.SSRF, ['GDPR-ART32', 'CCPA-1798.150', 'HIPAA-SEC-164.312']);
    mappings.set(VulnerabilityCategory.INPUT_VALIDATION, ['GDPR-ART32', 'CCPA-1798.150', 'HIPAA-SEC-164.312']);
    mappings.set(VulnerabilityCategory.INSECURE_DESERIALIZATION, ['GDPR-ART32', 'CCPA-1798.150', 'HIPAA-SEC-164.312']);
    mappings.set(VulnerabilityCategory.HARDCODED_SECRETS, ['GDPR-ART32', 'CCPA-1798.150', 'HIPAA-SEC-164.312']);
    mappings.set(VulnerabilityCategory.WEAK_CRYPTOGRAPHY, ['GDPR-ART32', 'CCPA-1798.150', 'HIPAA-SEC-164.312']);
    mappings.set(VulnerabilityCategory.INSECURE_FILE_HANDLING, ['GDPR-ART5', 'GDPR-ART32', 'CCPA-1798.105', 'HIPAA-PRIV-164.502']);

    return mappings;
  }

  /**
   * Initialize vulnerability category to regulatory framework mappings
   */
  private initializeFrameworkMappings(): Map<VulnerabilityCategory, RegulatoryFramework[]> {
    const mappings = new Map<VulnerabilityCategory, RegulatoryFramework[]>();

    // All vulnerability categories potentially affect all three frameworks
    const allFrameworks = [RegulatoryFramework.GDPR, RegulatoryFramework.CCPA, RegulatoryFramework.HIPAA];
    
    Object.values(VulnerabilityCategory).forEach(category => {
      mappings.set(category, allFrameworks);
    });

    return mappings;
  }

  /**
   * Get regulatory framework from control ID
   */
  private getFrameworkFromControlId(controlId: string): RegulatoryFramework {
    if (controlId.startsWith('GDPR')) return RegulatoryFramework.GDPR;
    if (controlId.startsWith('CCPA')) return RegulatoryFramework.CCPA;
    if (controlId.startsWith('HIPAA')) return RegulatoryFramework.HIPAA;
    
    return RegulatoryFramework.GDPR; // Default
  }

  /**
   * Get regulation from control ID
   */
  private getRegulationFromControlId(controlId: string): string {
    const regulationMap: { [key: string]: string } = {
      'GDPR-ART5': GdprArticle.ARTICLE_5,
      'GDPR-ART25': GdprArticle.ARTICLE_25,
      'GDPR-ART32': GdprArticle.ARTICLE_32,
      'GDPR-ART33': GdprArticle.ARTICLE_33,
      'CCPA-1798.100': CcpaSection.SECTION_1798_100,
      'CCPA-1798.105': CcpaSection.SECTION_1798_105,
      'CCPA-1798.150': CcpaSection.SECTION_1798_150,
      'HIPAA-SEC-164.306': HipaaRule.SECURITY_RULE,
      'HIPAA-SEC-164.312': HipaaRule.SECURITY_RULE,
      'HIPAA-PRIV-164.502': HipaaRule.PRIVACY_RULE
    };

    return regulationMap[controlId] || 'Unknown Regulation';
  }

  /**
   * Get control ID from framework and regulation
   */
  private getControlIdFromFramework(framework: RegulatoryFramework, regulation: string): string {
    // Simple mapping - could be enhanced with more sophisticated logic
    if (framework === RegulatoryFramework.GDPR) {
      if (regulation.includes('Article 5')) return 'GDPR-ART5';
      if (regulation.includes('Article 25')) return 'GDPR-ART25';
      if (regulation.includes('Article 32')) return 'GDPR-ART32';
      if (regulation.includes('Article 33')) return 'GDPR-ART33';
    }
    if (framework === RegulatoryFramework.CCPA) {
      if (regulation.includes('1798.100')) return 'CCPA-1798.100';
      if (regulation.includes('1798.105')) return 'CCPA-1798.105';
      if (regulation.includes('1798.150')) return 'CCPA-1798.150';
    }
    if (framework === RegulatoryFramework.HIPAA) {
      if (regulation.includes('164.306')) return 'HIPAA-SEC-164.306';
      if (regulation.includes('164.312')) return 'HIPAA-SEC-164.312';
      if (regulation.includes('164.502')) return 'HIPAA-PRIV-164.502';
    }
    
    return 'GDPR-ART32'; // Default
  }

  /**
   * Assess legal risk for a vulnerability
   */
  private assessLegalRisk(vulnerability: VulnerabilityFinding, controlId: string): string {
    const framework = this.getFrameworkFromControlId(controlId);
    
    if (vulnerability.severity === VulnerabilitySeverity.CRITICAL || vulnerability.severity === VulnerabilitySeverity.HIGH) {
      switch (framework) {
        case RegulatoryFramework.GDPR:
          return 'High - Potential for significant GDPR fines up to 4% of annual turnover or €20 million';
        case RegulatoryFramework.CCPA:
          return 'High - Potential for CCPA penalties up to $7,500 per violation and private right of action';
        case RegulatoryFramework.HIPAA:
          return 'High - Potential for HIPAA penalties up to $1.5 million per incident and criminal charges';
        default:
          return 'High - Significant regulatory penalties possible';
      }
    }
    
    if (vulnerability.severity === VulnerabilitySeverity.MEDIUM) {
      return 'Medium - Moderate regulatory risk with potential for enforcement action';
    }
    
    return 'Low - Minor regulatory risk requiring monitoring and remediation';
  }

  /**
   * Get potential penalties for a control
   */
  private getPotentialPenalties(controlId: string): string[] {
    const framework = this.getFrameworkFromControlId(controlId);
    
    switch (framework) {
      case RegulatoryFramework.GDPR:
        return [
          'Administrative fines up to €20 million or 4% of annual worldwide turnover',
          'Corrective measures and compliance orders',
          'Suspension of data processing operations',
          'Reputational damage and loss of customer trust',
          'Compensation claims from affected data subjects'
        ];
      case RegulatoryFramework.CCPA:
        return [
          'Civil penalties up to $7,500 per intentional violation',
          'Civil penalties up to $2,500 per unintentional violation',
          'Private right of action for data breaches ($100-$750 per consumer)',
          'Injunctive relief and corrective measures',
          'Attorney fees and litigation costs'
        ];
      case RegulatoryFramework.HIPAA:
        return [
          'Civil monetary penalties up to $1.5 million per incident',
          'Criminal penalties up to $250,000 and 10 years imprisonment',
          'Corrective action plans and compliance monitoring',
          'Exclusion from federal healthcare programs',
          'Reputational damage and loss of patient trust'
        ];
      default:
        return ['Regulatory penalties and enforcement actions'];
    }
  }

  /**
   * Determine compliance status for a vulnerability against regulatory control
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
   * Identify gaps for a vulnerability against regulatory control
   */
  private identifyGaps(vulnerability: VulnerabilityFinding, controlId: string): string[] {
    const gaps: string[] = [];
    
    const control = this.regulatoryControls.get(controlId);
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
    if (reqLower.includes('security') && vulnTitle.includes('insecure')) {
      return true;
    }
    
    if (reqLower.includes('encrypt') && vulnTitle.includes('unencrypted')) {
      return true;
    }
    
    if (reqLower.includes('access') && vulnTitle.includes('unauthorized')) {
      return true;
    }
    
    if (reqLower.includes('protect') && vulnTitle.includes('exposed')) {
      return true;
    }
    
    return false;
  }

  /**
   * Generate recommendations for a vulnerability against regulatory control
   */
  private generateRecommendations(vulnerability: VulnerabilityFinding, controlId: string): string[] {
    const recommendations: string[] = [];
    
    const control = this.regulatoryControls.get(controlId);
    if (!control) return recommendations;

    const framework = this.getFrameworkFromControlId(controlId);

    // Add general recommendations based on control
    recommendations.push(`Implement ${control.title.toLowerCase()}`);
    
    // Add framework-specific recommendations based on vulnerability type
    switch (vulnerability.category) {
      case VulnerabilityCategory.CRYPTOGRAPHIC_FAILURE:
        if (framework === RegulatoryFramework.GDPR) {
          recommendations.push('Implement encryption as required by GDPR Article 32');
          recommendations.push('Conduct data protection impact assessment (DPIA)');
        }
        if (framework === RegulatoryFramework.CCPA) {
          recommendations.push('Implement encryption to prevent unauthorized access under CCPA');
        }
        if (framework === RegulatoryFramework.HIPAA) {
          recommendations.push('Implement encryption for ePHI as required by HIPAA Security Rule');
        }
        break;
      case VulnerabilityCategory.INFORMATION_DISCLOSURE:
        if (framework === RegulatoryFramework.GDPR) {
          recommendations.push('Implement data minimization principles (GDPR Article 5)');
          recommendations.push('Ensure lawful basis for processing (GDPR Article 6)');
        }
        if (framework === RegulatoryFramework.CCPA) {
          recommendations.push('Implement consumer right to know procedures');
          recommendations.push('Provide clear privacy notices');
        }
        if (framework === RegulatoryFramework.HIPAA) {
          recommendations.push('Implement minimum necessary standard');
          recommendations.push('Ensure proper authorization for PHI disclosure');
        }
        break;
      case VulnerabilityCategory.LOGGING_FAILURE:
        if (framework === RegulatoryFramework.GDPR) {
          recommendations.push('Implement breach notification procedures (GDPR Article 33)');
          recommendations.push('Prepare for 72-hour notification requirement');
        }
        if (framework === RegulatoryFramework.CCPA) {
          recommendations.push('Implement incident response for data breaches');
        }
        if (framework === RegulatoryFramework.HIPAA) {
          recommendations.push('Implement audit controls as required by HIPAA Security Rule');
          recommendations.push('Maintain audit logs for ePHI access');
        }
        break;
      case VulnerabilityCategory.INSECURE_DESIGN:
        if (framework === RegulatoryFramework.GDPR) {
          recommendations.push('Implement privacy by design (GDPR Article 25)');
          recommendations.push('Implement privacy by default');
        }
        break;
      default:
        recommendations.push(`Address ${vulnerability.category.toLowerCase()} to ensure regulatory compliance`);
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
    const framework = this.getFrameworkFromControlId(controlId);
    
    for (const vulnerability of vulnerabilities) {
      gaps.push({
        controlId,
        framework: this.mapRegulatoryFrameworkToComplianceFramework(framework),
        gapDescription: `${vulnerability.title}: ${vulnerability.description}`,
        severity: vulnerability.severity,
        remediation: `Implement ${framework} controls to address ${vulnerability.category.toLowerCase()}`,
        timeline: this.getRemediationTimeline(vulnerability.severity),
        owner: 'Legal and Compliance Team'
      });
    }

    return gaps;
  }

  /**
   * Map regulatory framework to compliance framework
   */
  private mapRegulatoryFrameworkToComplianceFramework(framework: RegulatoryFramework): ComplianceFramework {
    switch (framework) {
      case RegulatoryFramework.GDPR: return ComplianceFramework.GDPR;
      case RegulatoryFramework.CCPA: return ComplianceFramework.CCPA;
      case RegulatoryFramework.HIPAA: return ComplianceFramework.HIPAA;
      default: return ComplianceFramework.GDPR;
    }
  }

  /**
   * Generate remediation actions for vulnerabilities
   */
  private generateRemediationActions(vulnerabilities: VulnerabilityFinding[], controlId: string): string[] {
    const actions: string[] = [];
    
    const control = this.regulatoryControls.get(controlId);
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
      case VulnerabilitySeverity.CRITICAL: return 'Immediate (24-48 hours) - High regulatory risk';
      case VulnerabilitySeverity.HIGH: return 'Urgent (1-2 weeks) - Significant regulatory risk';
      case VulnerabilitySeverity.MEDIUM: return 'Medium (1-3 months) - Moderate regulatory risk';
      case VulnerabilitySeverity.LOW: return 'Low (3-6 months) - Minor regulatory risk';
      case VulnerabilitySeverity.INFO: return 'Informational (Next compliance review)';
      default: return 'To be determined based on regulatory requirements';
    }
  }
}