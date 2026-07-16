import React, { useEffect, useState } from 'react';
import { Shield, ShieldAlert, CheckCircle, Clock, Smartphone, Globe, Lock, Database, Code, FileText, Banknote, Activity } from "lucide-react";
import { useTheme } from "../components/ThemeContext";
import { api } from "../services/api";

export function UserDashboard() {
  const { theme } = useTheme();
  
  const currentRole = (localStorage.getItem('privguard_role') || "user").toLowerCase();
  
  // Define dynamic role-based privileges
  const getRolePrivileges = () => {
    switch(currentRole) {
      case "hr":
        return [
          { name: "HR Portal (Workday)", icon: <FileText className="w-3.5 h-3.5 text-text-muted" />, level: "Full Admin", status: "Active" },
          { name: "Employee Payroll DB", icon: <Database className="w-3.5 h-3.5 text-text-muted" />, level: "Read/Write", status: "Active" },
          { name: "Engineering Servers", icon: <Lock className="w-3.5 h-3.5 text-text-muted" />, level: "None", status: "Restricted" }
        ];
      case "dev":
        return [
          { name: "GitHub Enterprise", icon: <Code className="w-3.5 h-3.5 text-text-muted" />, level: "Commit Access", status: "Active" },
          { name: "Production DB", icon: <Database className="w-3.5 h-3.5 text-text-muted" />, level: "Read Only", status: "Monitored" },
          { name: "AWS Console", icon: <Globe className="w-3.5 h-3.5 text-text-muted" />, level: "Developer", status: "Active" }
        ];
      case "finance":
        return [
          { name: "Oracle Financials", icon: <Banknote className="w-3.5 h-3.5 text-text-muted" />, level: "Full Admin", status: "Active" },
          { name: "Expense System", icon: <FileText className="w-3.5 h-3.5 text-text-muted" />, level: "Approver", status: "Active" },
          { name: "IT Infrastructure", icon: <Lock className="w-3.5 h-3.5 text-text-muted" />, level: "None", status: "Restricted" }
        ];
      case "admin":
      case "soc lead analyst":
        return [
          { name: "Root Active Directory", icon: <ShieldAlert className="w-3.5 h-3.5 text-text-muted" />, level: "Domain Admin", status: "Active" },
          { name: "SOC Dashboard", icon: <Activity className="w-3.5 h-3.5 text-text-muted" />, level: "Tier 3", status: "Active" },
          { name: "All Production DBs", icon: <Database className="w-3.5 h-3.5 text-text-muted" />, level: "sysadmin", status: "Active" }
        ];
      default:
        return [
          { name: "Internal Wiki", icon: <FileText className="w-3.5 h-3.5 text-text-muted" />, level: "Read / Write", status: "Active" },
          { name: "HR Portal", icon: <Lock className="w-3.5 h-3.5 text-text-muted" />, level: "Read Only", status: "Active" },
          { name: "Production DB", icon: <Lock className="w-3.5 h-3.5 text-text-muted" />, level: "None", status: "Restricted" }
        ];
    }
  };

  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const username = localStorage.getItem('privguard_username');
        if (username) {
          const data = await api.getUserActivities(username);
          setActivities(data);
        }
      } catch (err) {
        console.error("Failed to fetch user activities", err);
      }
    };
    fetchActivities();
  }, []);

  const privileges = getRolePrivileges();

  return (
    <div id="user-dashboard-view-container" className="space-y-6">
      
      {/* 1. Header & Status */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-2/3 bg-background-surface border border-border-main rounded-xl p-6 relative overflow-hidden shadow-sm">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Shield className="w-48 h-48" />
          </div>
          
          <h2 className="text-2xl font-bold text-text-main mb-2">My Security Profile ({currentRole.toUpperCase()})</h2>
          <p className="text-sm text-text-muted max-w-lg mb-6">
            Welcome to your personal Privguard Security Center. Here you can review your access status and active sessions to ensure compliance with enterprise policies.
          </p>
          
          <div className="flex items-center gap-4 bg-background-muted/50 p-4 rounded-lg border border-border-main w-max">
            <div className="p-3 bg-brand-success/10 rounded-full border border-brand-success/20">
              <CheckCircle className="w-8 h-8 text-brand-success" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-main">Status: Compliant</h3>
              <p className="text-xs text-text-muted">No security flags on your account</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="md:w-1/3 flex flex-col gap-4">
          <div className="bg-background-surface border border-border-main rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-text-muted font-mono block mb-1">LAST PASSWORD CHANGE</span>
              <span className="font-bold text-text-main">45 Days Ago</span>
            </div>
            <Clock className="w-5 h-5 text-brand-primary" />
          </div>
          <div className="bg-background-surface border border-border-main rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-text-muted font-mono block mb-1">MFA AUTHENTICATOR</span>
              <span className="font-bold text-brand-success">Active & Synced</span>
            </div>
            <Smartphone className="w-5 h-5 text-brand-success" />
          </div>
        </div>
      </div>

      {/* 2. Active Sessions & Access */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Activities */}
        <div className="bg-background-surface border border-border-main rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-border-main bg-background-muted/30">
            <h3 className="text-sm font-bold text-text-main">Recent Automated Activity Logs</h3>
          </div>
          <div className="p-5 space-y-4">
            {activities.map((act, i) => (
              <div key={i} className="flex items-start gap-4 p-3 rounded-lg border border-border-main bg-background-muted/20">
                <div className="p-2 bg-background-main rounded-lg shadow-sm border border-border-main">
                  <Activity className="w-5 h-5 text-brand-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-bold text-text-main">{act.action}</h4>
                  </div>
                  <p className="text-xs text-text-muted mb-1">System: {act.system}</p>
                  <p className="text-[10px] text-slate-500 font-mono">Timestamp: {act.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* My Assigned Privileges */}
        <div className="bg-background-surface border border-border-main rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-border-main bg-background-muted/30">
            <h3 className="text-sm font-bold text-text-main">My Assigned Privileges</h3>
          </div>
          <div className="p-5">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[10px] text-text-muted font-mono uppercase tracking-wider border-b border-border-main/50">
                  <th className="pb-3 font-semibold">Resource</th>
                  <th className="pb-3 font-semibold">Access Level</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main/50 text-text-main">
                {privileges.map((priv, i) => (
                  <tr key={i}>
                    <td className="py-3 font-medium flex items-center gap-2">
                      {priv.icon} {priv.name}
                    </td>
                    <td className="py-3 text-text-muted">{priv.level}</td>
                    <td className="py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${priv.status === 'Active' ? 'text-brand-success bg-brand-success/10' : priv.status === 'Monitored' ? 'text-brand-warning bg-brand-warning/10' : 'text-slate-500 bg-slate-500/10'}`}>
                        {priv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
