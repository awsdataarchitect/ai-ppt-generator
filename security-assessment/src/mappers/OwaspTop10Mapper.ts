/**
 * OWASP Top 10 compliance mapping engine
 * Maps security vulnerabilities to OWASP Top 10 2021 categories
 */

import {
  ComplianceMapping,
  ComplianceStatus,
  OwaspTop10Category,
  OwaspMapping,
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

export interface OwaspMappingResult {
  readonly vulnerabilityId: string;
  readonly owaspCategory: OwaspTop10Category;
  readonly mapping: OwaspMapping;
  readonly complianceStatus: ComplianceStatus;
  readonly gaps: string[];
  readonly recommendations: string[];
}

export class OwaspTop10Mapper {
  private readonly owaspControls: Map<OwaspTop10Category, ComplianceControl>;
  private readonly categoryMappings: Map<VulnerabilityCategory, OwaspTop10Category[]>;
  private readonly cweMappings: Map<string, OwaspTop10Category>;

  constructor() {
    this.owaspControls = this.initializeOwaspControls();
    this.categoryMappings = this.initializeCategoryMappings();
    this.cweMappings = this.initializeCweMappings();
  }

  /**
   * Map a vulnerability finding to OWASP Top 10 categories
   */
  public mapVulnerability(vulnerability: VulnerabilityFinding): OwaspMappingResult[] {
    const results: OwaspMappingResult[] = [];
    
    // Primary mapping based on vulnerability category
    const primaryCategories = this.categoryMappings.get(vulnerability.category) || [];
    
    // Secondary mapping based on CWE ID if available
    const secondaryCategories: OwaspTop10Category[] = [];
    if (vulnerability.cweId) {
      const cweCategory = this.cweMappings.get(vulnerability.cweId);
      if (cweCategory && !primaryCategories.includes(cweCategory)) {
        secondaryCategories.push(cweCategory);
      }
    }

    // Process all applicable OWASP categories
    const allCategories = [...primaryCategories, ...secondaryCategories];
    
    for (const category of allCategories) {
      const mapping = this.createOwaspMapping(category, vulnerability);
      const complianceStatus = this.determineComplianceStatus(vulnerability, category);
      const gaps = this.identifyGaps(vulnerability, category);
      const recommendations = this.generateRecommendations(vulnerability, category);

      results.push({
        vulnerabilityId: vulnerability.id,
        owaspCategory: category,
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
    const mappingsByCategory = new Map<OwaspTop10Category, VulnerabilityFinding[]>();
    
    // Group vulnerabilities by OWASP category
    for (const vulnerability of vulnerabilities) {
      const owaspResults = this.mapVulnerability(vulnerability);
      
      for (const result of owaspResults) {
        if (!mappingsByCategory.has(result.owaspCategory)) {
          mappingsByCategory.set(result.owaspCategory, []);
        }
        mappingsByCategory.get(result.owaspCategory)!.push(vulnerability);
      }
    }

    // Create compliance mappings for each category
    const complianceMappings: ComplianceMapping[] = [];
    
    for (const [category, categoryVulns] of mappingsByCategory) {
      const control = this.owaspControls.get(category)!;
      const overallStatus = this.determineOverallStatus(categoryVulns);
      const gaps = this.createComplianceGaps(categoryVulns, category);
      const actions = this.generateRemediationActions(categoryVulns, category);

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
   * Initialize OWASP Top 10 2021 controls
   */
  private initializeOwaspControls(): Map<OwaspTop10Category, ComplianceControl> {
    const controls = new Map<OwaspTop10Category, ComplianceControl>();

    controls.set(OwaspTop10Category.A01_BROKEN_ACCESS_CONTROL, {
      id: 'OWASP-A01-2021',
      framework: ComplianceFramework.OWASP_TOP_10,
      controlNumber: 'A01:2021',
      title: 'Broken Access Control',
      description: 'Access control enforces policy such that users cannot act outside of their intended permissions.',
      category: 'Authorization',
      requirements: [
        'Implement proper access control mechanisms',
        'Deny access by default except for public resources',
        'Implement access control checks consistently',
        'Disable web server directory listing',
        'Log access control failures and alert admins when appropriate'
      ],
      testProcedures: [
        'Test for privilege escalation vulnerabilities',
        'Verify access controls cannot be bypassed',
        'Test for insecure direct object references',
        'Verify proper session management'
      ]
    });

    controls.set(OwaspTop10Category.A02_CRYPTOGRAPHIC_FAILURES, {
      id: 'OWASP-A02-2021',
      framework: ComplianceFramework.OWASP_TOP_10,
      controlNumber: 'A02:2021',
      title: 'Cryptographic Failures',
      description: 'Protect data in transit and at rest using strong cryptographic controls.',
      category: 'Cryptography',
      requirements: [
        'Encrypt all data in transit using strong protocols',
        'Encrypt sensitive data at rest',
        'Use strong, up-to-date cryptographic algorithms',
        'Proper key management and rotation',
        'Disable weak cryptographic functions'
      ],
      testProcedures: [
        'Verify encryption of sensitive data',
        'Test for weak cryptographic implementations',
        'Verify proper key management',
        'Test SSL/TLS configuration'
      ]
    });

    controls.set(OwaspTop10Category.A03_INJECTION, {
      id: 'OWASP-A03-2021',
      framework: ComplianceFramework.OWASP_TOP_10,
      controlNumber: 'A03:2021',
      title: 'Injection',
      description: 'Prevent injection flaws such as SQL, NoSQL, OS, and LDAP injection.',
      category: 'Input Validation',
      requirements: [
        'Use parameterized queries and prepared statements',
        'Validate and sanitize all user inputs',
        'Use positive server-side input validation',
        'Escape special characters in dynamic queries',
        'Use LIMIT and other SQL controls in queries'
      ],
      testProcedures: [
        'Test for SQL injection vulnerabilities',
        'Test for NoSQL injection',
        'Test for OS command injection',
        'Test for LDAP injection',
        'Verify input validation mechanisms'
      ]
    });

    controls.set(OwaspTop10Category.A04_INSECURE_DESIGN, {
      id: 'OWASP-A04-2021',
      framework: ComplianceFramework.OWASP_TOP_10,
      controlNumber: 'A04:2021',
      title: 'Insecure Design',
      description: 'Secure design patterns and principles to prevent architectural flaws.',
      category: 'Architecture',
      requirements: [
        'Establish secure development lifecycle',
        'Use threat modeling for critical authentication flows',
        'Integrate security language and controls into user stories',
        'Plausibility checks at each tier of application',
        'Write unit and integration tests to validate critical flows'
      ],
      testProcedures: [
        'Review architectural security patterns',
        'Verify threat modeling coverage',
        'Test business logic flaws',
        'Verify secure design principles'
      ]
    });

    controls.set(OwaspTop10Category.A05_SECURITY_MISCONFIGURATION, {
      id: 'OWASP-A05-2021',
      framework: ComplianceFramework.OWASP_TOP_10,
      controlNumber: 'A05:2021',
      title: 'Security Misconfiguration',
      description: 'Secure configuration of all application stack components.',
      category: 'Configuration',
      requirements: [
        'Implement repeatable hardening process',
        'Remove unnecessary features and frameworks',
        'Review and update configurations regularly',
        'Implement segmented application architecture',
        'Send security directives to clients'
      ],
      testProcedures: [
        'Review security configurations',
        'Test for default credentials',
        'Verify unnecessary services are disabled',
        'Test security headers implementation'
      ]
    });

    controls.set(OwaspTop10Category.A06_VULNERABLE_COMPONENTS, {
      id: 'OWASP-A06-2021',
      framework: ComplianceFramework.OWASP_TOP_10,
      controlNumber: 'A06:2021',
      title: 'Vulnerable and Outdated Components',
      description: 'Manage and secure all application components and dependencies.',
      category: 'Component Security',
      requirements: [
        'Inventory all components and versions',
        'Monitor for security vulnerabilities',
        'Obtain components from official sources',
        'Remove unused dependencies and features',
        'Continuously monitor component security'
      ],
      testProcedures: [
        'Scan for vulnerable components',
        'Verify component inventory accuracy',
        'Test for known vulnerabilities',
        'Verify update procedures'
      ]
    });

    controls.set(OwaspTop10Category.A07_AUTHENTICATION_FAILURES, {
      id: 'OWASP-A07-2021',
      framework: ComplianceFramework.OWASP_TOP_10,
      controlNumber: 'A07:2021',
      title: 'Identification and Authentication Failures',
      description: 'Implement strong authentication and session management.',
      category: 'Authentication',
      requirements: [
        'Implement multi-factor authentication',
        'Do not ship with default credentials',
        'Implement weak password checks',
        'Align password policies with NIST guidelines',
        'Limit failed login attempts'
      ],
      testProcedures: [
        'Test authentication mechanisms',
        'Verify session management',
        'Test for credential stuffing protection',
        'Verify password policy enforcement'
      ]
    });

    controls.set(OwaspTop10Category.A08_SOFTWARE_INTEGRITY_FAILURES, {
      id: 'OWASP-A08-2021',
      framework: ComplianceFramework.OWASP_TOP_10,
      controlNumber: 'A08:2021',
      title: 'Software and Data Integrity Failures',
      description: 'Ensure software updates and critical data changes are properly verified.',
      category: 'Integrity',
      requirements: [
        'Use digital signatures to verify software integrity',
        'Ensure CI/CD pipeline security',
        'Validate serialized data integrity',
        'Review code and configuration changes',
        'Implement proper update mechanisms'
      ],
      testProcedures: [
        'Verify software signature validation',
        'Test CI/CD pipeline security',
        'Test for insecure deserialization',
        'Verify update integrity checks'
      ]
    });

    controls.set(OwaspTop10Category.A09_LOGGING_FAILURES, {
      id: 'OWASP-A09-2021',
      framework: ComplianceFramework.OWASP_TOP_10,
      controlNumber: 'A09:2021',
      title: 'Security Logging and Monitoring Failures',
      description: 'Implement comprehensive logging and monitoring for security events.',
      category: 'Monitoring',
      requirements: [
        'Log all login and access control failures',
        'Ensure logs are generated in consumable format',
        'Ensure log data is encoded correctly',
        'Ensure sufficient user context is included',
        'Implement effective monitoring and alerting'
      ],
      testProcedures: [
        'Verify security event logging',
        'Test log integrity and protection',
        'Verify monitoring and alerting',
        'Test incident response procedures'
      ]
    });

    controls.set(OwaspTop10Category.A10_SSRF, {
      id: 'OWASP-A10-2021',
      framework: ComplianceFramework.OWASP_TOP_10,
      controlNumber: 'A10:2021',
      title: 'Server-Side Request Forgery (SSRF)',
      description: 'Prevent server-side request forgery attacks.',
      category: 'Network Security',
      requirements: [
        'Sanitize and validate all client-supplied input data',
        'Enforce URL schema, port, and destination with positive allow list',
        'Do not send raw responses to clients',
        'Disable HTTP redirections',
        'Implement network segmentation'
      ],
      testProcedures: [
        'Test for SSRF vulnerabilities',
        'Verify input validation for URLs',
        'Test network access controls',
        'Verify response filtering'
      ]
    });

    return controls;
  }

  /**
   * Initialize vulnerability category to OWASP mappings
   */
  private initializeCategoryMappings(): Map<VulnerabilityCategory, OwaspTop10Category[]> {
    const mappings = new Map<VulnerabilityCategory, OwaspTop10Category[]>();

    mappings.set(VulnerabilityCategory.XSS, [OwaspTop10Category.A03_INJECTION]);
    mappings.set(VulnerabilityCategory.CSRF, [OwaspTop10Category.A01_BROKEN_ACCESS_CONTROL]);
    mappings.set(VulnerabilityCategory.SQL_INJECTION, [OwaspTop10Category.A03_INJECTION]);
    mappings.set(VulnerabilityCategory.COMMAND_INJECTION, [OwaspTop10Category.A03_INJECTION]);
    mappings.set(VulnerabilityCategory.PATH_TRAVERSAL, [OwaspTop10Category.A01_BROKEN_ACCESS_CONTROL]);
    mappings.set(VulnerabilityCategory.INFORMATION_DISCLOSURE, [OwaspTop10Category.A01_BROKEN_ACCESS_CONTROL]);
    mappings.set(VulnerabilityCategory.AUTHENTICATION_BYPASS, [OwaspTop10Category.A07_AUTHENTICATION_FAILURES]);
    mappings.set(VulnerabilityCategory.AUTHORIZATION_FAILURE, [OwaspTop10Category.A01_BROKEN_ACCESS_CONTROL]);
    mappings.set(VulnerabilityCategory.CRYPTOGRAPHIC_FAILURE, [OwaspTop10Category.A02_CRYPTOGRAPHIC_FAILURES]);
    mappings.set(VulnerabilityCategory.INSECURE_CONFIGURATION, [OwaspTop10Category.A05_SECURITY_MISCONFIGURATION]);
    mappings.set(VulnerabilityCategory.VULNERABLE_DEPENDENCY, [OwaspTop10Category.A06_VULNERABLE_COMPONENTS]);
    mappings.set(VulnerabilityCategory.INSECURE_DESIGN, [OwaspTop10Category.A04_INSECURE_DESIGN]);
    mappings.set(VulnerabilityCategory.LOGGING_FAILURE, [OwaspTop10Category.A09_LOGGING_FAILURES]);
    mappings.set(VulnerabilityCategory.SSRF, [OwaspTop10Category.A10_SSRF]);
    mappings.set(VulnerabilityCategory.INPUT_VALIDATION, [OwaspTop10Category.A03_INJECTION]);
    mappings.set(VulnerabilityCategory.INSECURE_DESERIALIZATION, [OwaspTop10Category.A08_SOFTWARE_INTEGRITY_FAILURES]);
    mappings.set(VulnerabilityCategory.HARDCODED_SECRETS, [OwaspTop10Category.A02_CRYPTOGRAPHIC_FAILURES]);
    mappings.set(VulnerabilityCategory.WEAK_CRYPTOGRAPHY, [OwaspTop10Category.A02_CRYPTOGRAPHIC_FAILURES]);
    mappings.set(VulnerabilityCategory.INSECURE_FILE_HANDLING, [OwaspTop10Category.A01_BROKEN_ACCESS_CONTROL]);

    return mappings;
  }

  /**
   * Initialize CWE to OWASP mappings
   */
  private initializeCweMappings(): Map<string, OwaspTop10Category> {
    const mappings = new Map<string, OwaspTop10Category>();

    // A01 - Broken Access Control
    mappings.set('CWE-22', OwaspTop10Category.A01_BROKEN_ACCESS_CONTROL); // Path Traversal
    mappings.set('CWE-79', OwaspTop10Category.A03_INJECTION); // XSS (moved to injection)
    mappings.set('CWE-200', OwaspTop10Category.A01_BROKEN_ACCESS_CONTROL); // Information Exposure
    mappings.set('CWE-264', OwaspTop10Category.A01_BROKEN_ACCESS_CONTROL); // Permissions/Privileges
    mappings.set('CWE-284', OwaspTop10Category.A01_BROKEN_ACCESS_CONTROL); // Improper Access Control
    mappings.set('CWE-352', OwaspTop10Category.A01_BROKEN_ACCESS_CONTROL); // CSRF

    // A02 - Cryptographic Failures
    mappings.set('CWE-259', OwaspTop10Category.A02_CRYPTOGRAPHIC_FAILURES); // Hard-coded Password
    mappings.set('CWE-295', OwaspTop10Category.A02_CRYPTOGRAPHIC_FAILURES); // Improper Certificate Validation
    mappings.set('CWE-310', OwaspTop10Category.A02_CRYPTOGRAPHIC_FAILURES); // Cryptographic Issues
    mappings.set('CWE-311', OwaspTop10Category.A02_CRYPTOGRAPHIC_FAILURES); // Missing Encryption
    mappings.set('CWE-312', OwaspTop10Category.A02_CRYPTOGRAPHIC_FAILURES); // Cleartext Storage
    mappings.set('CWE-319', OwaspTop10Category.A02_CRYPTOGRAPHIC_FAILURES); // Cleartext Transmission
    mappings.set('CWE-326', OwaspTop10Category.A02_CRYPTOGRAPHIC_FAILURES); // Inadequate Encryption Strength
    mappings.set('CWE-327', OwaspTop10Category.A02_CRYPTOGRAPHIC_FAILURES); // Broken/Risky Crypto

    // A03 - Injection
    mappings.set('CWE-77', OwaspTop10Category.A03_INJECTION); // Command Injection
    mappings.set('CWE-78', OwaspTop10Category.A03_INJECTION); // OS Command Injection
    mappings.set('CWE-79', OwaspTop10Category.A03_INJECTION); // Cross-site Scripting
    mappings.set('CWE-89', OwaspTop10Category.A03_INJECTION); // SQL Injection
    mappings.set('CWE-90', OwaspTop10Category.A03_INJECTION); // LDAP Injection
    mappings.set('CWE-91', OwaspTop10Category.A03_INJECTION); // XML Injection
    mappings.set('CWE-94', OwaspTop10Category.A03_INJECTION); // Code Injection
    mappings.set('CWE-943', OwaspTop10Category.A03_INJECTION); // NoSQL Injection

    // A04 - Insecure Design
    mappings.set('CWE-209', OwaspTop10Category.A04_INSECURE_DESIGN); // Information Exposure Through Error Messages
    mappings.set('CWE-256', OwaspTop10Category.A04_INSECURE_DESIGN); // Unprotected Storage of Credentials
    mappings.set('CWE-501', OwaspTop10Category.A04_INSECURE_DESIGN); // Trust Boundary Violation
    mappings.set('CWE-522', OwaspTop10Category.A04_INSECURE_DESIGN); // Insufficiently Protected Credentials

    // A05 - Security Misconfiguration
    mappings.set('CWE-16', OwaspTop10Category.A05_SECURITY_MISCONFIGURATION); // Configuration
    mappings.set('CWE-260', OwaspTop10Category.A05_SECURITY_MISCONFIGURATION); // Password in Configuration File
    mappings.set('CWE-276', OwaspTop10Category.A05_SECURITY_MISCONFIGURATION); // Incorrect Default Permissions
    mappings.set('CWE-732', OwaspTop10Category.A05_SECURITY_MISCONFIGURATION); // Incorrect Permission Assignment

    // A06 - Vulnerable and Outdated Components
    mappings.set('CWE-1104', OwaspTop10Category.A06_VULNERABLE_COMPONENTS); // Use of Unmaintained Third Party Components
    mappings.set('CWE-937', OwaspTop10Category.A06_VULNERABLE_COMPONENTS); // Using Components with Known Vulnerabilities

    // A07 - Identification and Authentication Failures
    mappings.set('CWE-287', OwaspTop10Category.A07_AUTHENTICATION_FAILURES); // Improper Authentication
    mappings.set('CWE-288', OwaspTop10Category.A07_AUTHENTICATION_FAILURES); // Authentication Bypass Using Alternate Path
    mappings.set('CWE-290', OwaspTop10Category.A07_AUTHENTICATION_FAILURES); // Authentication Bypass by Spoofing
    mappings.set('CWE-306', OwaspTop10Category.A07_AUTHENTICATION_FAILURES); // Missing Authentication
    mappings.set('CWE-307', OwaspTop10Category.A07_AUTHENTICATION_FAILURES); // Improper Restriction of Excessive Authentication Attempts
    mappings.set('CWE-521', OwaspTop10Category.A07_AUTHENTICATION_FAILURES); // Weak Password Requirements
    mappings.set('CWE-613', OwaspTop10Category.A07_AUTHENTICATION_FAILURES); // Insufficient Session Expiration
    mappings.set('CWE-620', OwaspTop10Category.A07_AUTHENTICATION_FAILURES); // Unverified Password Change
    mappings.set('CWE-640', OwaspTop10Category.A07_AUTHENTICATION_FAILURES); // Weak Password Recovery Mechanism

    // A08 - Software and Data Integrity Failures
    mappings.set('CWE-345', OwaspTop10Category.A08_SOFTWARE_INTEGRITY_FAILURES); // Insufficient Verification of Data Authenticity
    mappings.set('CWE-353', OwaspTop10Category.A08_SOFTWARE_INTEGRITY_FAILURES); // Missing Support for Integrity Check
    mappings.set('CWE-502', OwaspTop10Category.A08_SOFTWARE_INTEGRITY_FAILURES); // Deserialization of Untrusted Data
    mappings.set('CWE-829', OwaspTop10Category.A08_SOFTWARE_INTEGRITY_FAILURES); // Inclusion of Functionality from Untrusted Control Sphere
    mappings.set('CWE-830', OwaspTop10Category.A08_SOFTWARE_INTEGRITY_FAILURES); // Inclusion of Web Functionality from an Untrusted Source

    // A09 - Security Logging and Monitoring Failures
    mappings.set('CWE-117', OwaspTop10Category.A09_LOGGING_FAILURES); // Improper Output Neutralization for Logs
    mappings.set('CWE-223', OwaspTop10Category.A09_LOGGING_FAILURES); // Omission of Security-relevant Information
    mappings.set('CWE-532', OwaspTop10Category.A09_LOGGING_FAILURES); // Information Exposure Through Log Files
    mappings.set('CWE-778', OwaspTop10Category.A09_LOGGING_FAILURES); // Insufficient Logging

    // A10 - Server-Side Request Forgery (SSRF)
    mappings.set('CWE-918', OwaspTop10Category.A10_SSRF); // Server-Side Request Forgery (SSRF)

    return mappings;
  }

  /**
   * Create OWASP mapping for a specific category and vulnerability
   */
  private createOwaspMapping(category: OwaspTop10Category, vulnerability: VulnerabilityFinding): OwaspMapping {
    const cweIds = vulnerability.cweId ? [vulnerability.cweId] : [];
    
    // Add related CWE IDs based on category
    const relatedCwes = this.getRelatedCweIds(category);
    cweIds.push(...relatedCwes.filter(cwe => !cweIds.includes(cwe)));

    return {
      category,
      cweIds,
      riskRating: this.calculateRiskRating(vulnerability),
      prevalence: this.getPrevalence(category),
      detectability: this.getDetectability(category),
      technicalImpact: this.getTechnicalImpact(vulnerability),
      businessImpact: this.getBusinessImpact(vulnerability)
    };
  }

  /**
   * Get related CWE IDs for an OWASP category
   */
  private getRelatedCweIds(category: OwaspTop10Category): string[] {
    const relatedCwes: { [key in OwaspTop10Category]: string[] } = {
      [OwaspTop10Category.A01_BROKEN_ACCESS_CONTROL]: ['CWE-22', 'CWE-200', 'CWE-284', 'CWE-352'],
      [OwaspTop10Category.A02_CRYPTOGRAPHIC_FAILURES]: ['CWE-259', 'CWE-295', 'CWE-311', 'CWE-319', 'CWE-327'],
      [OwaspTop10Category.A03_INJECTION]: ['CWE-77', 'CWE-78', 'CWE-79', 'CWE-89', 'CWE-94'],
      [OwaspTop10Category.A04_INSECURE_DESIGN]: ['CWE-209', 'CWE-256', 'CWE-501', 'CWE-522'],
      [OwaspTop10Category.A05_SECURITY_MISCONFIGURATION]: ['CWE-16', 'CWE-260', 'CWE-276', 'CWE-732'],
      [OwaspTop10Category.A06_VULNERABLE_COMPONENTS]: ['CWE-1104', 'CWE-937'],
      [OwaspTop10Category.A07_AUTHENTICATION_FAILURES]: ['CWE-287', 'CWE-306', 'CWE-307', 'CWE-521', 'CWE-613'],
      [OwaspTop10Category.A08_SOFTWARE_INTEGRITY_FAILURES]: ['CWE-345', 'CWE-502', 'CWE-829', 'CWE-830'],
      [OwaspTop10Category.A09_LOGGING_FAILURES]: ['CWE-117', 'CWE-223', 'CWE-532', 'CWE-778'],
      [OwaspTop10Category.A10_SSRF]: ['CWE-918']
    };

    return relatedCwes[category] || [];
  }

  /**
   * Calculate risk rating based on vulnerability severity and likelihood
   */
  private calculateRiskRating(vulnerability: VulnerabilityFinding): string {
    const severityScore = this.getSeverityScore(vulnerability.severity);
    const likelihoodScore = this.getLikelihoodScore(vulnerability.likelihood);
    const riskScore = (severityScore + likelihoodScore) / 2;

    if (riskScore >= 8) return 'Critical';
    if (riskScore >= 6) return 'High';
    if (riskScore >= 3.5) return 'Medium';
    return 'Low';
  }

  private getSeverityScore(severity: VulnerabilitySeverity): number {
    switch (severity) {
      case VulnerabilitySeverity.CRITICAL: return 10;
      case VulnerabilitySeverity.HIGH: return 8;
      case VulnerabilitySeverity.MEDIUM: return 6;
      case VulnerabilitySeverity.LOW: return 4;
      case VulnerabilitySeverity.INFO: return 2;
      default: return 0;
    }
  }

  private getLikelihoodScore(likelihood: string): number {
    const likelihoodLower = likelihood.toLowerCase();
    if (likelihoodLower.includes('very high') || likelihoodLower.includes('certain')) return 10;
    if (likelihoodLower.includes('high') || likelihoodLower.includes('likely')) return 8;
    if (likelihoodLower.includes('medium') || likelihoodLower.includes('possible')) return 6;
    if (likelihoodLower.includes('low') || likelihoodLower.includes('unlikely')) return 4;
    if (likelihoodLower.includes('very low') || likelihoodLower.includes('rare')) return 2;
    return 5; // Default medium likelihood
  }

  /**
   * Get prevalence information for OWASP category
   */
  private getPrevalence(category: OwaspTop10Category): string {
    const prevalenceData: { [key in OwaspTop10Category]: string } = {
      [OwaspTop10Category.A01_BROKEN_ACCESS_CONTROL]: 'Very High - Found in 94% of applications',
      [OwaspTop10Category.A02_CRYPTOGRAPHIC_FAILURES]: 'High - Found in 46% of applications',
      [OwaspTop10Category.A03_INJECTION]: 'High - Found in 33% of applications',
      [OwaspTop10Category.A04_INSECURE_DESIGN]: 'Medium - New category in 2021',
      [OwaspTop10Category.A05_SECURITY_MISCONFIGURATION]: 'High - Found in 90% of applications',
      [OwaspTop10Category.A06_VULNERABLE_COMPONENTS]: 'Very High - Found in 84% of applications',
      [OwaspTop10Category.A07_AUTHENTICATION_FAILURES]: 'Medium - Found in 22% of applications',
      [OwaspTop10Category.A08_SOFTWARE_INTEGRITY_FAILURES]: 'Medium - New category in 2021',
      [OwaspTop10Category.A09_LOGGING_FAILURES]: 'Medium - Found in 23% of applications',
      [OwaspTop10Category.A10_SSRF]: 'Medium - Found in 9% of applications'
    };

    return prevalenceData[category];
  }

  /**
   * Get detectability information for OWASP category
   */
  private getDetectability(category: OwaspTop10Category): string {
    const detectabilityData: { [key in OwaspTop10Category]: string } = {
      [OwaspTop10Category.A01_BROKEN_ACCESS_CONTROL]: 'Medium - Requires testing with different user roles',
      [OwaspTop10Category.A02_CRYPTOGRAPHIC_FAILURES]: 'Easy - Can be detected through configuration review',
      [OwaspTop10Category.A03_INJECTION]: 'Easy - Well-known testing techniques available',
      [OwaspTop10Category.A04_INSECURE_DESIGN]: 'Difficult - Requires architectural review and threat modeling',
      [OwaspTop10Category.A05_SECURITY_MISCONFIGURATION]: 'Easy - Automated tools can detect many issues',
      [OwaspTop10Category.A06_VULNERABLE_COMPONENTS]: 'Easy - Automated dependency scanning tools available',
      [OwaspTop10Category.A07_AUTHENTICATION_FAILURES]: 'Medium - Requires testing authentication mechanisms',
      [OwaspTop10Category.A08_SOFTWARE_INTEGRITY_FAILURES]: 'Medium - Requires code review and supply chain analysis',
      [OwaspTop10Category.A09_LOGGING_FAILURES]: 'Medium - Requires review of logging implementation',
      [OwaspTop10Category.A10_SSRF]: 'Medium - Requires testing with various payloads'
    };

    return detectabilityData[category];
  }

  /**
   * Get technical impact assessment
   */
  private getTechnicalImpact(vulnerability: VulnerabilityFinding): string {
    const impact = vulnerability.impact.toLowerCase();
    
    if (impact.includes('remote code execution') || impact.includes('system compromise')) {
      return 'Severe - Complete system compromise possible';
    }
    if (impact.includes('data breach') || impact.includes('sensitive data')) {
      return 'High - Sensitive data exposure or modification';
    }
    if (impact.includes('privilege escalation') || impact.includes('unauthorized access')) {
      return 'High - Unauthorized access to restricted functionality';
    }
    if (impact.includes('denial of service') || impact.includes('availability')) {
      return 'Medium - Service disruption or availability impact';
    }
    
    return 'Medium - Limited technical impact';
  }

  /**
   * Get business impact assessment
   */
  private getBusinessImpact(vulnerability: VulnerabilityFinding): string {
    const severity = vulnerability.severity;
    const impact = vulnerability.impact.toLowerCase();
    
    if (severity === VulnerabilitySeverity.CRITICAL) {
      return 'Severe - Potential for significant business disruption, regulatory fines, or reputation damage';
    }
    if (severity === VulnerabilitySeverity.HIGH || impact.includes('compliance') || impact.includes('regulatory')) {
      return 'High - Compliance violations, customer data at risk, potential legal liability';
    }
    if (severity === VulnerabilitySeverity.MEDIUM) {
      return 'Medium - Operational impact, potential customer trust issues';
    }
    
    return 'Low - Minimal business impact expected';
  }

  /**
   * Determine compliance status for a vulnerability against OWASP category
   */
  private determineComplianceStatus(vulnerability: VulnerabilityFinding, category: OwaspTop10Category): ComplianceStatus {
    // Critical and High severity vulnerabilities are non-compliant
    if (vulnerability.severity === VulnerabilitySeverity.CRITICAL || vulnerability.severity === VulnerabilitySeverity.HIGH) {
      return ComplianceStatus.NON_COMPLIANT;
    }
    
    // Medium severity may be partially compliant depending on remediation
    if (vulnerability.severity === VulnerabilitySeverity.MEDIUM) {
      return ComplianceStatus.PARTIALLY_COMPLIANT;
    }
    
    // Low and Info are generally compliant but require review
    return ComplianceStatus.REQUIRES_REVIEW;
  }

  /**
   * Determine overall compliance status for multiple vulnerabilities
   */
  private determineOverallStatus(vulnerabilities: VulnerabilityFinding[]): ComplianceStatus {
    const hasCritical = vulnerabilities.some(v => v.severity === VulnerabilitySeverity.CRITICAL);
    const hasHigh = vulnerabilities.some(v => v.severity === VulnerabilitySeverity.HIGH);
    const hasMedium = vulnerabilities.some(v => v.severity === VulnerabilitySeverity.MEDIUM);
    
    if (hasCritical || hasHigh) {
      return ComplianceStatus.NON_COMPLIANT;
    }
    if (hasMedium) {
      return ComplianceStatus.PARTIALLY_COMPLIANT;
    }
    if (vulnerabilities.length > 0) {
      return ComplianceStatus.REQUIRES_REVIEW;
    }
    
    return ComplianceStatus.COMPLIANT;
  }

  /**
   * Identify compliance gaps for vulnerabilities in a category
   */
  private identifyGaps(vulnerability: VulnerabilityFinding, category: OwaspTop10Category): string[] {
    const gaps: string[] = [];
    const control = this.owaspControls.get(category)!;
    
    // Check against control requirements
    for (const requirement of control.requirements) {
      if (this.isRequirementViolated(vulnerability, requirement)) {
        gaps.push(`Requirement not met: ${requirement}`);
      }
    }
    
    return gaps;
  }

  /**
   * Check if a vulnerability violates a specific requirement
   */
  private isRequirementViolated(vulnerability: VulnerabilityFinding, requirement: string): boolean {
    const reqLower = requirement.toLowerCase();
    const vulnDesc = vulnerability.description.toLowerCase();
    const vulnTitle = vulnerability.title.toLowerCase();
    
    // Simple keyword matching - could be enhanced with more sophisticated logic
    if (reqLower.includes('access control') && (vulnDesc.includes('bypass') || vulnTitle.includes('unauthorized'))) {
      return true;
    }
    if (reqLower.includes('encrypt') && (vulnDesc.includes('plaintext') || vulnDesc.includes('unencrypted'))) {
      return true;
    }
    if (reqLower.includes('validate') && vulnDesc.includes('injection')) {
      return true;
    }
    if (reqLower.includes('log') && vulnDesc.includes('logging')) {
      return true;
    }
    
    return false;
  }

  /**
   * Create compliance gaps for multiple vulnerabilities
   */
  private createComplianceGaps(vulnerabilities: VulnerabilityFinding[], category: OwaspTop10Category): ComplianceGap[] {
    const gaps: ComplianceGap[] = [];
    const control = this.owaspControls.get(category)!;
    
    for (const vulnerability of vulnerabilities) {
      gaps.push({
        controlId: control.id,
        framework: ComplianceFramework.OWASP_TOP_10,
        gapDescription: `${vulnerability.title}: ${vulnerability.description}`,
        severity: vulnerability.severity,
        remediation: vulnerability.remediation.summary,
        timeline: vulnerability.remediation.timeline,
        owner: 'Security Team'
      });
    }
    
    return gaps;
  }

  /**
   * Generate remediation actions for vulnerabilities in a category
   */
  private generateRemediationActions(vulnerabilities: VulnerabilityFinding[], category: OwaspTop10Category): string[] {
    const actions: string[] = [];
    const control = this.owaspControls.get(category)!;
    
    // Add category-specific actions
    actions.push(`Implement ${control.title} controls as per OWASP guidelines`);
    
    // Add vulnerability-specific actions
    for (const vulnerability of vulnerabilities) {
      actions.push(`${vulnerability.title}: ${vulnerability.remediation.summary}`);
    }
    
    // Add general actions based on category
    const categoryActions = this.getCategorySpecificActions(category);
    actions.push(...categoryActions);
    
    return [...new Set(actions)]; // Remove duplicates
  }

  /**
   * Generate recommendations for a specific vulnerability and category
   */
  private generateRecommendations(vulnerability: VulnerabilityFinding, category: OwaspTop10Category): string[] {
    const recommendations: string[] = [];
    
    // Add vulnerability-specific recommendations
    recommendations.push(...vulnerability.remediation.steps.map(step => step.description));
    
    // Add category-specific recommendations
    const categoryRecs = this.getCategorySpecificActions(category);
    recommendations.push(...categoryRecs);
    
    return [...new Set(recommendations)]; // Remove duplicates
  }

  /**
   * Get category-specific remediation actions
   */
  private getCategorySpecificActions(category: OwaspTop10Category): string[] {
    const actions: { [key in OwaspTop10Category]: string[] } = {
      [OwaspTop10Category.A01_BROKEN_ACCESS_CONTROL]: [
        'Implement role-based access control (RBAC)',
        'Use principle of least privilege',
        'Implement proper session management',
        'Add access control unit tests'
      ],
      [OwaspTop10Category.A02_CRYPTOGRAPHIC_FAILURES]: [
        'Use strong encryption algorithms (AES-256, RSA-2048+)',
        'Implement proper key management',
        'Use HTTPS/TLS 1.2+ for all communications',
        'Encrypt sensitive data at rest'
      ],
      [OwaspTop10Category.A03_INJECTION]: [
        'Use parameterized queries/prepared statements',
        'Implement input validation and sanitization',
        'Use ORM frameworks with built-in protection',
        'Apply principle of least privilege for database access'
      ],
      [OwaspTop10Category.A04_INSECURE_DESIGN]: [
        'Implement secure design patterns',
        'Conduct threat modeling exercises',
        'Use secure coding standards',
        'Implement defense in depth'
      ],
      [OwaspTop10Category.A05_SECURITY_MISCONFIGURATION]: [
        'Implement configuration management',
        'Remove default accounts and passwords',
        'Keep software and dependencies updated',
        'Implement security headers'
      ],
      [OwaspTop10Category.A06_VULNERABLE_COMPONENTS]: [
        'Implement dependency scanning in CI/CD',
        'Keep all components updated',
        'Remove unused dependencies',
        'Monitor for new vulnerabilities'
      ],
      [OwaspTop10Category.A07_AUTHENTICATION_FAILURES]: [
        'Implement multi-factor authentication',
        'Use strong password policies',
        'Implement account lockout mechanisms',
        'Use secure session management'
      ],
      [OwaspTop10Category.A08_SOFTWARE_INTEGRITY_FAILURES]: [
        'Implement code signing',
        'Use secure CI/CD pipelines',
        'Validate software integrity',
        'Implement supply chain security'
      ],
      [OwaspTop10Category.A09_LOGGING_FAILURES]: [
        'Implement comprehensive security logging',
        'Set up security monitoring and alerting',
        'Protect log integrity',
        'Implement incident response procedures'
      ],
      [OwaspTop10Category.A10_SSRF]: [
        'Implement URL validation and sanitization',
        'Use allowlists for external requests',
        'Implement network segmentation',
        'Disable unnecessary URL schemes'
      ]
    };

    return actions[category] || [];
  }
}