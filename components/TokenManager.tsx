"use client";

import { useState } from "react";
import { saveToken, removeToken, hasToken } from "@/lib/token";
import { Key, ShieldCheck, AlertTriangle, Loader2, Info, ChevronRight, Globe, Lock } from "lucide-react";
import { motion } from "framer-motion";

export function TokenManager({ onSuccess }: { onSuccess?: () => void }) {
  const [tokenInput, setTokenInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const [hasCurrentToken, setHasCurrentToken] = useState(hasToken());

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await saveToken(tokenInput.trim());
      setSuccess(true);
      setHasCurrentToken(true);
      setTokenInput("");
      if (onSuccess) {
        setTimeout(() => onSuccess(), 1000);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid token");
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    removeToken();
    setHasCurrentToken(false);
    setSuccess(false);
    setTokenInput("");
  }

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Key size={18} className="text-cyan-400" />
          <h3 className="text-sm font-black text-white uppercase tracking-wider">Authentication</h3>
        </div>
        {!hasCurrentToken && (
          <button 
            onClick={() => setShowGuide(!showGuide)}
            className="text-[10px] font-bold text-cyan-500 hover:text-cyan-400 transition-colors flex items-center gap-1 bg-cyan-500/10 px-2 py-1 rounded-md border border-cyan-500/20"
          >
            <Info size={12} /> {showGuide ? "Hide Guide" : "Setup Guide"}
          </button>
        )}
      </div>

      {showGuide && !hasCurrentToken && (
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 animate-fade-in">
          <div className="flex gap-3">
            <Globe size={16} className="text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-white mb-1">Public Repositories</p>
              <p className="text-[11px] text-slate-400">No token or permissions required. A token (with any permissions) simply boosts your rate limit to 5,000 req/hr.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Lock size={16} className="text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-white mb-1">Private & Selected Repos</p>
              <p className="text-[11px] text-slate-400 mb-2">When using "Only select repositories" or accessing private code, you MUST enable these permissions:</p>
              <ul className="space-y-1 text-[10px] font-mono text-slate-300">
                <li className="flex items-center gap-2 bg-black/30 p-1.5 rounded-lg border border-white/5">
                  <ChevronRight size={10} className="text-cyan-500" /> Repository: Contents (Read-only)
                </li>
                <li className="flex items-center gap-2 bg-black/30 p-1.5 rounded-lg border border-white/5">
                  <ChevronRight size={10} className="text-cyan-500" /> Repository: Metadata (Read-only)
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {hasCurrentToken ? (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center justify-between shadow-lg shadow-emerald-500/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="font-bold text-white text-xs">Token Verified</p>
              <p className="text-[10px] text-emerald-400/80 font-medium">Full access enabled</p>
            </div>
          </div>
          <button
            onClick={handleClear}
            className="text-[10px] uppercase font-black tracking-widest px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all border border-red-500/20"
          >
            Revoke
          </button>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="relative group">
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="github_pat_11..."
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all group-hover:border-white/20"
            />
            <div className="absolute inset-0 rounded-xl bg-cyan-500/5 opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity" />
          </div>

          <button
            type="submit"
            disabled={loading || !tokenInput.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: loading || !tokenInput.trim() ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #0ea5e9, #3b82f6)",
              color: loading || !tokenInput.trim() ? "#475569" : "white",
            }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Verify & Connect"}
          </button>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] text-red-400 flex items-start gap-2 bg-red-500/10 p-3 rounded-xl border border-red-500/20 leading-relaxed font-medium">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" /> 
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] text-emerald-400 flex items-center gap-2 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 font-medium">
              <ShieldCheck size={14} /> Connection established!
            </motion.div>
          )}
        </form>
      )}

      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Help & Docs</span>
        <a
          href="https://github.com/settings/tokens?type=beta"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-cyan-500 hover:text-cyan-400 font-bold transition-colors flex items-center gap-1 group"
        >
          Generate on GitHub <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>
    </div>
  );
}
