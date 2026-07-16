import React, { useState, useMemo, useEffect } from "react";
import { mockInvestigationCases, getStoredData, setStoredData } from "../data";
import { InvestigationCase } from "../types";
import { Folder, Layers, Search, Plus, Calendar, User, FileText, CheckSquare, PlusCircle, AlertCircle, MessageSquare, Download, Check, ShieldCheck } from "lucide-react";
import { useTheme } from "../components/ThemeContext";

export function Investigations() {
  const [cases, setCases] = useState<InvestigationCase[]>(() => getStoredData("investigation_cases", mockInvestigationCases));
  const [selectedCase, setSelectedCase] = useState<InvestigationCase | null>(() => {
    const loaded = getStoredData("investigation_cases", mockInvestigationCases);
    return loaded.length > 0 ? loaded[0] : null;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const { askConfirm, showToast } = useTheme();
  
  // Custom diary note input text
  const [noteContent, setNoteContent] = useState("");

  useEffect(() => {
    const handleSync = () => {
      const loaded = getStoredData("investigation_cases", mockInvestigationCases);
      setCases(loaded);
      setSelectedCase(prev => {
        if (!prev) return loaded.length > 0 ? loaded[0] : null;
        const found = loaded.find(c => c.id === prev.id);
        return found || (loaded.length > 0 ? loaded[0] : null);
      });
    };
    window.addEventListener("privguard_db_sync", handleSync);
    return () => window.removeEventListener("privguard_db_sync", handleSync);
  }, []);

  const saveCases = (newCases: InvestigationCase[]) => {
    setCases(newCases);
    setStoredData("investigation_cases", newCases);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim() || !selectedCase) return;

    const newNote = {
      id: `note-${Date.now()}`,
      author: "Lead Auditor (You)",
      timestamp: new Date().toISOString(),
      content: noteContent.trim()
    };

    const updatedCases = cases.map(c => {
      if (c.id === selectedCase.id) {
        const updated = { ...c, notes: [...c.notes, newNote] };
        setSelectedCase(updated);
        return updated;
      }
      return c;
    });

    saveCases(updatedCases);
    setNoteContent("");
    showToast("Investigation note successfully appended to the case timeline and cryptographically sealed.", "success");
  };

  const handleUpdateStatus = (caseId: string, status: any) => {
    const updatedCases = cases.map(c => {
      if (c.id === caseId) {
        const updated = { ...c, status };
        setSelectedCase(updated);
        showToast(`Case status updated to ${status.replace("_", " ")}`, "info");
        return updated;
      }
      return c;
    });
    saveCases(updatedCases);
  };

  const handleExportForensics = () => {
    if (!selectedCase) return;
    showToast(`Compiling and signing case forensics package for dossier_${selectedCase.caseNumber}...`, "info");
    setTimeout(() => {
      showToast(`Dossier package dossier_${selectedCase.caseNumber}.pdf ready for download.`, "success");
    }, 1500);
  };

  const handleDownloadArtifact = (fileName: string) => {
    askConfirm({
      title: "Initiate Secure Artifact Download",
      message: `You are requesting access to the raw forensic artifact "${fileName}". To comply with SOC2 audit procedures, this raw PCAP log extraction will be logged under your active analyst card.`,
      confirmText: "Download Artifact",
      cancelText: "Cancel",
      onConfirm: () => {
        showToast(`Secure direct download initiated for ${fileName}.`, "success");
      }
    });
  };

  const filteredCases = cases.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.assignedTo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="investigations-view" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* LEFT COLUMN: Cases List Selector */}
      <div className="bg-background-surface border border-border-main rounded-xl p-4 flex flex-col h-[580px] shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] uppercase font-mono font-bold text-text-muted tracking-wider">Active SOC Cases</span>
          <span className="text-[10px] font-mono font-semibold bg-blue-500/15 text-brand-primary px-2 py-0.5 rounded-full">
            {cases.length} Open Cases
          </span>
        </div>

        <div className="relative mb-3.5">
          <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-text-muted" />
          <input
            type="text"
            placeholder="Search incident case number..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-background-muted border border-border-main rounded-lg outline-none focus:border-brand-primary text-text-main"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredCases.map((c) => {
            const isSelected = selectedCase?.id === c.id;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedCase(c)}
                className={`p-3 rounded-lg border transition-all cursor-pointer space-y-2 ${isSelected ? "bg-brand-primary/10 border-brand-primary text-text-main" : "bg-background-surface border-border-main/60 hover:bg-background-muted/20"}`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono font-extrabold text-text-muted">{c.caseNumber}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${c.priority === "P1" ? "bg-red-500/10 text-brand-critical" : "bg-orange-500/10 text-brand-high"}`}>
                    {c.priority}
                  </span>
                </div>
                <h4 className="font-bold text-xs text-text-main leading-tight line-clamp-1">{c.title}</h4>
                <div className="flex justify-between items-center text-[10px] text-text-muted pt-1 border-t border-border-main/20">
                  <span className="font-semibold">{c.status.replace("_", " ")}</span>
                  <span>Risk: {c.riskScore}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT TWO COLUMNS: Selected Case Detailed Audit Folder */}
      <div className="lg:col-span-2 space-y-6">
        {selectedCase ? (
          <>
            {/* Case Main Folder header card */}
            <div className="bg-background-surface border border-border-main rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-main pb-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono font-bold text-text-muted">Investigation Dossier</span>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-text-main leading-tight">{selectedCase.title}</h2>
                    <span className="font-mono text-xs font-bold bg-background-muted border px-2 py-0.5 rounded text-text-muted">
                      {selectedCase.caseNumber}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  {/* Status transition select dropdown */}
                  <select
                    value={selectedCase.status}
                    onChange={(e) => handleUpdateStatus(selectedCase.id, e.target.value as any)}
                    className="text-xs font-bold border border-border-main rounded-lg px-2.5 py-1.5 outline-none cursor-pointer text-text-main bg-background-muted"
                  >
                    <option value="Open">📂 Open</option>
                    <option value="In_Progress">⚙️ In Progress</option>
                    <option value="Under_Review">🔬 Under Review</option>
                    <option value="Closed">✅ Closed / Resolved</option>
                  </select>

                  <button 
                    onClick={handleExportForensics}
                    className="p-1.5 text-text-muted hover:text-text-main border border-border-main hover:bg-background-muted rounded-lg transition-colors cursor-pointer"
                    title="Download forensics logs PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-text-muted font-semibold block">Case assigned to:</span>
                  <div className="flex items-center gap-1 font-bold text-text-main">
                    <User className="w-3.5 h-3.5 text-brand-primary" />
                    <span>{selectedCase.assignedTo.split(" (")[0]}</span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] text-text-muted font-semibold block">Case creation timestamp:</span>
                  <div className="flex items-center gap-1 font-bold text-text-main font-mono">
                    <Calendar className="w-3.5 h-3.5 text-text-muted" />
                    <span>{new Date(selectedCase.createdTimestamp).toLocaleDateString()} — {new Date(selectedCase.createdTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] text-text-muted font-semibold block">Incident priority:</span>
                  <div className="flex items-center gap-1 font-black">
                    <AlertCircle className="w-3.5 h-3.5 text-brand-critical" />
                    <span className={selectedCase.priority === "P1" ? "text-brand-critical" : "text-brand-high"}>{selectedCase.priority} Level</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-border-main/50">
                <span className="text-[10px] font-semibold uppercase text-text-muted font-mono tracking-wider">Forensic Scope Description</span>
                <p className="text-xs leading-relaxed text-text-muted">{selectedCase.description}</p>
              </div>
            </div>

            {/* Forensic checklist attachments list */}
            <div className="bg-background-surface border border-border-main rounded-xl p-5 shadow-sm">
              <h3 className="font-bold text-sm text-text-main mb-3.5 flex items-center gap-1.5">
                <FileText className="w-4.5 h-4.5 text-text-muted" />
                Evidentiary Attachments / Artifact Enclave
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {selectedCase.evidence.map((file, idx) => (
                  <div key={idx} className="p-3 border border-border-main rounded-lg bg-background-muted/20 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <CheckSquare className="w-4 h-4 text-brand-success shrink-0" />
                      <span className="font-mono text-[11px] text-text-main truncate">{file}</span>
                    </div>
                    <button 
                      onClick={() => handleDownloadArtifact(file)}
                      className="text-[10px] font-bold text-brand-primary hover:underline shrink-0 cursor-pointer"
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Case notes / active diary tracker */}
            <div className="bg-background-surface border border-border-main rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-text-main flex items-center gap-1.5">
                <MessageSquare className="w-4.5 h-4.5 text-brand-primary" />
                Investigation Diary Timeline ({selectedCase.notes.length})
              </h3>

              {/* Diary Timeline stream */}
              <div className="space-y-4 border-l-2 border-border-main pl-4 py-2">
                {selectedCase.notes.map((note) => (
                  <div key={note.id} className="relative space-y-1">
                    {/* Timeline visual node bullet */}
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-brand-primary border border-background-surface" />
                    
                    <div className="flex items-center gap-2 text-[10px] text-text-muted font-mono">
                      <span className="font-bold text-text-main">@{note.author}</span>
                      <span>— {new Date(note.timestamp).toLocaleDateString()} {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-xs leading-relaxed text-text-muted bg-background-muted/25 p-2.5 border border-border-main/50 rounded-lg max-w-full">
                      {note.content}
                    </p>
                  </div>
                ))}
              </div>

              {/* New note write area form */}
              <form onSubmit={handleAddNote} className="space-y-3.5 pt-4 border-t border-border-main">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-text-muted">Append Forensic Update Note</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Type forensic discoveries, container isolation steps, AD group reset status to seal on log..."
                    className="w-full bg-background-muted text-xs border border-border-main rounded-lg p-3 outline-none focus:border-brand-primary text-text-main leading-relaxed"
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-brand-primary/10 ml-auto"
                >
                  <PlusCircle className="w-4 h-4" />
                  Sign and Seal Note
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="bg-background-surface border border-border-main rounded-xl p-12 shadow-sm text-center flex flex-col items-center justify-center space-y-4 h-[580px]">
            <div className="p-4 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary">
              <ShieldCheck className="w-12 h-12 stroke-1" />
            </div>
            <div className="space-y-2 max-w-sm">
              <h3 className="font-extrabold text-sm text-text-main">No Case Active</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                There are no active security forensic cases currently running on this tenant directory.
              </p>
              <p className="text-[10px] text-text-muted/75 bg-background-muted p-2 rounded border border-border-main/50 font-mono">
                PRISTINE BASELINE COMPLIANT
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
