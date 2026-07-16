import { useState, useMemo, useEffect } from "react";
import { mockThreatAlerts, getStoredData, setStoredData } from "../data";
import { ThreatAlert, RiskLevel, ThreatStatus } from "../types";
import { Search, Filter, ArrowUpDown, ChevronDown, Download, Eye, ShieldAlert, BadgeAlert, AlertTriangle, User, Calendar, Network, FileText, Check, Layers, AlertCircle, Bot, X, Sparkles, UserPlus } from "lucide-react";
import { useTheme } from "../components/ThemeContext";

interface ThreatFeedProps {
  selectedAlertId: string | null;
  onCloseDrawer: () => void;
  onSelectAlert: (alertId: string) => void;
}

export function ThreatFeed({ selectedAlertId, onCloseDrawer, onSelectAlert }: ThreatFeedProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<keyof ThreatAlert>("riskScore");
  const [sortAscending, setSortAscending] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const { askConfirm, showToast } = useTheme();

  // Column visibility states
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    title: true,
    actor: true,
    riskScore: true,
    category: true,
    timestamp: true,
    status: true,
    affectedAsset: true,
    mitreTactic: true,
    assignedAnalyst: true,
    sourceIp: true,
    geoCountry: true
  });

  const [showColumnChooser, setShowColumnChooser] = useState(false);

  // Dynamic alert data modification simulation (assigned analysts, status change)
  const [alerts, setAlerts] = useState<ThreatAlert[]>([]);

  useEffect(() => {
    import('../services/api').then(m => m.api.getAlerts()).then(data => {
      setAlerts(data);
    }).catch(console.error);

    const handleSync = () => {
      // Data synchronization left intact for other local storage mock elements if any
    };
    window.addEventListener("privguard_db_sync", handleSync);
    return () => window.removeEventListener("privguard_db_sync", handleSync);
  }, []);

  const saveAlerts = (newAlerts: ThreatAlert[]) => {
    setAlerts(newAlerts);
    setStoredData("threat_alerts", newAlerts);
  };

  // Computed alerts matching query and filters
  const processedAlerts = useMemo(() => {
    let result = [...alerts];

    // Text search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(alert => 
        alert.title.toLowerCase().includes(query) ||
        alert.actor.toLowerCase().includes(query) ||
        alert.affectedAsset.toLowerCase().includes(query) ||
        alert.category.toLowerCase().includes(query) ||
        alert.id.toLowerCase().includes(query)
      );
    }

    // Risk level filter
    if (selectedRiskFilter !== "ALL") {
      result = result.filter(alert => alert.riskLevel === selectedRiskFilter);
    }

    // Status filter
    if (selectedStatusFilter !== "ALL") {
      result = result.filter(alert => alert.status === selectedStatusFilter);
    }

    // Sort execution
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal < bVal) return sortAscending ? -1 : 1;
      if (aVal > bVal) return sortAscending ? 1 : -1;
      return 0;
    });

    return result;
  }, [alerts, searchQuery, selectedRiskFilter, selectedStatusFilter, sortField, sortAscending]);

  // Paginated elements
  const paginatedAlerts = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return processedAlerts.slice(startIdx, startIdx + itemsPerPage);
  }, [processedAlerts, currentPage]);

  const totalPages = Math.ceil(processedAlerts.length / itemsPerPage) || 1;

  const handleSort = (field: keyof ThreatAlert) => {
    if (sortField === field) {
      setSortAscending(!sortAscending);
    } else {
      setSortField(field);
      setSortAscending(false);
    }
  };

  const selectedAlert = useMemo(() => {
    return alerts.find(a => a.id === selectedAlertId) || null;
  }, [alerts, selectedAlertId]);

  const handleAssignAnalyst = (alertId: string, analystName: string) => {
    saveAlerts(alerts.map(a => a.id === alertId ? { ...a, assignedAnalyst: analystName } : a));
  };

  const handleChangeStatus = (alertId: string, newStatus: ThreatStatus) => {
    saveAlerts(alerts.map(a => a.id === alertId ? { ...a, status: newStatus } : a));
  };

  // CSV Compiler
  const handleExportCSV = () => {
    showToast("Compiling active Threat intelligence table... verifying cryptographic ledger signatures.", "info");
    setTimeout(() => {
      showToast("Download initiated for 'privguard_incident_feed.csv'.", "success");
    }, 1500);
  };

  return (
    <div id="threat-feed-container" className="relative flex h-full">
      
      {/* 1. MASTER TABLE PANEL */}
      <div className={`flex-1 transition-all duration-300 ${selectedAlertId ? "lg:mr-[440px]" : ""}`}>
        <div className="bg-background-surface border border-border-main rounded-xl shadow-sm flex flex-col h-full overflow-hidden">
          
          {/* Controls Bar: Search, Filters, Export, Column Selector */}
          <div className="p-4 border-b border-border-main flex flex-wrap gap-4 items-center justify-between bg-background-surface/50">
            <div className="flex flex-wrap gap-3 items-center flex-1 min-w-[320px]">
              
              {/* Dynamic search input */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Filter alerts by name, actor, device..."
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-background-muted border border-border-main rounded-lg outline-none focus:border-brand-primary text-text-main"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Risk Filter choice */}
              <div className="flex items-center gap-1 bg-background-muted border border-border-main rounded-lg px-2 py-1 text-xs">
                <Filter className="w-3.5 h-3.5 text-text-muted" />
                <span className="text-text-muted font-medium">Risk:</span>
                <select 
                  className="bg-transparent font-bold text-text-main outline-none cursor-pointer"
                  value={selectedRiskFilter}
                  onChange={(e) => setSelectedRiskFilter(e.target.value)}
                >
                  <option value="ALL">All Levels</option>
                  <option value={RiskLevel.CRITICAL}>Critical Only</option>
                  <option value={RiskLevel.HIGH}>High Level</option>
                  <option value={RiskLevel.MEDIUM}>Medium Level</option>
                  <option value={RiskLevel.LOW}>Low Level</option>
                </select>
              </div>

              {/* Status Filter choice */}
              <div className="flex items-center gap-1 bg-background-muted border border-border-main rounded-lg px-2 py-1 text-xs">
                <span className="text-text-muted font-medium">Status:</span>
                <select 
                  className="bg-transparent font-bold text-text-main outline-none cursor-pointer"
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value={ThreatStatus.ACTIVE}>Active</option>
                  <option value={ThreatStatus.INVESTIGATING}>Investigating</option>
                  <option value={ThreatStatus.RESOLVED}>Resolved</option>
                  <option value={ThreatStatus.CONTAINED}>Contained</option>
                </select>
              </div>

            </div>

            {/* Right side controls */}
            <div className="flex gap-2 items-center">
              
              {/* Columns Selector Dropdown Trigger */}
              <div className="relative">
                <button
                  onClick={() => setShowColumnChooser(!showColumnChooser)}
                  className="text-xs px-3 py-1.5 border border-border-main hover:bg-background-muted rounded-lg flex items-center gap-1.5 transition-colors font-medium text-text-main"
                >
                  Columns
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                
                {showColumnChooser && (
                  <div className="absolute right-0 mt-2 w-48 bg-background-surface border border-border-main rounded-lg shadow-lg z-30 p-2.5 text-xs space-y-1.5">
                    <p className="font-bold text-[10px] text-text-muted uppercase tracking-wider mb-1.5">Visible Fields</p>
                    {Object.keys(visibleColumns).map((col) => (
                      <label key={col} className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={visibleColumns[col as keyof typeof visibleColumns]}
                          onChange={() => setVisibleColumns(prev => ({ ...prev, [col]: !prev[col as keyof typeof visibleColumns] }))}
                          className="rounded text-brand-primary w-3.5 h-3.5"
                        />
                        <span className="font-mono text-[10px] capitalize">{col.replace(/([A-Z])/g, " $1")}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleExportCSV}
                className="text-xs px-3 py-1.5 bg-background-muted hover:bg-border-main border border-border-main rounded-lg flex items-center gap-1.5 transition-colors font-medium text-text-main"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Table Element (High Density) */}
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse table-compact">
              <thead>
                <tr className="border-b border-border-main bg-background-muted/40 text-[10px] uppercase font-mono font-bold text-text-muted select-none">
                  {visibleColumns.id && <th className="py-2.5 px-4">Alert ID</th>}
                  {visibleColumns.riskScore && (
                    <th className="py-2.5 px-4 cursor-pointer hover:text-text-main" onClick={() => handleSort("riskScore")}>
                      <div className="flex items-center gap-1">Score <ArrowUpDown className="w-3 h-3" /></div>
                    </th>
                  )}
                  {visibleColumns.title && <th className="py-2.5 px-4">Threat Title</th>}
                  {visibleColumns.actor && (
                    <th className="py-2.5 px-4 cursor-pointer hover:text-text-main" onClick={() => handleSort("actor")}>
                      <div className="flex items-center gap-1">Actor <ArrowUpDown className="w-3 h-3" /></div>
                    </th>
                  )}
                  {visibleColumns.affectedAsset && <th className="py-2.5 px-4">Affected Asset</th>}
                  {visibleColumns.mitreTactic && <th className="py-2.5 px-4">MITRE Attack</th>}
                  {visibleColumns.sourceIp && <th className="py-2.5 px-4">Source IP</th>}
                  {visibleColumns.status && <th className="py-2.5 px-4">Status</th>}
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main/50 text-xs text-text-main font-sans">
                {paginatedAlerts.length > 0 ? (
                  paginatedAlerts.map((alert) => {
                    const isSelected = selectedAlertId === alert.id;
                    const isCrit = alert.riskLevel === RiskLevel.CRITICAL;
                    const isHigh = alert.riskLevel === RiskLevel.HIGH;

                    return (
                      <tr 
                        key={alert.id}
                        className={`hover:bg-background-muted/30 transition-all ${isSelected ? "bg-brand-primary/5 border-l-4 border-l-brand-primary" : ""}`}
                      >
                        {visibleColumns.id && (
                          <td className="py-3 px-4 font-mono font-bold text-[11px] text-text-muted">
                            {alert.id}
                          </td>
                        )}
                        {visibleColumns.riskScore && (
                          <td className="py-3 px-4">
                            <span className={`font-mono font-black px-1.5 py-0.5 rounded text-[11px] ${isCrit ? "bg-red-500/10 text-brand-critical font-bold" : isHigh ? "bg-orange-500/10 text-brand-high" : "bg-amber-500/10 text-brand-warning"}`}>
                              {alert.riskScore}
                            </span>
                          </td>
                        )}
                        {visibleColumns.title && (
                          <td className="py-3 px-4 max-w-sm truncate font-medium text-text-main">
                            {alert.title}
                          </td>
                        )}
                        {visibleColumns.actor && (
                          <td className="py-3 px-4 font-mono font-semibold text-brand-primary">
                            {alert.actor}
                          </td>
                        )}
                        {visibleColumns.affectedAsset && (
                          <td className="py-3 px-4 font-mono-dense text-text-muted">
                            {alert.affectedAsset}
                          </td>
                        )}
                        {visibleColumns.mitreTactic && (
                          <td className="py-3 px-4 text-[11px] text-text-muted">
                            {alert.mitreTactic.split(" (")[0]}
                          </td>
                        )}
                        {visibleColumns.sourceIp && (
                          <td className="py-3 px-4 font-mono text-[11px] text-text-muted">
                            {alert.sourceIp}
                          </td>
                        )}
                        {visibleColumns.status && (
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              alert.status === ThreatStatus.ACTIVE ? "bg-red-500/10 text-brand-critical border-red-500/20" :
                              alert.status === ThreatStatus.INVESTIGATING ? "bg-orange-500/10 text-brand-high border-orange-500/20" :
                              alert.status === ThreatStatus.CONTAINED ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                              "bg-emerald-500/10 text-brand-success border-emerald-500/20"
                            }`}>
                              {alert.status}
                            </span>
                          </td>
                        )}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => onSelectAlert(alert.id)}
                            className="text-xs px-2 py-1 bg-background-muted border border-border-main hover:bg-brand-primary hover:text-white rounded transition-all font-semibold inline-flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-xs text-text-muted font-medium">
                      No threat incidents match the current criteria parameters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Simple Pagination Footer */}
          <div className="p-3 border-t border-border-main flex justify-between items-center text-xs bg-background-muted/20">
            <span className="text-text-muted font-medium">
              Showing <span className="font-bold text-text-main">{processedAlerts.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-text-main">{Math.min(currentPage * itemsPerPage, processedAlerts.length)}</span> of <span className="font-bold text-text-main">{processedAlerts.length}</span> security alerts
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="px-2.5 py-1 border border-border-main rounded bg-background-surface hover:bg-background-muted text-text-main font-semibold disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="px-2.5 py-1 border border-border-main rounded bg-background-surface hover:bg-background-muted text-text-main font-semibold disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* 2. RIGHT SLIDEOUT INCIDENT DRAWER */}
      {selectedAlert && (
        <div className="fixed lg:absolute top-0 right-0 bottom-0 w-full sm:w-[440px] bg-background-surface border-l border-border-main shadow-2xl z-40 flex flex-col h-full transform transition-transform duration-300">
          
          {/* Drawer Header */}
          <div className="p-4 border-b border-border-main flex items-center justify-between bg-background-muted/40">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-brand-critical animate-pulse" />
              <div>
                <span className="font-mono text-[10px] font-bold text-text-muted uppercase">Incident Audit — {selectedAlert.id}</span>
                <h4 className="font-extrabold text-sm text-text-main">Analyst File Inspection</h4>
              </div>
            </div>
            <button
              onClick={onCloseDrawer}
              className="p-1 text-text-muted hover:text-text-main hover:bg-background-muted rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            
            {/* Title & Risk Gauge */}
            <div className="space-y-2">
              <h3 className="font-bold text-sm text-text-main leading-snug">{selectedAlert.title}</h3>
              
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 border border-border-main rounded-lg bg-background-muted/40">
                  <span className="text-[10px] text-text-muted block font-medium">Criticality Score</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xl font-black text-brand-critical font-mono leading-none">{selectedAlert.riskScore}%</span>
                    <span className="text-[9px] uppercase font-bold text-brand-critical font-mono">[{selectedAlert.riskLevel}]</span>
                  </div>
                </div>

                <div className="p-2.5 border border-border-main rounded-lg bg-background-muted/40">
                  <span className="text-[10px] text-text-muted block font-medium">State status</span>
                  <div className="relative mt-1">
                    <select
                      value={selectedAlert.status}
                      onChange={(e) => handleChangeStatus(selectedAlert.id, e.target.value as ThreatStatus)}
                      className="font-bold text-xs text-text-main bg-transparent outline-none cursor-pointer w-full"
                    >
                      <option value={ThreatStatus.ACTIVE}>🔴 Active</option>
                      <option value={ThreatStatus.INVESTIGATING}>🟠 Investigating</option>
                      <option value={ThreatStatus.CONTAINED}>🔵 Contained</option>
                      <option value={ThreatStatus.RESOLVED}>🟢 Resolved</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* MITRE ATT&CK Mapping */}
            <div className="p-3 border border-border-main rounded-lg bg-background-muted/25 space-y-1.5">
              <span className="text-[9px] uppercase font-mono font-bold text-text-muted tracking-wider block">MITRE ATT&CK Matrix classification</span>
              <div className="flex items-center gap-2">
                <BadgeAlert className="w-4 h-4 text-brand-high" />
                <span className="text-xs font-bold text-text-main font-mono">{selectedAlert.mitreTactic}</span>
              </div>
              <p className="text-[10px] text-text-muted">
                System mapped lateral movement, privilege elevation, and suspicious API credential abuse vectors automatically.
              </p>
            </div>

            {/* Incident Summary */}
            <div className="space-y-1.5">
              <span className="text-[9px] uppercase font-mono font-bold text-text-muted tracking-wider block">Incident Forensic Summary</span>
              <p className="text-xs leading-relaxed text-text-muted">{selectedAlert.description}</p>
            </div>

            {/* AI Explanation Box */}
            <div className="p-3 border border-brand-primary/25 rounded-lg bg-blue-500/5 relative overflow-hidden space-y-2">
              <div className="absolute top-2 right-2 text-brand-primary opacity-20">
                <Bot className="w-12 h-12 stroke-1" />
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
                <span className="text-[10px] font-bold text-brand-primary font-mono uppercase">AI Security Copilot Insight</span>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed">
                The compromised credential is linked to GPO escalation path **node-role-db-admin** to Domain Admin. The session is operating via a Proxy VPN.
              </p>
            </div>

            {/* Affected Assets & Location */}
            <div className="space-y-2.5">
              <span className="text-[9px] uppercase font-mono font-bold text-text-muted tracking-wider block">Affected Asset & Ingress Telemetry</span>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 border border-border-main rounded-md">
                  <span className="text-[9px] text-text-muted block">Identity Actor</span>
                  <span className="font-semibold text-text-main font-mono">{selectedAlert.actor}</span>
                </div>
                <div className="p-2 border border-border-main rounded-md">
                  <span className="text-[9px] text-text-muted block">Asset Endpoint</span>
                  <span className="font-semibold text-text-main font-mono">{selectedAlert.affectedAsset}</span>
                </div>
                <div className="p-2 border border-border-main rounded-md">
                  <span className="text-[9px] text-text-muted block">Source IP Address</span>
                  <span className="font-semibold text-text-main font-mono">{selectedAlert.sourceIp}</span>
                </div>
                <div className="p-2 border border-border-main rounded-md">
                  <span className="text-[9px] text-text-muted block">Geographical Origin</span>
                  <span className="font-semibold text-text-main font-mono">{selectedAlert.geoCountry}</span>
                </div>
              </div>
            </div>

            {/* Evidence & Files */}
            <div className="space-y-2">
              <span className="text-[9px] uppercase font-mono font-bold text-text-muted tracking-wider block">Evidentiary File Attachments ({selectedAlert.evidenceCount})</span>
              <div className="space-y-1.5">
                {[
                  "system_secure_terminal_traffic.pcap",
                  "active_directory_gpo_audit_dump.csv",
                  "terminal_commands_shell_history.log"
                ].map((file, fidx) => (
                  <div key={fidx} className="flex items-center justify-between p-2 border border-border-main rounded bg-background-muted/40 text-xs">
                    <span className="font-mono text-[10px] text-text-main truncate max-w-[280px]">{file}</span>
                    <button className="text-[10px] font-bold text-brand-primary hover:underline">Download</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Assigned Analyst Selector */}
            <div className="space-y-1.5 pt-2 border-t border-border-main">
              <span className="text-[9px] uppercase font-mono font-bold text-text-muted tracking-wider block">Assigned SOC Analyst</span>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-text-muted" />
                <select
                  value={selectedAlert.assignedAnalyst}
                  onChange={(e) => handleAssignAnalyst(selectedAlert.id, e.target.value)}
                  className="font-bold text-xs text-text-main bg-transparent outline-none cursor-pointer border border-border-main rounded-lg p-1.5 w-full bg-background-surface"
                >
                  <option value="Sarah Jenkins (Tier 3 SOC)">Sarah Jenkins (Tier 3 SOC)</option>
                  <option value="Marcus Vance (Tier 2 SOC)">Marcus Vance (Tier 2 SOC)</option>
                  <option value="Emily Cooper (Tier 1 SOC)">Emily Cooper (Tier 1 SOC)</option>
                  <option value="Unassigned">Unassigned</option>
                </select>
              </div>
            </div>

          </div>

          {/* Drawer Actions Footer */}
          <div className="p-4 border-t border-border-main bg-background-muted/40 space-y-2">
            <button
              onClick={() => {
                askConfirm({
                  title: "Enforce Endpoint Containment",
                  message: `Are you sure you want to enforce containment for asset "${selectedAlert.affectedAsset}"? This immediately updates boundary firewall drop tables, blocks internal routing, and revokes credentials for actor @${selectedAlert.actor}.`,
                  confirmText: "Enforce Quarantine",
                  cancelText: "Cancel",
                  onConfirm: () => {
                    showToast(`Containment script successfully executed. Network quarantined for ${selectedAlert.affectedAsset}.`, "success");
                    handleChangeStatus(selectedAlert.id, ThreatStatus.CONTAINED);
                  }
                });
              }}
              className="w-full text-xs py-2.5 bg-brand-critical hover:bg-red-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-red-500/10"
            >
              <AlertCircle className="w-4 h-4" />
              Auto-Isolate Asset Network
            </button>
            <p className="text-[9px] text-text-muted text-center leading-relaxed">
              Applying containment will isolate the VM host in the firewalls and freeze connected active operational authorization cookies.
            </p>
          </div>

        </div>
      )}

    </div>
  );
}
