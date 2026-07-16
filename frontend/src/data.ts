import { RiskLevel, ThreatStatus, ThreatAlert, PrivilegedUser, IdentityNode, IdentityEdge, ActiveSession, ThreatIntelItem, InvestigationCase, AuditLog, AccessPolicy } from "./types";

// Persistent Database Synchronization Engine
export const getStoredData = <T>(key: string, defaultData: T): T => {
  if (typeof window === "undefined") return defaultData;
  const stored = localStorage.getItem(`privguard_${key}`);
  if (stored === null) {
    // Removed the override that was forcing empty arrays so that the mock data for 
    // the users successfully populates all features in the menu bar.
    return defaultData;
  }
  try {
    const parsed = JSON.parse(stored);
    // If local storage has an empty array but we have rich mock data, use the mock data!
    if (Array.isArray(parsed) && parsed.length === 0 && Array.isArray(defaultData) && defaultData.length > 0) {
      return defaultData;
    }
    return parsed;
  } catch (e) {
    return defaultData;
  }
};

export const setStoredData = <T>(key: string, data: T) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(`privguard_${key}`, JSON.stringify(data));
  window.dispatchEvent(new Event("privguard_db_sync"));
};

// 1. Threat Alerts (Incident Feed)
export const mockThreatAlerts: ThreatAlert[] = [
  {
    id: "AL-1001",
    title: "Suspicious Multi-Factor Authentication Bypass via Session Hijacking",
    actor: "adm_j_smith",
    riskScore: 94,
    riskLevel: RiskLevel.CRITICAL,
    category: "Credential Exploitation",
    timestamp: "2026-07-15T21:40:00-07:00",
    status: ThreatStatus.ACTIVE,
    affectedAsset: "PROD-DB-CLUSTER-01",
    affectedUser: "John Smith (Database Admin)",
    mitreTactic: "Privilege Escalation (T1068)",
    assignedAnalyst: "Sarah Jenkins (Tier 3 SOC)",
    sourceIp: "185.220.101.42",
    geoCountry: "Germany (Tor Exit)",
    description: "Multiple high-privileged database queries executed after bypassing dual-factor token controls. Authentication token was cloned from a suspicious web-session ID originating from a known Tor IP range.",
    evidenceCount: 5
  },
  {
    id: "AL-1002",
    title: "Out-of-Hours Mass Backup Downloader via Compromised API Token",
    actor: "svc_billing_prod",
    riskScore: 88,
    riskLevel: RiskLevel.HIGH,
    category: "Insider Threat / Data Exfiltration",
    timestamp: "2026-07-15T20:15:32-07:00",
    status: ThreatStatus.INVESTIGATING,
    affectedAsset: "AWS-S3-FINANCIAL-DUMP-09",
    affectedUser: "Billing Service Account (High Privilege)",
    mitreTactic: "Exfiltration Over Web Service (T1567)",
    assignedAnalyst: "Marcus Vance (Tier 2 SOC)",
    sourceIp: "45.138.89.21",
    geoCountry: "Russia (Proxy)",
    description: "The service account svc_billing_prod fetched 420 GB of archived client transactional backups at 03:15 AM server time. This is a 1,200% deviation from the 30-day baseline.",
    evidenceCount: 8
  },
  {
    id: "AL-1003",
    title: "Lateral Movement & Domain Controller Querying Attempt",
    actor: "dev_alex_k",
    riskScore: 78,
    riskLevel: RiskLevel.HIGH,
    category: "Suspicious lateral movement",
    timestamp: "2026-07-15T19:42:11-07:00",
    status: ThreatStatus.ACTIVE,
    affectedAsset: "CORP-DC-01",
    affectedUser: "Alex Kincaid (Frontend Engineer)",
    mitreTactic: "Lateral Movement (TA0008)",
    assignedAnalyst: "Sarah Jenkins (Tier 3 SOC)",
    sourceIp: "10.142.33.118",
    geoCountry: "Internal LAN",
    description: "Alex Kincaid's workstation attempted to query Active Directory domain trust structures using command-line LSASS dump utilities. Workstation is categorized as non-privileged.",
    evidenceCount: 3
  },
  {
    id: "AL-1004",
    title: "Just-In-Time (JIT) Firecall Access Misuse - Vault Admin",
    actor: "adm_s_chen",
    riskScore: 65,
    riskLevel: RiskLevel.MEDIUM,
    category: "Policy Bypass Anomaly",
    timestamp: "2026-07-15T18:02:15-07:00",
    status: ThreatStatus.RESOLVED,
    affectedAsset: "CYBERARK-VAULT-MAIN-02",
    affectedUser: "Sonia Chen (Security Operations)",
    mitreTactic: "Defense Evasion (TA0005)",
    assignedAnalyst: "Marcus Vance (Tier 2 SOC)",
    sourceIp: "192.168.12.44",
    geoCountry: "Corporate VPN",
    description: "Emergency firecall privilege granted for DB recovery, but Sonia Chen utilized the credentials to query non-emergency security keys of internal microservices instead.",
    evidenceCount: 2
  },
  {
    id: "AL-1005",
    title: "Suspicious Privilege Elevation inside SWIFT Payment VM",
    actor: "swift_operator_04",
    riskScore: 98,
    riskLevel: RiskLevel.CRITICAL,
    category: "Financial System Anomaly",
    timestamp: "2026-07-15T17:33:04-07:00",
    status: ThreatStatus.ACTIVE,
    affectedAsset: "SWIFT-GATEWAY-TX-04",
    affectedUser: "Elena Rostova (SWIFT Operator)",
    mitreTactic: "Impact (TA0040)",
    assignedAnalyst: "Sarah Jenkins (Tier 3 SOC)",
    sourceIp: "10.220.44.89",
    geoCountry: "Internal Security Zone",
    description: "Critical risk alert: Local Administrator access was spawned from the standard Swift transaction terminal console. Attempted to execute unapproved terminal shell commands bypassing SWIFT CSP rules.",
    evidenceCount: 12
  },
  {
    id: "AL-1006",
    title: "UEBA Detection: Suspicious Geographically Impossible Travel",
    actor: "VP_finance_r_morris",
    riskScore: 45,
    riskLevel: RiskLevel.LOW,
    category: "UEBA Anomaly",
    timestamp: "2026-07-15T15:10:00-07:00",
    status: ThreatStatus.CONTAINED,
    affectedAsset: "OFFICE365-EMAIL-TENANT",
    affectedUser: "Robert Morris (VP of Finance)",
    mitreTactic: "Initial Access (TA0001)",
    assignedAnalyst: "Emily Cooper (Tier 1 SOC)",
    sourceIp: "103.45.22.90",
    geoCountry: "Singapore",
    description: "Successful login session recorded from Singapore only 42 minutes after another active login was registered from Dallas, Texas, USA. Session revoked automatically.",
    evidenceCount: 4
  }
];

