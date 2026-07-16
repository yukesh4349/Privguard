import { useState, useMemo, useEffect } from "react";
import { mockIdentityNodes, mockIdentityEdges, getStoredData } from "../data";
import { IdentityNode, RiskLevel } from "../types";
import { Shield, ShieldAlert, Server, Database, AppWindow, UserCheck, Key, Search, HelpCircle, Activity, Info, Zap } from "lucide-react";
import { useTheme } from "./ThemeContext";
import { api } from "../services/api";

export function IdentityGraph() {
  const [nodes, setNodes] = useState<IdentityNode[]>(() => getStoredData("identity_nodes", mockIdentityNodes));
  const [edges, setEdges] = useState<any[]>(() => getStoredData("identity_edges", mockIdentityEdges));
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNode, setSelectedNode] = useState<IdentityNode | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<string | null>(null);
  const { askConfirm, showToast } = useTheme();

  useEffect(() => {
    // Connect users to backend and log errors
    api.getIdentityGraph()
      .then(data => {
        setNodes(data.nodes);
        setEdges(data.edges);
        console.log("Successfully fetched Identity Graph from backend", data);
      })
      .catch(err => {
        console.error("Error fetching Identity Graph from backend:", err);
        showToast("Error loading dynamic graph. Check console logs.", "error");
      });

    const handleSync = () => {
      setNodes(getStoredData("identity_nodes", mockIdentityNodes));
      setEdges(getStoredData("identity_edges", mockIdentityEdges));
    };
    window.addEventListener("privguard_db_sync", handleSync);
    return () => window.removeEventListener("privguard_db_sync", handleSync);
  }, []);

  // Position nodes nicely on an interactive 2D coordinate grid dynamically from backend data
  const nodePositions = useMemo(() => {
    const positions: Record<string, {x: number, y: number}> = {};
    let userY = 80;
    let roleY = 80;
    let assetY = 120;
    
    nodes.forEach(node => {
      if (node.type === 'user') {
        positions[node.id] = { x: 80, y: userY };
        userY += 100;
      } else if (node.type === 'role') {
        positions[node.id] = { x: 340, y: roleY };
        roleY += 120;
      } else {
        positions[node.id] = { x: 620, y: assetY };
        assetY += 160;
      }
    });
    
    return positions;
  }, [nodes]);

  const filteredNodes = useMemo(() => {
    if (!searchQuery) return mockIdentityNodes;
    return mockIdentityNodes.filter(node => 
      node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleNodeClick = (node: IdentityNode) => {
    setSelectedNode(node);
    setHighlightedPath(node.id);
  };

  const getRiskColorClass = (score: number) => {
    if (score >= 90) return "text-brand-critical bg-red-950/30 border-red-800";
    if (score >= 70) return "text-brand-high bg-orange-950/30 border-orange-800";
    if (score >= 50) return "text-brand-warning bg-amber-950/30 border-amber-800";
    return "text-brand-success bg-green-950/30 border-green-800";
  };

  const getNodeIcon = (type: string, riskScore: number) => {
    const isHigh = riskScore >= 70;
    switch (type) {
      case "user":
        return isHigh ? <ShieldAlert className="w-4 h-4 text-brand-critical" /> : <UserCheck className="w-4 h-4 text-brand-success" />;
      case "role":
        return <Key className="w-4 h-4 text-amber-500" />;
      case "server":
        return <Server className="w-4 h-4 text-blue-400" />;
      case "database":
        return <Database className="w-4 h-4 text-cyan-400" />;
      case "application":
        return <AppWindow className="w-4 h-4 text-purple-400" />;
      default:
        return <Shield className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div id="identity-graph-container" className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
      {/* Visual Canvas Panel */}
      <div className="lg:col-span-3 flex flex-col bg-background-surface border border-border-main rounded-xl overflow-hidden shadow-sm">
        
        {/* Header Options */}
        <div className="p-4 border-b border-border-main flex flex-wrap items-center justify-between gap-4 bg-background-surface/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand-primary" />
            <div>
              <h3 className="font-semibold text-sm">Privilege Path Discovery</h3>
              <p className="text-xs text-text-muted">Interactive graph modeling lateral movement paths and risk escalation</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search identity or asset..."
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-background-muted border border-border-main rounded-lg outline-none focus:border-brand-primary transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              className="text-xs px-2.5 py-1.5 border border-border-main hover:bg-background-muted rounded-lg flex items-center gap-1.5 transition-colors"
              onClick={() => { setSelectedNode(null); setHighlightedPath(null); }}
            >
              Reset Graph
            </button>
          </div>
        </div>

        {/* SVG Drawing Canvas */}
        <div className="flex-1 relative min-h-[480px] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] overflow-auto">
          <svg className="absolute inset-0 w-full h-full min-w-[780px]" style={{ height: "550px" }}>
            <defs>
              <marker
                id="arrow-default"
                viewBox="0 0 10 10"
                refX="18"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
              </marker>
              <marker
                id="arrow-high-risk"
                viewBox="0 0 10 10"
                refX="18"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#dc2626" />
              </marker>
              <marker
                id="arrow-safe"
                viewBox="0 0 10 10"
                refX="18"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#16a34a" />
              </marker>
            </defs>

            {/* Draw Relationship Edges (Connections) */}
            {edges.map((edge) => {
              const fromPos = nodePositions[edge.source as keyof typeof nodePositions];
              const toPos = nodePositions[edge.target as keyof typeof nodePositions];
              
              if (!fromPos || !toPos) return null;

              const isPathActive = highlightedPath === edge.source || highlightedPath === edge.target;
              const isHighRisk = edge.isHighRiskPath;
              
              let strokeColor = "#64748b"; // muted slate
              let strokeWidth = "1.5";
              let markerId = "arrow-default";
              let strokeDash = "0";

              if (isHighRisk) {
                strokeColor = "#ea580c"; // orange high risk
                strokeWidth = "2";
                markerId = "arrow-high-risk";
              }
              if (isPathActive) {
                strokeColor = isHighRisk ? "#dc2626" : "#16a34a"; // critical red or success green
                strokeWidth = "2.5";
                strokeDash = isHighRisk ? "4 2" : "0";
              }

              return (
                <g key={edge.id} className="transition-all duration-300">
                  <line
                    x1={fromPos.x + 10}
                    y1={fromPos.y}
                    x2={toPos.x - 10}
                    y2={toPos.y}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDash}
                    markerEnd={`url(#${markerId})`}
                    className="transition-all duration-300"
                  />
                  {/* Floating Edge Text */}
                  <text
                    x={(fromPos.x + toPos.x) / 2}
                    y={(fromPos.y + toPos.y) / 2 - 6}
                    textAnchor="middle"
                    className="text-[9px] font-mono font-medium fill-text-muted bg-background-surface select-none"
                  >
                    {edge.label}
                  </text>
                </g>
              );
            })}

            {/* Draw Identity Nodes */}
            {nodes.map((node) => {
              const pos = nodePositions[node.id as keyof typeof nodePositions];
              if (!pos) return null;

              const isSelected = selectedNode?.id === node.id;
              const isCompromised = node.status === "compromised";
              const isSearchMatch = searchQuery ? node.label.toLowerCase().includes(searchQuery.toLowerCase()) : true;

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className="cursor-pointer select-none group"
                  onClick={() => handleNodeClick(node)}
                  opacity={isSearchMatch ? 1 : 0.3}
                >
                  {/* Outer status halo */}
                  <circle
                    r="24"
                    fill="none"
                    stroke={isCompromised ? "#dc2626" : isSelected ? "#2563eb" : "transparent"}
                    strokeWidth="2"
                    strokeDasharray={isCompromised ? "4 2" : "0"}
                    className={isCompromised ? "animate-spin" : ""}
                    style={{ transformOrigin: "0 0", animationDuration: "12s" }}
                  />
                  
                  {/* Interactive node dot */}
                  <circle
                    r="18"
                    fill="var(--bg-muted)"
                    stroke={isSelected ? "var(--primary)" : "var(--border-main)"}
                    strokeWidth="2"
                    className="transition-all duration-200 group-hover:scale-110 group-hover:stroke-brand-primary"
                  />

                  {/* Icon centered inside circle */}
                  <g transform="translate(-8, -8)">
                    {getNodeIcon(node.type, node.riskScore)}
                  </g>

                  {/* Node Name/Label text below */}
                  <foreignObject
                    x="-65"
                    y="24"
                    width="130"
                    height="40"
                    className="overflow-visible text-center"
                  >
                    <div className="flex flex-col items-center">
                      <span className={`text-[10px] font-medium leading-tight truncate max-w-full px-1.5 py-0.5 rounded ${isSelected ? "text-brand-primary font-bold" : "text-text-main"}`}>
                        {node.label.split(" (")[0]}
                      </span>
                      {node.riskScore > 0 && (
                        <span className={`text-[8px] font-mono px-1 rounded-sm mt-0.5 ${node.riskScore >= 70 ? "bg-red-500/10 text-brand-critical" : "bg-slate-500/10 text-text-muted"}`}>
                          Risk: {node.riskScore}
                        </span>
                      )}
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </svg>
          
          {/* Legend helper inside canvas */}
          <div className="absolute bottom-3 left-3 bg-background-surface/85 backdrop-blur-md border border-border-main p-3 rounded-lg text-[10px] flex flex-col gap-1.5 shadow-sm max-w-xs pointer-events-none select-none">
            <div className="font-semibold text-text-main flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-brand-primary" />
              Graph Visualizer Legend
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></div>Compromised Host</div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>High Privilege Link</div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-1 border-t-2 border-red-600 border-dashed"></div>Active Escalation Path</div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-1 border-t-2 border-slate-500"></div>Secure Link</div>
            </div>
          </div>
        </div>
      </div>

      {/* Node Inspector sidepanel */}
      <div className="bg-background-surface border border-border-main rounded-xl p-4 flex flex-col shadow-sm">
        <h3 className="font-semibold text-sm border-b border-border-main pb-2 flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-brand-warning" />
          Entity Path Inspector
        </h3>
        
        {selectedNode ? (
          <div className="flex-1 flex flex-col justify-between mt-4">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-text-muted bg-background-muted px-2 py-0.5 rounded-md">
                  {selectedNode.type} Node
                </span>
                <h4 className="font-bold text-base mt-1 text-text-main">{selectedNode.label}</h4>
              </div>

              {/* Risk Level gauge */}
              <div className="border border-border-main rounded-lg p-3 bg-background-muted/40">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-text-muted font-medium">Criticality Score</span>
                  <span className={`font-mono font-bold ${selectedNode.riskScore >= 70 ? "text-brand-critical" : "text-brand-success"}`}>
                    {selectedNode.riskScore}%
                  </span>
                </div>
                <div className="w-full bg-border-main h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${selectedNode.riskScore >= 80 ? "bg-brand-critical" : selectedNode.riskScore >= 60 ? "bg-brand-high" : "bg-brand-success"}`}
                    style={{ width: `${selectedNode.riskScore}%` }}
                  />
                </div>
                <p className="text-[10px] text-text-muted mt-2">
                  {selectedNode.riskScore >= 80 
                    ? "⚠️ Immediate isolation required. High possibility of active adversary control or open transit pathway." 
                    : "🔒 Compliant node status. No anomalous out-of-boundary actions mapped on this specific ID."}
                </p>
              </div>

              {/* Privilege Path details */}
              <div className="space-y-2">
                <span className="text-[10px] font-semibold uppercase font-mono text-text-muted tracking-wider block">Connected Paths:</span>
                
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {mockIdentityEdges
                    .filter(edge => edge.source === selectedNode.id || edge.target === selectedNode.id)
                    .map(edge => {
                      const fromNode = mockIdentityNodes.find(n => n.id === edge.source);
                      const toNode = mockIdentityNodes.find(n => n.id === edge.target);
                      return (
                        <div key={edge.id} className="text-xs border-l-2 border-border-main pl-2.5 py-1">
                          <span className="font-mono text-[10px] text-brand-primary block">{edge.label}</span>
                          <span className="text-text-muted">
                            {fromNode?.label.split(" (")[0]} ➜ {toNode?.label.split(" (")[0]}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border-main space-y-2">
              <button 
                className="w-full text-xs py-2 bg-brand-primary hover:bg-brand-primary/90 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                onClick={() => {
                  askConfirm({
                    title: "Isolate Identity Node",
                    message: `Are you sure you want to apply the Access Session Sandbox isolation policy for "${selectedNode.label}"? This will instantly terminate active ticket grants, quarantine connected endpoints, and log a critical SOC event.`,
                    confirmText: "Enforce Isolation",
                    cancelText: "Cancel",
                    onConfirm: () => {
                      showToast(`Access Session Sandbox isolation policy successfully applied for "${selectedNode.label}". Connected workstations locked.`, "success");
                    }
                  });
                }}
              >
                Isolate Node Session
              </button>
              <p className="text-[9px] text-center text-text-muted">
                Action triggers temporary identity quarantine via Active Directory and locks connected GPO instances.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-text-muted">
            <HelpCircle className="w-10 h-10 mb-2 stroke-1 text-text-muted/60" />
            <p className="text-xs font-medium">No node selected</p>
            <p className="text-[11px] mt-1 max-w-xs">
              Click on any identity, user role, server, or application node in the graph map to inspect active privilege paths, credential vectors, and risk profiles.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
