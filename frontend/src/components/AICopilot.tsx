import { useState, useRef, useEffect } from "react";
import { copilotPresetPrompts, getCopilotAnswer } from "../data";
import { Sparkles, Send, Bot, User, Trash2, Copy, Check, MessageSquareCode, ShieldCheck, ArrowRight } from "lucide-react";
import { useTheme } from "./ThemeContext";

interface Message {
  id: string;
  sender: "user" | "copilot";
  content: string;
  timestamp: string;
}

export function AICopilot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-msg",
      sender: "copilot",
      content: `### Welcome to PrivGuard AI Security Copilot Workspace

I am your active Security Intelligence Assistant. I have indexed active log-streams, Privilege GPO Paths, and active incident lists. 

How can I assist you in your SOC operations today? You can ask questions in natural language, or utilize the quick analysis templates below.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const { askConfirm, showToast } = useTheme();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      sender: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    // Simulate sophisticated neural reasoning delay
    setTimeout(() => {
      const answer = getCopilotAnswer(text);
      const copilotMsg: Message = {
        id: `msg-${Date.now()}-copilot`,
        sender: "copilot",
        content: answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, copilotMsg]);
      setIsTyping(false);
    }, 1200);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    askConfirm({
      title: "Flush Copilot Thread",
      message: "Are you sure you want to flush the active Copilot conversation thread? This action clears your active incident context memory.",
      confirmText: "Clear Conversation",
      cancelText: "Cancel",
      onConfirm: () => {
        setMessages([
          {
            id: "welcome-msg-reset",
            sender: "copilot",
            content: "### Investigation Workspace Flushed.\nHow can I help you investigate current logs?",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        showToast("Copilot context thread flushed.", "info");
      }
    });
  };

  // Basic custom markdown formatter for bulletproof render in single component without external packages
  const renderMessageContent = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith("### ")) {
        return <h3 key={idx} className="text-sm font-bold text-text-main mt-4 mb-2 flex items-center gap-1.5">{line.replace("### ", "")}</h3>;
      }
      if (line.startsWith("#### ")) {
        return <h4 key={idx} className="text-xs font-semibold text-text-main mt-3 mb-1">{line.replace("#### ", "")}</h4>;
      }
      if (line.startsWith("**") && line.endsWith("**")) {
        return <p key={idx} className="text-xs font-bold text-text-main mt-2">{line.replace(/\*\*/g, "")}</p>;
      }
      // Bullets
      if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
        const cleaned = line.replace(/^\s*[\*\-]\s+/, "");
        // Inline bold replacement
        const parts = cleaned.split("**");
        return (
          <li key={idx} className="text-xs text-text-muted ml-4 list-disc mt-1">
            {parts.map((part, pidx) => pidx % 2 === 1 ? <strong key={pidx} className="text-text-main font-semibold">{part}</strong> : part)}
          </li>
        );
      }
      // Numbered items
      if (/^\d+\.\s+/.test(line.trim())) {
        const cleaned = line.replace(/^\s*\d+\.\s+/, "");
        const parts = cleaned.split("**");
        return (
          <div key={idx} className="text-xs text-text-muted ml-4 mt-1">
            <span className="font-mono text-brand-primary mr-1.5">{line.trim().match(/^\d+/)?.[0]}.</span>
            {parts.map((part, pidx) => pidx % 2 === 1 ? <strong key={pidx} className="text-text-main font-semibold">{part}</strong> : part)}
          </div>
        );
      }
      // Codeblocks
      if (line.startsWith("```")) {
        if (line.trim() === "```") return null;
        return <div key={idx} className="text-[10px] font-mono text-brand-success bg-black/90 p-3 rounded-lg my-2 overflow-x-auto border border-zinc-800 leading-relaxed font-mono-dense" />;
      }
      // Inline formatting (bold highlighted blocks)
      if (line.includes("`")) {
        const parts = line.split("`");
        return (
          <p key={idx} className="text-xs leading-relaxed text-text-muted mt-1">
            {parts.map((part, pidx) => pidx % 2 === 1 ? <code key={pidx} className="px-1.5 py-0.5 bg-background-muted rounded text-[11px] font-mono font-semibold text-brand-critical">{part}</code> : part)}
          </p>
        );
      }

      return line.trim() === "" ? <div key={idx} className="h-2" /> : <p key={idx} className="text-xs leading-relaxed text-text-muted mt-1">{line}</p>;
    });
  };

  return (
    <div id="ai-copilot-container" className="flex flex-col h-[550px] bg-background-surface border border-border-main rounded-xl overflow-hidden shadow-sm">
      
      {/* Title Header */}
      <div className="p-4 border-b border-border-main flex items-center justify-between bg-background-surface/50 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-brand-primary/10 text-brand-primary">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-text-main flex items-center gap-1.5">
              PrivGuard Copilot
              <span className="text-[9px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-mono font-medium border border-emerald-500/10">
                ACTIVE
              </span>
            </h3>
            <p className="text-[10px] text-text-muted">AI-Powered Privilege Path Analysis & SOC Intelligence Assistant</p>
          </div>
        </div>

        <button
          onClick={clearChat}
          className="p-1.5 text-text-muted hover:text-brand-critical hover:bg-background-muted rounded-lg transition-colors"
          title="Clear Investigation Memory"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main Messaging Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
          >
            {/* Sender avatar */}
            <div className={`p-2 rounded-lg h-9 w-9 shrink-0 flex items-center justify-center ${msg.sender === "user" ? "bg-brand-primary text-white" : "bg-background-muted border border-border-main text-brand-primary"}`}>
              {msg.sender === "user" ? <User className="w-4.5 h-4.5" /> : <Sparkles className="w-4.5 h-4.5" />}
            </div>

            {/* Bubble wrapper */}
            <div className={`rounded-xl p-3.5 relative border ${msg.sender === "user" ? "bg-brand-primary/10 border-brand-primary/20 text-text-main" : "bg-background-muted/40 border-border-main"}`}>
              
              {/* Copy actions for Copilot */}
              {msg.sender === "copilot" && (
                <button
                  onClick={() => copyToClipboard(msg.content, msg.id)}
                  className="absolute top-2.5 right-2.5 p-1 text-text-muted hover:text-text-main rounded transition-colors"
                  title="Copy analysis"
                >
                  {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-brand-success" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}

              {/* Message text formatted */}
              <div className="space-y-1 text-xs">
                {msg.sender === "user" ? <p className="leading-relaxed font-medium">{msg.content}</p> : renderMessageContent(msg.content)}
              </div>

              {/* Timestamp */}
              <span className="text-[8px] text-text-muted block mt-2 text-right font-mono">
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {/* Typing Loader Indicator */}
        {isTyping && (
          <div className="flex gap-3 max-w-[50%] mr-auto items-center">
            <div className="p-2 rounded-lg bg-background-muted border border-border-main text-brand-primary h-9 w-9 flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 animate-spin" style={{ animationDuration: "3s" }} />
            </div>
            <div className="bg-background-muted/40 border border-border-main rounded-xl p-3.5 text-xs flex gap-1.5 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-bounce" style={{ animationDelay: "0ms" }}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-bounce" style={{ animationDelay: "150ms" }}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-bounce" style={{ animationDelay: "300ms" }}></span>
              <span className="text-[10px] text-text-muted font-medium ml-1.5">Analyzing logs...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggested Quick Prompts Row */}
      <div className="px-4 py-2 border-t border-border-main bg-background-muted/30 flex gap-2 overflow-x-auto select-none no-scrollbar">
        {copilotPresetPrompts.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleSendMessage(preset.question)}
            className="shrink-0 text-[10px] font-semibold px-2.5 py-1.5 bg-background-surface hover:bg-background-muted border border-border-main hover:border-brand-primary rounded-lg text-text-main transition-all flex items-center gap-1 shadow-sm"
          >
            <MessageSquareCode className="w-3 h-3 text-brand-primary" />
            {preset.label}
            <ArrowRight className="w-2.5 h-2.5 text-text-muted" />
          </button>
        ))}
      </div>

      {/* Input Form Bar */}
      <div className="p-3 border-t border-border-main bg-background-surface">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputText);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            placeholder="Ask Copilot to explain alerts, summarize logs, or audit access rules..."
            className="flex-1 bg-background-muted text-xs border border-border-main rounded-lg px-3 py-2.5 outline-none focus:border-brand-primary transition-all text-text-main"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isTyping}
          />
          <button
            type="submit"
            className="px-3 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            disabled={!inputText.trim() || isTyping}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[9px] text-text-muted text-center mt-2 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3 h-3 text-brand-success" />
          Copilot queries are processed locally inside PrivGuard's cryptographically hardened enclave zone.
        </p>
      </div>
    </div>
  );
}
