import React, { useState } from "react";
import { Shield, Key, Eye, EyeOff, Globe, Sparkles, Terminal, Activity, Lock, Users, AlertOctagon } from "lucide-react";
import { useTheme } from "../components/ThemeContext";

interface LoginProps {
  onLoginSuccess: (userRole: string, username: string) => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("112233");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState("EN-US");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setErrorMsg("");

    try {
      const data = await import('../services/api').then(m => m.api.login(username, password));
      localStorage.setItem('privguard_token', data.access_token);
      onLoginSuccess("SOC Lead Analyst", username);
    } catch (err) {
      setErrorMsg("Invalid credentials. Please verify security enrollment card.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div id="login-layout-container" className="min-h-screen flex flex-col md:flex-row bg-background-main transition-colors duration-200">
      
      {/* LEFT HAND PANEL: Security platform identity & telemetry illustration */}
      <div className="hidden md:flex md:w-1/2 bg-[#020617] text-white p-12 flex-col justify-between relative overflow-hidden border-r border-slate-900">
        
        {/* Ambient grid decoration */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />
        
        {/* Floating security orb (ambient aura) */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top brand indicator */}
        <div className="relative flex items-center gap-2.5">
          <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/25">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-wider font-sans">PRIVGUARD</h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-widest">SECURE IDENTITY ENVELOPE</p>
          </div>
        </div>

        {/* Middle product information & active SOC stats */}
        <div className="relative space-y-8 my-auto max-w-lg">
          <div className="space-y-4">
            <span className="text-xs font-semibold px-2.5 py-1 bg-blue-500/15 text-blue-400 rounded-full border border-blue-500/25 inline-flex items-center gap-1.5 font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              INTELLIGENCE ENGINE V4.8
            </span>
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-100 font-sans">
              AI-Powered Insider Threat & Privilege Misuse Detection.
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Designed explicitly for Banks, Financial Clearing Desks, Government Security, and global enterprise operations centers to monitor and terminate rogue administrative behaviors instantly.
            </p>
          </div>

          {/* Hard telemetry box */}
          <div className="grid grid-cols-2 gap-4 border border-slate-800 p-4 rounded-xl bg-slate-950/80 backdrop-blur-md">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Active Safeguards</span>
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-bold font-mono">14,285 Assets</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Threat Intelligence Feed</span>
              <div className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-blue-400 animate-pulse" />
                <span className="text-sm font-bold font-mono">24/7 Global C2</span>
              </div>
            </div>
            <div className="space-y-1 border-t border-slate-900 pt-3">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Privileged Identities</span>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-bold font-mono">842 Monitored</span>
              </div>
            </div>
            <div className="space-y-1 border-t border-slate-900 pt-3">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Immutable Ledger Status</span>
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-bold font-mono text-emerald-400">SYNCED 100%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright / policy lines */}
        <div className="relative text-xs text-slate-500 font-mono space-y-1">
          <p>© 2026 PRIVGUARD SYSTEMS INC. ALL RIGHTS RESERVED.</p>
          <p>PROTECTED BY US PATENT LAWS & SEC CRYPTOGRAPHIC STANDARDS.</p>
        </div>
      </div>

      {/* RIGHT HAND PANEL: Clean Secure Card Layout */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 md:w-1/2 bg-background-surface">
        
        {/* Top utility row: Language selector and Theme toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <Globe className="w-4 h-4 text-text-muted" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-transparent border-none text-text-muted outline-none cursor-pointer font-semibold"
            >
              <option value="EN-US" className="bg-background-surface text-text-main">English (US)</option>
              <option value="EN-GB" className="bg-background-surface text-text-main">English (UK)</option>
              <option value="FR-FR" className="bg-background-surface text-text-main">Français</option>
              <option value="DE-DE" className="bg-background-surface text-text-main">Deutsch</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-background-muted p-1 rounded-lg border border-border-main">
            <button
              onClick={() => setTheme("light")}
              className={`text-[10px] font-semibold px-2 py-1 rounded ${resolvedTheme === "light" ? "bg-background-surface text-text-main shadow-sm" : "text-text-muted"}`}
            >
              Light
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`text-[10px] font-semibold px-2 py-1 rounded ${resolvedTheme === "dark" ? "bg-background-surface text-text-main shadow-sm" : "text-text-muted"}`}
            >
              Dark
            </button>
          </div>
        </div>

        {/* Middle Secure Credentials Form */}
        <div className="my-auto max-w-sm w-full mx-auto space-y-6">
          <div className="space-y-1.5">
            <h3 className="text-2xl font-black tracking-tight text-text-main">Secure Analyst Portal</h3>
            <p className="text-xs text-text-muted">Enter administrative identity credentials to access active threat enclaves.</p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-xs text-brand-critical">
              <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Username/Enrollment tag input */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono font-bold text-text-muted tracking-wider flex items-center justify-between">
                <span>Administrative Security Identifier</span>
                <span className="text-[9px] text-brand-primary cursor-pointer" onClick={() => setUsername("admin_soc_tier3")}>
                  AUTOFILL DEMO
                </span>
              </label>
              <div className="relative">
                <Terminal className="absolute left-3 top-3 h-4 w-4 text-text-muted" />
                <input
                  type="text"
                  required
                  placeholder="e.g. adm_j_smith"
                  className="w-full bg-background-muted text-xs border border-border-main rounded-lg pl-9 pr-4 py-3 outline-none focus:border-brand-primary transition-all text-text-main font-mono"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono font-bold text-text-muted tracking-wider flex justify-between">
                <span>Access Key Signature</span>
                <a href="#forgot" className="text-[10px] text-brand-primary hover:underline" onClick={() => alert("Administrative Key Signature reissue requires physically contacting your local SOC Vault Security Officer.")}>
                  Forgot Token?
                </a>
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-text-muted" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••••••"
                  className="w-full bg-background-muted text-xs border border-border-main rounded-lg pl-9 pr-10 py-3 outline-none focus:border-brand-primary transition-all text-text-main font-mono"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-text-muted hover:text-text-main"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Device choice */}
            <div className="flex items-center justify-between text-xs text-text-muted">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className="rounded border-border-main text-brand-primary focus:ring-brand-primary w-4 h-4"
                />
                <span>Remember this terminal device</span>
              </label>
            </div>

            {/* Submit Authorization button */}
            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 shadow-md shadow-brand-primary/10"
            >
              {isAuthenticating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Verifying Crypto Key...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Authenticate Session</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Bottom security warning info */}
        <div className="text-center text-[10px] text-text-muted font-mono max-w-sm mx-auto leading-relaxed mt-6">
          ⚠️ WARNING: This terminal is restricted to authorized bank auditors. Unapproved access queries are immediately logged and forwarded to Cyber Security Operations command centers for physical location tracking.
        </div>
      </div>
    </div>
  );
}
