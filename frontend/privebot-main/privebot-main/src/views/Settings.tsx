import { useState, useEffect } from "react";
import { mockAccessPolicies, getStoredData, setStoredData } from "../data";
import { AccessPolicy } from "../types";
import { Shield, Key, Sliders, ToggleLeft, ToggleRight, Radio, Server, Check, HelpCircle, Save, Plus } from "lucide-react";
import { useTheme } from "../components/ThemeContext";

export function Settings() {
  const [policies, setPolicies] = useState<AccessPolicy[]>(() => getStoredData("access_policies", mockAccessPolicies));
  const [criticalThreshold, setCriticalThreshold] = useState(85);
  const [highThreshold, setHighThreshold] = useState(70);
  const [mfaTimeout, setMfaTimeout] = useState(30);
  const { askConfirm, showToast } = useTheme();

  useEffect(() => {
    const handleSync = () => {
      setPolicies(getStoredData("access_policies", mockAccessPolicies));
    };
    window.addEventListener("privguard_db_sync", handleSync);
    return () => window.removeEventListener("privguard_db_sync", handleSync);
  }, []);

  const savePolicies = (newPolicies: AccessPolicy[]) => {
    setPolicies(newPolicies);
    setStoredData("access_policies", newPolicies);
  };

  const handleTogglePolicy = (id: string, name: string) => {
    const updated = policies.map(p => {
      if (p.id === id) {
        const nextState = !p.isEnabled;
        showToast(`Policy ${p.id} (${name}) has been ${nextState ? "ENABLED" : "DISABLED"} successfully.`, "info");
        return { ...p, isEnabled: nextState };
      }
      return p;
    });
    savePolicies(updated);
  };

  const handleSaveSettings = () => {
    showToast("Committing security configuration parameters to cluster database...", "info");
    setTimeout(() => {
      showToast("Administrative platform settings successfully committed to secure enclave. All caches flushed.", "success");
    }, 1000);
  };

  const handleCreatePolicy = () => {
    askConfirm({
      title: "Initialize Policy Builder",
      message: "You are starting the automated Access Policy Builder wizard. This compiles Active Directory schemas, CyberArk vaults, and IAM requirements. Do you want to launch the constructor tool?",
      confirmText: "Launch Wizard",
      cancelText: "Cancel",
      onConfirm: () => {
        showToast("Policy Builder wizard successfully launched in background thread.", "success");
      }
    });
  };

  return (
    <div id="settings-view-container" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* LEFT TWO COLUMNS: Policies manager and Risk sliders */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Policies toggle list */}
        <div className="bg-background-surface border border-border-main rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-border-main pb-3">
            <div>
              <h3 className="font-bold text-sm text-text-main flex items-center gap-1.5">
                <Shield className="w-4.5 h-4.5 text-brand-primary" />
                Active Privilege Access Policies ({policies.length})
              </h3>
              <p className="text-xs text-text-muted">Dynamic rules evaluating access sessions risk bounds and MFA</p>
            </div>
            
            <button
              onClick={handleCreatePolicy}
              className="px-2.5 py-1 bg-background-muted hover:bg-border-main border border-border-main hover:border-brand-primary rounded text-xs font-semibold text-text-main transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              New Policy
            </button>
          </div>

          <div className="space-y-3">
            {policies.map((policy) => (
              <div 
                key={policy.id} 
                className={`p-3.5 border rounded-lg flex items-start justify-between gap-4 text-xs transition-colors ${policy.isEnabled ? "bg-background-surface border-border-main" : "bg-background-muted/20 border-border-main/50"}`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] font-bold text-text-muted bg-background-muted px-1.5 py-0.5 rounded">
                      {policy.id}
                    </span>
                    <h4 className={`font-bold text-xs ${policy.isEnabled ? "text-text-main" : "text-text-muted line-through"}`}>{policy.name}</h4>
                  </div>
                  <p className="text-[11px] text-text-muted leading-relaxed max-w-md">{policy.description}</p>
                  <div className="flex gap-4 text-[10px] text-text-muted font-mono pt-1">
                    <span>MFA: <strong className="text-text-main">{policy.mfaRequired ? "Required" : "Optional"}</strong></span>
                    <span>Approval: <strong className="text-text-main">{policy.approvalRequired ? "Required" : "By-Passable"}</strong></span>
                    <span>Window: <strong className="text-text-main">{policy.timeWindow}</strong></span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleTogglePolicy(policy.id, policy.name)}
                  className="p-1 focus:outline-none shrink-0"
                >
                  {policy.isEnabled ? (
                    <ToggleRight className="w-9 h-9 text-brand-primary cursor-pointer" />
                  ) : (
                    <ToggleLeft className="w-9 h-9 text-text-muted cursor-pointer" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Threshold Sliders */}
        <div className="bg-background-surface border border-border-main rounded-xl p-5 shadow-sm space-y-5">
          <div>
            <h3 className="font-bold text-sm text-text-main flex items-center gap-1.5">
              <Sliders className="w-4.5 h-4.5 text-brand-primary" />
              Automated Containment Thresholds
            </h3>
            <p className="text-xs text-text-muted">Configure active risk score markers that automatically initiate host network isolation</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-2">
              <div className="flex justify-between font-bold">
                <span className="text-text-main">🔴 Critical-Alert Auto-Quarantine Trigger</span>
                <span className="font-mono text-brand-critical">{criticalThreshold}% Score</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                className="w-full h-1.5 bg-border-main rounded-lg appearance-none cursor-pointer"
                value={criticalThreshold}
                onChange={(e) => setCriticalThreshold(Number(e.target.value))}
              />
              <span className="text-[10px] text-text-muted block">
                Alerts matching this score instantly freeze Active Directory auth tokens. Default: 85%.
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between font-bold">
                <span className="text-text-main">🟠 High-Alert Dual-Approval Trigger</span>
                <span className="font-mono text-brand-high">{highThreshold}% Score</span>
              </div>
              <input
                type="range"
                min="40"
                max="90"
                className="w-full h-1.5 bg-border-main rounded-lg appearance-none cursor-pointer"
                value={highThreshold}
                onChange={(e) => setHighThreshold(Number(e.target.value))}
              />
              <span className="text-[10px] text-text-muted block">
                Requires explicit manager visual signoff for access to proceed. Default: 70%.
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Integrations & MFA Setup options */}
      <div className="space-y-6">
        
        {/* Integrations checklist */}
        <div className="bg-background-surface border border-border-main rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-sm text-text-main mb-3.5 flex items-center gap-1.5">
            <Server className="w-4.5 h-4.5 text-brand-primary" />
            Platform Ecosystem Integrations
          </h3>

          <div className="space-y-2.5 text-xs">
            {[
              { name: "Active Directory (Local)", status: "Connected", sync: "4 mins ago", active: true },
              { name: "Azure AD / Office 365 Tenant", status: "Connected", sync: "10 mins ago", active: true },
              { name: "CyberArk Privilege Vault", status: "Connected", sync: "Synced Real-time", active: true },
              { name: "Cisco Catalyst Edge Firewall", status: "Connected", sync: "Synced Real-time", active: true },
              { name: "AWS CloudTrail Event Bridge", status: "Degraded Connection", sync: "Failing auth keys", active: false }
            ].map((int, idx) => (
              <div key={idx} className="p-3 border border-border-main rounded-lg bg-background-muted/20 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-bold text-text-main block">{int.name}</span>
                  <span className="text-[10px] text-text-muted font-mono">Sync: {int.sync}</span>
                </div>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${int.active ? "bg-emerald-500/10 text-brand-success" : "bg-red-500/10 text-brand-critical"}`}>
                  {int.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Platform settings save card */}
        <div className="bg-background-surface border border-border-main rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-1.5">
            <h4 className="font-bold text-xs text-text-main">Save Core Security Parameters</h4>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Updating these parameters flushes cache layers and forces active SOC consoles to synchronize to GPO security matrix schemas.
            </p>
          </div>

          <button
            onClick={handleSaveSettings}
            className="mt-4 w-full py-2 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-brand-primary/10"
          >
            <Save className="w-4 h-4" />
            Commit Configuration
          </button>
        </div>

      </div>

    </div>
  );
}
