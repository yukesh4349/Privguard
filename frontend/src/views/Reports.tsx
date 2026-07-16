import { useState } from "react";
import { FileText, Download, Calendar, ShieldCheck, Activity, Layers, AlertCircle, BookOpen, Check } from "lucide-react";
import { useTheme } from "../components/ThemeContext";

export function Reports() {
  const [activeReportTab, setActiveReportTab] = useState<"executive" | "soc" | "compliance">("executive");
  const { showToast } = useTheme();

  const handleDownload = (reportName: string) => {
    showToast(`Compiling database ledger indices and verifying enclave cryptographic signatures...`, "info");
    setTimeout(() => {
      showToast(`Exported certified compliance artifact: '${reportName}.pdf'.`, "success");
    }, 1200);
  };

  return (
    <div id="reports-view-container" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* LEFT COLUMN: Report Catalog Selectors */}
      <div className="bg-background-surface border border-border-main rounded-xl p-4 flex flex-col h-fit shadow-sm space-y-4">
        <h3 className="font-extrabold text-sm text-text-main border-b border-border-main pb-2">Compliance Document Center</h3>
        
        <div className="space-y-2">
          {[
            { id: "executive", title: "C-Suite Executive Briefing", desc: "Summarized threat matrices, department score averages and budget risk values." },
            { id: "soc", title: "SOC Operations Summary", desc: "Average response latency, isolated containers count, alerts triage breakdown." },
            { id: "compliance", title: "PCI-DSS & SOC2 Audit Report", desc: "Cryptographic signature compliance, MFA enforcement stats, JIT session reviews." },
          ].map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActiveReportTab(tab.id as any)}
              className={`p-3 rounded-lg border text-xs cursor-pointer transition-all space-y-1 ${activeReportTab === tab.id ? "bg-brand-primary/10 border-brand-primary text-text-main" : "bg-background-surface border-border-main/60 hover:bg-background-muted/20"}`}
            >
              <h4 className="font-bold text-text-main">{tab.title}</h4>
              <p className="text-text-muted leading-relaxed text-[11px]">{tab.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT TWO COLUMNS: Dynamic Document Previewer */}
      <div className="lg:col-span-2 bg-background-surface border border-border-main rounded-xl p-6 shadow-sm flex flex-col justify-between">
        
        {/* Dynamic preview block */}
        <div className="space-y-6">
          
          {/* Header metadata */}
          <div className="flex justify-between items-start border-b border-border-main pb-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono font-bold text-text-muted">Document Preview Workspace</span>
              <h2 className="text-lg font-black text-text-main">
                {activeReportTab === "executive" ? "Privilege Threat Risk Executive Summary" :
                 activeReportTab === "soc" ? "Security Operations Center (SOC) Log Analysis" :
                 "PCI-DSS / SOC2 Enclave Access Audit"}
              </h2>
              <div className="flex items-center gap-2 text-xs text-text-muted font-mono mt-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Q3 2026 Fiscal Quarter (Generated Now)</span>
              </div>
            </div>

            <button
              onClick={() => handleDownload(`${activeReportTab}_audit_report`)}
              className="px-3.5 py-1.5 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-brand-primary/10"
            >
              <Download className="w-3.5 h-3.5" />
              Download Signed PDF
            </button>
          </div>

          {/* Report Specific Previews */}
          {activeReportTab === "executive" && (
            <div className="space-y-5 text-xs">
              <div className="p-4 bg-blue-500/5 border border-brand-primary/15 rounded-lg">
                <h4 className="font-bold text-text-main flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-brand-primary" />
                  Q3 Corporate Cybersecurity Posture Summary
                </h4>
                <p className="text-text-muted mt-1.5 leading-relaxed text-[11px]">
                  Global threat metrics mapped across internal payment structures show high compliance. Internal employee risk indices decreased by 12% following deployment of automatic session termination rules. Active compromise pathways are isolated inside contained enclaves.
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] uppercase font-mono font-bold text-text-muted">High-Level Indicator Metrics</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 border border-border-main rounded-lg bg-background-muted/20">
                    <span className="text-text-muted block text-[10px]">Average Forest Health</span>
                    <span className="text-xl font-bold text-brand-success font-mono">92/100</span>
                  </div>
                  <div className="p-3 border border-border-main rounded-lg bg-background-muted/20">
                    <span className="text-text-muted block text-[10px]">Credential Path Hops</span>
                    <span className="text-xl font-bold text-text-main font-mono">2 Hops Avg</span>
                  </div>
                  <div className="p-3 border border-border-main rounded-lg bg-background-muted/20">
                    <span className="text-text-muted block text-[10px]">Exfiltration Block Rate</span>
                    <span className="text-xl font-bold text-brand-critical font-mono">100% Locked</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] uppercase font-mono font-bold text-text-muted block">Risk Vectors Action Items</span>
                <ul className="space-y-1.5 pl-4 list-disc text-text-muted">
                  <li>Remove sysvol write parameters on GPO policies linking <strong>PROD-DB-CLUSTER-01</strong>.</li>
                  <li>Enable automatic hardware key resets on operations crews in regional zones.</li>
                </ul>
              </div>
            </div>
          )}

          {activeReportTab === "soc" && (
            <div className="space-y-4 text-xs">
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-mono font-bold text-text-muted">SOC Operational KPIs</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 border border-border-main rounded-lg bg-background-muted/20">
                    <span className="text-text-muted block">Mean Time to Triage</span>
                    <span className="text-lg font-bold font-mono text-text-main">3.4 Minutes</span>
                  </div>
                  <div className="p-3 border border-border-main rounded-lg bg-background-muted/20">
                    <span className="text-text-muted block">Hostile IPs Blocked</span>
                    <span className="text-lg font-bold font-mono text-brand-critical">842 Endpoints</span>
                  </div>
                </div>
              </div>

              <div className="p-3 border border-border-main rounded-lg bg-background-muted/10 space-y-2">
                <span className="text-[10px] uppercase font-mono font-bold text-text-muted block">Incident Triage Distribution</span>
                <div className="space-y-1.5 font-mono text-[11px] text-text-muted">
                  <div className="flex justify-between">
                    <span>Credential Spoofing / Session Hijacking</span>
                    <span className="font-bold text-brand-critical">42 Alerts</span>
                  </div>
                  <div className="flex justify-between">
                    <span>UEBA Behavioral Anomalies / Travel Spikes</span>
                    <span className="font-bold text-brand-high">128 Alerts</span>
                  </div>
                  <div className="flex justify-between">
                    <span>JIT / Firecall Policy Violations</span>
                    <span className="font-bold text-brand-warning">14 Alerts</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeReportTab === "compliance" && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-lg flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-brand-success shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-text-main">Audit Certifications Verified</h4>
                  <p className="text-text-muted leading-relaxed">
                    All database operations and privileged access request records are signed using cryptographically un-falsifiable blockchain ledger hashes. No database tampers detected in the current audit period.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] uppercase font-mono font-bold text-text-muted block">MFA Compliance Status</span>
                <div className="space-y-2.5">
                  {[
                    { label: "SWIFT Core Transactions subnets", status: "100% Hard FIDO2 Key Enforced", ok: true },
                    { label: "Primary Azure Active Directory Groups", status: "100% Microsoft Authenticator App Enforced", ok: true },
                    { label: "Production Cloud S3 Backup buckets", status: "Disabled / Static API token used (Risk point)", ok: false }
                  ].map((rule, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 border border-border-main rounded bg-background-muted/25">
                      <span className="font-medium text-text-main">{rule.label}</span>
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${rule.ok ? "bg-emerald-500/10 text-brand-success" : "bg-red-500/10 text-brand-critical"}`}>
                        {rule.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Audit sealing certification line */}
        <div className="mt-8 pt-4 border-t border-border-main text-[10px] text-text-muted font-mono flex items-center justify-between">
          <span>Enclave Signature: PRIVGUARD_CRYPT_LOCK_SECURE_v4</span>
          <span className="flex items-center gap-1 text-brand-success">
            <ShieldCheck className="w-3.5 h-3.5" />
            COMPLIANT STATUS
          </span>
        </div>

      </div>

    </div>
  );
}
