import { useState } from "react";
import { Clock, AlertTriangle, Cpu, Laptop, ShieldCheck, HelpCircle, Activity, Globe } from "lucide-react";

export function UEBACHarts() {
  const [selectedHeatBlock, setSelectedHeatBlock] = useState<{ day: string; hour: string; value: number; risk: string } | null>(null);

  // 1. Heatmap data: Days (Monday-Sunday) vs Hour Blocks
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const hourBlocks = [
    { label: "00:00-03:00", startHour: 0 },
    { label: "03:00-06:00", startHour: 3 },
    { label: "06:00-09:00", startHour: 6 },
    { label: "09:00-12:00", startHour: 9 },
    { label: "12:00-15:00", startHour: 12 },
    { label: "15:00-18:00", startHour: 15 },
    { label: "18:00-21:00", startHour: 18 },
    { label: "21:00-00:00", startHour: 21 },
  ];

  // Grid values of login count. Sat & Sun late night has anomalous spikes!
  const heatmapData: Record<string, number[]> = {
    "Mon": [12, 4, 23, 142, 195, 180, 45, 12],
    "Tue": [8, 2, 28, 150, 210, 165, 30, 18],
    "Wed": [15, 6, 19, 138, 185, 190, 52, 25],
    "Thu": [10, 5, 25, 160, 205, 175, 41, 14],
    "Fri": [22, 12, 18, 125, 160, 140, 80, 56],
    "Sat": [45, 38, 5, 12, 18, 25, 95, 142], // 🚨 Sat late night high density (anomalous)
    "Sun": [82, 94, 2, 8, 10, 15, 40, 110], // 🚨 Sun early morning/late night extreme spikes
  };

  const getHeatmapColor = (val: number, day: string, hourIdx: number) => {
    // Flag Saturday and Sunday non-office hours as red/orange
    const isWeekend = day === "Sat" || day === "Sun";
    const isOffHours = hourIdx <= 1 || hourIdx >= 6; // 00:00-06:00 and 18:00-00:00
    
    if (isWeekend && isOffHours && val > 40) {
      return "bg-red-600 border-red-500 hover:bg-red-500";
    }
    if (val > 150) return "bg-blue-600 dark:bg-blue-500 hover:bg-blue-400";
    if (val > 80) return "bg-blue-400 dark:bg-blue-600/75 hover:bg-blue-300";
    if (val > 25) return "bg-slate-300 dark:bg-slate-700 hover:bg-slate-400";
    return "bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800";
  };

  const handleBlockClick = (day: string, hourLabel: string, val: number, hourIdx: number) => {
    const isWeekend = day === "Sat" || day === "Sun";
    const isOffHours = hourIdx <= 1 || hourIdx >= 6;
    let risk = "Low Risk - Regular Business Session";
    
    if (isWeekend && isOffHours && val > 40) {
      risk = "🔴 CRITICAL - Extreme Out-of-Hours Anomaly detected. Multi-credential logins registered from cloud VPS endpoints.";
    } else if (isOffHours && val > 30) {
      risk = "⚠️ MEDIUM - Off-Hours active admin operations. Monitor database commands list.";
    }

    setSelectedHeatBlock({ day, hour: hourLabel, value: val, risk });
  };

  return (
    <div id="ueba-charts-container" className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Login Heatmap Block */}
        <div className="xl:col-span-2 bg-background-surface border border-border-main rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-2 text-text-main">
                <Clock className="w-4 h-4 text-brand-primary animate-pulse" />
                Hourly Login & Action Heatmap
              </h3>
              <p className="text-xs text-text-muted">7-day rolling view of privileged authentication queries mapped against baseline hours</p>
            </div>
            <div className="flex gap-4 text-[10px] text-text-muted">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-slate-100 dark:bg-slate-800 border"></span>Idle</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-400"></span>Standard</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-600"></span>Peak</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-600"></span>Anomaly</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[640px] space-y-2">
              
              {/* Hour block column headers */}
              <div className="grid grid-cols-9 text-center pb-1 text-[10px] font-mono font-medium text-text-muted border-b border-border-main">
                <div>Day / UTC</div>
                {hourBlocks.map((block) => (
                  <div key={block.label} className="truncate px-1">{block.label}</div>
                ))}
              </div>

              {/* Rows of days */}
              {days.map((day) => (
                <div key={day} className="grid grid-cols-9 items-center text-center">
                  <div className="text-xs font-semibold text-left text-text-main font-mono">{day}</div>
                  {heatmapData[day].map((val, idx) => (
                    <div key={idx} className="p-1">
                      <button
                        className={`w-full h-8 rounded-md transition-all border ${getHeatmapColor(val, day, idx)} flex items-center justify-center text-[10px] font-mono font-bold text-transparent hover:text-white dark:hover:text-black shadow-sm`}
                        onClick={() => handleBlockClick(day, hourBlocks[idx].label, val, idx)}
                      >
                        {val}
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic block selection info */}
          <div className="mt-4 border border-border-main p-3 rounded-lg bg-background-muted/40 min-h-[64px] flex items-center justify-between text-xs">
            {selectedHeatBlock ? (
              <div className="flex-1 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="font-bold text-text-main font-mono mr-2">[{selectedHeatBlock.day} - {selectedHeatBlock.hour}]</span>
                  <span className="text-text-muted">Logs registered:</span> <span className="font-bold font-mono text-brand-primary">{selectedHeatBlock.value} sessions</span>
                </div>
                <div className="text-xs font-semibold">{selectedHeatBlock.risk}</div>
              </div>
            ) : (
              <div className="text-text-muted flex items-center gap-1.5 justify-center w-full">
                <HelpCircle className="w-4 h-4 text-text-muted/60" />
                Click on any heatmap grid box block to execute a dynamic forensic risk audit of that time window.
              </div>
            )}
          </div>
        </div>

        {/* Working Hour Deviation Analysis */}
        <div className="bg-background-surface border border-border-main rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-sm text-text-main flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-brand-high" />
              Department Working Hour Deviation
            </h3>
            <p className="text-xs text-text-muted mb-4">Percentage of actions executed outside standard regional hours (08:00 - 18:00)</p>
          </div>

          <div className="space-y-4">
            {[
              { dept: "Treasury Operations", pct: 74, color: "bg-red-600", note: "Anomalous operator elevation" },
              { dept: "Cloud Operational Devs", pct: 45, color: "bg-orange-500", note: "High overnight db backup pulls" },
              { dept: "Executive Finance Desk", pct: 28, color: "bg-amber-500", note: "Occasional overnight emails" },
              { dept: "Standard Core Engineering", pct: 12, color: "bg-blue-500", note: "Standard localized shifts" },
            ].map((item) => (
              <div key={item.dept} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-text-main">{item.dept}</span>
                  <span className="font-mono font-bold text-text-muted">{item.pct}% off-hours</span>
                </div>
                <div className="w-full bg-border-main h-2.5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }}></div>
                </div>
                <span className="text-[9px] font-mono text-text-muted block">{item.note}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-border-main text-[10px] text-text-muted">
            🚨 Deviances exceeding 30% automatically route session verification requirements to SOC managers.
          </div>
        </div>
      </div>

      {/* UEBA Anomaly log timeline */}
      <div className="bg-background-surface border border-border-main rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold text-sm text-text-main mb-3 flex items-center gap-1.5">
          <AlertTriangle className="w-4.5 h-4.5 text-brand-critical" />
          UEBA Behavioral Anomaly Logs
        </h3>
        
        <div className="space-y-3">
          {[
            {
              time: "July 15, 21:10 UTC",
              anomaly: "Geographical Travel Paradox",
              user: "Robert Morris (VP Finance)",
              detail: "Login registered from Singapore IP 103.45.22.90, exactly 42 minutes after an active session inside Dallas, Texas. Speed threshold exceeded by 1,120 km/h.",
              severity: "High",
              badge: "bg-orange-500/10 text-brand-high border-orange-500/20"
            },
            {
              time: "July 15, 20:15 UTC",
              anomaly: "Excessive S3 Download Volume Deviation",
              user: "svc_billing_prod (Service Account)",
              detail: "Pulled 420 GB of archived transaction records in 18 minutes. Standard historical billing consumption baseline is 10 GB per hour maximum.",
              severity: "High",
              badge: "bg-orange-500/10 text-brand-high border-orange-500/20"
            },
            {
              time: "July 15, 17:33 UTC",
              anomaly: "Terminal Root Shell Creation inside Secure Area",
              user: "Elena Rostova (SWIFT Operator)",
              detail: "Successfully executed unapproved root-level CMD terminal instance in restricted SWIFT transactional virtual machine. Hardware keys were compromised.",
              severity: "Critical",
              badge: "bg-red-500/10 text-brand-critical border-red-500/20"
            }
          ].map((log, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-border-main bg-background-muted/20 hover:bg-background-muted/45 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${log.badge}`}>
                    {log.severity}
                  </span>
                  <span className="text-xs font-semibold text-text-main">{log.anomaly}</span>
                  <span className="text-[10px] font-mono text-text-muted">— {log.time}</span>
                </div>
                <p className="text-xs text-text-muted">
                  User: <span className="font-bold text-text-main">{log.user}</span>. {log.detail}
                </p>
              </div>
              <button 
                className="text-xs font-semibold text-brand-primary hover:underline self-start sm:self-center shrink-0"
                onClick={() => alert(`Forensic audit dossier compiled. Security Ticket issued under ${log.anomaly.replace(/ /g, '_')}_INC.`)}
              >
                Inspect Logs
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
