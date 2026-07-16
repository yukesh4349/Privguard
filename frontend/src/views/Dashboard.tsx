import { useState, useEffect } from "react";
import { mockThreatAlerts, departmentRisks, mockPrivilegedUsers, getStoredData } from "../data";
import { RiskLevel, ThreatStatus } from "../types";
import { Shield, ShieldAlert, Users, Ban, Radio, Layers, Server, Activity, ArrowUpRight, TrendingUp, Cpu, Globe, ArrowRight, Zap, CheckCircle2 } from "lucide-react";
import { useTheme } from "../components/ThemeContext";

interface DashboardProps {
  onNavigate: (viewId: string) => void;
  onSelectAlert: (alertId: string) => void;
}

export function Dashboard({ onNavigate, onSelectAlert }: DashboardProps) {
  const { askConfirm, showToast } = useTheme();

  // Unified synchronized databases for dynamic metrics
  const [alerts, setAlerts] = useState<any[]>([]);
  const [users, setUsers] = useState(() => getStoredData("privileged_users", mockPrivilegedUsers));
  const [sessions, setSessions] = useState(() => getStoredData("active_sessions", []));
  const [cases, setCases] = useState(() => getStoredData("investigation_cases", []));

  useEffect(() => {
    import('../services/api').then(m => m.api.getAlerts()).then(data => {
      setAlerts(data);
    }).catch(console.error);

    const handleSync = () => {
      setUsers(getStoredData("privileged_users", mockPrivilegedUsers));
      setSessions(getStoredData("active_sessions", []));
      setCases(getStoredData("investigation_cases", []));
    };
    window.addEventListener("privguard_db_sync", handleSync);
    return () => window.removeEventListener("privguard_db_sync", handleSync);
  }, []);

  // Compute dynamic KPI values
  const activeThreatsCount = alerts.length;
  const privilegedUsersCount = users.length;
  const criticalIncidentsCount = alerts.filter(a => a.riskLevel === RiskLevel.CRITICAL).length;
  const averageRiskScore = alerts.length > 0 ? Math.round(alerts.reduce((acc, a) => acc + a.riskScore, 0) / alerts.length) : 0;
  const activeCasesCount = cases.length;
  const activeSessionsCount = sessions.length;
  
  // Custom simple vector Sparkline to look extremely polished
  const renderMiniSparkline = (points: number[], color: string) => {
    const width = 120;
    const height = 30;
    const maxVal = Math.max(...points);
    const minVal = Math.min(...points);
    const spread = maxVal - minVal || 1;
    
    const svgPoints = points
      .map((p, idx) => {
        const x = (idx / (points.length - 1)) * width;
        const y = height - ((p - minVal) / spread) * height;
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-16 h-8 opacity-80 overflow-visible">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={svgPoints}
        />
        <circle
          cx={width}
          cy={height - ((points[points.length - 1] - minVal) / spread) * height}
          r="3"
          fill={color}
        />
      </svg>
    );
  };

  return (
    <div id="dashboard-view-container" className="space-y-6">
      
      {/* 1. TOP KPI Row - High Information Density Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3.5">
        {[
          { title: "Active Threats", val: activeThreatsCount.toString(), change: activeThreatsCount > 0 ? "+12%" : "Stable", status: "up", color: "text-brand-critical border-red-500/20 bg-red-500/5", points: activeThreatsCount > 0 ? [2, 3, 1, 4, 3, activeThreatsCount] : [0, 0, 0], icon: <ShieldAlert className="w-4 h-4 text-brand-critical" />, pulse: activeThreatsCount > 0 },
          { title: "Privileged Users", val: privilegedUsersCount.toString(), change: privilegedUsersCount > 0 ? "+2.4%" : "0", status: "up", color: "text-brand-primary border-blue-500/10 bg-blue-500/5", points: privilegedUsersCount > 0 ? [810, 815, 824, 830, 835, privilegedUsersCount] : [0, 0, 0], icon: <Users className="w-4 h-4 text-brand-primary" /> },
          { title: "Critical Incidents", val: criticalIncidentsCount.toString(), change: criticalIncidentsCount > 0 ? "Elevated" : "Pristine", status: "stable", color: criticalIncidentsCount > 0 ? "text-brand-critical border-red-500/30 bg-red-950/10" : "text-brand-success border-border-main bg-background-muted/40", points: [criticalIncidentsCount, criticalIncidentsCount], icon: <Radio className={criticalIncidentsCount > 0 ? "w-4 h-4 text-brand-critical animate-pulse" : "w-4 h-4 text-brand-success"} />, pulse: criticalIncidentsCount > 0 },
          { title: "Average Risk Score", val: averageRiskScore > 0 ? `${averageRiskScore}%` : "0%", change: averageRiskScore > 50 ? "+4.1%" : "Safe", status: "down", color: averageRiskScore > 75 ? "text-brand-critical" : averageRiskScore > 40 ? "text-brand-warning border-amber-500/10 bg-amber-500/5" : "text-brand-success border-emerald-500/10 bg-emerald-500/5", points: [60, 62, averageRiskScore], icon: <TrendingUp className="w-4 h-4 text-brand-warning" /> },
          { title: "Blocked Sessions", val: activeSessionsCount > 0 ? (activeSessionsCount + 138).toString() : "0", change: activeSessionsCount > 0 ? "+48" : "0", status: "up", color: "text-brand-success border-emerald-500/10 bg-emerald-500/5", points: activeSessionsCount > 0 ? [90, 101, 110, 125, 138, 138 + activeSessionsCount] : [0, 0], icon: <Ban className="w-4 h-4 text-brand-success" /> },
          { title: "Protected Assets", val: privilegedUsersCount > 0 ? "14,285" : "0", change: privilegedUsersCount > 0 ? "Verified" : "Offline", status: "up", color: "text-text-main border-border-main bg-background-muted/40", points: privilegedUsersCount > 0 ? [14200, 14250, 14285] : [0, 0], icon: <Server className="w-4 h-4 text-text-muted" /> },
          { title: "Security Score", val: activeThreatsCount > 0 ? "88%" : "100%", change: activeThreatsCount > 0 ? "Good" : "Max Safe", status: "up", color: "text-brand-success border-emerald-500/20 bg-emerald-500/5", points: [85, 86, 88, activeThreatsCount > 0 ? 88 : 100], icon: <Shield className="w-4 h-4 text-brand-success" /> }
        ].map((card, idx) => (
          <div 
            key={idx} 
            className={`border rounded-xl p-3 flex flex-col justify-between bg-background-surface shadow-sm relative overflow-hidden`}
          >
            {/* Visual warning flash line */}
            {card.pulse && <div className="absolute top-0 left-0 right-0 h-0.5 bg-brand-critical animate-pulse" />}
            
            <div className="flex justify-between items-start text-xs text-text-muted">
              <span className="font-semibold leading-tight">{card.title}</span>
              {card.icon}
            </div>

            <div className="mt-2.5">
              <span className="text-xl font-black text-text-main font-mono tracking-tight">{card.val}</span>
              <div className="flex justify-between items-center text-[9px] font-mono text-text-muted mt-1.5">
                <span>{card.change}</span>
                {renderMiniSparkline(card.points, card.color.includes("critical") ? "#dc2626" : card.color.includes("success") ? "#16a34a" : "#2563eb")}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 2. MAIN LAYOUT GRID - Dual panels */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* LEFT TWO COLUMNS: Charts & Alerts Map */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Active Threat Timeline Log & Visual Trend Chart */}
          <div className="bg-background-surface border border-border-main rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="font-bold text-sm text-text-main flex items-center gap-1.5">
                  <Activity className="w-4.5 h-4.5 text-brand-primary" />
                  Live Threat Analytics & Forensic Timeline
                </h3>
                <p className="text-xs text-text-muted">Real-time tracking of privileged access violations and anomalous operations</p>
              </div>
              <button 
                className="text-xs font-semibold text-brand-primary hover:underline flex items-center gap-1"
                onClick={() => onNavigate("threats")}
              >
                View Live Feed
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Custom High Density Vector SVG Graph Trend Area */}
            <div className="h-44 border border-border-main/60 bg-background-muted/20 rounded-lg p-3 relative overflow-hidden flex items-end">
              
              {/* Background guidelines */}
              <div className="absolute inset-x-0 top-1/4 border-b border-border-main/40" />
              <div className="absolute inset-x-0 top-2/4 border-b border-border-main/40" />
              <div className="absolute inset-x-0 top-3/4 border-b border-border-main/40" />
              
              <svg className="w-full h-full" viewBox="0 0 500 120" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Area fill */}
                <path
                  d="M 0 120 L 0 90 L 80 110 L 160 50 L 240 85 L 320 20 L 400 65 L 500 10 L 500 120 Z"
                  fill="url(#chart-area-grad)"
                />
                {/* Line graph */}
                <path
                  d="M 0 90 L 80 110 L 160 50 L 240 85 L 320 20 L 400 65 L 500 10"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                />
                {/* Critical incidents overlay spikes */}
                <circle cx="320" cy="20" r="5" fill="#dc2626" className="animate-ping" />
                <circle cx="320" cy="20" r="4.5" fill="#dc2626" />
                
                <circle cx="500" cy="10" r="5" fill="#dc2626" className="animate-ping" />
                <circle cx="500" cy="10" r="4.5" fill="#dc2626" />
              </svg>

              {/* Chart metadata floating badges */}
              <div className="absolute top-2 left-3 text-[9px] font-mono font-medium text-brand-critical bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">
                🔴 PEAK THREAT LEVEL: SWIFT Bypasses Detected
              </div>
              <div className="absolute bottom-2 right-3 text-[9px] font-mono text-text-muted">
                Timeline: 12-Hour Operational Windows
              </div>
            </div>

            {/* List of active alerts */}
            <div className="mt-5 space-y-2.5">
              {alerts.length > 0 ? (
                alerts.slice(0, 3).map((alert) => (
                  <div 
                    key={alert.id}
                    onClick={() => onSelectAlert(alert.id)}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border border-border-main hover:border-brand-primary rounded-lg bg-background-surface hover:bg-background-muted/20 transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 mt-0.5 ${alert.riskLevel === RiskLevel.CRITICAL ? "bg-red-500/10 text-brand-critical border-red-500/20" : "bg-orange-500/10 text-brand-high border-orange-500/20"}`}>
                        {alert.riskLevel} {alert.riskScore}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-text-main group-hover:text-brand-primary transition-colors leading-tight">
                          {alert.title}
                        </h4>
                        <p className="text-[11px] text-text-muted mt-1">
                          Actor: <span className="font-semibold text-text-main font-mono">{alert.actor}</span> | Asset: <span className="font-mono">{alert.affectedAsset}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <span className="text-[10px] text-text-muted font-mono">
                        {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button className="text-[10px] font-bold px-2.5 py-1 bg-background-muted hover:bg-brand-primary hover:text-white rounded border border-border-main group-hover:border-brand-primary transition-all">
                        Analyze
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center border border-dashed border-border-main rounded-lg text-text-muted text-xs">
                  🟢 All baseline services compliant. No outstanding threats detected.
                </div>
              )}
            </div>
          </div>

          {/* Geographical Security Map Tracker */}
          <div className="bg-background-surface border border-border-main rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-sm text-text-main flex items-center gap-1.5">
                  <Globe className="w-4.5 h-4.5 text-blue-500" />
                  Active Geo-Ingress Threat Centers
                </h3>
                <p className="text-xs text-text-muted">Geographical distribution of active hostile sessions and network proxies routing commands</p>
              </div>
              <span className="text-[10px] font-mono font-medium text-brand-primary bg-blue-500/10 px-2 py-0.5 rounded-full">
                AUTOMATED GEOLOCATION ACTIVE
              </span>
            </div>

            {/* Simulated Vector World Map layout with hot centers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Map Illustration Grid */}
              <div className="md:col-span-2 h-44 bg-slate-950 rounded-lg p-3 relative flex items-center justify-center border border-slate-900 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:12px_12px] opacity-40" />
                
                {/* Draw some abstract countries and ping circles */}
                <div className="absolute top-1/4 left-1/4 text-center">
                  <div className="relative flex justify-center">
                    <div className="w-3.5 h-3.5 bg-brand-primary rounded-full animate-ping absolute"></div>
                    <div className="w-2.5 h-2.5 bg-brand-primary rounded-full"></div>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 block mt-1">Dallas HQ</span>
                </div>

                <div className="absolute top-[40%] left-[42%] text-center">
                  <div className="relative flex justify-center">
                    <div className="w-3.5 h-3.5 bg-brand-critical rounded-full animate-ping absolute"></div>
                    <div className="w-2.5 h-2.5 bg-brand-critical rounded-full"></div>
                  </div>
                  <span className="text-[9px] font-mono text-brand-critical block mt-1 font-bold">Munich Node</span>
                </div>

                <div className="absolute top-1/2 right-1/4 text-center">
                  <div className="relative flex justify-center">
                    <div className="w-3.5 h-3.5 bg-brand-warning rounded-full animate-ping absolute"></div>
                    <div className="w-2.5 h-2.5 bg-brand-warning rounded-full"></div>
                  </div>
                  <span className="text-[9px] font-mono text-brand-warning block mt-1">Singapore</span>
                </div>

                <div className="absolute top-[15%] right-[20%] text-center">
                  <div className="relative flex justify-center">
                    <div className="w-3.5 h-3.5 bg-brand-high rounded-full animate-ping absolute"></div>
                    <div className="w-2.5 h-2.5 bg-brand-high rounded-full"></div>
                  </div>
                  <span className="text-[9px] font-mono text-brand-high block mt-1 font-bold">Moscow C2</span>
                </div>

                {/* Cyberpunk grid vectors */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                  <line x1="25%" y1="25%" x2="50%" y2="33%" stroke="#dc2626" strokeWidth="1.5" strokeDasharray="3 3" />
                  <line x1="50%" y1="33%" x2="75%" y2="25%" stroke="#ea580c" strokeWidth="1.5" strokeDasharray="3 3" />
                  <line x1="75%" y1="50%" x2="50%" y2="33%" stroke="#d97706" strokeWidth="1.5" strokeDasharray="3 3" />
                </svg>

                <div className="absolute bottom-2 left-2 bg-slate-900/90 px-2 py-0.5 rounded text-[9px] text-slate-500 font-mono">
                  Live Vector Threat Topology
                </div>
              </div>

              {/* Threat Locations list */}
              <div className="space-y-2 flex flex-col justify-between">
                {[
                  { location: "Munich, Germany", ioc: "185.220.101.42", risk: "Tor Exit Anomaly", threat: "AL-1001" },
                  { location: "Moscow, Russia", ioc: "45.138.89.21", risk: "Known Billing Proxy", threat: "AL-1002" },
                  { location: "Singapore Transit", ioc: "103.45.22.90", risk: "Travel Paradox", threat: "AL-1006" },
                ].map((item, idx) => (
                  <div key={idx} className="p-2.5 border border-border-main bg-background-muted/20 rounded-lg text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-text-main">{item.location}</span>
                      <span className="text-[9px] font-mono bg-red-500/10 text-brand-critical px-1 rounded">{item.threat}</span>
                    </div>
                    <div className="text-[10px] text-text-muted font-mono mt-1">
                      IOC: {item.ioc} | {item.risk}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Engine Health, Department risk, AI Recommendations */}
        <div className="space-y-6">
          
          {/* AI SOC Recommendations Box */}
          <div className="bg-background-surface border border-brand-primary/20 rounded-xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 text-brand-primary opacity-15">
              <Zap className="w-16 h-16 stroke-1" />
            </div>
            
            <h3 className="font-bold text-sm text-text-main flex items-center gap-1.5">
              <Zap className="w-4.5 h-4.5 text-brand-primary animate-bounce" />
              AI Security Copilot Guidance
            </h3>
            <p className="text-xs text-text-muted mb-4">Proactive remediation scripts generated from neural threat graph models</p>

            <div className="space-y-3.5">
              <div className="p-3 bg-blue-500/10 border border-blue-500/15 rounded-lg">
                <span className="text-[9px] uppercase font-mono font-bold text-brand-primary block">CRITICAL MITIGATION</span>
                <p className="text-xs font-bold text-text-main mt-1 leading-tight">Revoke Token and isolate adm_j_smith</p>
                <p className="text-[11px] text-text-muted mt-1">
                  Active session hijacked via Tor node Munich. Terminate session SES-99812 immediately.
                </p>
                <div className="flex gap-2 mt-2.5">
                  <button 
                    className="text-[10px] font-bold text-white bg-brand-primary px-3 py-1 rounded hover:bg-brand-primary/90 transition-colors cursor-pointer"
                    onClick={() => {
                      askConfirm({
                        title: "Trigger Session Revocation",
                        message: "Are you sure you want to trigger immediate session revocation for adm_j_smith across Azure AD and on-prem Active Directory? This will terminate all active database queries and workstations.",
                        confirmText: "Revoke Session",
                        cancelText: "Cancel",
                        onConfirm: () => {
                          showToast("Remediation execution command triggered. Session revoked across directory server enclaves.", "success");
                        }
                      });
                    }}
                  >
                    Auto-Remediate
                  </button>
                  <button 
                    className="text-[10px] font-semibold text-text-main border border-border-main px-2 py-1 rounded hover:bg-background-muted transition-colors cursor-pointer"
                    onClick={() => onNavigate("copilot")}
                  >
                    Consult AI
                  </button>
                </div>
              </div>

              <div className="p-3 bg-orange-500/10 border border-orange-500/15 rounded-lg">
                <span className="text-[9px] uppercase font-mono font-bold text-brand-high block">COMPLIANCE RISK</span>
                <p className="text-xs font-bold text-text-main mt-1 leading-tight">Enable S3 Hourly Limit Rule (POL-304)</p>
                <p className="text-[11px] text-text-muted mt-1">
                  Billing account download volume exceeded baseline. Enable Policy 304 to automatically trigger security barriers.
                </p>
                <button 
                  className="text-[10px] font-bold text-brand-high bg-orange-500/15 px-3 py-1 rounded hover:bg-orange-500/25 transition-colors mt-2.5 cursor-pointer"
                  onClick={() => {
                    askConfirm({
                      title: "Enable Security Policy",
                      message: "You are activating Policy POL-304 (Out-of-Hours Mass S3 Downloads Limit). This immediately configures AWS IAM and alerts on subsequent violations. Proceed?",
                      confirmText: "Enable Policy",
                      cancelText: "Cancel",
                      onConfirm: () => {
                        showToast("GPO Access Policy POL-304 successfully updated to ENABLED state.", "success");
                      }
                    });
                  }}
                >
                  Activate Rule
                </button>
              </div>
            </div>
          </div>

          {/* Department Risk Indices */}
          <div className="bg-background-surface border border-border-main rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-sm text-text-main mb-3.5 flex items-center gap-1.5">
              <Layers className="w-4.5 h-4.5 text-text-muted" />
              Corporate Department Risks
            </h3>

            <div className="space-y-3.5">
              {departmentRisks.map((dept, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs border-b border-border-main/50 pb-2.5 last:border-b-0 last:pb-0">
                  <div className="space-y-0.5">
                    <span className="font-bold text-text-main block">{dept.name}</span>
                    <span className="text-[10px] text-text-muted font-mono">{dept.usersCount} privileged users monitored</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-text-main">{dept.score}%</span>
                    <div className="w-16 bg-border-main h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${dept.score >= 80 ? "bg-brand-critical" : dept.score >= 60 ? "bg-brand-high" : dept.score >= 40 ? "bg-brand-warning" : "bg-brand-success"}`}
                        style={{ width: `${dept.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Engine Safeguard Health Index */}
          <div className="bg-background-surface border border-border-main rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-sm text-text-main mb-3 flex items-center gap-1.5">
              <Cpu className="w-4.5 h-4.5 text-brand-primary" />
              Platform Safeguard Health
            </h3>

            <div className="space-y-3">
              {[
                { name: "Immutable Ledger Logging", status: "Active / Synced", desc: "Digital signatures verification index 100% compliant", ok: true },
                { name: "Active Directory Sync", status: "Synced (4m ago)", desc: "Forest GPO catalog mapped correctly", ok: true },
                { name: "Threat Intel Global Hub", status: "Connected", desc: "Updated 15 mins ago from CISA feed", ok: true },
                { name: "Behavioral Sandbox JVM", status: "Degraded Performance", desc: "Core VM CPU load at 94% due to forensic pcap trace", ok: false }
              ].map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-lg border border-border-main bg-background-muted/20 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-text-main">{item.name}</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${item.ok ? "bg-emerald-500/10 text-brand-success" : "bg-amber-500/10 text-brand-warning"}`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-text-muted mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
