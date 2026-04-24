"use client";

import { useState } from "react";
import { saveToken, removeToken, hasToken } from "@/lib/token";
import { Key, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";

export function TokenManager({ onSuccess }: { onSuccess?: () => void }) {
  const [tokenInput, setTokenInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Key size={16} className="text-cyan-400" />
        <h3 className="text-sm font-bold text-white">GitHub PAT Setup</h3>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        Adding a Fine-Grained Personal Access Token unlocks a <strong className="text-emerald-400">5,000 req/hr rate limit</strong> and allows you to analyze your private repositories securely.
      </p>

      {hasCurrentToken ? (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} />
            <span className="font-medium">Valid token connected</span>
          </div>
          <button
            onClick={handleClear}
            className="text-[10px] uppercase font-bold tracking-wider hover:text-emerald-300 underline underline-offset-2"
          >
            Remove
          </button>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-3">
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="github_pat_11..."
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />

          <button
            type="submit"
            disabled={loading || !tokenInput.trim()}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: loading || !tokenInput.trim() ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #0ea5e9, #3b82f6)",
              color: loading || !tokenInput.trim() ? "#64748b" : "white",
            }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : "Save & Verify Token"}
          </button>

          {error && (
            <p className="text-xs text-red-400 flex items-center gap-1.5 mt-2 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
              <AlertTriangle size={12} /> {error}
            </p>
          )}

          {success && (
            <p className="text-xs text-emerald-400 flex items-center gap-1.5 mt-2 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
              <ShieldCheck size={12} /> Token successfully verified!
            </p>
          )}
        </form>
      )}

      <div className="pt-3 border-t border-slate-800">
        <a
          href="https://github.com/settings/tokens?type=beta"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-cyan-500 hover:text-cyan-400 font-medium transition-colors"
        >
          Generate a new token →
        </a>
      </div>
    </div>
  );
}
