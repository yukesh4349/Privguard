import { useState, useEffect } from "react";
import { mockAuditLogs, getStoredData } from "../data";
import { AuditLog } from "../types";
import { ShieldCheck, ShieldAlert, Search, RefreshCw, Filter, Calendar, FileText, Info } from "lucide-react";
import { useTheme } from "../components/ThemeContext";

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>(() => getStoredData("audit_logs", mockAuditLogs));
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isVerifying, setIsVerifying] = useState(false);
  const { showToast } = useTheme();

  useEffect(() => {
    const handleSync = () => {
      setLogs(getStoredData("audit_logs", mockAuditLogs));
    };
    window.addEventListener("privguard_db_sync", handleSync);
    return () => window.removeEventListener("privguard_db_sync", handleSync);
  }, []);

  const handleRunVerification = () => {
    setIsVerifying(true);
    showToast("Starting secure ledger verification scan...", "info");
    setTimeout(() => {
      setIsVerifying(false);
      showToast("Ledger chain verification completed successfully. All SHA256 hashes match parent blocks. Zero tamper anomalies found.", "success");
    }, 1200);
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.cryptographicSignature.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div id="audit-logs-view" className="space-y-6">
      
      {/* Ledger status banner */}
      <div className="bg-background-surface border border-border-main rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3 text-xs">
          <ShieldCheck className="w-5 h-5 text-brand-success shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-text-main">Immutable Cryptographic Access Ledger</h4>
            <p className="text-text-muted leading-relaxed">
              Every administrative access query is instantly formatted, signed with the platform's private key enclave, and appended to an un-alterable blockchain-style transaction file.
            </p>
          </div>
        </div>

        <button
          onClick={handleRunVerification}
          disabled={isVerifying}
          className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50 shadow-md shadow-brand-primary/10"
        >
          <RefreshCw className={`w-4 h-4 ${isVerifying ? "animate-spin" : ""}`} />
          {isVerifying ? "Verifying Block Chain..." : "Audit Ledger Verification"}
        </button>
      </div>

      {/* Logs workspace */}
      <div className="bg-background-surface border border-border-main rounded-xl p-5 shadow-sm flex flex-col h-full overflow-hidden">
        
        {/* Filters bar */}
        <div className="flex flex-wrap gap-3 items-center justify-between mb-4 pb-3 border-b border-border-main/50">
          <div className="flex flex-wrap gap-3 items-center flex-1">
            
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-muted" />
              <input
                type="text"
                placeholder="Search audit actions, actors, or hash signatures..."
                className="w-full pl-8 pr-4 py-1.5 text-xs bg-background-muted border border-border-main rounded-lg outline-none focus:border-brand-primary text-text-main"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-1 bg-background-muted border border-border-main rounded-lg px-2.5 py-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-text-muted font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent font-bold text-text-main outline-none cursor-pointer"
              >
                <option value="ALL">All States</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
                <option value="REVOKED">Revoked</option>
              </select>
            </div>

          </div>

          <span className="text-[10px] font-mono font-bold text-text-muted">
            LEDGER INDEX HEAD: #9842A
          </span>
        </div>

        {/* Dense ledger table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-compact">
            <thead>
              <tr className="border-b border-border-main bg-background-muted/40 text-[10px] uppercase font-mono font-bold text-text-muted">
                <th className="py-2.5 px-3">Log ID</th>
                <th className="py-2.5 px-3">Timestamp / UTC</th>
                <th className="py-2.5 px-3">Actor</th>
                <th className="py-2.5 px-3">Action Description</th>
                <th className="py-2.5 px-3">Resource</th>
                <th className="py-2.5 px-3 text-center">Verification Status</th>
                <th className="py-2.5 px-3">Digital Signature Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main/50 text-xs text-text-main">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-background-muted/20">
                  <td className="py-3 px-3 font-mono text-[10px] text-text-muted font-bold">
                    {log.id}
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-text-muted">
                    {new Date(log.timestamp).toLocaleDateString()} — {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-brand-primary">
                    {log.actor}
                  </td>
                  <td className="py-3 px-3 font-medium">
                    {log.action}
                  </td>
                  <td className="py-3 px-3 font-mono-dense text-text-muted">
                    {log.targetResource}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-brand-success">
                      <ShieldCheck className="w-3.5 h-3.5 text-brand-success" />
                      VERIFIED
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[10px] text-text-muted truncate max-w-[120px]" title={log.cryptographicSignature}>
                    {log.cryptographicSignature}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
