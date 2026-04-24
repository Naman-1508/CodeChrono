"use client";

import { useState, useEffect } from "react";
import {
  saveToken,
  removeToken,
  getToken,
  validateToken,
  type TokenValidationResult,
} from "@/lib/token";
import { CheckCircle, Loader2, AlertTriangle, Key, X, ChevronDown, ChevronUp } from "lucide-react";

type Props = {
  onTokenChange?: (token: string | null) => void;
  compact?: boolean;
};

type UIState = "idle" | "input" | "validating" | "valid" | "error";

export function TokenManager({ onTokenChange, compact = false }: Props) {
  const [uiState, setUiState] = useState<UIState>("idle");
  const [tokenInput, setTokenInput] = useState("");
  const [validationResult, setValidationResult] = useState<TokenValidationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [showInstructions, setShowInstructions] = useState(false);

  // On mount, check for an existing token
  useEffect(() => {
    const existing = getToken();
    if (existing) {
      setUiState("validating");
      validateToken(existing).then((result) => {
        if (result.valid) {
          setValidationResult(result);
          setUiState("valid");
        } else {
          removeToken();
          setUiState("input");
        }
      });
    } else {
      setUiState("input");
    }
  }, []);

  async function handleSubmit() {
    const trimmed = tokenInput.trim();
    if (!trimmed) return;

    setUiState("validating");
    setErrorMessage("");

    try {
      saveToken(trimmed);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Invalid token");
      setUiState("error");
      return;
    }

    const result = await validateToken(trimmed);
    if (result.valid) {
      setValidationResult(result);
      setUiState("valid");
      onTokenChange?.(trimmed);
    } else {
      removeToken();
      setErrorMessage(result.error ?? "Token validation failed");
      setUiState("error");
    }
  }

  function handleRemove() {
    removeToken();
    setValidationResult(null);
    setTokenInput("");
    setUiState("input");
    onTokenChange?.(null);
  }

  // ── Valid ─────────────────────────────────────────────────────────────────
  if (uiState === "valid" && validationResult) {
    return (
      <div
        className="flex items-center justify-between p-3 rounded-xl"
        style={{
          background: "rgba(16,185,129,0.08)",
          border: "1px solid rgba(16,185,129,0.25)",
        }}
      >
        <div className="flex items-center gap-3">
          {validationResult.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={validationResult.avatarUrl}
              alt={validationResult.login ?? ""}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(16,185,129,0.15)" }}
            >
              <Key size={14} style={{ color: "#10b981" }} />
            </div>
          )}
          <div>
            <p className="text-sm font-semibold" style={{ color: "#10b981" }}>
              @{validationResult.login}
            </p>
            <p className="text-xs" style={{ color: "#6ee7b7" }}>
              ✓ Token connected · {validationResult.rateLimit?.toLocaleString()} req/hr
            </p>
          </div>
        </div>
        <button
          onClick={handleRemove}
          className="flex items-center gap-1 text-xs transition-colors"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
        >
          <X size={13} /> Remove
        </button>
      </div>
    );
  }

  // ── Validating ────────────────────────────────────────────────────────────
  if (uiState === "validating") {
    return (
      <div
        className="flex items-center gap-3 p-3 rounded-xl"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
      >
        <Loader2 size={16} className="animate-spin" style={{ color: "#0ea5e9" }} />
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Validating token…
        </span>
      </div>
    );
  }

  // ── Input / Error ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {!compact && (
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Connect GitHub Token
          </h3>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Add a fine-grained PAT to analyze private repos and unlock
            5,000 requests/hour instead of 60.
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <input
          id="pat-token-input"
          type="password"
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="github_pat_xxxxxxxxxxxx"
          className="flex-1 px-3 py-2 text-sm rounded-lg outline-none transition-all"
          style={{
            background: "var(--bg-elevated)",
            border: `1px solid ${uiState === "error" ? "rgba(239,68,68,0.5)" : "var(--border)"}`,
            color: "var(--text-primary)",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#0ea5e9")}
          onBlur={(e) =>
            (e.currentTarget.style.borderColor =
              uiState === "error" ? "rgba(239,68,68,0.5)" : "var(--border)")
          }
        />
        <button
          id="pat-connect-btn"
          onClick={handleSubmit}
          disabled={!tokenInput.trim()}
          className="px-4 py-2 text-sm font-medium rounded-lg transition-all"
          style={{
            background: tokenInput.trim() ? "#0ea5e9" : "var(--bg-elevated)",
            color: tokenInput.trim() ? "#fff" : "var(--text-muted)",
            border: "1px solid transparent",
          }}
        >
          Connect
        </button>
      </div>

      {uiState === "error" && (
        <p className="flex items-center gap-1.5 text-xs" style={{ color: "#ef4444" }}>
          <AlertTriangle size={12} /> {errorMessage}
        </p>
      )}

      <p className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
        <CheckCircle size={11} style={{ color: "#10b981" }} />
        Stored only in your browser — never sent to our servers.
      </p>

      <button
        onClick={() => setShowInstructions((v) => !v)}
        className="flex items-center gap-1 text-xs transition-colors"
        style={{ color: "#0ea5e9" }}
      >
        {showInstructions ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {showInstructions ? "Hide" : "How to generate a token"}
      </button>

      {showInstructions && (
        <div
          className="p-3 rounded-xl text-xs space-y-2"
          style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}
        >
          <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
            Generate a Fine-Grained PAT:
          </p>
          <ol className="list-decimal list-inside space-y-1.5" style={{ color: "var(--text-secondary)" }}>
            <li>
              Go to{" "}
              <a
                href="https://github.com/settings/tokens?type=beta"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#0ea5e9" }}
              >
                github.com/settings/tokens
              </a>
            </li>
            <li>Click &ldquo;Generate new token&rdquo; → &ldquo;Fine-grained token&rdquo;</li>
            <li>Set expiration (90 days recommended)</li>
            <li>
              Under &ldquo;Repository permissions&rdquo; set:
              <ul className="ml-4 mt-1 space-y-0.5">
                <li>• Contents → Read-only</li>
                <li>• Metadata → Read-only (auto-selected)</li>
              </ul>
            </li>
            <li>Click &ldquo;Generate token&rdquo; and paste it above</li>
          </ol>
        </div>
      )}
    </div>
  );
}
