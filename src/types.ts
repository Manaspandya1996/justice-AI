export interface ApplicableSection {
  act: string;
  section: string;
  title: string;
  description: string;
  whyApplies: string;
  punishmentMax: string;
  punishmentMin: string;
  fineMax: string;
  bailable: boolean;
  cognizable: boolean;
  compoundable: boolean;
  court: string;
}

export interface SimpleExplanation {
  english: string;
  hindi: string;
  gujarati: string;
}

export interface DraftFIR {
  subject: string;
  complainantDetails: string;
  incidentDetails: string;
  legalSectionsText: string;
  formalDraftText: string;
}

export interface AnalysisResult {
  category: string;
  crimeType: string;
  severity: 'High' | 'Medium' | 'Low';
  urgencyLevel: 'Critical' | 'Urgent' | 'Routine';
  riskScore: number;
  financialLossRisk: 'High' | 'Medium' | 'Low' | 'None';
  identityTheftRisk: 'High' | 'Medium' | 'Low' | 'None';
  evidenceRequired: string[];
  confidenceScore: number;
  applicableSections: ApplicableSection[];
  simpleExplanation: SimpleExplanation;
  recommendedAction: string;
  steps: string[];
  draftFIR: DraftFIR;
}

export interface TimelineEvent {
  date: string;
  title: string;
  description: string;
  type: 'success' | 'info' | 'warning' | 'pending';
}

export interface CaseItem {
  id: string;
  complainantName: string;
  complainantPhone: string;
  complainantAadhaar: string;
  incidentDate: string;
  incidentDescription: string;
  category: string;
  crimeType: string;
  severity: 'High' | 'Medium' | 'Low';
  urgencyLevel: 'Critical' | 'Urgent' | 'Routine';
  riskScore: number;
  status: 'Pending' | 'Active' | 'Under Investigation' | 'Closed';
  submittedAt: string;
  evidence: string[];
  signature?: string; // Base64 data url or signature indicator
  analysis?: AnalysisResult;
  timeline: TimelineEvent[];
  documents: {
    fir?: string;
    caseDiary?: string;
    witnessStatement?: string;
    chargeSummary?: string;
  };
}

export interface DashboardStats {
  todayFIRCount: number;
  pendingCasesCount: number;
  resolvedCasesCount: number;
  avgResponseDays: number;
  crimeTrends: { name: string; count: number }[];
  categoryDistribution: { name: string; value: number }[];
  monthlyReports: number;
  resolutionRate: number;
}