// 2. Privileged Users with detailed risk scores
export const mockPrivilegedUsers: PrivilegedUser[] = [
  {
    id: "USR-001",
    username: "adm_j_smith",
    fullName: "John Smith",
    role: "Lead Database Administrator",
    department: "Cloud Operations",
    riskScore: 94,
    behaviorScore: 91,
    activeSessions: 3,
    devicesUsed: 4,
    clearanceLevel: "Admin",
    lastActive: "Active Now"
  },
  {
    id: "USR-002",
    username: "swift_operator_04",
    fullName: "Elena Rostova",
    role: "SWIFT Systems Operator",
    department: "Treasury Operations",
    riskScore: 98,
    behaviorScore: 95,
    activeSessions: 1,
    devicesUsed: 2,
    clearanceLevel: "L3",
    lastActive: "Active Now"
  },
  {
    id: "USR-003",
    username: "svc_billing_prod",
    fullName: "Billing Service Account",
    role: "Automated Microservice Worker",
    department: "Finance Software Dev",
    riskScore: 88,
    behaviorScore: 82,
    activeSessions: 4,
    devicesUsed: 1,
    clearanceLevel: "L2",
    lastActive: "15 mins ago"
  },
  {
    id: "USR-004",
    username: "adm_s_chen",
    fullName: "Sonia Chen",
    role: "Security Engineer",
    department: "Enterprise Cyber Security",
    riskScore: 65,
    behaviorScore: 54,
    activeSessions: 0,
    devicesUsed: 3,
    clearanceLevel: "Admin",
    lastActive: "1 hr ago"
  },
  {
    id: "USR-005",
    username: "dev_alex_k",
    fullName: "Alex Kincaid",
    role: "Staff Software Engineer",
    department: "Frontend Platform Group",
    riskScore: 78,
    behaviorScore: 84,
    activeSessions: 2,
    devicesUsed: 5,
    clearanceLevel: "L1",
    lastActive: "Active Now"
  },
  {
    id: "USR-006",
    username: "VP_finance_r_morris",
    fullName: "Robert Morris",
    role: "VP Finance & Operations",
    department: "Executive Committee",
    riskScore: 45,
    behaviorScore: 71,
    activeSessions: 0,
    devicesUsed: 2,
    clearanceLevel: "L3",
    lastActive: "4 hrs ago"
  }
];

