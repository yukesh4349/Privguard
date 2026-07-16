/**
 * PrivGuard Cybersecurity Platform
 * Enterprise Type Definitions (TS-Safe)
 */

export enum RiskLevel {
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High",
  CRITICAL = "Critical"
}

export enum ThreatStatus {
  ACTIVE = "Active",
  INVESTIGATING = "Investigating",
  CONTAINED = "Contained",
  RESOLVED = "Resolved",
  FALSE_POSITIVE = "False Positive"
}

export interface SecurityMetric {
  title: string;
  value: string | number;
  change: number; // positive or negative percentage
  status: "up" | "down" | "stable";
  color: string;
  sparkline: number[];
}

export interface ThreatAlert {
  id: string;
  title: string;
  actor: string;
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  category: string; // e.g., UEBA Anomaly, Credential Stuffing, Just-In-Time Bypass
  timestamp: string;
  status: ThreatStatus;
  affectedAsset: string;
  affectedUser: string;
  mitreTactic: string; // e.g., Privilege Escalation (T1068)
  assignedAnalyst: string;
  sourceIp: string;
  geoCountry: string;
  description: string;
  evidenceCount: number;
}

export interface PrivilegedUser {
  id: string;
  username: string;
  fullName: string;
  role: string;
  department: string;
  riskScore: number;
  behaviorScore: number; // 0-100 where higher is anomalous
  activeSessions: number;
  devicesUsed: number;
  clearanceLevel: "L1" | "L2" | "L3" | "Admin";
  lastActive: string;
}

export interface IdentityNode {
  id: string;
  label: string;
  type: "user" | "role" | "server" | "database" | "application";
  riskScore: number; // 0-100
  status?: "active" | "compromised" | "idle";
}

export interface IdentityEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  isHighRiskPath: boolean;
}

export interface ActiveSession {
  id: string;
  userId: string;
  username: string;
  ipAddress: string;
  country: string;
  browser: string;
  device: string;
  os: string;
  startTime: string;
  durationSeconds: number;
  privilegedCommandsRun: number;
  riskScore: number;
  hasMfaVerified: boolean;
  resourceAccessed: string;
}

export interface ThreatIntelItem {
  id: string;
  indicator: string; // IP, domain, hash
  type: "IP" | "Domain" | "Hash";
  maliciousScore: number; // 0-100
  detectionCategory: "Tor Exit Node" | "Bulletproof Hosting" | "VPN Proxy" | "Known Malware C2" | "Suspicious Cloud VPS";
  firstSeen: string;
  lastSeen: string;
  country: string;
  status: "Blocked" | "Monitored" | "Flagged";
}

export interface InvestigationCase {
  id: string;
  caseNumber: string;
  title: string;
  riskScore: number;
  status: "Open" | "In_Progress" | "Under_Review" | "Closed";
  priority: "P1" | "P2" | "P3" | "P4";
  createdTimestamp: string;
  assignedTo: string;
  description: string;
  alertsIncluded: string[]; // IDs of alerts
  evidence: string[]; // evidence file names or logs
  notes: {
    id: string;
    author: string;
    timestamp: string;
    content: string;
  }[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  targetResource: string;
  ipAddress: string;
  status: "SUCCESS" | "FAILED" | "REVOKED";
  cryptographicSignature: string; // Immutable blockchain-like SHA256 tag
  isVerified: boolean;
}

export interface AccessPolicy {
  id: string;
  name: string;
  description: string;
  targetRoles: string[];
  riskThreshold: number;
  mfaRequired: boolean;
  approvalRequired: boolean;
  timeWindow: string; // e.g., "08:00 - 18:00 UTC"
  isEnabled: boolean;
}
