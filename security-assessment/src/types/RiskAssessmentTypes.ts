/**
 * Risk assessment types for security vulnerability evaluation
 * Defines interfaces for risk scoring, business impact analysis, and threat modeling
 */

export enum RiskLevel {
  CRITICAL = 'Critical',
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
  NEGLIGIBLE = 'Negligible'
}

export enum BusinessImpactType {
  DATA_BREACH = 'Data Breach',
  SERVICE_DISRUPTION = 'Service Disruption',
  FINANCIAL_LOSS = 'Financial Loss',
  REPUTATION_DAMAGE = 'Reputation Damage',
  COMPLIANCE_VIOLATION = 'Compliance Violation',
  INTELLECTUAL_PROPERTY_THEFT = 'Intellectual Property Theft'
}

export interface RiskScore {
  readonly likelihood: number; // 1-5 scale
  readonly impact: number; // 1-5 scale
  readonly overallRisk: number; // calculated: likelihood * impact
  readonly riskLevel: RiskLevel;
  readonly confidenceLevel: number; // 1-5 scale
}

export interface BusinessImpactAssessment {
  readonly impactTypes: BusinessImpactType[];
  readonly financialImpact: FinancialImpact;
  readonly operationalImpact: OperationalImpact;
  readonly complianceImpact: ComplianceImpact;
  readonly reputationalImpact: ReputationalImpact;
}

export interface FinancialImpact {
  readonly estimatedCost: {
    readonly minimum: number;
    readonly maximum: number;
    readonly currency: string;
  };
  readonly costFactors: string[];
  readonly recoveryTime: string;
}

export interface OperationalImpact {
  readonly affectedSystems: string[];
  readonly serviceDowntime: string;
  readonly userImpact: string;
  readonly dataIntegrityRisk: boolean;
}

export interface ComplianceImpact {
  readonly affectedRegulations: string[];
  readonly potentialFines: string;
  readonly auditImplications: string[];
}

export interface ReputationalImpact {
  readonly publicityRisk: string;
  readonly customerTrustImpact: string;
  readonly brandDamageAssessment: string;
}

export interface ThreatModel {
  readonly threatActors: ThreatActor[];
  readonly attackVectors: AttackVector[];
  readonly assetValuation: AssetValuation;
  readonly threatScenarios: ThreatScenario[];
}

export interface ThreatActor {
  readonly type: string; // e.g., "External Attacker", "Malicious Insider", "Nation State"
  readonly motivation: string;
  readonly capabilities: string[];
  readonly likelihood: number;
}

export interface AttackVector {
  readonly name: string;
  readonly description: string;
  readonly complexity: string; // "Low", "Medium", "High"
  readonly prerequisites: string[];
}

export interface AssetValuation {
  readonly assetName: string;
  readonly confidentialityValue: number;
  readonly integrityValue: number;
  readonly availabilityValue: number;
  readonly overallValue: number;
}

export interface ThreatScenario {
  readonly id: string;
  readonly description: string;
  readonly threatActor: string;
  readonly attackVector: string;
  readonly likelihood: number;
  readonly impact: number;
  readonly riskScore: RiskScore;
}

export interface RiskAssessment {
  readonly vulnerabilityId: string;
  readonly riskScore: RiskScore;
  readonly businessImpact: BusinessImpactAssessment;
  readonly threatModel: ThreatModel;
  readonly mitigationStrategies: string[];
  readonly residualRisk: RiskScore;
  readonly assessmentDate: Date;
  readonly assessor: string;
}