// 3. Identity Graph Nodes & Edges (Interactive Visual Path representation)
export const mockIdentityNodes: IdentityNode[] = [
  { id: "node-user-john", label: "John Smith (DB Admin)", type: "user", riskScore: 94, status: "compromised" },
  { id: "node-role-db-admin", label: "DB_ADMIN_ROLE", type: "role", riskScore: 80, status: "active" },
  { id: "node-role-domain-admin", label: "DOMAIN_ADMIN_ROLE", type: "role", riskScore: 95, status: "idle" },
  { id: "node-server-db01", label: "PROD-DB-CLUSTER-01", type: "server", riskScore: 90, status: "compromised" },
  { id: "node-server-dc01", label: "CORP-DC-01 (Domain Controller)", type: "server", riskScore: 98, status: "idle" },
  { id: "node-db-sql", label: "Customer_Credit_DB", type: "database", riskScore: 92, status: "compromised" },
  { id: "node-app-swift", label: "SWIFT Payments App", type: "application", riskScore: 85, status: "active" },
  
  { id: "node-user-elena", label: "Elena Rostova (SWIFT Operator)", type: "user", riskScore: 98, status: "compromised" },
  { id: "node-user-alex", label: "Alex Kincaid (Frontend Dev)", type: "user", riskScore: 78, status: "active" },
  { id: "node-role-dev-standard", label: "DEV_READ_ONLY_ROLE", type: "role", riskScore: 20, status: "active" },
];

export const mockIdentityEdges: IdentityEdge[] = [
  // John Smith paths
  { id: "edge1", source: "node-user-john", target: "node-role-db-admin", label: "Assigned To", isHighRiskPath: true },
  { id: "edge2", source: "node-role-db-admin", target: "node-server-db01", label: "Full Root SSH", isHighRiskPath: true },
  { id: "edge3", source: "node-server-db01", target: "node-db-sql", label: "Stores/Owns", isHighRiskPath: true },
  
  // High risk escalation path from DB role to Domain admin due to bad GPO policies
  { id: "edge4", source: "node-role-db-admin", target: "node-role-domain-admin", label: "Indirect GPO Override", isHighRiskPath: true },
  { id: "edge5", source: "node-role-domain-admin", target: "node-server-dc01", label: "Grants RDP Access", isHighRiskPath: true },
  
  // Elena Rostova paths
  { id: "edge6", source: "node-user-elena", target: "node-app-swift", label: "Authorized Console", isHighRiskPath: true },
  { id: "edge7", source: "node-app-swift", target: "node-db-sql", label: "API Query Client", isHighRiskPath: false },
  
  // Alex paths (Low risk standard path)
  { id: "edge8", source: "node-user-alex", target: "node-role-dev-standard", label: "Assigned To", isHighRiskPath: false },
  { id: "edge9", source: "node-role-dev-standard", target: "node-server-db01", label: "Read-Only VPN Proxy", isHighRiskPath: false }
];

