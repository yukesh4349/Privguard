import { IdentityGraph } from "../components/IdentityGraph";
import { ShieldCheck, Info } from "lucide-react";

export function IdentityGraphView() {
  return (
    <div id="identity-graph-view" className="space-y-6">
      {/* Informational banner */}
      <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3 text-xs">
        <Info className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-text-main">Zero-Trust Directory Map Audit</h4>
          <p className="text-text-muted leading-relaxed">
            The platform automatically crawls Active Directory, Azure AD, AWS Identity accounts, and Local GPO parameters every 15 minutes to calculate credential hops. Nodes marked in <strong className="text-brand-critical">red halos</strong> represent active compromise triggers.
          </p>
        </div>
      </div>

      <div className="h-full min-h-[580px]">
        <IdentityGraph />
      </div>
    </div>
  );
}
