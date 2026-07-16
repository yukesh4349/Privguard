import { useState, useEffect } from "react";
import { mockActiveSessions, getStoredData, setStoredData } from "../data";
import { ActiveSession } from "../types";
import { Terminal, ShieldAlert, ShieldCheck, Globe, Clock, Ban, Radio, Info, Search, Power } from "lucide-react";
import { useTheme } from "../components/ThemeContext";

export function ActiveSessions() {
  const [sessions, setSessions] = useState<ActiveSession[]>(() => getStoredData("active_sessions", mockActiveSessions));
  const [searchQuery, setSearchQuery] = useState("");
  const { askConfirm, showToast } = useTheme();

  useEffect(() => {
    const handleSync = () => {
      setSessions(getStoredData("active_sessions", mockActiveSessions));
    };
    window.addEventListener("privguard_db_sync", handleSync);
    return () => window.removeEventListener("privguard_db_sync", handleSync);
  }, []);

  const saveSessions = (newSessions: ActiveSession[]) => {
    setSessions(newSessions);
    setStoredData("active_sessions", newSessions);
  };

  const handleTerminate = (sessionId: string, username: string) => {
    askConfirm({
      title: "Forcible Session Termination",
      message: `CRITICAL SOC COMMAND: Are you sure you want to forcibly terminate active session ${sessionId} for user @${username}? This will immediately revoke access cookies, flush browser storage, and trigger credential rotation.`,
      confirmText: "Terminate Session",
      cancelText: "Keep Active",
      onConfirm: () => {
        const remaining = sessions.filter((s) => s.id !== sessionId);
        saveSessions(remaining);
        showToast(`Session ${sessionId} has been successfully revoked and killed across Active Directory and microservice API proxies.`, "success");
      }
    });
  };

  const filteredSessions = sessions.filter(s => 
    s.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.ipAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.resourceAccessed.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="active-sessions-view" className="space-y-6">
      
      {/* Informational Warning */}
      <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-xs text-brand-critical">
        <ShieldAlert className="w-5 h-5 text-brand-critical shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold">Real-Time Privileged Session Telemetry</h4>
          <p className="text-text-muted leading-relaxed">
            Active connections listed below are authenticated into high-value database arrays, directory services, and financial networks. Terminating a session immediately revokes access cookies, flushes the user's browser storage, and triggers a full credential rotation request.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT TWO COLUMNS: Active Sessions Table */}
        <div className="lg:col-span-2 bg-background-surface border border-border-main rounded-xl p-5 shadow-sm flex flex-col h-full">
          <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-text-main flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-brand-primary animate-pulse" />
                Live Handshake Registry ({sessions.length})
              </h3>
              <p className="text-xs text-text-muted">Currently active cryptographic connections to secure enclaves</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search active IP, user, target..."
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-background-muted border border-border-main rounded-lg outline-none focus:border-brand-primary text-text-main"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-compact">
              <thead>
                <tr className="border-b border-border-main bg-background-muted/40 text-[10px] uppercase font-mono font-bold text-text-muted">
                  <th className="py-2.5 px-3">Session ID</th>
                  <th className="py-2.5 px-3">Identity User</th>
                  <th className="py-2.5 px-3">Origin / Location</th>
                  <th className="py-2.5 px-3 text-center">MFA</th>
                  <th className="py-2.5 px-3 text-center">Risk</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main/50 text-xs">
                {filteredSessions.length > 0 ? (
                  filteredSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-background-muted/20">
                      <td className="py-3.5 px-3 font-mono text-[11px] text-text-muted">
                        {session.id}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-text-main">@{session.username}</div>
                        <span className="text-[10px] font-mono text-text-muted">{session.device.split(" (")[0]}</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-text-main">{session.ipAddress}</div>
                        <span className="text-[10px] text-text-muted flex items-center gap-1">
                          <Globe className="w-3 h-3 text-text-muted" />
                          {session.country}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${session.hasMfaVerified ? "bg-green-500/10 text-brand-success" : "bg-red-500/10 text-brand-critical"}`}>
                          {session.hasMfaVerified ? "PASSED" : "BYPASSED"}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono font-black">
                        <span className={session.riskScore >= 80 ? "text-brand-critical" : session.riskScore >= 60 ? "text-brand-high" : "text-brand-success"}>
                          {session.riskScore}%
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => handleTerminate(session.id, session.username)}
                          className="px-2.5 py-1 text-[10px] font-bold bg-red-500/10 hover:bg-red-600 hover:text-white text-brand-critical rounded border border-red-500/15 transition-all flex items-center gap-1 ml-auto"
                        >
                          <Power className="w-3 h-3" />
                          Kill
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-text-muted font-medium">
                      No active sessions match the current query criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Command Stream Console */}
        <div className="bg-[#020617] text-slate-100 rounded-xl p-4 shadow-sm border border-slate-900 flex flex-col h-[400px]">
          <div className="flex justify-between items-center pb-2 border-b border-slate-900 mb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4.5 h-4.5 text-brand-primary" />
              <span className="text-xs font-bold font-mono tracking-wider text-slate-300">COMMAND AUDIT STREAM</span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          </div>

          <div className="flex-1 overflow-y-auto font-mono text-[10px] text-brand-success leading-relaxed space-y-2 pr-1 font-mono-dense">
            <p className="text-slate-500">// UTC: 2026-07-15 22:37:16</p>
            <p className="text-slate-500">[SYSTEM] Hooked terminal telemetry streams on active DB clusters...</p>
            
            <p className="text-slate-300">
              <strong className="text-brand-primary">@adm_j_smith</strong>: CONNECT TO PROD-DB-CLUSTER-01
            </p>
            <p className="text-slate-500">➜ Status: AUTHENTICATED [MFA BYPASSED - Session Hijack flag]</p>
            
            <p className="text-slate-300">
              <strong className="text-brand-primary">@adm_j_smith</strong>: SELECT * FROM Credit_Card_Numbers LIMIT 100000;
            </p>
            <p className="text-red-500">⚠️ WARN: Query size deviates 4,500% from user's historical 30d baseline.</p>
            <p className="text-red-500">🚨 ALERT: Threat AL-1001 issued. Event logged to signed blockchain ledger.</p>

            <p className="text-slate-300">
              <strong className="text-brand-primary">@svc_billing_prod</strong>: GET aws-s3-financial-dump-09/archive-jul2026.tar.gz
            </p>
            <p className="text-slate-500">➜ Status: EXPORTING [420 GB transferred. Flagged: Anomaly Volume]</p>

            <p className="text-slate-300">
              <strong className="text-brand-primary">@dev_alex_k</strong>: query_ad_schema --trust-relations --local-forest
            </p>
            <p className="text-amber-500">⚠️ ANOMALY: Alex Kincaid workstation query executed on CORP-DC-01. Mapped: Lateral movement reconnaissance.</p>

            <p className="text-slate-500">[SYSTEM] Sentinel engine holding lock validations. Waiting SOC command...</p>
          </div>

          <div className="pt-3 border-t border-slate-900 flex justify-between items-center text-[9px] text-slate-500 font-mono">
            <span>Ledger Index: #41285</span>
            <span>Rate: 14 logs/sec</span>
          </div>
        </div>

      </div>

    </div>
  );
}