// 4. Active Sessions (Real-time telemetry)
export const mockActiveSessions: ActiveSession[] = [
  {
    id: "SES-99812",
    userId: "USR-001",
    username: "adm_j_smith",
    ipAddress: "185.220.101.42",
    country: "Germany (Tor Exit)",
    browser: "Chrome v119 (Cloned Metadata)",
    device: "Corporate ThinkPad L490",
    os: "Windows 11 Enterprise",
    startTime: "2026-07-15T21:10:00-07:00",
    durationSeconds: 1800,
    privilegedCommandsRun: 18,
    riskScore: 94,
    hasMfaVerified: false,
    resourceAccessed: "PROD-DB-CLUSTER-01 (Table: Credit_Card_Numbers)"
  },
  {
    id: "SES-99813",
    userId: "USR-002",
    username: "swift_operator_04",
    ipAddress: "10.220.44.89",
    country: "Internal LAN Zone B",
    browser: "Edge v121",
    device: "Special Swift Terminal Terminal-04",
    os: "Windows 10 IoT Secure",
    startTime: "2026-07-15T22:00:00-07:00",
    durationSeconds: 2235,
    privilegedCommandsRun: 4,
    riskScore: 98,
    hasMfaVerified: true,
    resourceAccessed: "SWIFT-GATEWAY-TX-04 (Terminal Console)"
  },
  {
    id: "SES-99814",
    userId: "USR-005",
    username: "dev_alex_k",
    ipAddress: "10.142.33.118",
    country: "Internal LAN Zone G",
    browser: "Safari 17.2",
    device: "Alex Mac Studio Workstation",
    os: "macOS Sonoma",
    startTime: "2026-07-15T22:15:30-07:00",
    durationSeconds: 1305,
    privilegedCommandsRun: 23,
    riskScore: 78,
    hasMfaVerified: true,
    resourceAccessed: "CORP-DC-01 (Directory Trust Schema Query)"
  },
  {
    id: "SES-99815",
    userId: "USR-003",
    username: "svc_billing_prod",
    ipAddress: "45.138.89.21",
    country: "Russia (Proxy Host)",
    browser: "Axios client / Node-HTTP",
    device: "Docker Container Cloud-Cluster-A",
    os: "Linux (Alpine 3.18)",
    startTime: "2026-07-15T22:30:00-07:00",
    durationSeconds: 435,
    privilegedCommandsRun: 120,
    riskScore: 88,
    hasMfaVerified: false,
    resourceAccessed: "AWS-S3-FINANCIAL-DUMP-09"
  }
];

// 5. Threat Intelligence (IP & IOC blacklist data)
export const mockThreatIntel: ThreatIntelItem[] = [
  {
    id: "IOC-401",
    indicator: "185.220.101.42",
    type: "IP",
    maliciousScore: 99,
    detectionCategory: "Tor Exit Node",
    firstSeen: "2026-03-10",
    lastSeen: "2026-07-15",
    country: "Germany",
    status: "Blocked"
  },
  {
    id: "IOC-402",
    indicator: "45.138.89.21",
    type: "IP",
    maliciousScore: 95,
    detectionCategory: "VPN Proxy",
    firstSeen: "2026-05-18",
    lastSeen: "2026-07-15",
    country: "Russia",
    status: "Blocked"
  },
  {
    id: "IOC-403",
    indicator: "da39a3ee5e6b4b0d3255bfef95601890afd80709",
    type: "Hash",
    maliciousScore: 100,
    detectionCategory: "Known Malware C2",
    firstSeen: "2026-01-05",
    lastSeen: "2026-07-14",
    country: "Global (Cobalt Strike Beacon)",
    status: "Blocked"
  },
  {
    id: "IOC-404",
    indicator: "suspicious-malware-domain-xyz.biz",
    type: "Domain",
    maliciousScore: 88,
    detectionCategory: "Bulletproof Hosting",
    firstSeen: "2026-06-30",
    lastSeen: "2026-07-15",
    country: "Netherlands",
    status: "Monitored"
  },
  {
    id: "IOC-405",
    indicator: "109.248.9.112",
    type: "IP",
    maliciousScore: 90,
    detectionCategory: "Suspicious Cloud VPS",
    firstSeen: "2026-07-10",
    lastSeen: "2026-07-15",
    country: "Ukraine",
    status: "Flagged"
  }
];

