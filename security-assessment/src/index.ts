/**
 * Security Vulnerability Assessment System
 * Main entry point for all security assessment functionality
 */

// Core types and interfaces
export * from './types/VulnerabilityTypes';
export * from './types/RiskAssessmentTypes';
export * from './types/ComplianceTypes';

// Scanner interfaces
export * from './interfaces/ScannerInterface';

// Configuration
export * from './config/FileSystemConfig';

// OWASP Top 10 Compliance Mapping
export * from './mappers/OwaspTop10Mapper';

// Version information
export const VERSION = '1.0.0';
export const SYSTEM_NAME = 'Security Vulnerability Assessment System';

/**
 * System metadata and capabilities
 */
export const SYSTEM_INFO = {
  name: SYSTEM_NAME,
  version: VERSION,
  description: 'Comprehensive security vulnerability assessment tool for AI PPT Generator',
  capabilities: [
    'Frontend Security Scanning (React/Next.js)',
    'Backend Security Scanning (Python/Lambda)',
    'Infrastructure Security Scanning (CDK/TypeScript)',
    'Dependency Vulnerability Scanning',
    'Data Flow Security Analysis',
    'OWASP Top 10 Compliance Mapping',
    'NIST Cybersecurity Framework Assessment',
    'AWS Well-Architected Security Pillar Evaluation',
    'Risk Assessment and Business Impact Analysis',
    'Comprehensive Security Report Generation'
  ],
  supportedFrameworks: [
    'OWASP Top 10',
    'NIST Cybersecurity Framework',
    'AWS Well-Architected Security Pillar',
    'SOC2 Type II',
    'ISO 27001',
    'GDPR',
    'CCPA',
    'HIPAA'
  ],
  targetProject: 'AI PPT Generator',
  assessmentType: 'READ-ONLY',
  lastUpdated: new Date().toISOString()
} as const;