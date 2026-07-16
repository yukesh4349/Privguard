import React from "react";
import { Shield, Brain, Fingerprint, MapPin, Globe, Clock, FileWarning, Eye, FileText, Database, Lock, Laptop, CheckCircle2 } from "lucide-react";

export function SecurityPolicies() {
  const policies = [
    { 
      id: "ai-behavioral", 
      title: "AI Behavioral Analysis Engine", 
      icon: <Brain className="w-5 h-5" />, 
      desc: "Learns employee login, access, and download habits to detect unusual patterns instantly.",
      status: "Enabled",
      riskLevel: "Critical"
    },
    { 
      id: "pam", 
      title: "Privileged Access Monitoring", 
      icon: <Lock className="w-5 h-5" />, 
      desc: "Tracks files and databases accessed by administrators and vendors. Alerts on excessive access.",
      status: "Enabled",
      riskLevel: "High"
    },
    { 
      id: "geo-location", 
      title: "Geo-Location Monitoring", 
      icon: <MapPin className="w-5 h-5" />, 
      desc: "Verifies state/country access and detects Impossible Travel or foreign country login attempts.",
      status: "Enabled",
      riskLevel: "High"
    },
    { 
      id: "vpn-proxy", 
      title: "VPN & Proxy Detection", 
      icon: <Globe className="w-5 h-5" />, 
      desc: "Blocks public WiFi, unknown networks, TOR, and proxy servers. Enforces corporate LAN/VPN.",
      status: "Enforcing",
      riskLevel: "High"
    },
    { 
      id: "device-verify", 
      title: "Device Verification", 
      icon: <Laptop className="w-5 h-5" />, 
      desc: "Checks MAC Address and Browser Fingerprint. Alerts if a device is suddenly changed.",
      status: "Enabled",
      riskLevel: "Medium"
    },
    { 
      id: "login-enforce", 
      title: "Login Time Enforcement", 
      icon: <Clock className="w-5 h-5" />, 
      desc: "Restricts access outside 8 AM - 6 PM unless manager approval or biometric verification provided.",
      status: "Enabled",
      riskLevel: "Medium"
    },
    { 
      id: "biometrics", 
      title: "Biometric Authentication", 
      icon: <Fingerprint className="w-5 h-5" />, 
      desc: "Requires Face/Iris/Fingerprint scanning before viewing customer records or exporting data.",
      status: "Enabled",
      riskLevel: "Critical"
    },
    { 
      id: "dlp", 
      title: "Data Loss Prevention (DLP)", 
      icon: <Database className="w-5 h-5" />, 
      desc: "Blocks USB transfers, email forwarding, and copy/pasting of sensitive financial records.",
      status: "Enforcing",
      riskLevel: "Critical"
    },
    { 
      id: "link-scanner", 
      title: "Secure Link & File Scanner", 
      icon: <FileWarning className="w-5 h-5" />, 
      desc: "AI dynamically scans all clicked URLs and downloaded PDFs/Executables for ransomware.",
      status: "Active",
      riskLevel: "High"
    },
    { 
      id: "screen-monitor", 
      title: "Screen & Session Monitoring", 
      icon: <Eye className="w-5 h-5" />, 
      desc: "Detects and blocks screen recording software and captures full command line session audits.",
      status: "Active",
      riskLevel: "Medium"
    },
    { 
      id: "honey-files", 
      title: "Honey Files (Trap Files)", 
      icon: <FileText className="w-5 h-5" />, 
      desc: "Deploys fake sensitive files (e.g. salary_database.xlsx) and triggers critical alerts if opened.",
      status: "Deployed",
      riskLevel: "Critical"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-main">Enterprise Security Suite</h2>
          <p className="text-text-muted mt-1">Configure and monitor the 18 active defense modules across the corporate network.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-brand-success/10 border border-brand-success/30 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-brand-success" />
          <span className="text-sm font-bold text-brand-success">All Systems Operational</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {policies.map((policy) => (
          <div key={policy.id} className="bg-background-surface border border-border-main rounded-xl p-6 shadow-sm hover:border-brand-primary/50 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-brand-primary/10 rounded-lg text-brand-primary border border-brand-primary/20">
                {policy.icon}
              </div>
              <div className="flex flex-col items-end">
                <span className={`text-[10px] font-mono uppercase px-2 py-1 rounded font-bold ${
                  policy.status === 'Enabled' || policy.status === 'Active' ? 'bg-brand-success/10 text-brand-success' : 'bg-brand-warning/10 text-brand-warning'
                }`}>
                  {policy.status}
                </span>
                <span className="text-[10px] text-slate-500 mt-1">Impact: {policy.riskLevel}</span>
              </div>
            </div>
            
            <h3 className="text-sm font-bold text-text-main mb-2">{policy.title}</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              {policy.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