// 6. Investigation Cases
export const mockInvestigationCases: InvestigationCase[] = [
  {
    id: "CASE-4401",
    caseNumber: "INC-2026-8812",
    title: "Critical Database Exfiltration & Tor Access Hijack",
    riskScore: 95,
    status: "In_Progress",
    priority: "P1",
    createdTimestamp: "2026-07-15T21:42:00-07:00",
    assignedTo: "Sarah Jenkins (Tier 3 SOC)",
    description: "Multi-stage compromise investigation of lead DB Administrator account adm_j_smith. Initiated following critical alerts on bypassed 2FA and bulk card-table exports through Tor node.",
    alertsIncluded: ["AL-1001", "AL-1003"],
    evidence: ["ssh_history_adm_j_smith.log", "prod_db_audit_export.csv", "tor_exit_traffic_raw.pcap", "cloned_user_agent_signature.json"],
    notes: [
      {
        id: "note-1",
        author: "Sarah Jenkins (Tier 3 SOC)",
        timestamp: "2026-07-15T21:55:00-07:00",
        content: "Isolated the PROD-DB-CLUSTER-01 server from general inbound web pipelines. Database cluster now operating inside containment sandbox."
      },
      {
        id: "note-2",
        author: "Sarah Jenkins (Tier 3 SOC)",
        timestamp: "2026-07-15T22:10:00-07:00",
        content: "Initiated session revocation protocol for adm_j_smith across Azure AD tenant and Active Directory local servers. Awaiting physical log audits."
      }
    ]
  },
  {
    id: "CASE-4402",
    caseNumber: "INC-2026-7741",
    title: "Billing Service Account Mass Backup Extraction",
    riskScore: 88,
    status: "Open",
    priority: "P2",
    createdTimestamp: "2026-07-15T20:20:00-07:00",
    assignedTo: "Marcus Vance (Tier 2 SOC)",
    description: "Automation pipeline anomaly alert. High deviation detected inside automated cloud backups bucket. svc_billing_prod triggered standard safety locks.",
    alertsIncluded: ["AL-1002"],
    evidence: ["aws_cloudtrail_exfil.json", "s3_access_bucket_logs.txt"],
    notes: [
      {
        id: "note-3",
        author: "Marcus Vance (Tier 2 SOC)",
        timestamp: "2026-07-15T20:45:00-07:00",
        content: "Contacted billing microservice owner. He is currently out of office. Verifying if scheduled system maintenance or database consolidation run was planned."
      }
    ]
  }
];

