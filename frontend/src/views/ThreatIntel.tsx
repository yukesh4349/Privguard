import React, { useState, useEffect } from "react";
import { mockThreatIntel, getStoredData, setStoredData } from "../data";
import { ThreatIntelItem } from "../types";
import { Shield, ShieldAlert, Globe, Search, Plus, Trash2, Ban, Filter, HelpCircle, FileCheck, RefreshCw } from "lucide-react";
import { useTheme } from "../components/ThemeContext";

export function ThreatIntel() {
  const [intelItems, setIntelItems] = useState<ThreatIntelItem[]>(() => getStoredData("threat_intel", mockThreatIntel));
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("ALL");
  const { askConfirm, showToast } = useTheme();
  
  // Form input for adding new indicator
  const [newIndicator, setNewIndicator] = useState("");
  const [newType, setNewType] = useState<"IP" | "Domain" | "Hash">("IP");
  const [newCategory, setNewCategory] = useState<"Tor Exit Node" | "Bulletproof Hosting" | "VPN Proxy" | "Known Malware C2" | "Suspicious Cloud VPS">("Tor Exit Node");

  useEffect(() => {
    const handleSync = () => {
      setIntelItems(getStoredData("threat_intel", mockThreatIntel));
    };
    window.addEventListener("privguard_db_sync", handleSync);
    return () => window.removeEventListener("privguard_db_sync", handleSync);
  }, []);

  const saveIntelItems = (newItems: ThreatIntelItem[]) => {
    setIntelItems(newItems);
    setStoredData("threat_intel", newItems);
  };

  const handleAddIndicator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIndicator.trim()) return;

    const newItem: ThreatIntelItem = {
      id: `IOC-${Date.now().toString().slice(-3)}`,
      indicator: newIndicator.trim(),
      type: newType,
      maliciousScore: 95,
      detectionCategory: newCategory,
      firstSeen: new Date().toISOString().split("T")[0],
      lastSeen: new Date().toISOString().split("T")[0],
      country: "Global Flagged",
      status: "Blocked"
    };

    saveIntelItems([newItem, ...intelItems]);
    setNewIndicator("");
    showToast(`IOC ${newIndicator} added to firewalls drop list. Broadcast sync completed across global routing tables.`, "success");
  };

  const handleDeleteIndicator = (id: string, indicator: string) => {
    askConfirm({
      title: "Remove Threat Indicator",
      message: `Are you sure you want to remove the indicator "${indicator}" from active edge blocking rules? This restores perimeter network trust for this signature.`,
      confirmText: "Unblock Signatures",
      cancelText: "Keep Blocked",
      onConfirm: () => {
        saveIntelItems(intelItems.filter(item => item.id !== id));
        showToast(`Indicator ${indicator} removed from active edge blocking tables.`, "info");
      }
    });
  };

  const filteredIntel = intelItems.filter(item => {
    const matchesSearch = item.indicator.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.detectionCategory.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedTypeFilter === "ALL" || item.type === selectedTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div id="threat-intel-view" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* LEFT COLUMN: Add New Blacklist Rule Form */}
      <div className="bg-background-surface border border-border-main rounded-xl p-5 shadow-sm h-fit">
        <h3 className="font-extrabold text-sm text-text-main mb-3.5 flex items-center gap-1.5 border-b border-border-main pb-2">
          <Ban className="w-4.5 h-4.5 text-brand-critical" />
          Blocklist Gateway Rules
        </h3>
        <p className="text-xs text-text-muted mb-4">
          Inject real-time indicator hashes, hostile domain lists, or server proxy IPs into the perimeter firewalls.
        </p>

        <form onSubmit={handleAddIndicator} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-mono font-bold text-text-muted">IOC Signature / Value</label>
            <input
              type="text"
              required
              placeholder="e.g. 195.122.40.10, payload.exe hash"
              className="w-full bg-background-muted border border-border-main rounded-lg px-3 py-2 outline-none focus:border-brand-primary text-text-main font-mono text-xs"
              value={newIndicator}
              onChange={(e) => setNewIndicator(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono font-bold text-text-muted">Signature Type</label>
              <select
                className="w-full bg-background-muted border border-border-main rounded-lg px-2.5 py-1.5 outline-none text-text-main text-xs font-semibold"
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
              >
                <option value="IP">IP Address</option>
                <option value="Domain">Domain</option>
                <option value="Hash">MD5/SHA256 Hash</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono font-bold text-text-muted">Malicious Category</label>
              <select
                className="w-full bg-background-muted border border-border-main rounded-lg px-2.5 py-1.5 outline-none text-text-main text-xs font-semibold"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
              >
                <option value="Tor Exit Node">Tor Exit Node</option>
                <option value="VPN Proxy">VPN Proxy</option>
                <option value="Known Malware C2">Known Malware C2</option>
                <option value="Bulletproof Hosting">Bulletproof Hosting</option>
                <option value="Suspicious Cloud VPS">Suspicious Cloud VPS</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-brand-critical hover:bg-red-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-red-500/10"
          >
            <Plus className="w-4 h-4" />
            Deploy Edge Blocking Rule
          </button>
        </form>

        <div className="mt-5 p-3 rounded-lg border border-border-main bg-background-muted/20 text-[10px] text-text-muted leading-relaxed">
          💡 Added indicators synchronize instantly across global cloud security groups (AWS Security Groups, Cloudflare Zero-Trust, and Cisco core routers) within 15 seconds.
        </div>
      </div>

      {/* RIGHT TWO COLUMNS: Active Intel Indicators list */}
      <div className="lg:col-span-2 bg-background-surface border border-border-main rounded-xl p-5 shadow-sm flex flex-col h-full">
        <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-sm text-text-main flex items-center gap-1.5">
              <Globe className="w-4.5 h-4.5 text-brand-primary" />
              Active IOC Intelligence Ledger ({intelItems.length})
            </h3>
            <p className="text-xs text-text-muted">Blocked or flagged server networks matched against global vulnerability alerts</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-44">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-muted" />
              <input
                type="text"
                placeholder="Search IOCs..."
                className="w-full pl-8 pr-2.5 py-1.5 text-[11px] bg-background-muted border border-border-main rounded-lg outline-none focus:border-brand-primary text-text-main"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="text-[11px] font-semibold border border-border-main bg-background-muted px-2 py-1.5 rounded-lg outline-none cursor-pointer text-text-main"
            >
              <option value="ALL">All Types</option>
              <option value="IP">IP Addresses</option>
              <option value="Domain">Domains</option>
              <option value="Hash">Hashes</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-compact">
            <thead>
              <tr className="border-b border-border-main bg-background-muted/40 text-[10px] uppercase font-mono font-bold text-text-muted">
                <th className="py-2.5 px-3">IOC ID</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Indicator Address / Signature</th>
                <th className="py-2.5 px-3">Threat Category</th>
                <th className="py-2.5 px-3 text-center">Score</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main/50 text-xs">
              {filteredIntel.map((item) => (
                <tr key={item.id} className="hover:bg-background-muted/25 transition-colors">
                  <td className="py-3 px-3 font-mono text-[10px] text-text-muted font-bold">
                    {item.id}
                  </td>
                  <td className="py-3 px-3 font-mono text-[10px] text-brand-primary font-bold">
                    {item.type}
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-text-main break-all max-w-[180px]">
                    {item.indicator}
                  </td>
                  <td className="py-3 px-3 font-semibold text-text-muted">
                    {item.detectionCategory}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="font-mono font-black text-brand-critical">
                      {item.maliciousScore}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleDeleteIndicator(item.id, item.indicator)}
                      className="p-1 text-text-muted hover:text-brand-critical hover:bg-background-muted rounded-lg transition-colors ml-auto"
                      title="Unblock indicator"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
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
