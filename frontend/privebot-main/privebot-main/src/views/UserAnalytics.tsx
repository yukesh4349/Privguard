import { useState, useMemo } from "react";
import { mockPrivilegedUsers, mockActiveSessions } from "../data";
import { PrivilegedUser } from "../types";
import { UEBACHarts } from "../components/UEBACHarts";
import { Search, User, ShieldAlert, Cpu, Laptop, ShieldCheck, HelpCircle, Activity, Globe, AppWindow, Key, Clock, Shield } from "lucide-react";
import { useTheme } from "../components/ThemeContext";

export function UserAnalytics() {
  const [selectedUser, setSelectedUser] = useState<PrivilegedUser>(mockPrivilegedUsers[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sessions, setSessions] = useState(mockActiveSessions);
  const { askConfirm, showToast } = useTheme();

  const filteredUsersList = useMemo(() => {
    if (!searchQuery) return mockPrivilegedUsers;
    return mockPrivilegedUsers.filter(u => 
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Find active sessions for the selected user
  const activeSessionsForUser = useMemo(() => {
    return sessions.filter(s => s.userId === selectedUser.id);
  }, [selectedUser, sessions]);

  const handleRevokeSession = (sessionId: string) => {
    askConfirm({
      title: "Immediate Session Revocation",
      message: `Are you sure you want to forcibly terminate active session ${sessionId} for user @${selectedUser.username}? This will instantly revoke access keys, flush the token cache, and block active operations.`,
      confirmText: "Revoke Session",
      cancelText: "Keep Active",
      onConfirm: () => {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        showToast(`Active session ${sessionId} has been targeted for administrative immediate teardown. Cryptographic handshake keys revoked.`, "success");
      }
    });
  };

  return (
    <div id="user-analytics-view" className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      
      {/* LEFT COLUMN: User Selector Sidebar List */}
      <div className="bg-background-surface border border-border-main rounded-xl p-4 flex flex-col h-[580px] shadow-sm">
        <span className="text-[10px] uppercase font-mono font-bold text-text-muted tracking-wider block mb-2">Monitored Credentials</span>
        <div className="relative mb-3.5">
          <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-text-muted" />
          <input
            type="text"
            placeholder="Search privileged identity..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-background-muted border border-border-main rounded-lg outline-none focus:border-brand-primary text-text-main"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1.5">
          {filteredUsersList.map((user) => {
            const isSelected = selectedUser.id === user.id;
            return (
              <div
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer flex justify-between items-center ${isSelected ? "bg-brand-primary/10 border-brand-primary text-text-main" : "bg-background-surface border-border-main/60 hover:bg-background-muted/20"}`}
              >
                <div className="space-y-0.5 max-w-[130px]">
                  <h4 className="font-bold text-xs truncate text-text-main">{user.fullName}</h4>
                  <span className="text-[10px] font-mono text-text-muted block truncate">@{user.username}</span>
                </div>
                <span className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded ${user.riskScore >= 80 ? "bg-red-500/10 text-brand-critical" : user.riskScore >= 60 ? "bg-orange-500/10 text-brand-high" : "bg-green-500/10 text-brand-success"}`}>
                  {user.riskScore}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT THREE COLUMNS: Full Identity Profile & UEBA Graphs */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* 1. IDENTITY HEADER DOSSIER PROFILE CARD */}
        <div className="bg-background-surface border border-border-main rounded-xl p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* Left Hand: General profile parameters */}
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-background-muted border border-border-main rounded-2xl text-brand-primary relative">
                <User className="w-8 h-8 stroke-1" />
                <span className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background-surface ${selectedUser.riskScore >= 70 ? "bg-brand-critical animate-pulse" : "bg-brand-success"}`} />
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-extrabold text-text-main leading-tight">{selectedUser.fullName}</h2>
                  <span className="text-[9px] font-mono font-bold bg-background-muted border border-border-main text-text-muted px-2 py-0.5 rounded-full">
                    Clearance: {selectedUser.clearanceLevel}
                  </span>
                </div>
                <p className="text-xs text-text-muted">
                  Role: <span className="font-bold text-text-main">{selectedUser.role}</span> | Dept: <span className="font-semibold text-text-main">{selectedUser.department}</span>
                </p>
                <p className="text-[10px] text-text-muted font-mono">
                  Registry UID: <span className="font-bold">{selectedUser.id}</span> | Terminal state: <span className="font-semibold">{selectedUser.lastActive}</span>
                </p>
              </div>
            </div>

            {/* Right Hand: Twin scores circles */}
            <div className="flex gap-4">
              <div className="p-3 border border-border-main rounded-xl bg-background-muted/20 text-center min-w-[100px]">
                <span className="text-[9px] uppercase font-mono font-bold text-text-muted block">Global Risk</span>
                <span className={`text-xl font-black font-mono mt-1 block ${selectedUser.riskScore >= 80 ? "text-brand-critical" : "text-brand-success"}`}>
                  {selectedUser.riskScore}%
                </span>
                <span className="text-[8px] font-mono text-text-muted">GPO & Path vulnerability</span>
              </div>

              <div className="p-3 border border-border-main rounded-xl bg-background-muted/20 text-center min-w-[100px]">
                <span className="text-[9px] uppercase font-mono font-bold text-text-muted block">UEBA Deviancy</span>
                <span className="text-xl font-black font-mono text-brand-high mt-1 block">
                  {selectedUser.behaviorScore}%
                </span>
                <span className="text-[8px] font-mono text-text-muted">Deviation vs historical</span>
              </div>
            </div>

          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-5 border-t border-border-main text-xs">
            <div className="p-2.5 rounded-lg border border-border-main bg-background-muted/20 space-y-0.5">
              <span className="text-[9px] text-text-muted uppercase font-mono">Active Group Privileges</span>
              <div className="flex items-center gap-1 font-bold text-text-main">
                <Key className="w-3.5 h-3.5 text-amber-500" />
                <span>12 Active Keys</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg border border-border-main bg-background-muted/20 space-y-0.5">
              <span className="text-[9px] text-text-muted uppercase font-mono">Enrolled Corporate Devices</span>
              <div className="flex items-center gap-1 font-bold text-text-main">
                <Laptop className="w-3.5 h-3.5 text-blue-400" />
                <span>{selectedUser.devicesUsed} Windows/macOS</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg border border-border-main bg-background-muted/20 space-y-0.5">
              <span className="text-[9px] text-text-muted uppercase font-mono">Simultaneous Active Sessions</span>
              <div className="flex items-center gap-1 font-bold text-text-main">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>{selectedUser.activeSessions} Enclave links</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg border border-border-main bg-background-muted/20 space-y-0.5">
              <span className="text-[9px] text-text-muted uppercase font-mono">Cryptographic Signing Audit</span>
              <div className="flex items-center gap-1 font-bold text-brand-success">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-success" />
                <span>VERIFIED</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. SPECIFIC ACTIVE SESSIONS DETAILED DATA */}
        <div className="bg-background-surface border border-border-main rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-sm text-text-main mb-3 flex items-center gap-1.5">
            <Shield className="w-4.5 h-4.5 text-brand-primary" />
            Active Authentication & Session Handshakes
          </h3>

          {activeSessionsForUser.length > 0 ? (
            <div className="space-y-3">
              {activeSessionsForUser.map((session) => (
                <div key={session.id} className="p-3 border border-border-main rounded-lg bg-background-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[10px] text-text-muted bg-background-muted px-2 py-0.5 rounded">
                        {session.id}
                      </span>
                      <span className="font-bold text-text-main">{session.resourceAccessed.split(" (")[0]}</span>
                      <span className="text-[10px] text-text-muted font-mono">— {new Date(session.startTime).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-[11px] text-text-muted font-mono flex flex-wrap gap-x-4">
                      <span>IP: <strong className="text-text-main">{session.ipAddress}</strong></span>
                      <span>Location: <strong className="text-text-main">{session.country}</strong></span>
                      <span>Commands Run: <strong className="text-brand-critical">{session.privilegedCommandsRun} SQL/Shell</strong></span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleRevokeSession(session.id)}
                    className="px-2.5 py-1 text-[11px] text-white bg-brand-critical hover:bg-red-700 rounded font-bold transition-colors shadow-sm self-start sm:self-center shrink-0"
                  >
                    Revoke Session
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-muted font-medium p-4 text-center border border-dashed border-border-main rounded-lg">
              No active session handshakes recorded currently for {selectedUser.fullName}. Cryptographic authorization tokens are dormant.
            </p>
          )}
        </div>

        {/* 3. INTEGRATED BEHAVIORAL CHARTS & HEATMAPS */}
        <UEBACHarts />

      </div>

    </div>
  );
}