// 7. Audit Logs (with cryptographically secure verification hashes)
export const mockAuditLogs: AuditLog[] = [
  {
    id: "LOG-1099281",
    timestamp: "2026-07-15T22:31:04-07:00",
    actor: "adm_j_smith",
    action: "READ TABLE Credit_Card_Numbers",
    targetResource: "PROD-DB-CLUSTER-01",
    ipAddress: "185.220.101.42",
    status: "SUCCESS",
    cryptographicSignature: "61a5b89c3db6f9fdeea8bcda913e96a41f893e9cd188f6bc06a41e97d463d12f",
    isVerified: true
  },
  {
    id: "LOG-1099282",
    timestamp: "2026-07-15T22:30:15-07:00",
    actor: "svc_billing_prod",
    action: "BATCH_DOWNLOAD S3_Bucket_Backup_09",
    targetResource: "AWS-S3-FINANCIAL-DUMP-09",
    ipAddress: "45.138.89.21",
    status: "SUCCESS",
    cryptographicSignature: "fb3945de210e3956cae4f9b8719f9f928e18fbfca910ea09fbdf80ca910e9ca3",
    isVerified: true
  },
  {
    id: "LOG-1099283",
    timestamp: "2026-07-15T22:18:22-07:00",
    actor: "dev_alex_k",
    action: "QUERY_DIRECTORY Active_Directory_Schema",
    targetResource: "CORP-DC-01",
    ipAddress: "10.142.33.118",
    status: "SUCCESS",
    cryptographicSignature: "3f98ea0d0a7bc9b6e8f498cda6a1ef8fbca39d6e7f82b7190ca8ea210e9bd281",
    isVerified: true
  },
  {
    id: "LOG-1099284",
    timestamp: "2026-07-15T22:04:15-07:00",
    actor: "swift_operator_04",
    action: "EXECUTE Local_Admin_Spawn",
    targetResource: "SWIFT-GATEWAY-TX-04",
    ipAddress: "10.220.44.89",
    status: "SUCCESS",
    cryptographicSignature: "cc3910abecfe9012fcaed498cda6b10ebca98fe9c7f12bc8ca98ea21f8a928ef",
    isVerified: true
  },
  {
    id: "LOG-1099285",
    timestamp: "2026-07-15T22:01:00-07:00",
    actor: "adm_s_chen",
    action: "REQUEST Firecall_Authorization",
    targetResource: "CYBERARK-VAULT-MAIN-02",
    ipAddress: "192.168.12.44",
    status: "SUCCESS",
    cryptographicSignature: "ab89ef473b6dcd8f9eaed9cd18ca019ebca72bfca1b6ed8fca9b10edcb7f6da9",
    isVerified: true
  },
  {
    id: "LOG-1099286",
    timestamp: "2026-07-15T21:45:11-07:00",
    actor: "unauthorized_guest",
    action: "SSH_LOGIN Root_Access",
    targetResource: "SWIFT-GATEWAY-TX-04",
    ipAddress: "91.240.23.11",
    status: "FAILED",
    cryptographicSignature: "e938fbdca298fca390ebac29e18bca9ea7bcda19efcab4dca7bda2910ebca193",
    isVerified: true
  }
];

// 8. Access Policies
export const mockAccessPolicies: AccessPolicy[] = [
  {
    id: "POL-301",
    name: "SWIFT Financial Zone Zero-Trust Access Rule",
    description: "Requires explicit dual-manager approval + physical key hardware token + active security session logs for any administrative shell execution inside SWIFT subnet.",
    targetRoles: ["SWIFT_OPERATOR", "TREASURY_MGR"],
    riskThreshold: 50,
    mfaRequired: true,
    approvalRequired: true,
    timeWindow: "06:00 - 20:00 UTC",
    isEnabled: true
  },
  {
    id: "POL-302",
    name: "Production Database Access Just-In-Time Escalation",
    description: "Restricts permanent administrative DBA logins. Temporary 'Firecall' role access expires dynamically after 2 hours and logs all SQL text commands to signed immutable ledger.",
    targetRoles: ["CLOUD_DBA", "ENTERPRISE_SEC"],
    riskThreshold: 40,
    mfaRequired: true,
    approvalRequired: true,
    timeWindow: "24/7 Continuous",
    isEnabled: true
  },
  {
    id: "POL-303",
    name: "Automatic Session Revocation for Geographically Impossible Actions",
    description: "UEBA analytical trigger. Instantaneous termination of web authorization cookies if two subsequent logins are logged within an impossible travel speed timeframe.",
    targetRoles: ["ALL_PRIVILEGED_ACCOUNTS"],
    riskThreshold: 30,
    mfaRequired: true,
    approvalRequired: false,
    timeWindow: "24/7 Continuous",
    isEnabled: true
  },
  {
    id: "POL-304",
    name: "Non-Office Hours High Privileged API Bucket Downloads Limit",
    description: "Limits automated billing/reporting endpoints to 10 GB bulk backups pulling outside the hours of 07:00 to 22:00 UTC. Flags high risk with instant SOC P1 ticket auto-creation.",
    targetRoles: ["SERVICE_ACCOUNTS"],
    riskThreshold: 60,
    mfaRequired: false,
    approvalRequired: true,
    timeWindow: "22:00 - 07:00 UTC",
    isEnabled: false
  }
];

// 9. Department Risk Levels
export const departmentRisks = [
  { name: "Treasury Ops", score: 85, usersCount: 14, color: "text-brand-critical" },
  { name: "Cloud Infrastructure", score: 72, usersCount: 42, color: "text-brand-high" },
  { name: "Developer Services", score: 48, usersCount: 156, color: "text-brand-warning" },
  { name: "Global Finance Desk", score: 64, usersCount: 22, color: "text-brand-high" },
  { name: "Enterprise Security", score: 18, usersCount: 12, color: "text-brand-success" }
];

