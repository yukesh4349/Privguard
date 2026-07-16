import { useState, useMemo } from "react";
import { ThemeProvider, useTheme } from "./components/ThemeContext";
import { Login } from "./views/Login";
import { Dashboard } from "./views/Dashboard";
import { ThreatFeed } from "./views/ThreatFeed";
import { UserAnalytics } from "./views/UserAnalytics";
import { IdentityGraphView } from "./views/IdentityGraphView";
import { ActiveSessions } from "./views/ActiveSessions";
import { ThreatIntel } from "./views/ThreatIntel";
import { Investigations } from "./views/Investigations";
import { Reports } from "./views/Reports";
import { AuditLogs } from "./views/AuditLogs";
import { Settings } from "./views/Settings";
import { AICopilot } from "./components/AICopilot";
import { mockThreatAlerts } from "./data";

import { 
  Shield, Activity, Bot, LogOut, Bell, Menu, X, ChevronRight,
  LayoutDashboard, ShieldAlert, Users, Radio, Globe, Layers, FileText, Settings as SettingsIcon, ShieldCheck, Sun, Moon, Laptop 
} from "lucide-react";

function MainAppShell() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  // Login Session state
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Default authenticated for frictionless previewing
  const [analystRole, setAnalystRole] = useState("Lead SOC Analyst");
  const [analystName, setAnalystName] = useState("admin_soc_tier3");

  // Router navigation view
  const [activeView, setActiveView] = useState<string>("dashboard");
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  // Layout UI Toggles
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showCopilot, setShowCopilot] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleLoginSuccess = (role: string, name: string) => {
    setAnalystRole(role);
    setAnalystName(name);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const handleDashboardAlertClick = (alertId: string) => {
    setSelectedAlertId(alertId);
    setActiveView("threats");
  };

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4.5 h-4.5" /> },
    { id: "threats", label: "Live Monitoring", icon: <ShieldAlert className="w-4.5 h-4.5 text-brand-critical" />, counter: 6 },
    { id: "analytics", label: "Identity UEBA", icon: <Users className="w-4.5 h-4.5" /> },
    { id: "identity", label: "Identity Graph", icon: <Layers className="w-4.5 h-4.5" /> },
    { id: "sessions", label: "Active Sessions", icon: <Radio className="w-4.5 h-4.5 text-emerald-500 animate-pulse" /> },
    { id: "intel", label: "Threat Intelligence", icon: <Globe className="w-4.5 h-4.5" /> },
    { id: "cases", label: "Investigations", icon: <FileText className="w-4.5 h-4.5" /> },
    { id: "reports", label: "Compliance Reports", icon: <ShieldCheck className="w-4.5 h-4.5 text-blue-500" /> },
    { id: "audit", label: "Audit Logs Ledger", icon: <FileText className="w-4.5 h-4.5" /> },
    { id: "settings", label: "System Settings", icon: <SettingsIcon className="w-4.5 h-4.5" /> },
  ];

  // Helper to resolve dynamic page header title
  const getViewTitle = () => {
    const matched = navigationItems.find(item => item.id === activeView);
    return matched ? matched.label : "Secured Workspace";
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div id="main-app-shell-container" className="flex h-screen bg-background-main text-text-main transition-colors duration-200 overflow-hidden font-sans">
      
      {/* 1. LEFT HAND COLLAPSABLE SIDEBAR (DESKTOP) */}
      <aside 
        className={`hidden md:flex flex-col bg-[#0b0f19] text-slate-300 border-r border-slate-900 transition-all duration-300 select-none z-30 shrink-0 ${sidebarCollapsed ? "w-16" : "w-60"}`}
      >
        {/* Sidebar Header Title */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-900 bg-slate-950/80">
          <div className="flex items-center gap-2.5 truncate">
            <div className="p-1.5 bg-blue-600 rounded-lg shadow-lg text-white">
              <Shield className="w-5 h-5 shrink-0" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="text-sm font-extrabold tracking-wider text-slate-100 font-sans">PRIVGUARD</h1>
                <p className="text-[8px] text-slate-500 font-mono tracking-widest leading-none mt-0.5">SOC IDENTITY V4</p>
              </div>
            )}
          </div>
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-slate-500 hover:text-slate-300 shrink-0"
            title={sidebarCollapsed ? "Expand panel" : "Collapse panel"}
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>

        {/* Sidebar Middle Nav Links */}
        <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-1">
          {navigationItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  setSelectedAlertId(null); // Reset alert drilldown on navigation change
                }}
                className={`w-full text-left text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-between transition-all cursor-pointer ${isActive ? "bg-blue-600/15 text-slate-100 border border-blue-500/10 shadow-sm" : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-200 border border-transparent"}`}
              >
                <div className="flex items-center gap-3 truncate">
                  {item.icon}
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </div>
                {!sidebarCollapsed && item.counter && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-red-600 text-white rounded-full font-mono">
                    {item.counter}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer User Detail Card */}
        <div className="p-3 border-t border-slate-900 bg-slate-950/40">
          {!sidebarCollapsed ? (
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="truncate">
                <span className="text-slate-500 text-[9px] uppercase font-mono block">Operator ID</span>
                <span className="font-bold text-slate-200 truncate block">@{analystName}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors"
                title="Log out session"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogout}
              className="w-full p-2 flex justify-center text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors"
              title="Log out session"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          )}
        </div>
      </aside>

      {/* MOBILE HEADER & DRAWER LINK NAVIGATION */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 z-50 flex">
          <div className="w-64 bg-[#0b0f19] text-slate-300 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-900 mb-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-500" />
                  <span className="font-bold text-slate-100">PRIVGUARD SOC</span>
                </div>
                <button onClick={() => setMobileSidebarOpen(false)}><X className="w-5 h-5 text-slate-500" /></button>
              </div>

              <div className="space-y-1">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveView(item.id);
                      setSelectedAlertId(null);
                      setMobileSidebarOpen(false);
                    }}
                    className={`w-full text-left text-xs font-semibold py-2.5 px-3 rounded-lg flex items-center gap-3 ${activeView === item.id ? "bg-blue-600/15 text-slate-100" : "text-slate-400"}`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleLogout} className="py-2.5 bg-red-500/10 text-red-500 font-bold text-xs rounded-lg flex items-center justify-center gap-2">
              <LogOut className="w-4 h-4" />
              Terminate Terminal Session
            </button>
          </div>
        </div>
      )}

      {/* 2. MAIN CENTERWORKSPACE WRAPPER */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        
        {/* Top Navbar */}
        <header className="h-16 border-b border-border-main bg-background-surface/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 shrink-0 z-10">
          
          {/* Breadcrumbs Left Hand */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-1 text-text-muted hover:text-text-main"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 text-xs text-text-muted select-none">
              <span className="font-bold text-text-main tracking-wide">PrivGuard</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="font-semibold">{getViewTitle()}</span>
            </div>
          </div>

          {/* Right Hand Actions: Copilot trigger, Alarm notifications, Theme selector */}
          <div className="flex items-center gap-3">
            
            {/* Quick action: AI Security Copilot Workspace toggle */}
            <button
              onClick={() => setShowCopilot(!showCopilot)}
              className={`text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold cursor-pointer border shadow-sm transition-all ${showCopilot ? "bg-brand-primary text-white border-brand-primary" : "bg-blue-500/10 border-blue-500/10 hover:border-brand-primary/40 text-brand-primary"}`}
            >
              <Bot className="w-4 h-4" />
              {!showCopilot ? "Ask Copilot" : "Hide Copilot"}
            </button>

            {/* Quick theme toggler dropdown */}
            <div className="flex items-center bg-background-muted border border-border-main rounded-lg p-0.5">
              <button 
                onClick={() => setTheme("light")} 
                className={`p-1.5 rounded-md ${resolvedTheme === "light" ? "bg-background-surface text-text-main shadow-sm" : "text-text-muted hover:text-text-main"}`}
                title="Light Theme"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setTheme("dark")} 
                className={`p-1.5 rounded-md ${resolvedTheme === "dark" ? "bg-background-surface text-text-main shadow-sm" : "text-text-muted hover:text-text-main"}`}
                title="Dark Theme"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Notifications Bell Alert panel */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 bg-background-muted hover:bg-border-main border border-border-main rounded-lg text-text-muted hover:text-text-main transition-colors relative"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-brand-critical animate-ping" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-brand-critical" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2.5 w-80 bg-background-surface border border-border-main rounded-xl shadow-2xl z-50 overflow-hidden text-xs">
                  <div className="p-3 border-b border-border-main bg-background-muted/40 flex justify-between items-center">
                    <span className="font-bold text-text-main">Critical Telemetry Alerts</span>
                    <span className="text-[10px] font-mono font-bold text-brand-critical">2 Active P1s</span>
                  </div>
                  <div className="divide-y divide-border-main max-h-[280px] overflow-y-auto">
                    {mockThreatAlerts.slice(0, 3).map((alert) => (
                      <div 
                        key={alert.id}
                        onClick={() => {
                          setSelectedAlertId(alert.id);
                          setActiveView("threats");
                          setShowNotifications(false);
                        }}
                        className="p-3 hover:bg-background-muted/40 cursor-pointer space-y-1 transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-[9px] font-bold text-brand-critical bg-red-500/10 px-1.5 rounded">
                            {alert.riskLevel} {alert.riskScore}%
                          </span>
                          <span className="text-[9px] text-text-muted font-mono">{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <h5 className="font-bold text-text-main leading-tight truncate">{alert.title}</h5>
                        <p className="text-[10px] text-text-muted">Actor: @{alert.actor}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 border-t border-border-main bg-background-muted/20 text-center">
                    <button 
                      className="text-[11px] font-semibold text-brand-primary hover:underline w-full"
                      onClick={() => { setActiveView("threats"); setShowNotifications(false); }}
                    >
                      View All Security Feeds
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Center Workspace Scroll Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 relative">
          
          {/* Workspaces router mapping */}
          <div className="h-full">
            {activeView === "dashboard" && (
              <Dashboard 
                onNavigate={setActiveView} 
                onSelectAlert={handleDashboardAlertClick} 
              />
            )}
            {activeView === "threats" && (
              <ThreatFeed 
                selectedAlertId={selectedAlertId} 
                onCloseDrawer={() => setSelectedAlertId(null)}
                onSelectAlert={setSelectedAlertId}
              />
            )}
            {activeView === "analytics" && <UserAnalytics />}
            {activeView === "identity" && <IdentityGraphView />}
            {activeView === "sessions" && <ActiveSessions />}
            {activeView === "intel" && <ThreatIntel />}
            {activeView === "cases" && <Investigations />}
            {activeView === "reports" && <Reports />}
            {activeView === "audit" && <AuditLogs />}
            {activeView === "settings" && <Settings />}
          </div>

        </main>
      </div>

      {/* 3. FLOATING SIDEBAR AI COPILOT WORKSPACE (SIDE-BY-SIDE DESKTOP COMPATIBILITY) */}
      {showCopilot && (
        <aside className="hidden lg:block w-[380px] shrink-0 border-l border-border-main bg-background-surface z-20">
          <div className="h-full">
            <AICopilot />
          </div>
        </aside>
      )}

      {/* Mobile Copilot Drawer */}
      {showCopilot && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-50 flex justify-end">
          <div className="w-full max-w-md bg-background-surface h-full flex flex-col">
            <div className="flex justify-end p-2 border-b border-border-main">
              <button 
                onClick={() => setShowCopilot(false)}
                className="text-text-muted hover:text-text-main flex items-center gap-1 text-xs font-semibold"
              >
                <X className="w-5 h-5" />
                Close Copilot
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <AICopilot />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainAppShell />
    </ThemeProvider>
  );
}
