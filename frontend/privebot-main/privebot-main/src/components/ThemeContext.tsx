import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { X, CheckCircle2, AlertTriangle, Info, AlertOctagon, HelpCircle } from "lucide-react";

export type Theme = "light" | "dark" | "system";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "info" | "warning" | "error";
}

export interface ConfirmConfig {
  title: string;
  message: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
  showToast: (message: string, type?: "success" | "info" | "warning" | "error") => void;
  askConfirm: (config: ConfirmConfig) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem("privguard-theme") as Theme) || "dark"; // Defaulting to premium dark theme for security analyst preference
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig | null>(null);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem("privguard-theme", newTheme);
    setThemeState(newTheme);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    
    const applyTheme = () => {
      let activeTheme: "light" | "dark" = "dark";
      
      if (theme === "system") {
        const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        activeTheme = systemPrefersDark ? "dark" : "light";
      } else {
        activeTheme = theme;
      }
      
      if (activeTheme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      
      setResolvedTheme(activeTheme);
    };

    applyTheme();

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = () => applyTheme();
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, [theme]);

  const showToast = (message: string, type: "success" | "info" | "warning" | "error" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-dismiss toast
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const askConfirm = (config: ConfirmConfig) => {
    setConfirmConfig(config);
  };

  const closeConfirm = () => {
    setConfirmConfig(null);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, showToast, askConfirm }}>
      {children}

      {/* GLOBAL TOAST NOTIFICATIONS DRAWER */}
      <div id="global-toasts" className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none select-none">
        {toasts.map((toast) => {
          let icon = <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
          let styles = "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300";
          
          if (toast.type === "error") {
            icon = <AlertOctagon className="w-5 h-5 text-red-500 shrink-0" />;
            styles = "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300";
          } else if (toast.type === "warning") {
            icon = <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
            styles = "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300";
          } else if (toast.type === "info") {
            icon = <Info className="w-5 h-5 text-blue-500 shrink-0" />;
            styles = "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300";
          }

          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md pointer-events-auto transition-all duration-300 animate-[slide-in_0.2s_ease-out] ${styles}`}
            >
              {icon}
              <div className="flex-1 text-[11px] font-medium leading-relaxed">
                {toast.message}
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* GLOBAL CONFIRMATION MODAL OVERLAY */}
      {confirmConfig && (
        <div id="global-confirm-modal" className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-background-surface border border-border-main rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-[zoom-in_0.15s_ease-out] text-text-main">
            <div className="flex items-start gap-3.5">
              <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-brand-critical shrink-0">
                <HelpCircle className="w-6 h-6 stroke-1.5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-sm text-text-main">{confirmConfig.title}</h3>
                <p className="text-xs text-text-muted leading-relaxed">{confirmConfig.message}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={closeConfirm}
                className="px-3.5 py-1.5 text-xs font-bold border border-border-main hover:bg-background-muted rounded-lg transition-colors text-text-main cursor-pointer"
              >
                {confirmConfig.cancelText || "Cancel"}
              </button>
              <button
                onClick={() => {
                  confirmConfig.onConfirm();
                  closeConfirm();
                }}
                className="px-4 py-1.5 text-xs font-bold bg-brand-critical hover:bg-red-700 text-white rounded-lg transition-colors shadow-md shadow-red-500/10 cursor-pointer"
              >
                {confirmConfig.confirmText || "Confirm Operations"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