// 10. AI Security Copilot Preset Scenarios & AI Responses
export const copilotPresetPrompts = [
  {
    id: "prompt1",
    label: "Explain Active Threat: AL-1001",
    question: "Explain alert AL-1001: suspicious multi-factor authentication bypass inside PROD-DB-CLUSTER-01."
  },
  {
    id: "prompt2",
    label: "Analyze Attack Path for John Smith",
    question: "Analyze the privilege escalation path and critical risk nodes starting from user John Smith."
  },
  {
    id: "prompt3",
    label: "Synthesize SOC Report (Case INC-2026-8812)",
    question: "Generate an executive SOC incident summary report for active case INC-2026-8812."
  },
  {
    id: "prompt4",
    label: "Show Active JIT Access Policies",
    question: "List current Just-In-Time policies and identify which ones are currently disabled or failing thresholds."
  }
];

export const getCopilotAnswer = (question: string): string => {
  const normalized = question.toLowerCase();
  
  if (normalized.includes("al-1001") || normalized.includes("bypass")) {
    return `### AI Security Copilot Analysis: **AL-1001**
**Threat Categorization:** MFA Bypass via Session Hijacking / Cookie Cloner
**Criticality Status:** 🔴 CRITICAL (Risk Score: **94/100**)

#### 🕵️‍♂️ Root Cause Reconstruction:
The adversary initiated a high-privilege SQL console connection targeting \`PROD-DB-CLUSTER-01\`. Although the account (\`adm_j_smith\`) is strictly protected by Azure MFA conditional access, the login process bypassed token creation prompts. 
* This is indicative of **Session Hijacking (MITRE T1539)**, where an active browser cookie session ID was harvested from John Smith's workstation (likely through a local infostealer payload).
* The session cookie was immediately injected from an adversary-controlled Tor Exit node based in **Germany (185.220.101.42)**.

#### 📦 Evidence & Forensic Anchors:
1. **User Agent Divergence**: The host OS changed from macOS Sonoma (owner's laptop baseline) to Windows 11 Enterprise (attacker host) without triggering typical registration procedures.
2. **Tor Network Tunneling**: Connection established via known exit endpoint \`185.220.101.42\`.
3. **Table Query Sequence**: Multiple bulk select queries triggered targeting the \`Credit_Card_Numbers\` table, deviating by **4,500%** from John's normal transactional volume.

---

#### 🛡️ AI Recommended Actions:
1. **Instantly Revoke Web Authorization Token**: Terminate the session \`SES-99812\` immediately (Use the **Active Sessions** dashboard).
2. **Enforce Hard Hardware Token MFA Reset**: Flush active devices and force John Smith to enroll a new physical FIDO2 key.
3. **Microsegment Database Clusters**: Apply Firecall JIT Access Policy \`POL-302\` to enforce manager authorization for database table extraction.`;
  }
  
  if (normalized.includes("path") || normalized.includes("john smith") || normalized.includes("escalation")) {
    return `### AI Privilege Attack Chain Analysis: **John Smith**
**Risk Vector:** Excessive Group Policies and Active Directory trust relationships.

#### 🕸️ Privilege Node Chain:
\`\`\`
[John Smith (DB Admin)] 
       │ (Assigned DB_ADMIN_ROLE)
       ▼
[DB_ADMIN_ROLE]
       │ (Grants root SSH to database clusters)
       ▼
[PROD-DB-CLUSTER-01]
       │ (🚨 GPO Configuration Flaw: Admin Credentials cached in local memory)
       ▼
[DOMAIN_ADMIN_ROLE] 
       │ (Full Forest Domain Compromise)
       ▼
[CORP-DC-01 (Domain Controller)]
\`\`\`

#### 🔍 Critical Risk Analysis:
Our behavioral discovery detected that the active \`DB_ADMIN_ROLE\` carries an indirect privilege loop. An active Active Directory GPO configures local admins on database machines with read/write access to the Active Directory SYSVOL folder. 
* If an attacker compromises the Database server (which is currently **compromised** under \`AL-1001\`), they can inject a malicious PowerShell startup script into SYSVOL, automatically granting themselves **Domain Admin** privileges inside \`CORP-DC-01\`.

#### 🚧 Mitigation Architecture:
* **Remove GPO Write Access**: Retract SYSVOL write privileges from all database operational accounts.
* **Enable Credential Guard**: Deploy Windows Credential Guard on \`PROD-DB-CLUSTER-01\` to prevent LSASS password dumping.`;
  }
  
  if (normalized.includes("report") || normalized.includes("8812") || normalized.includes("inc-")) {
    return `### Executive SOC Report: Case **INC-2026-8812**
**Prepared by:** PrivGuard AI Copilot Engine
**Date:** 2026-07-15 UTC
**Target Threat**: Unauthorized Database Extraction & Multi-Vector Hijacking

---

#### 1. Executive Summary:
On July 15, 2026, the PrivGuard SOC detection engine flagged two high-criticality threats originating from the credentials of Lead DBA John Smith. The attacker successfully executed an MFA session-hijack from a German Tor Exit node and attempted lateral movement targeting the Primary Active Directory Domain Controller (\`CORP-DC-01\`). Total data exposed is estimated at 120,000 hashed accounts.

#### 2. Technical Timeline:
* **21:10 UTC**: Attacker establishes remote persistent session (\`SES-99812\`) using duplicated authorization cookies.
* **21:40 UTC**: Alert \`AL-1001\` triggers following SQL queries targeting critical payment databases.
* **21:42 UTC**: Case \`INC-2026-8812\` created and routed to Tier 3 Lead Sarah Jenkins.
* **22:15 UTC**: Alex Kincaid's workstation triggers secondary lateral movement querying AD directory schemas. Workstation isolated.

#### 3. Current Remediation Status:
* **Database Isolation**: Complete.
* **Active Sessions Revoked**: John Smith's active sessions have been isolated, awaiting manager confirmation.
* **Malicious IPs**: Attacker host \`185.220.101.42\` placed on firewall drop-all blacklists globally.

---
**Verdict**: Threat Containment is **80% Complete**. Recommended to initiate identity-refresh for cloud operations.`;
  }
  
  if (normalized.includes("policy") || normalized.includes("jit") || normalized.includes("disabled")) {
    return `### Policy Audit Report
**Total Monitored Policies:** 4 Active Policies

#### 📑 Current Policy Compliance Grid:
1. **POL-301: SWIFT Zero-Trust Access Rule** 
   * Status: **ENABLED** | Health: 🟩 100% compliant. Prevents un-MFA operator sessions.
2. **POL-302: Production Database JIT Access**
   * Status: **ENABLED** | Health: 🟧 72% compliance. Sonia Chen's alert \`AL-1004\` bypass has triggered a review.
3. **POL-303: Travel Revocation UEBA**
   * Status: **ENABLED** | Health: 🟩 100% compliant. Terminated Robert Morris's login session from Singapore automatically.
4. **POL-304: Out-of-Hours Mass S3 Downloads Limit**
   * Status: **DISABLED** (⚠️ Danger / Compliance Fail)
   * **AI Warning**: This policy is currently deactivated. Due to this deactivation, the service account \`svc_billing_prod\` extracted 420 GB of core S3 databases without automatic blocking (Alert \`AL-1002\`).

#### 🚨 Recommendations:
* **Enable POL-304 instantly** to block further exfiltration attempts from automated containers outside UTC hours.`;
  }

  return `### AI Security Copilot Workspace
I am listening to your query regarding **PrivGuard's** active SOC threat surface.

I can help you with specific tasks:
1. **Explain Alert AL-1001** (Tor exit node credential bypass)
2. **Analyze Attack Chain for John Smith** (Identity privilege path)
3. **Summarize Case INC-2026-8812** (SOC compliance report)
4. **Audit Just-In-Time Access Policies** (Policy thresholds)

Please enter an alert ID, user name, or ask a question about our active investigations.`;
};
