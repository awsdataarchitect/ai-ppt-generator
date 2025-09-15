/**
 * AWS Well-Architected Security Pillar compliance mapping engine
 * Maps security vulnerabilities to AWS Well-Architected Security Pillar design principles and best practices
 */

import {
  ComplianceMapping,
  ComplianceStatus,
  AwsSecurityPillar,
  AwsSecurityMapping,
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

export interface AwsMappingResult {
  readonly vulnerabilityId: string;
  readonly securityPillar: AwsSecurityPillar;
  readonly designPrinciple: string;
  readonly mapping: AwsSecurityMapping;
  readonly complianceStatus: ComplianceStatus;
  readonly gaps: string[];
  readonly recommendations: string[];
}

export class AwsWellArchitectedMapper {
  private readonly awsControls: Map<string, ComplianceControl>;
  private readonly categoryMappings: Map<VulnerabilityCategory, string[]>;
  private readonly pillarMappings: Map<VulnerabilityCategory, AwsSecurityPillar[]>;

  constructor() {
    this.awsControls = this.initializeAwsControls();
    this.categoryMappings = this.initializeCategoryMappings();
    this.pillarMappings = this.initializePillarMappings();
  }

  /**
   * Map a vulnerability finding to AWS Well-Architected Security Pillar
   */
  public mapVulnerability(vulnerability: VulnerabilityFinding): AwsMappingResult[] {
    const results: AwsMappingResult[] = [];
    
    // Get applicable AWS security controls for this vulnerability
    const controlIds = this.categoryMappings.get(vulnerability.category) || [];
    
    for (const controlId of controlIds) {
      const control = this.awsControls.get(controlId);
      if (!control) continue;

      const mapping = this.createAwsMapping(controlId, vulnerability);
      const complianceStatus = this.determineComplianceStatus(vulnerability, controlId);
      const gaps = this.identifyGaps(vulnerability, controlId);
      const recommendations = this.generateRecommendations(vulnerability, controlId);

      // Extract pillar and design principle from control ID
      const pillar = this.getPillarFromControlId(controlId);
      const designPrinciple = this.getDesignPrincipleFromControlId(controlId);

      results.push({
        vulnerabilityId: vulnerability.id,
        securityPillar: pillar,
        designPrinciple,
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
    const mappingsByControl = new Map<string, VulnerabilityFinding[]>();
    
    // Group vulnerabilities by AWS control
    for (const vulnerability of vulnerabilities) {
      const awsResults = this.mapVulnerability(vulnerability);
      
      for (const result of awsResults) {
        const controlId = this.getControlIdFromPillar(result.securityPillar, result.designPrinciple);
        if (!mappingsByControl.has(controlId)) {
          mappingsByControl.set(controlId, []);
        }
        mappingsByControl.get(controlId)!.push(vulnerability);
      }
    }

    // Create compliance mappings for each control
    const complianceMappings: ComplianceMapping[] = [];
    
    for (const [controlId, controlVulns] of mappingsByControl) {
      const control = this.awsControls.get(controlId)!;
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
   * Initialize AWS Well-Architected Security Pillar controls
   */
  private initializeAwsControls(): Map<string, ComplianceControl> {
    const controls = new Map<string, ComplianceControl>();

    // Identity and Access Management Controls
    controls.set('AWS-IAM-1', {
      id: 'AWS-IAM-1',
      framework: ComplianceFramework.AWS_WELL_ARCHITECTED,
      controlNumber: 'SEC-2',
      title: 'Apply security at all layers',
      description: 'Implement defense in depth with multiple security controls at all layers.',
      category: 'Identity and Access Management',
      requirements: [
        'Implement strong identity foundation',
        'Apply principle of least privilege',
        'Use temporary credentials where possible',
        'Store and use secrets securely',
        'Rely on centralized identity provider'
      ],
      testProcedures: [
        'Review IAM policies and roles',
        'Test access controls',
        'Verify credential management',
        'Audit identity provider integration'
      ]
    });

    controls.set('AWS-IAM-2', {
      id: 'AWS-IAM-2',
      framework: ComplianceFramework.AWS_WELL_ARCHITECTED,
      controlNumber: 'SEC-3',
      title: 'Automate security best practices',
      description: 'Automate security mechanisms to improve your ability to securely scale.',
      category: 'Identity and Access Management',
      requirements: [
        'Automate deployment of security controls',
        'Use infrastructure as code for security',
        'Implement automated security testing',
        'Use managed security services'
      ],
      testProcedures: [
        'Review automation implementation',
        'Test security control deployment',
        'Verify infrastructure as code security'
      ]
    });

    // Detective Controls
    controls.set('AWS-DET-1', {
      id: 'AWS-DET-1',
      framework: ComplianceFramework.AWS_WELL_ARCHITECTED,
      controlNumber: 'SEC-4',
      title: 'Prepare for security events',
      description: 'Implement comprehensive logging and monitoring to detect security events.',
      category: 'Detective Controls',
      requirements: [
        'Capture and analyze events and logs',
        'Implement comprehensive monitoring',
        'Automate response to security events',
        'Conduct regular security assessments'
      ],
      testProcedures: [
        'Review logging configuration',
        'Test monitoring and alerting',
        'Verify automated response capabilities',
        'Audit security assessment procedures'
      ]
    });

    // Infrastructure Protection Controls
    controls.set('AWS-INF-1', {
      id: 'AWS-INF-1',
      framework: ComplianceFramework.AWS_WELL_ARCHITECTED,
      controlNumber: 'SEC-5',
      title: 'Protect networks and hosts',
      description: 'Implement multiple layers of defense including network and host-level controls.',
      category: 'Infrastructure Protection',
      requirements: [
        'Create network layers with VPC',
        'Control traffic at all layers',
        'Implement host-based security',
        'Use managed security services for infrastructure'
      ],
      testProcedures: [
        'Review network architecture',
        'Test network access controls',
        'Verify host security configuration',
        'Audit managed service security'
      ]
    });

    controls.set('AWS-INF-2', {
      id: 'AWS-INF-2',
      framework: ComplianceFramework.AWS_WELL_ARCHITECTED,
      controlNumber: 'SEC-6',
      title: 'Classify your data',
      description: 'Classify data based on sensitivity and implement appropriate protection mechanisms.',
      category: 'Infrastructure Protection',
      requirements: [
        'Identify and classify data',
        'Implement data protection mechanisms',
        'Use encryption appropriately',
        'Implement secure key management'
      ],
      testProcedures: [
        'Review data classification',
        'Test data protection controls',
        'Verify encryption implementation',
        'Audit key management practices'
      ]
    });

    // Data Protection Controls
    controls.set('AWS-DATA-1', {
      id: 'AWS-DATA-1',
      framework: ComplianceFramework.AWS_WELL_ARCHITECTED,
      controlNumber: 'SEC-7',
      title: 'Protect data in transit',
      description: 'Implement appropriate encryption and network controls for data in transit.',
      category: 'Data Protection in Transit and at Rest',
      requirements: [
        'Implement encryption in transit',
        'Use secure protocols (TLS/SSL)',
        'Authenticate network communications',
        'Implement network segmentation'
      ],
      testProcedures: [
        'Test encryption in transit',
        'Verify secure protocol usage',
        'Review network authentication',
        'Audit network segmentation'
      ]
    });

    controls.set('AWS-DATA-2', {
      id: 'AWS-DATA-2',
      framework: ComplianceFramework.AWS_WELL_ARCHITECTED,
      controlNumber: 'SEC-8',
      title: 'Protect data at rest',
      description: 'Implement appropriate encryption and access controls for data at rest.',
      category: 'Data Protection in Transit and at Rest',
      requirements: [
        'Implement encryption at rest',
        'Use appropriate key management',
        'Control access to encrypted data',
        'Implement data backup and recovery'
      ],
      testProcedures: [
        'Test encryption at rest',
        'Verify key management',
        'Review data access controls',
        'Test backup and recovery'
      ]
    });

    // Incident Response Controls
    controls.set('AWS-IR-1', {
      id: 'AWS-IR-1',
      framework: ComplianceFramework.AWS_WELL_ARCHITECTED,
      controlNumber: 'SEC-9',
      title: 'Prepare for security incidents',
      description: 'Develop and implement incident response capabilities.',
      category: 'Incident Response',
      requirements: [
        'Develop incident response plan',
        'Implement incident response team',
        'Automate incident response where possible',
        'Conduct regular incident response exercises'
      ],
      testProcedures: [
        'Review incident response plan',
        'Test incident response procedures',
        'Verify automation capabilities',
        'Audit exercise documentation'
      ]
    });

    return controls;
  }

  /**
   * Initialize vulnerability category to AWS control mappings
   */
  private initializeCategoryMappings(): Map<VulnerabilityCategory, string[]> {
    const mappings = new Map<VulnerabilityCategory, string[]>();

    mappings.set(VulnerabilityCategory.XSS, ['AWS-DATA-1', 'AWS-DET-1']);
    mappings.set(VulnerabilityCategory.CSRF, ['AWS-IAM-1', 'AWS-DET-1']);
    mappings.set(VulnerabilityCategory.SQL_INJECTION, ['AWS-DATA-1', 'AWS-DATA-2', 'AWS-DET-1']);
    mappings.set(VulnerabilityCategory.COMMAND_INJECTION, ['AWS-IAM-1', 'AWS-INF-1', 'AWS-DET-1']);
    mappings.set(VulnerabilityCategory.PATH_TRAVERSAL, ['AWS-IAM-1', 'AWS-DATA-2']);
    mappings.set(VulnerabilityCategory.INFORMATION_DISCLOSURE, ['AWS-DATA-1', 'AWS-DATA-2', 'AWS-DET-1']);
    mappings.set(VulnerabilityCategory.AUTHENTICATION_BYPASS, ['AWS-IAM-1', 'AWS-DET-1']);
    mappings.set(VulnerabilityCategory.AUTHORIZATION_FAILURE, ['AWS-IAM-1', 'AWS-DET-1']);
    mappings.set(VulnerabilityCategory.CRYPTOGRAPHIC_FAILURE, ['AWS-DATA-1', 'AWS-DATA-2']);
    mappings.set(VulnerabilityCategory.INSECURE_CONFIGURATION, ['AWS-IAM-2', 'AWS-INF-1']);
    mappings.set(VulnerabilityCategory.VULNERABLE_DEPENDENCY, ['AWS-IAM-2', 'AWS-DET-1']);
    mappings.set(VulnerabilityCategory.INSECURE_DESIGN, ['AWS-IAM-1', 'AWS-INF-1']);
    mappings.set(VulnerabilityCategory.LOGGING_FAILURE, ['AWS-DET-1', 'AWS-IR-1']);
    mappings.set(VulnerabilityCategory.SSRF, ['AWS-INF-1', 'AWS-DET-1']);
    mappings.set(VulnerabilityCategory.INPUT_VALIDATION, ['AWS-DATA-1', 'AWS-DET-1']);
    mappings.set(VulnerabilityCategory.INSECURE_DESERIALIZATION, ['AWS-DATA-2', 'AWS-DET-1']);
    mappings.set(VulnerabilityCategory.HARDCODED_SECRETS, ['AWS-IAM-1', 'AWS-DATA-2']);
    mappings.set(VulnerabilityCategory.WEAK_CRYPTOGRAPHY, ['AWS-DATA-1', 'AWS-DATA-2']);
    mappings.set(VulnerabilityCategory.INSECURE_FILE_HANDLING, ['AWS-IAM-1', 'AWS-DATA-2']);

    return mappings;
  }

  /**
   * Initialize vulnerability category to AWS pillar mappings
   */
  private initializePillarMappings(): Map<VulnerabilityCategory, AwsSecurityPillar[]> {
    const mappings = new Map<VulnerabilityCategory, AwsSecurityPillar[]>();

    mappings.set(VulnerabilityCategory.XSS, [AwsSecurityPillar.DATA_PROTECTION, AwsSecurityPillar.DETECTIVE_CONTROLS]);
    mappings.set(VulnerabilityCategory.CSRF, [AwsSecurityPillar.IDENTITY_ACCESS_MANAGEMENT, AwsSecurityPillar.DETECTIVE_CONTROLS]);
    mappings.set(VulnerabilityCategory.SQL_INJECTION, [AwsSecurityPillar.DATA_PROTECTION, AwsSecurityPillar.DETECTIVE_CONTROLS]);
    mappings.set(VulnerabilityCategory.COMMAND_INJECTION, [AwsSecurityPillar.IDENTITY_ACCESS_MANAGEMENT, AwsSecurityPillar.INFRASTRUCTURE_PROTECTION]);
    mappings.set(VulnerabilityCategory.PATH_TRAVERSAL, [AwsSecurityPillar.IDENTITY_ACCESS_MANAGEMENT, AwsSecurityPillar.DATA_PROTECTION]);
    mappings.set(VulnerabilityCategory.INFORMATION_DISCLOSURE, [AwsSecurityPillar.DATA_PROTECTION, AwsSecurityPillar.DETECTIVE_CONTROLS]);
    mappings.set(VulnerabilityCategory.AUTHENTICATION_BYPASS, [AwsSecurityPillar.IDENTITY_ACCESS_MANAGEMENT, AwsSecurityPillar.DETECTIVE_CONTROLS]);
    mappings.set(VulnerabilityCategory.AUTHORIZATION_FAILURE, [AwsSecurityPillar.IDENTITY_ACCESS_MANAGEMENT, AwsSecurityPillar.DETECTIVE_CONTROLS]);
    mappings.set(VulnerabilityCategory.CRYPTOGRAPHIC_FAILURE, [AwsSecurityPillar.DATA_PROTECTION]);
    mappings.set(VulnerabilityCategory.INSECURE_CONFIGURATION, [AwsSecurityPillar.INFRASTRUCTURE_PROTECTION]);
    mappings.set(VulnerabilityCategory.VULNERABLE_DEPENDENCY, [AwsSecurityPillar.INFRASTRUCTURE_PROTECTION, AwsSecurityPillar.DETECTIVE_CONTROLS]);
    mappings.set(VulnerabilityCategory.INSECURE_DESIGN, [AwsSecurityPillar.IDENTITY_ACCESS_MANAGEMENT, AwsSecurityPillar.INFRASTRUCTURE_PROTECTION]);
    mappings.set(VulnerabilityCategory.LOGGING_FAILURE, [AwsSecurityPillar.DETECTIVE_CONTROLS, AwsSecurityPillar.INCIDENT_RESPONSE]);
    mappings.set(VulnerabilityCategory.SSRF, [AwsSecurityPillar.INFRASTRUCTURE_PROTECTION, AwsSecurityPillar.DETECTIVE_CONTROLS]);
    mappings.set(VulnerabilityCategory.INPUT_VALIDATION, [AwsSecurityPillar.DATA_PROTECTION, AwsSecurityPillar.DETECTIVE_CONTROLS]);
    mappings.set(VulnerabilityCategory.INSECURE_DESERIALIZATION, [AwsSecurityPillar.DATA_PROTECTION, AwsSecurityPillar.DETECTIVE_CONTROLS]);
    mappings.set(VulnerabilityCategory.HARDCODED_SECRETS, [AwsSecurityPillar.IDENTITY_ACCESS_MANAGEMENT, AwsSecurityPillar.DATA_PROTECTION]);
    mappings.set(VulnerabilityCategory.WEAK_CRYPTOGRAPHY, [AwsSecurityPillar.DATA_PROTECTION]);
    mappings.set(VulnerabilityCategory.INSECURE_FILE_HANDLING, [AwsSecurityPillar.IDENTITY_ACCESS_MANAGEMENT, AwsSecurityPillar.DATA_PROTECTION]);

    return mappings;
  }

  /**
   * Create AWS mapping for a specific control and vulnerability
   */
  private createAwsMapping(controlId: string, vulnerability: VulnerabilityFinding): AwsSecurityMapping {
    const pillar = this.getPillarFromControlId(controlId);
    const designPrinciple = this.getDesignPrincipleFromControlId(controlId);

    return {
      pillar,
      designPrinciple,
      bestPractices: this.getBestPractices(controlId),
      implementationGuidance: this.getImplementationGuidance(controlId, vulnerability),
      awsServices: this.getRelevantAwsServices(controlId, vulnerability)
    };
  }

  /**
   * Get AWS security pillar from control ID
   */
  private getPillarFromControlId(controlId: string): AwsSecurityPillar {
    if (controlId.startsWith('AWS-IAM')) return AwsSecurityPillar.IDENTITY_ACCESS_MANAGEMENT;
    if (controlId.startsWith('AWS-DET')) return AwsSecurityPillar.DETECTIVE_CONTROLS;
    if (controlId.startsWith('AWS-INF')) return AwsSecurityPillar.INFRASTRUCTURE_PROTECTION;
    if (controlId.startsWith('AWS-DATA')) return AwsSecurityPillar.DATA_PROTECTION;
    if (controlId.startsWith('AWS-IR')) return AwsSecurityPillar.INCIDENT_RESPONSE;
    
    return AwsSecurityPillar.IDENTITY_ACCESS_MANAGEMENT; // Default
  }

  /**
   * Get design principle from control ID
   */
  private getDesignPrincipleFromControlId(controlId: string): string {
    const designPrinciples: { [key: string]: string } = {
      'AWS-IAM-1': 'Implement a strong identity foundation',
      'AWS-IAM-2': 'Apply security at all layers',
      'AWS-DET-1': 'Prepare for security events',
      'AWS-INF-1': 'Protect networks and hosts',
      'AWS-INF-2': 'Classify your data',
      'AWS-DATA-1': 'Protect data in transit',
      'AWS-DATA-2': 'Protect data at rest',
      'AWS-IR-1': 'Prepare for security incidents'
    };

    return designPrinciples[controlId] || 'Apply security best practices';
  }

  /**
   * Get control ID from pillar and design principle
   */
  private getControlIdFromPillar(pillar: AwsSecurityPillar, designPrinciple: string): string {
    // Simple mapping - could be enhanced with more sophisticated logic
    if (pillar === AwsSecurityPillar.IDENTITY_ACCESS_MANAGEMENT) {
      return designPrinciple.includes('identity foundation') ? 'AWS-IAM-1' : 'AWS-IAM-2';
    }
    if (pillar === AwsSecurityPillar.DETECTIVE_CONTROLS) return 'AWS-DET-1';
    if (pillar === AwsSecurityPillar.INFRASTRUCTURE_PROTECTION) {
      return designPrinciple.includes('networks') ? 'AWS-INF-1' : 'AWS-INF-2';
    }
    if (pillar === AwsSecurityPillar.DATA_PROTECTION) {
      return designPrinciple.includes('transit') ? 'AWS-DATA-1' : 'AWS-DATA-2';
    }
    if (pillar === AwsSecurityPillar.INCIDENT_RESPONSE) return 'AWS-IR-1';
    
    return 'AWS-IAM-1'; // Default
  }

  /**
   * Get best practices for a control
   */
  private getBestPractices(controlId: string): string[] {
    const bestPractices: { [key: string]: string[] } = {
      'AWS-IAM-1': [
        'Use AWS IAM to manage access',
        'Implement multi-factor authentication',
        'Use temporary credentials with IAM roles',
        'Follow principle of least privilege',
        'Use AWS Organizations for multi-account management'
      ],
      'AWS-IAM-2': [
        'Use AWS CloudFormation for infrastructure as code',
        'Implement automated security testing in CI/CD',
        'Use AWS Config for compliance monitoring',
        'Leverage AWS managed security services'
      ],
      'AWS-DET-1': [
        'Enable AWS CloudTrail for API logging',
        'Use Amazon CloudWatch for monitoring',
        'Implement AWS GuardDuty for threat detection',
        'Use AWS Security Hub for centralized findings',
        'Enable VPC Flow Logs for network monitoring'
      ],
      'AWS-INF-1': [
        'Use Amazon VPC for network isolation',
        'Implement security groups and NACLs',
        'Use AWS WAF for web application protection',
        'Enable AWS Shield for DDoS protection',
        'Use AWS Systems Manager for patch management'
      ],
      'AWS-INF-2': [
        'Use AWS Macie for data discovery and classification',
        'Implement data loss prevention controls',
        'Use AWS Secrets Manager for secrets',
        'Enable AWS CloudHSM for key management'
      ],
      'AWS-DATA-1': [
        'Use TLS 1.2 or higher for encryption in transit',
        'Implement certificate management with AWS ACM',
        'Use VPN or AWS Direct Connect for private connectivity',
        'Enable HTTPS for all web communications'
      ],
      'AWS-DATA-2': [
        'Enable encryption at rest for all data stores',
        'Use AWS KMS for key management',
        'Implement S3 bucket encryption',
        'Enable RDS encryption',
        'Use encrypted EBS volumes'
      ],
      'AWS-IR-1': [
        'Develop incident response runbooks',
        'Use AWS Systems Manager for automated response',
        'Implement AWS Lambda for response automation',
        'Use AWS Step Functions for response workflows',
        'Enable AWS CloudFormation for rapid recovery'
      ]
    };

    return bestPractices[controlId] || [];
  }

  /**
   * Get implementation guidance for a control
   */
  private getImplementationGuidance(controlId: string, vulnerability: VulnerabilityFinding): string[] {
    const baseGuidance = this.getBestPractices(controlId);
    const guidance = [...baseGuidance];
    
    // Add vulnerability-specific guidance
    switch (vulnerability.category) {
      case VulnerabilityCategory.CRYPTOGRAPHIC_FAILURE:
        guidance.push('Review and update encryption configurations');
        guidance.push('Implement AWS KMS for centralized key management');
        break;
      case VulnerabilityCategory.AUTHENTICATION_BYPASS:
        guidance.push('Implement AWS Cognito for user authentication');
        guidance.push('Enable MFA for all privileged accounts');
        break;
      case VulnerabilityCategory.LOGGING_FAILURE:
        guidance.push('Enable comprehensive logging with CloudTrail and CloudWatch');
        guidance.push('Implement centralized log analysis with AWS Security Hub');
        break;
      case VulnerabilityCategory.INSECURE_CONFIGURATION:
        guidance.push('Use AWS Config Rules for configuration compliance');
        guidance.push('Implement AWS Systems Manager for configuration management');
        break;
    }

    if (vulnerability.severity === VulnerabilitySeverity.CRITICAL || vulnerability.severity === VulnerabilitySeverity.HIGH) {
      guidance.push(`Prioritize remediation of ${vulnerability.title} due to ${vulnerability.severity.toLowerCase()} severity`);
    }

    return guidance;
  }

  /**
   * Get relevant AWS services for a control
   */
  private getRelevantAwsServices(controlId: string, vulnerability: VulnerabilityFinding): string[] {
    const baseServices: { [key: string]: string[] } = {
      'AWS-IAM-1': ['AWS IAM', 'AWS Organizations', 'AWS SSO', 'AWS Cognito'],
      'AWS-IAM-2': ['AWS CloudFormation', 'AWS Config', 'AWS Systems Manager', 'AWS CodePipeline'],
      'AWS-DET-1': ['AWS CloudTrail', 'Amazon CloudWatch', 'AWS GuardDuty', 'AWS Security Hub', 'Amazon Macie'],
      'AWS-INF-1': ['Amazon VPC', 'AWS WAF', 'AWS Shield', 'AWS Systems Manager', 'Amazon Inspector'],
      'AWS-INF-2': ['Amazon Macie', 'AWS Secrets Manager', 'AWS CloudHSM', 'AWS Certificate Manager'],
      'AWS-DATA-1': ['AWS Certificate Manager', 'AWS Direct Connect', 'Amazon CloudFront', 'Application Load Balancer'],
      'AWS-DATA-2': ['AWS KMS', 'Amazon S3', 'Amazon RDS', 'Amazon EBS', 'AWS Secrets Manager'],
      'AWS-IR-1': ['AWS Systems Manager', 'AWS Lambda', 'AWS Step Functions', 'AWS CloudFormation', 'Amazon SNS']
    };

    const services = baseServices[controlId] || [];
    
    // Add vulnerability-specific services
    switch (vulnerability.category) {
      case VulnerabilityCategory.SQL_INJECTION:
        if (!services.includes('AWS WAF')) services.push('AWS WAF');
        if (!services.includes('Amazon RDS')) services.push('Amazon RDS');
        break;
      case VulnerabilityCategory.XSS:
        if (!services.includes('AWS WAF')) services.push('AWS WAF');
        if (!services.includes('Amazon CloudFront')) services.push('Amazon CloudFront');
        break;
      case VulnerabilityCategory.VULNERABLE_DEPENDENCY:
        if (!services.includes('Amazon Inspector')) services.push('Amazon Inspector');
        if (!services.includes('AWS CodeBuild')) services.push('AWS CodeBuild');
        break;
    }

    return services;
  }

  /**
   * Determine compliance status for a vulnerability against AWS control
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
   * Identify gaps for a vulnerability against AWS control
   */
  private identifyGaps(vulnerability: VulnerabilityFinding, controlId: string): string[] {
    const gaps: string[] = [];
    
    const control = this.awsControls.get(controlId);
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
    
    if (reqLower.includes('access') && vulnTitle.includes('unauthorized')) {
      return true;
    }
    
    if (reqLower.includes('monitor') && vulnTitle.includes('logging')) {
      return true;
    }
    
    if (reqLower.includes('identity') && vulnTitle.includes('authentication')) {
      return true;
    }
    
    return false;
  }

  /**
   * Generate recommendations for a vulnerability against AWS control
   */
  private generateRecommendations(vulnerability: VulnerabilityFinding, controlId: string): string[] {
    const recommendations: string[] = [];
    
    const control = this.awsControls.get(controlId);
    if (!control) return recommendations;

    // Add general recommendations based on control
    recommendations.push(`Implement ${control.title.toLowerCase()}`);
    
    // Add AWS-specific recommendations based on vulnerability type
    switch (vulnerability.category) {
      case VulnerabilityCategory.CRYPTOGRAPHIC_FAILURE:
        recommendations.push('Use AWS KMS for encryption key management');
        recommendations.push('Enable encryption at rest for all AWS services');
        recommendations.push('Use TLS 1.2+ for all data in transit');
        break;
      case VulnerabilityCategory.AUTHENTICATION_BYPASS:
        recommendations.push('Implement AWS Cognito for user authentication');
        recommendations.push('Enable MFA using AWS IAM');
        recommendations.push('Use AWS SSO for centralized access management');
        break;
      case VulnerabilityCategory.LOGGING_FAILURE:
        recommendations.push('Enable AWS CloudTrail for comprehensive API logging');
        recommendations.push('Use Amazon CloudWatch for application and system monitoring');
        recommendations.push('Implement AWS GuardDuty for threat detection');
        break;
      case VulnerabilityCategory.INSECURE_CONFIGURATION:
        recommendations.push('Use AWS Config for configuration compliance monitoring');
        recommendations.push('Implement AWS Systems Manager for configuration management');
        recommendations.push('Use AWS CloudFormation for infrastructure as code');
        break;
      case VulnerabilityCategory.VULNERABLE_DEPENDENCY:
        recommendations.push('Use Amazon Inspector for vulnerability assessment');
        recommendations.push('Implement automated dependency scanning in AWS CodeBuild');
        recommendations.push('Use AWS Systems Manager Patch Manager for updates');
        break;
      default:
        recommendations.push(`Address ${vulnerability.category.toLowerCase()} using AWS security services`);
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
        framework: ComplianceFramework.AWS_WELL_ARCHITECTED,
        gapDescription: `${vulnerability.title}: ${vulnerability.description}`,
        severity: vulnerability.severity,
        remediation: `Implement AWS Well-Architected controls to address ${vulnerability.category.toLowerCase()}`,
        timeline: this.getRemediationTimeline(vulnerability.severity),
        owner: 'Cloud Security Team'
      });
    }

    return gaps;
  }

  /**
   * Generate remediation actions for vulnerabilities
   */
  private generateRemediationActions(vulnerabilities: VulnerabilityFinding[], controlId: string): string[] {
    const actions: string[] = [];
    
    const control = this.awsControls.get(controlId);
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