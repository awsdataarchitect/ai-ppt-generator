/**
 * Compliance mapping types for security standards and frameworks
 * Defines interfaces for OWASP, NIST, AWS, SOC2, ISO 27001, and regulatory compliance
 */

export enum ComplianceFramework {
  OWASP_TOP_10 = 'OWASP Top 10',
  NIST_CSF = 'NIST Cybersecurity Framework',
  AWS_WELL_ARCHITECTED = 'AWS Well-Architected Security Pillar',
  SOC2_TYPE_II = 'SOC2 Type II',
  ISO_27001 = 'ISO 27001',
  GDPR = 'General Data Protection Regulation',
  CCPA = 'California Consumer Privacy Act',
  HIPAA = 'Health Insurance Portability and Accountability Act',
  PCI_DSS = 'Payment Card Industry Data Security Standard'
}

export enum ComplianceStatus {
  COMPLIANT = 'Compliant',
  NON_COMPLIANT = 'Non-Compliant',
  PARTIALLY_COMPLIANT = 'Partially Compliant',
  NOT_APPLICABLE = 'Not Applicable',
  REQUIRES_REVIEW = 'Requires Review'
}

export interface ComplianceControl {
  readonly id: string;
  readonly framework: ComplianceFramework;
  readonly controlNumber: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly requirements: string[];
  readonly testProcedures: string[];
}

export interface ComplianceMapping {
  readonly vulnerabilityId: string;
  readonly mappedControls: ComplianceControlMapping[];
  readonly overallStatus: ComplianceStatus;
  readonly gapAnalysis: ComplianceGap[];
  readonly recommendedActions: string[];
}

export interface ComplianceControlMapping {
  readonly control: ComplianceControl;
  readonly status: ComplianceStatus;
  readonly evidence: string[];
  readonly gaps: string[];
  readonly remediation: string[];
}

export interface ComplianceGap {
  readonly controlId: string;
  readonly framework: ComplianceFramework;
  readonly gapDescription: string;
  readonly severity: string;
  readonly remediation: string;
  readonly timeline: string;
  readonly owner: string;
}

// OWASP Top 10 specific mappings
export enum OwaspTop10Category {
  A01_BROKEN_ACCESS_CONTROL = 'A01:2021 – Broken Access Control',
  A02_CRYPTOGRAPHIC_FAILURES = 'A02:2021 – Cryptographic Failures',
  A03_INJECTION = 'A03:2021 – Injection',
  A04_INSECURE_DESIGN = 'A04:2021 – Insecure Design',
  A05_SECURITY_MISCONFIGURATION = 'A05:2021 – Security Misconfiguration',
  A06_VULNERABLE_COMPONENTS = 'A06:2021 – Vulnerable and Outdated Components',
  A07_AUTHENTICATION_FAILURES = 'A07:2021 – Identification and Authentication Failures',
  A08_SOFTWARE_INTEGRITY_FAILURES = 'A08:2021 – Software and Data Integrity Failures',
  A09_LOGGING_FAILURES = 'A09:2021 – Security Logging and Monitoring Failures',
  A10_SSRF = 'A10:2021 – Server-Side Request Forgery (SSRF)'
}

export interface OwaspMapping {
  readonly category: OwaspTop10Category;
  readonly cweIds: string[];
  readonly riskRating: string;
  readonly prevalence: string;
  readonly detectability: string;
  readonly technicalImpact: string;
  readonly businessImpact: string;
}

// NIST Cybersecurity Framework mappings
export enum NistFunction {
  IDENTIFY = 'Identify',
  PROTECT = 'Protect',
  DETECT = 'Detect',
  RESPOND = 'Respond',
  RECOVER = 'Recover'
}

export interface NistMapping {
  readonly function: NistFunction;
  readonly category: string;
  readonly subcategory: string;
  readonly informativeReferences: string[];
  readonly implementationGuidance: string[];
}

// AWS Well-Architected Security Pillar mappings
export enum AwsSecurityPillar {
  IDENTITY_ACCESS_MANAGEMENT = 'Identity and Access Management',
  DETECTIVE_CONTROLS = 'Detective Controls',
  INFRASTRUCTURE_PROTECTION = 'Infrastructure Protection',
  DATA_PROTECTION = 'Data Protection in Transit and at Rest',
  INCIDENT_RESPONSE = 'Incident Response'
}

export interface AwsSecurityMapping {
  readonly pillar: AwsSecurityPillar;
  readonly designPrinciple: string;
  readonly bestPractices: string[];
  readonly implementationGuidance: string[];
  readonly awsServices: string[];
}

export interface ComplianceReport {
  readonly assessmentId: string;
  readonly frameworks: ComplianceFramework[];
  readonly overallCompliance: ComplianceStatus;
  readonly complianceScore: number; // 0-100 percentage
  readonly frameworkResults: FrameworkResult[];
  readonly criticalGaps: ComplianceGap[];
  readonly recommendedPriorities: string[];
  readonly generatedAt: Date;
}

export interface FrameworkResult {
  readonly framework: ComplianceFramework;
  readonly status: ComplianceStatus;
  readonly score: number;
  readonly totalControls: number;
  readonly compliantControls: number;
  readonly nonCompliantControls: number;
  readonly gaps: ComplianceGap[];
}